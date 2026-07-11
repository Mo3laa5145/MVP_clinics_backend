import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import aiRoutes from './routes/ai.routes';
import patientRoutes from './routes/patient.routes'
import visitRoutes from './routes/visit.routes';
const app = express();

app.use(cors());
app.use(express.json());

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/ai', aiRoutes);
app.use('/patient', patientRoutes);
app.use('/visit', visitRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
