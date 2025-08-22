import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { INestApplication } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix for API routes
  app.setGlobalPrefix('api');
  await connectToAngularSSR(app);
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

async function connectToAngularSSR(app: INestApplication) {
  try {
    // Import the Angular SSR Express app
    const angularAppPath = join(
      process.cwd(),
      '..',
      'frontend',
      'dist',
      'frontend',
      'server',
      'server.mjs',
    );
    const angularAppUrl = pathToFileURL(angularAppPath).href;
    const angularApp = await import(angularAppUrl);

    // Use Angular app for all non-API routes
    app.use('/', angularApp.default);

    console.log('Angular SSR integrated successfully');
  } catch (error) {
    console.warn('Could not load Angular SSR app:', error.message);
    console.warn(
      'Make sure to build the frontend first: cd frontend && npm run build',
    );
  }
}

bootstrap();
