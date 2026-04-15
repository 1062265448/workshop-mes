import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as mime from 'mime-types';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 启用静态文件服务（uploads 目录）
  app.use('/uploads/', (req: any, res: any, next: any) => {
    const filePath = join(__dirname, '..', 'uploads', req.path);
    const contentType = mime.lookup(filePath);
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    next();
  });
  app.use('/uploads/', express.static(join(__dirname, '..', 'uploads')));

  // 启用 CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger 文档
  const config = new DocumentBuilder()
    .setTitle('Workshop MES API')
    .setDescription('制造执行系统 API 文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
