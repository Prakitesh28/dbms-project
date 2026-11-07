import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'farmledger.db');

export async function resetAndSeedDatabase() {
  let dbRemoved = false;
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
      dbRemoved = true;
      console.log('[DB] Removed old farmledger.db file.');
    } catch (e) {
      console.warn('[DB] farmledger.db is currently locked by a process; wiping tables directly...');
    }
  }

  const db = await getDb();
  
  if (!dbRemoved) {
    // Drop all existing tables & triggers cleanly
    db.exec('PRAGMA foreign_keys = OFF;');
    const tables = [
      'sales_records',
      'harvest_records',
      'inventory_transactions',
      'inventory_items',
      'suppliers',
      'crop_cycles',
      'crop_varieties',
      'crops',
      'plots',
      'farms'
    ];
    for (const t of tables) {
      db.exec(`DROP TABLE IF EXISTS ${t};`);
    }
    db.exec('PRAGMA foreign_keys = ON;');
    console.log('[DB] Cleaned existing tables.');
  }
  
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
  console.log('[DB] Fresh schema applied.');

  const seedPath = path.join(__dirname, 'seed.sql');
  const seedSql = fs.readFileSync(seedPath, 'utf8');
  db.exec(seedSql);
  console.log('[DB] Demo dataset seeded successfully.');

  return db;
}

resetAndSeedDatabase()
  .then(() => {
    console.log('[DB] Database reset and seed finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[DB] Reset and seed failed:', err);
    process.exit(1);
  });

