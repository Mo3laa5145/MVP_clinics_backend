import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/clinica',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || '',
};
