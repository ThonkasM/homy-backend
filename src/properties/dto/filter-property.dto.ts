import { IsOptional, IsString, IsNumber, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

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

export class FilterPropertyDto {
    @IsEnum(PropertyType)
    @IsOptional()
    propertyType?: PropertyType;

    @IsEnum(OperationType)
    @IsOptional()
    operationType?: OperationType;

    @IsEnum(PropertyStatus)
    @IsOptional()
    status?: PropertyStatus;

    @IsEnum(PostStatus)
    @IsOptional()
    postStatus?: PostStatus;

    @IsEnum(Currency)
    @IsOptional()
    currency?: Currency;

    @IsString()
    @IsOptional()
    search?: string;

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    amenities?: string[];

    // ========================================
    // FILTROS PARA SPECIFICATIONS (nuevo sistema dinámico)
    // ========================================

    // Dormitorios
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    dormitorios_min?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    dormitorios_max?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    dormitorios?: number;

    // Baños
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    baños_min?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    baños_max?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    baños?: number;

    // Área
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    area_min?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    area_max?: number;

    // Área construida
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    areaBuilt_min?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    areaBuilt_max?: number;

    // Garage/Estacionamiento
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    garage_min?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    estacionamiento_min?: number;

    // Expensas
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    expensas_min?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    expensas_max?: number;

    // Piso
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    piso_min?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    piso_max?: number;

    // Campos booleanos comunes
    @IsOptional()
    @Type(() => Boolean)
    jardin?: boolean;

    @IsOptional()
    @Type(() => Boolean)
    patio?: boolean;

    @IsOptional()
    @Type(() => Boolean)
    balcon?: boolean;

    @IsOptional()
    @Type(() => Boolean)
    esquina?: boolean;

    // Topografía (para terrenos)
    @IsString()
    @IsOptional()
    topografia?: string;

    // ========================================
    // FILTROS GENERALES
    // ========================================

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    minPrice?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    maxPrice?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    bedrooms?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    bathrooms?: number;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    state?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    latitude?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    longitude?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    radius?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    page?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    limit?: number;

    @IsString()
    @IsOptional()
    sortBy?: string;

    @IsString()
    @IsOptional()
    sortOrder?: 'asc' | 'desc';
}
