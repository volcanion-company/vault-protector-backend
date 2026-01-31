import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/index.js';
import { swaggerSpec } from './config/swagger.js';
import {
  requestLogger,
  apiLimiter,
  errorHandler,
  notFoundHandler,
} from './middleware/index.js';

// Import routes
import { authRoutes } from './modules/auth/index.js';
import { vaultRoutes } from './modules/vault/index.js';
import { sessionsRoutes } from './modules/sessions/index.js';
import { devicesRoutes } from './modules/devices/index.js';
import { usersRoutes } from './modules/users/index.js';
import { appRoutes } from './modules/app/index.js';

/**
 * Create and configure Express application
 */
export const createApp = (): Express => {
  const app = express();

  // ============ Security Middleware ============
  
  // Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: config.cors.origins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400, // 24 hours
    })
  );

  // ============ Request Parsing ============
  
  // Parse JSON bodies
  app.use(express.json({ limit: '10mb' }));
  
  // Parse URL-encoded bodies
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ============ Logging ============
  
  // Request logging (skip in test)
  if (!config.isTest) {
    app.use(requestLogger);
  }

  // ============ Health Check (before rate limit) ============
  
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get('/ready', (_req, res) => {
    // Could add database/redis connectivity checks here
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  });

  // ============ Swagger Documentation ============
  
  app.use('/api-docs', swaggerUi.serve as unknown as express.RequestHandler[], swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Vault Protector API Docs',
  }) as unknown as express.RequestHandler);

  // Serve OpenAPI spec as JSON
  app.get('/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // ============ Rate Limiting ============
  
  // Apply general rate limit to all API routes
  app.use('/api', apiLimiter);

  // ============ API Routes ============
  
  const apiPrefix = `/api/${config.apiVersion}`;

  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/vault`, vaultRoutes);
  app.use(`${apiPrefix}/sessions`, sessionsRoutes);
  app.use(`${apiPrefix}/devices`, devicesRoutes);
  app.use(`${apiPrefix}/users`, usersRoutes);
  app.use(`${apiPrefix}/app`, appRoutes);

  // ============ API Info ============
  
  app.get('/api', (_req, res) => {
    res.json({
      name: 'Vault Protector API',
      version: config.apiVersion,
      endpoints: {
        auth: `${apiPrefix}/auth`,
        vault: `${apiPrefix}/vault`,
        sessions: `${apiPrefix}/sessions`,
        devices: `${apiPrefix}/devices`,
        users: `${apiPrefix}/users`,
        app: `${apiPrefix}/app`,
      },
    });
  });

  // ============ Error Handling ============
  
  // 404 handler for undefined routes
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
};
