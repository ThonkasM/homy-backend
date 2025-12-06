import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    /**
     * Registrar un nuevo usuario
     */
    async register(registerDto: RegisterDto) {
        
        const { email, password, firstName, lastName, phone } = registerDto;

        // Verificar si el usuario ya existe
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('El email ya está registrado');
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone: phone || null,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                avatar: true,
                bio: true,
                createdAt: true,
            },
        });

        // Generar JWT
        const accessToken = this.jwtService.sign(
            { sub: user.id, email: user.email },
            { expiresIn: '7d' },
        );

        return {
            accessToken,
            user,
        };
    }

    /**
     * Login de usuario
     */
    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Encontrar usuario por email
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('Email inválido');
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Contraseña inválida');
        }

        // Generar JWT
        const accessToken = this.jwtService.sign(
            { sub: user.id, email: user.email },
            { expiresIn: '7d' },
        );

        // Retornar sin el password
        const { password: _, ...userWithoutPassword } = user;

        return {
            accessToken,
            user: userWithoutPassword,
        };
    }

    /**
     * Obtener perfil del usuario autenticado
     */
    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                bio: true,
                avatar: true,
                role: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        return user;
    }

    /**
     * Actualizar perfil del usuario
     */
    async updateProfile(userId: string, updateData: any) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                firstName: updateData.firstName,
                lastName: updateData.lastName,
                phone: updateData.phone,
                bio: updateData.bio,
                avatar: updateData.avatar,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                bio: true,
                avatar: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }

    /**
     * Validar token JWT
     */
    validateToken(token: string) {
        try {
            return this.jwtService.verify(token);
        } catch (error) {
            throw new UnauthorizedException('Token inválido o expirado');
        }
    }
}
