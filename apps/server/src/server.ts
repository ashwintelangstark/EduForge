import { app } from './app.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
try {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} catch {}

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[EduForge Express Server] Running on http://localhost:${PORT}`);
});

export default app;
