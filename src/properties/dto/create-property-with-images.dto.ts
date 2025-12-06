import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsPositive, Min, Max } from 'class-validator';
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
    @IsOptional()
    @Type(() => Number)
    floor?: number;

    @IsArray()
    @IsOptional()
    amenities?: string[];

    @IsString()
    contactPhone: string;

    @IsString()
    @IsOptional()
    contactEmail?: string;

    @IsString()
    @IsOptional()
    contactWhatsApp?: string;

    // Los archivos se reciben como Express.Multer.File[]
    // No necesita validación aquí, se maneja en el controller
}
