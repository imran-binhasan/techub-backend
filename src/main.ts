import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger(bootstrap.name)
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'log', 'warn','debug']
  });

  const configService = app.get(ConfigService)
  const port = configService.get<number>('PORT') ?? 3000;

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI })
  app.enableCors()
  await app.listen(port);
  logger.debug(`Application is running on : http://127.0.0.1:${port}/api`)
}
bootstrap();
