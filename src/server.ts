import app from './app';
import { env } from './config/env';
import { testPrismaConnection } from './lib/prisma';

async function startServer() {
  try {
    await testPrismaConnection();
    console.log('Database connection established');
  } catch (error) {
    console.warn('Database connection failed:', error);
  }

  const server = app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });

  server.on('error', (error: Error) => {
    console.error('Server startup error:', error);
  });
}

startServer().catch((error) => {
  console.error('Fatal server startup error:', error);
  process.exit(1);
});
