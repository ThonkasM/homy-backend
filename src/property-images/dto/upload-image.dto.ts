import { IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadImageDto {
    @IsString()
    propertyId: string;

    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(10)
    order: number;
}
