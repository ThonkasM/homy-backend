import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';

@Module({
    imports: [PrismaModule, UploadModule],
    providers: [PropertiesService],
    controllers: [PropertiesController],
    exports: [PropertiesService],
})
export class PropertiesModule { }
