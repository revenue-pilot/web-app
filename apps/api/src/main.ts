import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  // Initialize Sentry
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      integrations: [
        nodeProfilingIntegration(),
      ],
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
      environment: process.env.NODE_ENV || 'development',
    });
  }

  const app = await NestFactory.create(AppModule);
  
  // Use Sentry Interceptor globally
  app.useGlobalInterceptors(new SentryInterceptor());

  
  // Enforce Helmet HTTP security headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  }));

  // Enforce whitelisted CORS access rules
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'https://revenuepilot.in', 'https://www.revenuepilot.in'];
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email'],
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
