// @ts-ignore
import { httpServerHandler } from 'cloudflare:node';
import app from './app.js';

// Register the server internally on port 3001
app.listen(3001);

// Export the edge handler mapping to port 3001
export default httpServerHandler({ port: 3001 });
