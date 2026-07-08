import express from 'express';
import cors from 'cors';
import logRouter from './routes/logs.js';
import { ensureStorage } from './services/logger.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Logs Router
app.use('/logs', logRouter);

// Start Server
async function start() {
  await ensureStorage();
  app.listen(PORT, () => {
    console.log(`Developer Observability Backend listening on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
});
export {};
