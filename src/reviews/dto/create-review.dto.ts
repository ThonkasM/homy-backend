import { IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(5)
    rating: number;

    @IsString()
    comment: string;

    @IsString()
    propertyId: string;
}
