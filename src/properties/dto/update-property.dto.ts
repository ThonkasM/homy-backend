import { IsString, IsNumber, IsOptional, IsArray, IsEnum } from 'class-validator';
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

    @IsArray()
    @IsOptional()
    amenities?: string[];

    @IsString()
    @IsOptional()
    contactPhone?: string;

    @IsString()
    @IsOptional()
    contactEmail?: string;

    @IsString()
    @IsOptional()
    contactWhatsApp?: string;
}
