import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/openapi';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import jobRoutes from './routes/job.routes';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs-json', (_req, res) => res.json(swaggerSpec));

app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'Welcome to TaskFlow API',
    docs: '/api-docs',
    health: '/health'
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/jobs', jobRoutes);

app.use(errorHandler);

export default app;
