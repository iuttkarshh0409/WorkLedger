import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getEnv } from './env.js';
import logRouter from './routes/logs.js';
import performanceRouter from './routes/performance.js';
import workspaceRouter from './routes/workspaces.js';
import contributorRouter from './routes/contributors.js';
import milestoneRouter from './routes/milestones.js';
import assignmentRouter from './routes/assignments.js';
import submissionRouter from './routes/submissions.js';
import reviewRouter from './routes/reviews.js';
import activityRouter from './routes/activities.js';
import { requestIdMiddleware, authMiddleware, errorHandler } from './middleware/context.js';

dotenv.config();

const app = express();

// Global Middleware
const frontendUrl = getEnv('FRONTEND_URL') || 'https://work-ledger-eight.vercel.app';
const allowedOrigins = [
  frontendUrl,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const isLocalhost = origin.startsWith('http://localhost:') || origin === 'http://localhost' || origin.startsWith('http://127.0.0.1:');
    if (allowedOrigins.includes(origin) || isLocalhost) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-Session-ID',
    'X-Client-Timestamp',
    'x-user-id',
    'x-user-role',
    'x-user-email',
    'x-user-name',
    'x-workspace-id'
  ],
  exposedHeaders: ['X-Request-ID', 'X-Session-ID', 'X-Server-Timestamp', 'X-Backend-Duration'],
  credentials: true,
  optionsSuccessStatus: 200,
}));
app.use(express.json());
app.use(requestIdMiddleware);
app.use(authMiddleware);

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Logs Router
app.use('/logs', logRouter);

// Performance Router
app.use('/performance', performanceRouter);

// API v1 Routes
app.use('/api/v1/workspaces', workspaceRouter);
app.use('/api/v1/contributors', contributorRouter);
app.use('/api/v1/milestones', milestoneRouter);
app.use('/api/v1/assignments', assignmentRouter);
app.use('/api/v1/submissions', submissionRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/activities', activityRouter);

// Centralized Error Handler
app.use(errorHandler);

export default app;
