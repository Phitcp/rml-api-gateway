import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import pkg from '../package.json';
import { AppLogger } from '@shared/logger';
import { ValidationPipe } from '@nestjs/common';

const swaggerAlias = 'explorer';
async function bootstrap() {
  const appPort = process.env.PORT ?? 3000;
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle(pkg.name)
    .setDescription(pkg.description)
    .setVersion(pkg.version)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(swaggerAlias, app, document);

  const logger = app.get(AppLogger);
  await app.listen(appPort);
  logger
    .addLogContext('App Start Successfully')
    .log(`${pkg.name} is now running on port: ${appPort}`);
  logger.log(
    `Swagger available at http://localhost:${appPort}/${swaggerAlias}`,
  );
}
bootstrap();
