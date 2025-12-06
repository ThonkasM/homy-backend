import { Controller } from '@nestjs/common';
import { PropertyImagesService } from './property-images.service';

@Controller('api/property-images')
export class PropertyImagesController {
    constructor(private readonly propertyImagesService: PropertyImagesService) { }

    // TODO: Implementar endpoints de imágenes
}
