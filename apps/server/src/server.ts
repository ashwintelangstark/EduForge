import { app } from './app.js';
import dotenv from 'dotenv';
import path from 'path';

// In cPanel Phusion Passenger, process.env.PORT is injected as a Unix socket path or port.
// Capture it before loading local .env to prevent any local PORT=4000 override.
const initialPort = process.env.PORT;

dotenv.config();
try {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} catch {}

const PORT = initialPort || (process.env.PASSENGER_APP_ENV ? (process.env.PORT || 0) : (process.env.PORT || 4000));

const server = app.listen(PORT, () => {
  console.log(`[EduForge Express Server] Running on ${typeof PORT === 'string' ? PORT : `port ${PORT}`}`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[EduForge Express Server] Port ${PORT} in use, binding to ephemeral port...`);
    app.listen(0);
  } else {
    console.error('[EduForge Express Server] Startup error:', err);
  }
});

export { app, server };
export default app;
