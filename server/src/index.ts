import app from './app.js';

const PORT = process.env.PORT || 3001;

// Start Server normally for local Node.js environment
async function start() {
  app.listen(PORT, () => {
    console.log(`WorkLedger Backend listening on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
});
