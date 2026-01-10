import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsPositive, Min, Max, IsObject } from 'class-validator';
import { Type, Transform } from 'class-transformer';

enum PropertyType {
    HOUSE = 'HOUSE',
    APARTMENT = 'APARTMENT',
    LAND = 'LAND',
    OFFICE = 'OFFICE',
    COMMERCIAL = 'COMMERCIAL',
    WAREHOUSE = 'WAREHOUSE',
    ROOM = 'ROOM',
    OTHER = 'OTHER',
}

enum OperationType {
    SALE = 'SALE',
    RENT_TEMPORARY = 'RENT_TEMPORARY',
    RENT_PERMANENT = 'RENT_PERMANENT',
    ANTICRETICO = 'ANTICRETICO',
}

enum PostStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED',
}

enum Currency {
    BOB = 'BOB',
    USD = 'USD',
    ARS = 'ARS',
    PEN = 'PEN',
    CLP = 'CLP',
    MXN = 'MXN',
    COP = 'COP',
}

/**
 * DTO para crear propiedad con imágenes en un solo formulario multipart/form-data
 * Las imágenes se envían como archivos (en files)
 */
export class CreatePropertyWithImagesDto {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    price: number;

    @IsEnum(Currency)
    @IsOptional()
    currency?: Currency = Currency.BOB;

    @IsEnum(PropertyType)
    propertyType: PropertyType;

    @IsEnum(OperationType)
    operationType: OperationType;

    @IsNumber()
    @Type(() => Number)
    latitude: number;

    @IsNumber()
    @Type(() => Number)
    longitude: number;

    @IsString()
    address: string;

    @IsString()
    city: string;

    @IsString()
    @IsOptional()
    state?: string;

    @IsString()
    @IsOptional()
    country?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    bedrooms?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    bathrooms?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    area?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    parking?: number;

    @IsNumber()
    @IsNumber()
    @Type(() => Number)
    floor?: number;

    @IsString()
    contactPhone: string;

    @IsString()
    @IsOptional()
    contactEmail?: string;

    @IsString()
    @IsOptional()
    contactWhatsApp?: string;

    @IsObject()
    @IsOptional()
    @Transform(({ value }) => {
        // Si viene como string JSON (desde FormData), parsearlo
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return {};
            }
        }
        return value || {};
    })
    specifications?: Record<string, any>; // Dinámicas por PropertyType

    @IsArray()
    @IsOptional()
    @Transform(({ value }) => {
        // Si viene como string JSON (desde FormData), parsearlo
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return [];
            }
        }
        return value || [];
    })
    amenities?: string[]; // IDs validados por PropertyType

    @IsEnum(PostStatus)
    @IsOptional()
    @Transform(({ value }) => value || 'DRAFT')
    postStatus?: PostStatus;

    // Los archivos se reciben como Express.Multer.File[]
    // No necesita validación aquí, se maneja en el controller
}
