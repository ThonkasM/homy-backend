import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { VideoProcessingService } from './video-processing.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [UploadService, VideoProcessingService],
    controllers: [UploadController],
    exports: [UploadService],
})
export class UploadModule { }
