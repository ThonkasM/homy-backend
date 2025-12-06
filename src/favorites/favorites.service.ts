import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
    constructor(private prisma: PrismaService) { }

    // TODO: Implementar lógica de favoritos
}
