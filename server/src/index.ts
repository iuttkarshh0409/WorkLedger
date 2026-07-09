import app from './app.js';
import { ensureStorage } from './services/logger.js';

const PORT = process.env.PORT || 3001;

// Start Server normally for local Node.js environment
async function start() {
  await ensureStorage();
  app.listen(PORT, () => {
    console.log(`WorkLedger Backend and Developer Observability listening on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
});
