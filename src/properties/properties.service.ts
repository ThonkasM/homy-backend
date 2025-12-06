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

@Injectable()
export class PropertiesService {
    constructor(
        private prisma: PrismaService,
        private uploadService: UploadService,
    ) { }

    /**
     * Crear una nueva propiedad
     */
    async create(createPropertyDto: CreatePropertyDto, userId: string) {
        const {
            title,
            description,
            price,
            propertyType,
            operationType,
            latitude,
            longitude,
            address,
            city,
            state,
            country,
            bedrooms,
            bathrooms,
            area,
            parking,
            floor,
            amenities,
            contactPhone,
            contactEmail,
            contactWhatsApp,
        } = createPropertyDto;

        const property = await this.prisma.property.create({
            data: {
                title,
                description,
                price,
                propertyType,
                operationType,
                latitude,
                longitude,
                address,
                city,
                state: state || null,
                country: country || 'Bolivia',
                bedrooms: bedrooms || null,
                bathrooms: bathrooms || null,
                area: area || null,
                parking: parking || 0,
                floor: floor || null,
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

        return property;
    }

    /**
     * Obtener todas las propiedades (con filtros opcionales)
     */
    async findAll(filters?: FilterPropertyDto, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const where: any = {
            deletedAt: null,
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

        return {
            properties,
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

        return property;
    }

    /**
     * Actualizar una propiedad
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

        return updatedProperty;
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
     */
    async searchByLocation(latitude: number, longitude: number, radiusKm: number = 50) {
        // Convertir radio a grados (aproximadamente)
        const radiusInDegrees = radiusKm / 111;

        const properties = await this.prisma.property.findMany({
            where: {
                deletedAt: null,
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

        return filtered;
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

        return {
            properties,
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
            propertyType,
            operationType,
            latitude,
            longitude,
            address,
            city,
            state,
            country,
            bedrooms,
            bathrooms,
            area,
            parking,
            floor,
            amenities,
            contactPhone,
            contactEmail,
            contactWhatsApp,
        } = createPropertyDto;

        // Crear la propiedad sin imágenes primero
        const property = await this.prisma.property.create({
            data: {
                title,
                description,
                price,
                propertyType,
                operationType,
                latitude,
                longitude,
                address,
                city,
                state: state || null,
                country: country || 'Bolivia',
                bedrooms: bedrooms || null,
                bathrooms: bathrooms || null,
                area: area || null,
                parking: parking || 0,
                floor: floor || null,
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
}
