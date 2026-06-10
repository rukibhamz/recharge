import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');

export const ENV_PATH = envPath;
export const ENV_EXISTS = fs.existsSync(envPath);

const result = dotenv.config({ path: envPath });

if (result.error && process.env.NODE_ENV !== 'production') {
  console.warn(`[env] Could not load ${envPath}:`, result.error.message);
} else if (ENV_EXISTS && !result.error) {
  console.log(`[env] Loaded ${envPath}`);
}
