/**
 * Apply pending SQL migrations via direct Postgres connection.
 *
 * Setup (one time):
 *   1. Supabase Dashboard → Project Settings → Database
 *   2. Copy "Connection string" → URI (use Session pooler or Direct)
 *   3. Add to .env: DATABASE_URL=postgresql://postgres.[ref]:[password]@...
 *
 * Run: npm run db:migrate
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const migrationsDir = path.join(root, 'supabase', 'migrations');

dotenv.config({ path: path.join(root, '.env') });

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error(`
DATABASE_URL is not set in .env

Quick fix (no CLI needed):
  1. Open Supabase SQL Editor for your project
  2. Paste and run:

     alter table public.sessions
       add column if not exists demographics jsonb;

Or add DATABASE_URL to .env and run this script again.
`);
  process.exit(1);
}

const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log(`Connected. Applying ${files.length} migration file(s)...`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`  → ${file}`);
    await client.query(sql);
  }

  const { rows } = await client.query(`
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'sessions'
        and column_name = 'demographics'
    ) as demographics_column;
  `);

  console.log(`\nDone. sessions.demographics exists: ${rows[0]?.demographics_column === true}`);
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
