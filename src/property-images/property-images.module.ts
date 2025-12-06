import { Module } from '@nestjs/common';
import { PropertyImagesService } from './property-images.service';
import { PropertyImagesController } from './property-images.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [PropertyImagesService],
    controllers: [PropertyImagesController],
    exports: [PropertyImagesService],
})
export class PropertyImagesModule { }
