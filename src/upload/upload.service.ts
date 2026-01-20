import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { VideoProcessingService } from './video-processing.service';

export interface UploadedMedia {
    url: string;
    thumbnailUrl?: string;
    type: 'IMAGE' | 'VIDEO';
    mimeType: string;
    size: number;
    duration?: number; // Solo para videos
}

@Injectable()
export class UploadService {
    private readonly logger = new Logger('UploadService');
    private readonly propertiesDir = path.join(process.cwd(), 'uploads', 'properties');
    private readonly avatarsDir = path.join(process.cwd(), 'uploads', 'avatars');
    private readonly videosDir = path.join(this.propertiesDir, 'videos');
    private readonly imagesDir = path.join(this.propertiesDir, 'images');
    private readonly thumbnailsDir = path.join(this.propertiesDir, 'thumbnails');

    constructor(private videoProcessingService: VideoProcessingService) {
        // Crear directorios si no existen
        [
            this.propertiesDir,
            this.avatarsDir,
            this.videosDir,
            this.imagesDir,
            this.thumbnailsDir,
        ].forEach((dir) => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                this.logger.log(`Directorio creado: ${dir}`);
            }
        });
    }

    /**
     * Guardar archivos de media (imágenes y videos) para propiedades
     * @param files - Array de archivos de Express Multer
     * @returns Array con información de los archivos guardados
     */
    async savePropertyMedia(files: Express.Multer.File[]): Promise<UploadedMedia[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No se proporcionaron archivos');
        }

        const maxFiles = 10;
        if (files.length > maxFiles) {
            throw new BadRequestException(`Máximo ${maxFiles} archivos permitidos`);
        }

        // Validar límite de videos (máximo 3)
        const videoFiles = files.filter((f) => f.mimetype.startsWith('video/'));
        const maxVideos = 3;
        if (videoFiles.length > maxVideos) {
            throw new BadRequestException(`Máximo ${maxVideos} videos permitidos`);
        }

        const savedMedia: UploadedMedia[] = [];

        for (const file of files) {
            const isVideo = file.mimetype.startsWith('video/');
            const isImage = file.mimetype.startsWith('image/');

            if (!isVideo && !isImage) {
                throw new BadRequestException(
                    `Tipo de archivo no permitido: ${file.mimetype}. Solo imágenes y videos`
                );
            }

            if (isImage) {
                const mediaInfo = await this.savePropertyImage(file);
                savedMedia.push(mediaInfo);
            } else if (isVideo) {
                const mediaInfo = await this.savePropertyVideo(file);
                savedMedia.push(mediaInfo);
            }
        }

        return savedMedia;
    }

    /**
     * Guardar imagen de propiedad
     */
    private async savePropertyImage(file: Express.Multer.File): Promise<UploadedMedia> {
        // Validar tipo de archivo
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedMimes.includes(file.mimetype)) {
            throw new BadRequestException(
                `Tipo de imagen no permitido: ${file.mimetype}. Solo JPEG, PNG y WebP`
            );
        }

        // Validar tamaño (máximo 5MB por imagen)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new BadRequestException(
                `Imagen muy grande. Máximo 5MB, recibido ${(file.size / 1024 / 1024).toFixed(2)}MB`
            );
        }

        // Generar nombre único
        const ext = path.extname(file.originalname);
        const uniqueFilename = `${uuid()}${ext}`;
        const filepath = path.join(this.imagesDir, uniqueFilename);

        // Comprimir y guardar imagen
        await this.compressAndSaveImage(file.buffer, filepath);

        // Obtener tamaño del archivo final
        const finalSize = fs.statSync(filepath).size;

        return {
            url: `/uploads/properties/images/${uniqueFilename}`,
            type: 'IMAGE',
            mimeType: file.mimetype,
            size: finalSize,
        };
    }

    /**
     * Guardar video de propiedad
     */
    private async savePropertyVideo(file: Express.Multer.File): Promise<UploadedMedia> {
        // Validar tipo de archivo
        if (!this.videoProcessingService.isValidVideoFormat(file.mimetype)) {
            throw new BadRequestException(
                `Tipo de video no permitido: ${file.mimetype}. Solo MP4, MOV, AVI, WebM`
            );
        }

        // Validar tamaño (máximo 100MB por video)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            throw new BadRequestException(
                `Video muy grande. Máximo 100MB, recibido ${(file.size / 1024 / 1024).toFixed(2)}MB`
            );
        }

        // Generar nombre único (siempre guardamos como .mp4 después de procesar)
        const uniqueFilename = `${uuid()}.mp4`;
        const filepath = path.join(this.videosDir, uniqueFilename);

        this.logger.log(`Procesando video: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

        // Procesar video: comprimir y generar thumbnail
        const processed = await this.videoProcessingService.processVideo(file.buffer, filepath);

        // Extraer nombre del thumbnail para la URL
        const thumbnailFilename = path.basename(processed.thumbnailPath);

        return {
            url: `/uploads/properties/videos/${uniqueFilename}`, // Servir como archivo estático
            thumbnailUrl: `/uploads/properties/thumbnails/${thumbnailFilename}`,
            type: 'VIDEO',
            mimeType: 'video/mp4', // Siempre MP4 después de procesar
            size: processed.metadata.size,
            duration: Math.round(processed.metadata.duration),
        };
    }

    /**
     * Guardar archivos de imagen para propiedades (LEGACY - mantener compatibilidad)
     * @deprecated Usar savePropertyMedia en su lugar
     */
    async savePropertyImages(files: Express.Multer.File[]): Promise<string[]> {
        const media = await this.savePropertyMedia(files);
        return media.map((m) => m.url);
    }

    /**
     * Guardar avatar de usuario
     * Genera nombre único con timestamp para evitar problemas de cache
     * @param file - Archivo de imagen
     * @param userId - ID del usuario
     * @returns Ruta del avatar guardado
     */
    async saveUserAvatar(file: Express.Multer.File, userId: string): Promise<string> {
        this.logger.log(`Iniciando guardado de avatar para usuario: ${userId}`);

        if (!file) {
            this.logger.error('No se proporcionó imagen');
            throw new BadRequestException('No se proporcionó imagen');
        }

        // Validar tipo de archivo
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedMimes.includes(file.mimetype)) {
            this.logger.error(`Tipo de archivo no permitido: ${file.mimetype}`);
            throw new BadRequestException(
                `Tipo de archivo no permitido: ${file.mimetype}. Solo JPEG, PNG y WebP`,
            );
        }

        // Validar tamaño (máximo 2MB para avatars)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            this.logger.error(`Archivo muy grande: ${file.size} bytes`);
            throw new BadRequestException(
                `Archivo muy grande. Máximo 2MB, recibido ${(file.size / 1024 / 1024).toFixed(2)}MB`,
            );
        }

        // Generar nombre único con timestamp (evita problemas de cache)
        const ext = path.extname(file.originalname);
        const timestamp = Date.now();
        const uniqueFilename = `${userId}_${timestamp}${ext}`;
        const filepath = path.join(this.avatarsDir, uniqueFilename);

        this.logger.log(`Ruta de guardado: ${filepath}`);
        this.logger.log(`Timestamp añadido para evitar cache: ${timestamp}`);

        // Eliminar avatares antiguos del mismo usuario (mantener limpio el servidor)
        await this.deleteOldAvatars(userId);

        // Comprimir y guardar imagen (más pequeña para avatars)
        await this.compressAndSaveImage(file.buffer, filepath, {
            width: 200,
            height: 200,
            fit: 'cover',
            quality: 80,
        });

        this.logger.log(`Avatar guardado exitosamente: /uploads/avatars/${uniqueFilename}`);
        return `/uploads/avatars/${uniqueFilename}`;
    }

    /**
     * Eliminar avatares antiguos del mismo usuario
     * Mantiene solo el avatar más reciente para ahorrar espacio
     */
    private async deleteOldAvatars(userId: string): Promise<void> {
        try {
            const files = fs.readdirSync(this.avatarsDir);

            // Filtrar archivos del usuario (que empiezan con userId_)
            const userAvatars = files
                .filter((file) => file.startsWith(`${userId}_`))
                .map((file) => ({
                    name: file,
                    path: path.join(this.avatarsDir, file),
                    stat: fs.statSync(path.join(this.avatarsDir, file)),
                }))
                .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs); // Ordenar por fecha, más reciente primero

            // Eliminar todos excepto el más reciente
            for (let i = 1; i < userAvatars.length; i++) {
                fs.unlinkSync(userAvatars[i].path);
                this.logger.log(`Avatar antiguo eliminado: ${userAvatars[i].name}`);
            }
        } catch (error) {
            this.logger.warn(`No se pudieron limpiar avatares antiguos: ${error.message}`);
            // No lanzar error, solo advertencia
        }
    }

    /**
     * Comprimir y guardar imagen con Sharp
     */
    private async compressAndSaveImage(
        buffer: Buffer,
        filepath: string,
        options?: { width?: number; height?: number; fit?: any; quality?: number },
    ): Promise<void> {
        try {
            this.logger.log(`Comprimiendo imagen: ${filepath}`);

            let pipeline = sharp(buffer);

            // Si se especifican opciones de redimensionamiento
            if (options?.width || options?.height) {
                pipeline = pipeline.resize(options.width, options.height, {
                    fit: options.fit || 'cover',
                    withoutEnlargement: true,
                });
                this.logger.log(`Redimensionando a: ${options.width}x${options.height}`);
            }

            // Comprimir según formato
            const ext = path.extname(filepath).toLowerCase();
            if (ext === '.jpg' || ext === '.jpeg') {
                pipeline = pipeline.jpeg({ quality: options?.quality || 85 });
            } else if (ext === '.png') {
                pipeline = pipeline.png({ compressionLevel: 9 });
            } else if (ext === '.webp') {
                pipeline = pipeline.webp({ quality: options?.quality || 85 });
            }

            // Guardar archivo
            await pipeline.toFile(filepath);
            this.logger.log(`Imagen guardada exitosamente: ${filepath}`);
        } catch (error) {
            this.logger.error(`Error procesando imagen: ${error.message}`, error.stack);
            throw new BadRequestException(`Error procesando imagen: ${error.message}`);
        }
    }

    /**
     * Eliminar una imagen
     */
    deleteImage(imagePath: string): void {
        try {
            const filepath = path.join(process.cwd(), imagePath);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        } catch (error) {
            console.error(`Error eliminando archivo: ${imagePath}`, error);
        }
    }

    /**
     * Eliminar múltiples imágenes
     */
    deleteImages(imagePaths: string[]): void {
        imagePaths.forEach((imagePath) => this.deleteImage(imagePath));
    }

    /**
     * Obtener información de un archivo
     */
    getImageInfo(imagePath: string): { exists: boolean; size: number } {
        try {
            const filepath = path.join(process.cwd(), imagePath);
            if (fs.existsSync(filepath)) {
                const stats = fs.statSync(filepath);
                return {
                    exists: true,
                    size: stats.size,
                };
            }
            return { exists: false, size: 0 };
        } catch (error) {
            return { exists: false, size: 0 };
        }
    }
}
