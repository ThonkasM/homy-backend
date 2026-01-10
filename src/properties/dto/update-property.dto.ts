import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsObject } from 'class-validator';
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

enum PropertyStatus {
    AVAILABLE = 'AVAILABLE',
    RESERVED = 'RESERVED',
    SOLD = 'SOLD',
    RENTED = 'RENTED',
    INACTIVE = 'INACTIVE',
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

export class UpdatePropertyDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    price?: number;

    @IsEnum(Currency)
    @IsOptional()
    currency?: Currency;

    @IsEnum(PropertyType)
    @IsOptional()
    propertyType?: PropertyType;

    @IsEnum(OperationType)
    @IsOptional()
    operationType?: OperationType;

    @IsEnum(PropertyStatus)
    @IsOptional()
    status?: PropertyStatus;

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

    @IsString()
    @IsOptional()
    contactPhone?: string;

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
}
