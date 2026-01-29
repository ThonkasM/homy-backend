import {
    Controller,
    Get,
    Param,
    Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SearchUserDto } from './dto/search-user.dto';

@Controller('api/users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * GET /api/users
     * Buscar usuarios por nombre, email o ciudad
     */
    @Get()
    async searchUsers(
        @Query() searchDto: SearchUserDto,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ) {
        return await this.usersService.searchUsers(
            searchDto,
            parseInt(page),
            parseInt(limit),
        );
    }

    /**
     * GET /api/users/:id
     * Obtener el perfil público de un usuario
     */
    @Get(':id')
    async getUserProfile(@Param('id') id: string) {
        return await this.usersService.getUserProfile(id);
    }

    /**
     * GET /api/users/:id/properties
     * Obtener todas las propiedades (anuncios) de un usuario
     */
    @Get(':id/properties')
    async getUserProperties(
        @Param('id') userId: string,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ) {
        return await this.usersService.getUserProperties(
            userId,
            parseInt(page),
            parseInt(limit),
        );
    }
}
