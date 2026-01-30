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
    async findAll(filters?: FilterPropertyDto, page = 1, limit = 15) {
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
        if (filters?.currency) {
            where.currency = filters.currency;
        }

        // Búsqueda por título o descripción
        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
                { address: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        // Filtro por ubicación
        if (filters?.city) {
            where.city = { contains: filters.city, mode: 'insensitive' };
        }
        if (filters?.state) {
            where.state = { contains: filters.state, mode: 'insensitive' };
        }

        // Filtro por amenidades (debe contener TODAS las amenidades especificadas)
        if (filters?.amenities && filters.amenities.length > 0) {
            where.amenities = { hasEvery: filters.amenities };
        }

        // ========================================
        // FILTROS PARA SPECIFICATIONS (nuevo sistema dinámico)
        // ========================================
        const specFilters: any[] = [];

        // Dormitorios
        if (filters?.dormitorios !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['dormitorios'],
                    equals: filters.dormitorios,
                },
            });
        }
        if (filters?.dormitorios_min !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['dormitorios'],
                    gte: filters.dormitorios_min,
                },
            });
        }
        if (filters?.dormitorios_max !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['dormitorios'],
                    lte: filters.dormitorios_max,
                },
            });
        }

        // Baños
        if (filters?.baños !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['baños'],
                    equals: filters.baños,
                },
            });
        }
        if (filters?.baños_min !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['baños'],
                    gte: filters.baños_min,
                },
            });
        }
        if (filters?.baños_max !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['baños'],
                    lte: filters.baños_max,
                },
            });
        }

        // Área
        if (filters?.area_min !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['area'],
                    gte: filters.area_min,
                },
            });
        }
        if (filters?.area_max !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['area'],
                    lte: filters.area_max,
                },
            });
        }

        // Área construida
        if (filters?.areaBuilt_min !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['areaBuilt'],
                    gte: filters.areaBuilt_min,
                },
            });
        }
        if (filters?.areaBuilt_max !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['areaBuilt'],
                    lte: filters.areaBuilt_max,
                },
            });
        }

        // Garage
        if (filters?.garage_min !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['garage'],
                    gte: filters.garage_min,
                },
            });
        }

        // Estacionamiento
        if (filters?.estacionamiento_min !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['estacionamiento'],
                    gte: filters.estacionamiento_min,
                },
            });
        }

        // Expensas
        if (filters?.expensas_min !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['expensas'],
                    gte: filters.expensas_min,
                },
            });
        }
        if (filters?.expensas_max !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['expensas'],
                    lte: filters.expensas_max,
                },
            });
        }

        // Piso
        if (filters?.piso_min !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['piso'],
                    gte: filters.piso_min,
                },
            });
        }
        if (filters?.piso_max !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['piso'],
                    lte: filters.piso_max,
                },
            });
        }

        // Campos booleanos
        if (filters?.jardin !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['jardin'],
                    equals: filters.jardin,
                },
            });
        }
        if (filters?.patio !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['patio'],
                    equals: filters.patio,
                },
            });
        }
        if (filters?.balcon !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['balcon'],
                    equals: filters.balcon,
                },
            });
        }
        if (filters?.esquina !== undefined) {
            specFilters.push({
                specifications: {
                    path: ['esquina'],
                    equals: filters.esquina,
                },
            });
        }

        // Topografía
        if (filters?.topografia) {
            specFilters.push({
                specifications: {
                    path: ['topografia'],
                    equals: filters.topografia,
                },
            });
        }

        // Aplicar filtros de specifications si hay alguno
        if (specFilters.length > 0) {
            where.AND = specFilters;
        }

        // Filtro por características legacy (para compatibilidad con datos antiguos)
        if (filters?.bedrooms) {
            where.bedrooms = filters.bedrooms;
        }
        if (filters?.bathrooms) {
            where.bathrooms = filters.bathrooms;
        }

        if (filters?.minPrice) {
            where.price = { gte: filters.minPrice };
        }
        if (filters?.maxPrice) {
            where.price = { ...where.price, lte: filters.maxPrice };
        }

        // Configurar ordenamiento dinámico
        let orderBy: any = { createdAt: 'desc' }; // Por defecto, más recientes primero

        if (filters?.sortBy) {
            const validSortFields = ['price', 'createdAt', 'title', 'area'];
            if (validSortFields.includes(filters.sortBy)) {
                const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';
                orderBy = { [filters.sortBy]: sortOrder };
            }
        }

        const [properties, total] = await Promise.all([
            this.prisma.property.findMany({
                where,
                skip,
                take: limit,
                include: {
                    // ✅ Optimización: Solo la primera imagen para el feed/cards
                    images: {
                        take: 1, // Solo 1 imagen
                        orderBy: { order: 'asc' }, // La primera según orden
                        select: {
                            id: true,
                            url: true, // Solo URL necesaria
                            type: true, // Para distinguir IMAGE/VIDEO si es necesario
                        },
                    },
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            // ❌ phone removido - no se usa en las cards
                        },
                    },
                },
                orderBy,
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
     * Actualizar propiedad Y agregar nuevos archivos multimedia
     * Los archivos nuevos se AGREGAN a los existentes
     */
    async updateWithMedia(
        id: string,
        updatePropertyDto: UpdatePropertyDto,
        userId: string,
        files?: Express.Multer.File[],
    ) {
        // Primero actualizar los datos de la propiedad (si se proporcionan)
        let updatedProperty = await this.update(id, updatePropertyDto, userId);

        // Si hay archivos, procesarlos y agregarlos
        if (files && files.length > 0) {
            // Contar media existente
            const existingMedia = await this.prisma.propertyMedia.count({
                where: { propertyId: id },
            });

            // Validar límite total (10 archivos máximo)
            const maxFiles = 10;
            if (existingMedia + files.length > maxFiles) {
                throw new BadRequestException(
                    `Máximo ${maxFiles} archivos por propiedad. Tienes ${existingMedia}, intentas agregar ${files.length}`,
                );
            }

            // Procesar y guardar nuevos archivos
            const mediaArray = await this.uploadService.savePropertyMedia(files);

            // Calcular el siguiente order disponible
            const maxOrder = await this.prisma.propertyMedia.findFirst({
                where: { propertyId: id },
                orderBy: { order: 'desc' },
                select: { order: true },
            });
            const nextOrder = (maxOrder?.order ?? -1) + 1;

            // Crear registros en base de datos para cada archivo
            await Promise.all(
                mediaArray.map((media, index) =>
                    this.prisma.propertyMedia.create({
                        data: {
                            propertyId: id,
                            type: media.type,
                            url: media.url,
                            thumbnailUrl: media.thumbnailUrl,
                            order: nextOrder + index,
                            mimeType: media.mimeType,
                            size: media.size,
                            duration: media.duration,
                        },
                    }),
                ),
            );

            // Obtener propiedad actualizada con todos los media
            updatedProperty = await this.prisma.property.findUnique({
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
                        },
                    },
                },
            });
        }

        return this.normalizePropertyData(updatedProperty);
    }

    /**
     * Eliminar un archivo específico de una propiedad
     */
    async deletePropertyMedia(propertyId: string, mediaId: string, userId: string) {
        // Verificar propiedad y permisos
        const property = await this.prisma.property.findUnique({
            where: { id: propertyId },
        });

        if (!property) {
            throw new NotFoundException('Propiedad no encontrada');
        }

        if (property.ownerId !== userId) {
            throw new ForbiddenException('No tienes permisos para modificar esta propiedad');
        }

        // Buscar el archivo media
        const media = await this.prisma.propertyMedia.findUnique({
            where: { id: mediaId },
        });

        if (!media || media.propertyId !== propertyId) {
            throw new NotFoundException('Archivo no encontrado en esta propiedad');
        }

        // Eliminar archivo físico del servidor
        this.uploadService.deleteImage(media.url);

        // Si es video, eliminar también el thumbnail
        if (media.type === 'VIDEO' && media.thumbnailUrl) {
            this.uploadService.deleteImage(media.thumbnailUrl);
        }

        // Eliminar registro de base de datos
        await this.prisma.propertyMedia.delete({
            where: { id: mediaId },
        });

        return {
            message: 'Archivo eliminado exitosamente',
            deletedMedia: {
                id: media.id,
                type: media.type,
                url: media.url,
            },
        };
    }

    /**
     * Reordenar archivos multimedia de una propiedad
     */
    async reorderPropertyMedia(
        propertyId: string,
        mediaOrder: Array<{ id: string; order: number }>,
        userId: string,
    ) {
        // Verificar propiedad y permisos
        const property = await this.prisma.property.findUnique({
            where: { id: propertyId },
        });

        if (!property) {
            throw new NotFoundException('Propiedad no encontrada');
        }

        if (property.ownerId !== userId) {
            throw new ForbiddenException('No tienes permisos para modificar esta propiedad');
        }

        // Actualizar order de cada archivo en paralelo
        await Promise.all(
            mediaOrder.map((item) =>
                this.prisma.propertyMedia.update({
                    where: { id: item.id, propertyId }, // Validar que pertenece a esta propiedad
                    data: { order: item.order },
                }),
            ),
        );

        // Retornar propiedad actualizada
        const updatedProperty = await this.prisma.property.findUnique({
            where: { id: propertyId },
            include: {
                images: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!updatedProperty) {
            throw new NotFoundException('Error obteniendo propiedad actualizada');
        }

        return {
            message: 'Orden actualizado exitosamente',
            media: updatedProperty.images,
        };
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

        // Si hay archivos, procesarlos y crear registros en BD
        if (files && files.length > 0) {
            try {
                // Guardar archivos (imágenes y/o videos)
                const mediaFiles = await this.uploadService.savePropertyMedia(files);

                // Crear registros de media en la BD
                const propertyMedia = await Promise.all(
                    mediaFiles.map((media, index) =>
                        this.prisma.propertyMedia.create({
                            data: {
                                url: media.url,
                                thumbnailUrl: media.thumbnailUrl || null,
                                type: media.type,
                                order: index + 1,
                                duration: media.duration || null,
                                size: media.size || null,
                                mimeType: media.mimeType || null,
                                propertyId: property.id,
                            },
                        }),
                    ),
                );

                // Retornar propiedad con media
                return {
                    ...property,
                    images: propertyMedia,
                    owner: {
                        id: userId,
                    },
                };
            } catch (error) {
                // Si algo falla en los archivos, eliminar la propiedad creada
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
