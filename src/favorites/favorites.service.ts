import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Agregar una propiedad a favoritos
     * Valida que la propiedad exista y esté PUBLISHED
     */
    async addFavorite(userId: string, propertyId: string) {
        // Verificar que la propiedad existe y está publicada
        const property = await this.prisma.property.findUnique({
            where: { id: propertyId },
            select: { id: true, postStatus: true, deletedAt: true, ownerId: true },
        });

        if (!property || property.deletedAt) {
            throw new NotFoundException('Propiedad no encontrada');
        }

        if (property.postStatus !== 'PUBLISHED') {
            throw new BadRequestException('Solo puedes agregar a favoritos propiedades publicadas');
        }

        // Verificar que el usuario no sea el dueño
        if (property.ownerId === userId) {
            throw new BadRequestException('No puedes agregar tus propias propiedades a favoritos');
        }

        // Verificar si ya está en favoritos
        const existingFavorite = await this.prisma.favorite.findUnique({
            where: {
                userId_propertyId: {
                    userId,
                    propertyId,
                },
            },
        });

        if (existingFavorite) {
            throw new BadRequestException('Esta propiedad ya está en tus favoritos');
        }

        // Crear favorito
        const favorite = await this.prisma.favorite.create({
            data: {
                userId,
                propertyId,
            },
            include: {
                property: {
                    include: {
                        images: {
                            select: {
                                url: true,
                                order: true,
                            },
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
                },
            },
        });

        return {
            success: true,
            message: 'Propiedad agregada a favoritos',
            favorite,
        };
    }

    /**
     * Remover una propiedad de favoritos
     */
    async removeFavorite(userId: string, propertyId: string) {
        // Verificar que el favorito existe
        const favorite = await this.prisma.favorite.findUnique({
            where: {
                userId_propertyId: {
                    userId,
                    propertyId,
                },
            },
        });

        if (!favorite) {
            throw new NotFoundException('Este favorito no existe');
        }

        // Eliminar favorito
        await this.prisma.favorite.delete({
            where: {
                userId_propertyId: {
                    userId,
                    propertyId,
                },
            },
        });

        return {
            success: true,
            message: 'Propiedad removida de favoritos',
        };
    }

    /**
     * Obtener todos los favoritos del usuario
     */
    async getFavorites(userId: string) {
        const favorites = await this.prisma.favorite.findMany({
            where: { userId },
            include: {
                property: {
                    include: {
                        images: {
                            select: {
                                url: true,
                                order: true,
                            },
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
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return {
            success: true,
            count: favorites.length,
            favorites,
        };
    }

    /**
     * Verificar si una propiedad está en favoritos
     */
    async isFavorite(userId: string, propertyId: string) {
        const favorite = await this.prisma.favorite.findUnique({
            where: {
                userId_propertyId: {
                    userId,
                    propertyId,
                },
            },
        });

        return {
            success: true,
            isFavorite: !!favorite,
        };
    }
}
