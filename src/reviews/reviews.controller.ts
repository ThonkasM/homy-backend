import { Controller } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('api/reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    // TODO: Implementar endpoints de reseñas
}
