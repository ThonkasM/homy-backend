import {
    Controller,
    Post,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    HttpCode,
    HttpStatus,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/upload')
export class UploadController {
    private readonly logger = new Logger('UploadController');

    constructor(
        private readonly uploadService: UploadService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * POST /api/upload/avatar
     * Subir avatar del usuario autenticado
     * Acepta un archivo de imagen (multipart/form-data con campo 'file')
     */
    @Post('avatar')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('file'))
    async uploadAvatar(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: any,
    ) {
        this.logger.log(`Iniciando upload de avatar para usuario: ${user.sub}`);

        if (!file) {
            this.logger.error('No se proporcionó archivo');
            throw new BadRequestException('No se proporcionó archivo');
        }

        this.logger.log(`Archivo recibido: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}`);

        try {
            // Guardar avatar (comprimido a 200x200)
            const avatarUrl = await this.uploadService.saveUserAvatar(file, user.sub);
            this.logger.log(`Avatar guardado en: ${avatarUrl}`);

            // Actualizar usuario con nueva URL de avatar
            const updatedUser = await this.prisma.user.update({
                where: { id: user.sub },
                data: { avatar: avatarUrl },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    phone: true,
                },
            });

            this.logger.log(`Avatar actualizado exitosamente para usuario: ${user.sub}`);

            return {
                message: 'Avatar actualizado exitosamente',
                avatarUrl,
                user: updatedUser,
            };
        } catch (error) {
            this.logger.error(`Error al subir avatar: ${error.message}`, error.stack);
            throw new BadRequestException(error.message);
        }
    }

    /**
     * POST /api/upload/test
     * Endpoint de prueba para verificar que el upload funciona
     */
    @Post('test')
    @UseInterceptors(FileInterceptor('file'))
    async testUpload(@UploadedFile() file: Express.Multer.File) {
        this.logger.log('Test de upload recibido');

        if (!file) {
            throw new BadRequestException('No se proporcionó archivo');
        }

        this.logger.log(`Test file: ${file.originalname}, mimetype: ${file.mimetype}, size: ${file.size}`);

        return {
            message: 'Archivo recibido correctamente',
            filename: file.originalname,
            mimetype: file.mimetype,
            size: `${(file.size / 1024).toFixed(2)} KB`,
        };
    }
}
