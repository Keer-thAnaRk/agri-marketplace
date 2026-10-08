import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth.routes';
import { farmerRoutes } from './routes/farmer.routes';
import { adminRoutes } from './routes/admin.routes';
import { traceRoutes } from './routes/trace.routes';
import { orderRoutes } from './routes/order.routes';
import { consumerRoutes } from './routes/consumer.routes';
import { publicProductRoutes, publicFarmerRoutes } from './routes/marketplace.routes';
import { publicSurplusRoutes } from './routes/public-surplus.routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): express.Application {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: '*', // Allow frontend development ports (3000, etc.)
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'Krishi Market Backend API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/farmer', farmerRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/trace', traceRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/consumer', consumerRoutes);
  app.use('/api/products', publicProductRoutes);
  app.use('/api/farmers', publicFarmerRoutes);
  app.use('/api/surplus', publicSurplusRoutes);


  // 404 handler for undefined routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: `Route ${req.method} ${req.originalUrl} not found.`,
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
