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
     * Crear una propiedad CON imágenes en un solo formulario multipart/form-data
     * Endpoint recomendado para el frontend
     */
    @Post('with-images')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(
        FilesInterceptor('images', 10, {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const uploadsDir = path.join(process.cwd(), 'uploads', 'properties');
                    cb(null, uploadsDir);
                },
                filename: (req, file, cb) => {
                    const ext = path.extname(file.originalname);
                    const filename = `${uuid()}${ext}`;
                    cb(null, filename);
                },
            }),
        }),
    )
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
     * GET /api/properties
     * Obtener todas las propiedades con filtros opcionales
     */
    @Get()
    async findAll(
        @Query() filters: FilterPropertyDto,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
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
     * DELETE /api/properties/:id
     * Eliminar una propiedad (requiere ser el propietario)
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string, @CurrentUser() user: any) {
        return await this.propertiesService.remove(id, user.sub);
    }
}
