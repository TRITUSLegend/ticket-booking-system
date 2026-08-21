import http from 'http';
import app from './app';
import { env, prisma, redis } from './config';
import { initSocketServer } from './sockets';
import './jobs/hold-expiry.worker'; // Import to start workers
import './jobs/offer-expiry.worker';

const server = http.createServer(app);

// Initialize Socket.io
initSocketServer(server);

async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');

    server.listen(env.PORT, () => {
      console.log(`✅ Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  });
});
