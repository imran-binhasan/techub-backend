import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger(bootstrap.name)
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'log', 'warn', 'debug']
  });


  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ecommerce API')
    .setVersion('1.0')
    .addTag('Ecommerce')
    .setDescription('Developed by Emran Bin Hasan',)
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'Enter JWT token',
      in: 'header'
    },
      'access-token'
    )
    .build();

  const swaggerDocument = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);
  

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
  logger.debug(`Application is running on : http://127.0.0.1:${port}/api`)
  logger.debug(`Swagger is running on : http://127.0.0.1:${port}/docs`)
}
bootstrap();
