import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropertyImagesService {
    constructor(private prisma: PrismaService) { }

    // TODO: Implementar lógica de imágenes de propiedades
}
