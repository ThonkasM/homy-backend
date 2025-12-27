import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { FilterPropertyDto } from './dto/filter-property.dto';
import { UploadService } from '../upload/upload.service';
import { validateSpecifications, validateAmenities } from './config/property-types.config';

@Injectable()
export class PropertiesService {
    constructor(
        private prisma: PrismaService,
        private uploadService: UploadService,
    ) { }

    /**
     * MÉTODO AUXILIAR: Convertir datos legacy a specifications
     * Esto permite que propiedades antiguas que usan bedrooms, bathrooms, etc.
     * se conviertan automáticamente a specifications cuando se leen
     */
    private normalizePropertyData(property: any) {
        // Si ya tiene specifications con contenido, retorna como está
        if (property.specifications && Object.keys(property.specifications).length > 0) {
            return property;
        }

        // Si tiene campos legacy (bedrooms, bathrooms, etc.), convertir a specifications
        const specifications: any = {};
        if (property.bedrooms !== null) specifications.bedrooms = property.bedrooms;
        if (property.bathrooms !== null) specifications.bathrooms = property.bathrooms;
        if (property.area !== null) specifications.area = property.area;
        if (property.parking !== null) specifications.parking = property.parking;
        if (property.floor !== null) specifications.floor = property.floor;

        // Solo actualizar si hay algo que convertir
        if (Object.keys(specifications).length > 0) {
            property.specifications = specifications;
        }

        return property;
    }

    /**
     * MÉTODO AUXILIAR: Validar y normalizar datos de entrada
     * Soporta AMBOS formatos:
     * - Nuevo: specifications + amenities validadas
     * - Legacy: bedrooms, bathrooms, area, parking, floor (sin validar, para compatibilidad)
     */
    private validatePropertyInput(
        propertyType: string,
        createPropertyDto: any,
    ): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Si envía specifications, validar contra config
        if (createPropertyDto.specifications && Object.keys(createPropertyDto.specifications).length > 0) {
            const specValidation = validateSpecifications(propertyType, createPropertyDto.specifications);
            if (!specValidation.valid) {
                errors.push(...specValidation.errors);
            }
        }

        // Si envía amenities, validar contra config
        if (createPropertyDto.amenities && createPropertyDto.amenities.length > 0) {
            const amenitiesValidation = validateAmenities(propertyType, createPropertyDto.amenities);
            if (!amenitiesValidation.valid) {
                errors.push(...amenitiesValidation.errors);
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Crear una nueva propiedad
     * Soporta AMBOS formatos:
     * - Nuevo: specifications + amenities validadas
     * - Legacy: bedrooms, bathrooms, area, parking, floor (para compatibilidad)
     */
    async create(createPropertyDto: CreatePropertyDto, userId: string) {
        const {
            title,
            description,
            price,
            currency = 'BOB',
            propertyType,
            operationType,
            latitude,
            longitude,
            address,
            city,
            state,
            country,
            specifications = {},
            amenities = [],
            contactPhone,
            contactEmail,
            contactWhatsApp,
        } = createPropertyDto;

        // Validar si se envían specifications
        if (specifications && Object.keys(specifications).length > 0) {
            const validation = this.validatePropertyInput(propertyType, {
                specifications,
                amenities,
            });
            if (!validation.valid) {
                throw new BadRequestException(
                    `Validación fallida: ${validation.errors.join(', ')}`,
                );
            }
        }

        const property = await this.prisma.property.create({
            data: {
                title,
                description,
                price,
                currency,
                propertyType,
                operationType,
                latitude,
                longitude,
                address,
                city,
                state: state || null,
                country: country || 'Bolivia',
                specifications: specifications || {},
                amenities: amenities || [],
                contactPhone,
                contactEmail: contactEmail || null,
                contactWhatsApp: contactWhatsApp || null,
                ownerId: userId,
            },
            include: {
                images: true,
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        phone: true,
                    },
                },
            },
        });

        // Normalizar respuesta (convertir legacy a specifications si es necesario)
        return this.normalizePropertyData(property);
    }

    /**
     * Obtener todas las propiedades (con filtros opcionales)
     * Solo devuelve propiedades PUBLICADAS
     */
    async findAll(filters?: FilterPropertyDto, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const where: any = {
            deletedAt: null,
            postStatus: 'PUBLISHED', // Solo mostrar propiedades publicadas
        };

        // Aplicar filtros
        if (filters?.propertyType) {
            where.propertyType = filters.propertyType;
        }
        if (filters?.operationType) {
            where.operationType = filters.operationType;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.minPrice) {
            where.price = { gte: filters.minPrice };
        }
        if (filters?.maxPrice) {
            where.price = { ...where.price, lte: filters.maxPrice };
        }

        const [properties, total] = await Promise.all([
            this.prisma.property.findMany({
                where,
                skip,
                take: limit,
                include: {
                    images: true,
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            phone: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.property.count({ where }),
        ]);

        // Normalizar todas las propiedades (convertir legacy a specifications si es necesario)
        const normalizedProperties = properties.map((prop) => this.normalizePropertyData(prop));

        return {
            properties: normalizedProperties,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Obtener una propiedad por ID
     */
    async findOne(id: string) {
        const property = await this.prisma.property.findUnique({
            where: { id },
            include: {
                images: {
                    orderBy: { order: 'asc' },
                },
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        phone: true,
                        email: true,
                    },
                },
                reviews: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });

        if (!property || property.deletedAt) {
            throw new NotFoundException('Propiedad no encontrada');
        }

        // Normalizar respuesta (convertir legacy a specifications si es necesario)
        return this.normalizePropertyData(property);
    }

    /**
     * Actualizar una propiedad
     * Soporta AMBOS formatos (legacy + nuevo)
     */
    async update(id: string, updatePropertyDto: UpdatePropertyDto, userId: string) {
        // Verificar que la propiedad existe y pertenece al usuario
        const property = await this.prisma.property.findUnique({
            where: { id },
        });

        if (!property) {
            throw new NotFoundException('Propiedad no encontrada');
        }

        if (property.ownerId !== userId) {
            throw new ForbiddenException('No tienes permisos para actualizar esta propiedad');
        }

        // Validar si se envían specifications nuevas
        if (updatePropertyDto.specifications && Object.keys(updatePropertyDto.specifications).length > 0) {
            const validation = this.validatePropertyInput(property.propertyType, {
                specifications: updatePropertyDto.specifications,
                amenities: updatePropertyDto.amenities,
            });
            if (!validation.valid) {
                throw new BadRequestException(
                    `Validación fallida: ${validation.errors.join(', ')}`,
                );
            }
        }

        const updatedProperty = await this.prisma.property.update({
            where: { id },
            data: updatePropertyDto,
            include: {
                images: true,
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
        });

        // Normalizar respuesta
        return this.normalizePropertyData(updatedProperty);
    }

    /**
     * Eliminar una propiedad (soft delete)
     */
    async remove(id: string, userId: string) {
        const property = await this.prisma.property.findUnique({
            where: { id },
        });

        if (!property) {
            throw new NotFoundException('Propiedad no encontrada');
        }

        if (property.ownerId !== userId) {
            throw new ForbiddenException('No tienes permisos para eliminar esta propiedad');
        }

        await this.prisma.property.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return { message: 'Propiedad eliminada exitosamente' };
    }

    /**
     * Buscar propiedades por ubicación (usando radio en km)
     * Usa fórmula de Haversine para calcular distancia
     * Solo devuelve propiedades PUBLICADAS
     */
    async searchByLocation(latitude: number, longitude: number, radiusKm: number = 50) {
        // Convertir radio a grados (aproximadamente)
        const radiusInDegrees = radiusKm / 111;

        const properties = await this.prisma.property.findMany({
            where: {
                deletedAt: null,
                postStatus: 'PUBLISHED', // Solo mostrar propiedades publicadas
                latitude: {
                    gte: latitude - radiusInDegrees,
                    lte: latitude + radiusInDegrees,
                },
                longitude: {
                    gte: longitude - radiusInDegrees,
                    lte: longitude + radiusInDegrees,
                },
            },
            include: {
                images: true,
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
        });

        // Filtrar por distancia exacta usando Haversine
        const filtered = properties.filter((property) => {
            const distance = this.calculateDistance(
                latitude,
                longitude,
                Number(property.latitude),
                Number(property.longitude),
            );
            return distance <= radiusKm;
        });

        // Normalizar propiedades
        return filtered.map((prop) => this.normalizePropertyData(prop));
    }

    /**
     * Obtener propiedades del usuario autenticado
     */
    async getUserProperties(userId: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [properties, total] = await Promise.all([
            this.prisma.property.findMany({
                where: {
                    ownerId: userId,
                    deletedAt: null,
                },
                skip,
                take: limit,
                include: {
                    images: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.property.count({
                where: {
                    ownerId: userId,
                    deletedAt: null,
                },
            }),
        ]);

        // Normalizar propiedades
        const normalizedProperties = properties.map((prop) => this.normalizePropertyData(prop));

        return {
            properties: normalizedProperties,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Calcular distancia entre dos coordenadas usando Haversine
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
            Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Crear una propiedad con imágenes en un solo paso
     * Recibe la propiedad + archivos de imagen y los guarda juntos
     * Valida specifications y amenities dinámicas
     */
    async createWithImages(
        createPropertyDto: CreatePropertyDto,
        userId: string,
        files?: Express.Multer.File[],
    ) {
        const {
            title,
            description,
            price,
            currency = 'BOB',
            propertyType,
            operationType,
            latitude,
            longitude,
            address,
            city,
            state,
            country,
            specifications = {},
            amenities = [],
            contactPhone,
            contactEmail,
            contactWhatsApp,
        } = createPropertyDto;

        // Validar specifications dinámicas
        if (specifications && Object.keys(specifications).length > 0) {
            const specValidation = validateSpecifications(propertyType, specifications);
            if (!specValidation.valid) {
                throw new BadRequestException(
                    `Validación de specifications fallida: ${specValidation.errors.join(', ')}`,
                );
            }
        }

        // Validar amenities
        if (amenities && amenities.length > 0) {
            const amenitiesValidation = validateAmenities(propertyType, amenities);
            if (!amenitiesValidation.valid) {
                throw new BadRequestException(
                    `Validación de amenities fallida: ${amenitiesValidation.errors.join(', ')}`,
                );
            }
        }

        // Crear la propiedad sin imágenes primero
        const property = await this.prisma.property.create({
            data: {
                title,
                description,
                price,
                currency,
                propertyType,
                operationType,
                latitude,
                longitude,
                address,
                city,
                state: state || null,
                country: country || 'Bolivia',
                specifications: specifications || {},
                amenities: amenities || [],
                contactPhone,
                contactEmail: contactEmail || null,
                contactWhatsApp: contactWhatsApp || null,
                ownerId: userId,
            },
        });

        // Si hay archivos, crear registros en BD
        // Los archivos ya están guardados en disco por multer's diskStorage
        if (files && files.length > 0) {
            try {
                // Mapear archivos a sus rutas públicas
                // Los archivos ya están en uploads/properties/ gracias a diskStorage
                const imagePaths = files.map(
                    (file) => `/uploads/properties/${file.filename}`,
                );

                // Crear registros de imágenes en la BD
                const propertyImages = await Promise.all(
                    imagePaths.map((url, index) =>
                        this.prisma.propertyImage.create({
                            data: {
                                url,
                                order: index + 1,
                                propertyId: property.id,
                            },
                        }),
                    ),
                );

                // Retornar propiedad con imágenes
                return {
                    ...property,
                    images: propertyImages,
                    owner: {
                        id: userId,
                    },
                };
            } catch (error) {
                // Si algo falla en las imágenes, eliminar la propiedad creada
                await this.prisma.property.delete({
                    where: { id: property.id },
                });
                throw error;
            }
        }

        return {
            ...property,
            images: [],
        };
    }

    /**
     * Publicar una propiedad (cambiar postStatus a PUBLISHED)
     */
    async publishProperty(id: string, userId: string) {
        const property = await this.prisma.property.findUnique({
            where: { id },
        });

        if (!property) {
            throw new NotFoundException('Propiedad no encontrada');
        }

        if (property.ownerId !== userId) {
            throw new ForbiddenException('No tienes permisos para publicar esta propiedad');
        }

        if (property.postStatus === 'PUBLISHED') {
            throw new BadRequestException('Esta propiedad ya está publicada');
        }

        const updated = await this.prisma.property.update({
            where: { id },
            data: { postStatus: 'PUBLISHED' },
            include: {
                images: true,
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
        });

        return {
            success: true,
            message: 'Propiedad publicada exitosamente',
            property: updated,
        };
    }

    /**
     * Archivar una propiedad (cambiar postStatus a ARCHIVED)
     */
    async archiveProperty(id: string, userId: string) {
        const property = await this.prisma.property.findUnique({
            where: { id },
        });

        if (!property) {
            throw new NotFoundException('Propiedad no encontrada');
        }

        if (property.ownerId !== userId) {
            throw new ForbiddenException('No tienes permisos para archivar esta propiedad');
        }

        if (property.postStatus === 'ARCHIVED') {
            throw new BadRequestException('Esta propiedad ya está archivada');
        }

        const updated = await this.prisma.property.update({
            where: { id },
            data: { postStatus: 'ARCHIVED' },
            include: {
                images: true,
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
        });

        return {
            success: true,
            message: 'Propiedad archivada exitosamente',
            property: updated,
        };
    }
}
