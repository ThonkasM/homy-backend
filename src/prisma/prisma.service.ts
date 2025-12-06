import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

    private readonly logger = new Logger('homi-backend')
    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('PrismaService connected to the database');
        } catch (error) {
            this.logger.log('PrismaService failed to connect to database')
            throw Error
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('PrismaService disconnected from the database');
    }

}
