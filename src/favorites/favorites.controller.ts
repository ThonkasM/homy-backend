import { Controller } from '@nestjs/common';
import { FavoritesService } from './favorites.service';

@Controller('api/favorites')
export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) { }

    // TODO: Implementar endpoints de favoritos
}
