import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

// Configurar ffmpeg y ffprobe
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const unlinkAsync = promisify(fs.unlink);

export interface VideoMetadata {
    duration: number; // Duración en segundos
    width: number;
    height: number;
    size: number; // Tamaño en bytes
    format: string;
}

export interface ProcessedVideo {
    videoPath: string; // Ruta del video procesado
    thumbnailPath: string; // Ruta del thumbnail
    metadata: VideoMetadata;
}

@Injectable()
export class VideoProcessingService {
    private readonly logger = new Logger('VideoProcessingService');

    constructor() {
        // Verificar que FFmpeg y FFprobe estén configurados correctamente
        this.logger.log(`FFmpeg path: ${ffmpegInstaller.path}`);
        this.logger.log(`FFprobe path: ${ffprobeInstaller.path}`);
    }

    /**
     * Procesar video: comprimir y generar thumbnail
     * @param inputBuffer - Buffer del video original
     * @param outputPath - Ruta donde guardar el video procesado
     * @returns Información del video procesado
     */
    async processVideo(inputBuffer: Buffer, outputPath: string): Promise<ProcessedVideo> {
        const tempInputPath = `${outputPath}.temp`;

        // Generar ruta del thumbnail en la carpeta correcta (thumbnails, no videos)
        const videoFilename = path.basename(outputPath, path.extname(outputPath)); // xyz789
        const thumbnailsDir = outputPath.replace('/videos/', '/thumbnails/').replace(path.basename(outputPath), '');
        const thumbnailPath = path.join(thumbnailsDir, `${videoFilename}_thumb.jpg`);

        try {
            // Guardar temporalmente el archivo de entrada
            fs.writeFileSync(tempInputPath, inputBuffer);

            // Obtener metadata del video
            const metadata = await this.getVideoMetadata(tempInputPath);

            this.logger.log(`Video original: ${metadata.width}x${metadata.height}, ${metadata.duration}s, ${(metadata.size / 1024 / 1024).toFixed(2)}MB`);

            // Validar duración (máximo 2 minutos para propiedades)
            const maxDuration = 120; // 2 minutos
            if (metadata.duration > maxDuration) {
                throw new BadRequestException(
                    `Video muy largo. Máximo ${maxDuration} segundos, el video tiene ${Math.round(metadata.duration)}s`
                );
            }

            // Validar resolución (máximo 1920x1080)
            if (metadata.width > 1920 || metadata.height > 1080) {
                this.logger.log(`Video excede 1080p, se redimensionará`);
            }

            // Comprimir y optimizar video
            await this.compressVideo(tempInputPath, outputPath, metadata);

            // Generar thumbnail
            await this.generateThumbnail(outputPath, thumbnailPath);

            // Limpiar archivo temporal
            await unlinkAsync(tempInputPath);

            // Obtener tamaño del archivo final
            const finalSize = fs.statSync(outputPath).size;
            this.logger.log(`Video procesado: ${(finalSize / 1024 / 1024).toFixed(2)}MB`);

            return {
                videoPath: outputPath,
                thumbnailPath,
                metadata: {
                    ...metadata,
                    size: finalSize,
                },
            };
        } catch (error) {
            // Limpiar archivos en caso de error
            [tempInputPath, outputPath, thumbnailPath].forEach((file) => {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                }
            });
            throw error;
        }
    }

    /**
     * Obtener metadata del video
     */
    private getVideoMetadata(filePath: string): Promise<VideoMetadata> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) {
                    this.logger.error(`Error obteniendo metadata: ${err.message}`);
                    reject(new BadRequestException('No se pudo procesar el video'));
                    return;
                }

                const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
                if (!videoStream) {
                    reject(new BadRequestException('No se encontró stream de video'));
                    return;
                }

                resolve({
                    duration: metadata.format.duration || 0,
                    width: videoStream.width || 0,
                    height: videoStream.height || 0,
                    size: metadata.format.size || 0,
                    format: metadata.format.format_name || 'unknown',
                });
            });
        });
    }

    /**
     * Comprimir video usando H.264 (mejor compatibilidad)
     * Optimizado para web: calidad balanceada y tamaño reducido
     */
    private compressVideo(inputPath: string, outputPath: string, metadata: VideoMetadata): Promise<void> {
        return new Promise((resolve, reject) => {
            let command = ffmpeg(inputPath)
                .outputOptions([
                    '-c:v libx264', // Codec H.264 (mejor compatibilidad)
                    '-crf 28', // Calidad: 23=alta, 28=media (menor tamaño), 32=baja
                    '-preset medium', // Balance entre velocidad y compresión
                    '-c:a aac', // Audio AAC
                    '-b:a 128k', // Bitrate audio 128kbps
                    '-movflags +faststart', // Optimización para streaming web
                    '-pix_fmt yuv420p', // Compatibilidad con navegadores
                ]);

            // Redimensionar si excede 1080p
            if (metadata.width > 1920 || metadata.height > 1080) {
                command = command.size('1920x1080').autopad();
            }

            command
                .output(outputPath)
                .on('start', (cmdLine) => {
                    this.logger.log(`FFmpeg iniciado: ${cmdLine}`);
                })
                .on('progress', (progress) => {
                    if (progress.percent) {
                        this.logger.log(`Procesando: ${Math.round(progress.percent)}%`);
                    }
                })
                .on('end', () => {
                    this.logger.log('Compresión completada');
                    resolve();
                })
                .on('error', (err) => {
                    this.logger.error(`Error comprimiendo: ${err.message}`);
                    reject(new BadRequestException(`Error procesando video: ${err.message}`));
                })
                .run();
        });
    }

    /**
     * Generar thumbnail del video con crop centrado (alta calidad)
     * Captura en el segundo 1, hace crop al centro para preservar calidad
     */
    private generateThumbnail(videoPath: string, thumbnailPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Primero capturamos el frame en resolución original
            const tempThumbnail = `${thumbnailPath}.temp.jpg`;

            ffmpeg(videoPath)
                .screenshots({
                    timestamps: ['1'], // Captura en el segundo 1
                    filename: path.basename(tempThumbnail),
                    folder: path.dirname(tempThumbnail),
                    size: '?x720', // Capturar en 720p (altura fija, mantener aspecto)
                })
                .on('end', async () => {
                    try {
                        // Usar Sharp para hacer crop centrado y optimizar
                        await sharp(tempThumbnail)
                            .resize(1280, 720, {
                                fit: 'cover',      // Crop centrado (cubre todo el área)
                                position: 'center' // Centrar el crop
                            })
                            .jpeg({
                                quality: 90,       // Alta calidad para thumbnails
                                progressive: true  // JPEG progresivo (carga más rápido)
                            })
                            .toFile(thumbnailPath);

                        // Eliminar archivo temporal
                        if (fs.existsSync(tempThumbnail)) {
                            fs.unlinkSync(tempThumbnail);
                        }

                        this.logger.log(`Thumbnail generado (crop centrado 1280x720): ${thumbnailPath}`);
                        resolve();
                    } catch (sharpError) {
                        this.logger.error(`Error procesando thumbnail con Sharp: ${sharpError.message}`);
                        reject(new BadRequestException(`Error procesando thumbnail: ${sharpError.message}`));
                    }
                })
                .on('error', (err) => {
                    this.logger.error(`Error capturando frame: ${err.message}`);
                    reject(new BadRequestException(`Error generando thumbnail: ${err.message}`));
                });
        });
    }

    /**
     * Validar formato de video
     */
    isValidVideoFormat(mimetype: string): boolean {
        const allowedMimes = [
            'video/mp4',
            'video/quicktime', // MOV
            'video/x-msvideo', // AVI
            'video/webm',
        ];
        return allowedMimes.includes(mimetype);
    }

    /**
     * Obtener extensión apropiada según mimetype
     */
    getVideoExtension(mimetype: string): string {
        const extensions = {
            'video/mp4': '.mp4',
            'video/quicktime': '.mov',
            'video/x-msvideo': '.avi',
            'video/webm': '.webm',
        };
        return extensions[mimetype] || '.mp4';
    }
}
