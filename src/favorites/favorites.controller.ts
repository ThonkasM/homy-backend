import {
    Controller,
    Post,
    Delete,
    Get,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/favorites')
export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) { }

    /**
     * POST /api/favorites/:propertyId
     * Agregar una propiedad a favoritos
     * Requiere autenticación
     */
    @Post(':propertyId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async addFavorite(
        @Param('propertyId') propertyId: string,
        @CurrentUser() user: any,
    ) {
        return await this.favoritesService.addFavorite(user.sub, propertyId);
    }

    /**
     * DELETE /api/favorites/:propertyId
     * Remover una propiedad de favoritos
     * Requiere autenticación
     */
    @Delete(':propertyId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async removeFavorite(
        @Param('propertyId') propertyId: string,
        @CurrentUser() user: any,
    ) {
        return await this.favoritesService.removeFavorite(user.sub, propertyId);
    }

    /**
     * GET /api/favorites
     * Obtener todas las propiedades favoritas del usuario autenticado
     * Requiere autenticación
     */
    @Get()
    @UseGuards(JwtAuthGuard)
    async getFavorites(
        @CurrentUser() user: any,
    ) {
        return await this.favoritesService.getFavorites(user.sub);
    }

    /**
     * GET /api/favorites/:propertyId
     * Verificar si una propiedad está en favoritos
     * Requiere autenticación
     */
    @Get('check/:propertyId')
    @UseGuards(JwtAuthGuard)
    async isFavorite(
        @Param('propertyId') propertyId: string,
        @CurrentUser() user: any,
    ) {
        return await this.favoritesService.isFavorite(user.sub, propertyId);
    }
}
