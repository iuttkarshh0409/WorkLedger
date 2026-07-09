// @ts-ignore
import { httpServerHandler } from 'cloudflare:node';
import app from './app.js';
import { setCfEnv } from './env.js';

// Register the server internally on port 3001
app.listen(3001);

const handler = httpServerHandler({ port: 3001 });

// Export the edge handler mapping to port 3001
export default {
  async fetch(request: any, env: any, ctx: any) {
    setCfEnv(env);
    return handler.fetch(request, env, ctx);
  }
};
