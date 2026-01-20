import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    /**
     * Obtener el perfil público de un usuario
     * Retorna información pública con estadísticas
     */
    async getUserProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                bio: true,        // ✅ Añadido: "Acerca de mí"
                avatar: true,
                createdAt: true,
                properties: {
                    where: { deletedAt: null },
                    select: { id: true },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const reviews = await this.prisma.review.findMany({
            where: {
                property: {
                    ownerId: userId,
                },
            },
            select: {
                rating: true,
            },
        });

        const averageRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : null;

        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            bio: user.bio,           // ✅ Añadido: "Acerca de mí"
            avatar: user.avatar,
            createdAt: user.createdAt,
            propertiesCount: user.properties.length,
            reviewsCount: reviews.length,
            averageRating: averageRating ? parseFloat(averageRating) : null,
        };
    }

    /**
     * Obtener todas las propiedades de un usuario
     * Solo retorna propiedades no eliminadas con paginación
     */
    async getUserProperties(userId: string, page = 1, limit = 10) {
        const userExists = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!userExists) {
            throw new NotFoundException('Usuario no encontrado');
        }

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
            user: {
                id: userId,
                name: `${userExists.firstName} ${userExists.lastName}`,
                avatar: userExists.avatar,
            },
        };
    }
}
