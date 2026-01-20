import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * POST /api/auth/register
     * Registrar un nuevo usuario
     */
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto) {
        return await this.authService.register(registerDto);
    }

    /**
     * POST /api/auth/login
     * Login de usuario con email y contraseña
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return await this.authService.login(loginDto);
    }

    /**
     * GET /api/auth/profile
     * Obtener el perfil del usuario autenticado
     */
    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@CurrentUser() user: any) {
        return await this.authService.getProfile(user.sub);
    }

    /**<<<<
     * PATCH /api/auth/profile
     * Actualizar el perfil del usuario autenticado
     */
    @Patch('profile')
    @UseGuards(JwtAuthGuard)
    async updateProfile(@CurrentUser() user: any, @Body() updateData: any) {
        return await this.authService.updateProfile(user.sub, updateData);
    }
}
