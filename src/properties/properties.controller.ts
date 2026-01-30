import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Delete,
    Param,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFiles,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import * as path from 'path';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { FilterPropertyDto } from './dto/filter-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PROPERTY_TYPES_CONFIG } from './config/property-types.config';

@Controller('api/properties')
export class PropertiesController {
    constructor(private readonly propertiesService: PropertiesService) { }

    /**
     * POST /api/properties
     * Crear una nueva propiedad (requiere autenticación)
     */
    @Post()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createPropertyDto: CreatePropertyDto, @CurrentUser() user: any) {
        return await this.propertiesService.create(createPropertyDto, user.sub);
    }

    /**
     * POST /api/properties/with-images
     * Crear una propiedad CON media (imágenes y/o videos)
     * Endpoint recomendado para el frontend
     * 
     * IMPORTANTE: El campo de archivos debe llamarse 'files' (no 'images')
     * Soporta: JPG, PNG, WebP (máx 5MB) y MP4, MOV, AVI, WebM (máx 100MB)
     * Límites: 10 archivos totales, máximo 3 videos
     */
    @Post('with-images')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FilesInterceptor('files', 10)) // Ahora acepta 'files' y procesa en memoria
    async createWithImages(
        @Body() createPropertyDto: CreatePropertyDto,
        @UploadedFiles() files: Express.Multer.File[],
        @CurrentUser() user: any,
    ) {
        return await this.propertiesService.createWithImages(
            createPropertyDto,
            user.sub,
            files,
        );
    }

    /**
     * GET /api/properties/config/:propertyType
     * Obtener configuración de campos y amenidades para un PropertyType
     * Usado por frontend para generar formularios dinámicos
     */
    @Get('config/:propertyType')
    async getPropertyTypeConfig(@Param('propertyType') propertyType: string) {
        const config = PROPERTY_TYPES_CONFIG[propertyType];
        if (!config) {
            throw new Error(`PropertyType inválido: ${propertyType}`);
        }
        return {
            success: true,
            data: config,
        };
    }

    /**
     * GET /api/properties
     * Obtener todas las propiedades con filtros opcionales
     */
    @Get()
    async findAll(
        @Query() filters: FilterPropertyDto,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '15',
    ) {
        return await this.propertiesService.findAll(
            filters,
            parseInt(page),
            parseInt(limit),
        );
    }

    /**
     * GET /api/properties/search/location
     * Buscar propiedades por ubicación
     */
    @Get('search/location')
    async searchByLocation(
        @Query('latitude') latitude: string,
        @Query('longitude') longitude: string,
        @Query('radius') radius: string = '50',
    ) {
        return await this.propertiesService.searchByLocation(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(radius),
        );
    }

    /**
     * GET /api/properties/my-properties
     * Obtener las propiedades del usuario autenticado
     */
    @Get('my-properties')
    @UseGuards(JwtAuthGuard)
    async getUserProperties(
        @CurrentUser() user: any,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ) {
        return await this.propertiesService.getUserProperties(
            user.sub,
            parseInt(page),
            parseInt(limit),
        );
    }

    /**
     * GET /api/properties/:id
     * Obtener una propiedad por ID
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.propertiesService.findOne(id);
    }

    /**
     * PATCH /api/properties/:id
     * Actualizar una propiedad (requiere ser el propietario)
     */
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    async update(
        @Param('id') id: string,
        @Body() updatePropertyDto: UpdatePropertyDto,
        @CurrentUser() user: any,
    ) {
        return await this.propertiesService.update(id, updatePropertyDto, user.sub);
    }

    /**
     * PATCH /api/properties/:id/with-media
     * Actualizar propiedad Y agregar nuevos archivos (imágenes/videos)
     * Los archivos nuevos se AGREGAN a los existentes (no se reemplazan)
     * Para eliminar archivos, usar DELETE /api/properties/:id/media/:mediaId
     * 
     * Body debe incluir campos de UpdatePropertyDto + archivos
     * Campo de archivos: 'files' (multipart/form-data)
     */
    @Patch(':id/with-media')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FilesInterceptor('files', 10))
    async updateWithMedia(
        @Param('id') id: string,
        @Body() updatePropertyDto: UpdatePropertyDto,
        @UploadedFiles() files: Express.Multer.File[],
        @CurrentUser() user: any,
    ) {
        return await this.propertiesService.updateWithMedia(
            id,
            updatePropertyDto,
            user.sub,
            files,
        );
    }

    /**
     * DELETE /api/properties/:id/media/:mediaId
     * Eliminar un archivo específico (imagen o video) de una propiedad
     * También elimina el thumbnail si es un video
     */
    @Delete(':id/media/:mediaId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async deleteMedia(
        @Param('id') propertyId: string,
        @Param('mediaId') mediaId: string,
        @CurrentUser() user: any,
    ) {
        return await this.propertiesService.deletePropertyMedia(propertyId, mediaId, user.sub);
    }

    /**
     * PATCH /api/properties/:id/media/reorder
     * Reordenar los archivos de media de una propiedad
     * Body: { mediaOrder: [{ id: 'uuid1', order: 0 }, { id: 'uuid2', order: 1 }] }
     */
    @Patch(':id/media/reorder')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async reorderMedia(
        @Param('id') propertyId: string,
        @Body() body: { mediaOrder: Array<{ id: string; order: number }> },
        @CurrentUser() user: any,
    ) {
        return await this.propertiesService.reorderPropertyMedia(
            propertyId,
            body.mediaOrder,
            user.sub,
        );
    }

    /**
     * DELETE /api/properties/:id
     * Eliminar una propiedad (requiere ser el propietario)
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string, @CurrentUser() user: any) {
        return await this.propertiesService.remove(id, user.sub);
    }

    /**
     * PATCH /api/properties/:id/publish
     * Publicar una propiedad (cambiar postStatus a PUBLISHED)
     */
    @Patch(':id/publish')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async publishProperty(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ) {
        return await this.propertiesService.publishProperty(id, user.sub);
    }

    /**
     * PATCH /api/properties/:id/archive
     * Archivar una propiedad (cambiar postStatus a ARCHIVED)
     */
    @Patch(':id/archive')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async archiveProperty(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ) {
        return await this.propertiesService.archiveProperty(id, user.sub);
    }
}
