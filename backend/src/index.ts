import { app } from './app';
import { config } from './config/env';

const server = app.listen(config.port, () => {
  console.log(`[Krishi Market Backend] Server listening on port ${config.port} in ${config.nodeEnv} mode`);
  console.log(`[Krishi Market Backend] Health check available at http://localhost:${config.port}/api/health`);
});

process.on('SIGTERM', () => {
  console.log('[Krishi Market Backend] SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('[Krishi Market Backend] Process terminated.');
  });
});
