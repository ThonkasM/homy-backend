import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Servir archivos estáticos (ya configurado en app.module.ts con ServeStaticModule)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Habilitar CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
   await app.listen(port);

  console.log(`✅ Servidor ejecutándose en puerto ${port}`);
  console.log(`🔗 API disponible en http://localhost:${port}`);
  console.log(`📁 Archivos estáticos disponibles en /uploads`);
}
bootstrap();
