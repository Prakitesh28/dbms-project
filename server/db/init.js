import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabase() {
  const db = await getDb();
  
  console.log('[DB] Loading schema.sql...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
  console.log('[DB] Schema applied successfully.');

  // Check if data already exists
  const farmCheck = db.prepare('SELECT COUNT(*) as count FROM farms').get();
  if (!farmCheck || farmCheck.count === 0) {
    console.log('[DB] Database is empty. Applying seed.sql...');
    const seedPath = path.join(__dirname, 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    db.exec(seedSql);
    console.log('[DB] Seed data inserted successfully.');
  } else {
    console.log(`[DB] Database already contains ${farmCheck.count} farms.`);
  }

  return db;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase()
    .then(() => {
      console.log('[DB] Initialization complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DB] Initialization failed:', err);
      process.exit(1);
    });
}

