import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchUserDto {
    @IsString()
    @IsOptional()
    search?: string; // Buscar por nombre, email

    @IsString()
    @IsOptional()
    city?: string; // Filtrar por ciudad

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    page?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    limit?: number;
}
