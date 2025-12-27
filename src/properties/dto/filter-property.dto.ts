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
