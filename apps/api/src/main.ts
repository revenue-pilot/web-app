import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  
  // Enforce Helmet HTTP security headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  }));

  // Enforce whitelisted CORS access rules
  // const allowedOrigins = process.env.FRONTEND_URL 
  //   ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  //   : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'];
  
  // app.enableCors({
  //   origin: allowedOrigins,
  //   credentials: true,
  //   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  //   allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email'],
  // });

  app.enableCors({
  origin: [
    'http://localhost:3000',
  ],
  credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
