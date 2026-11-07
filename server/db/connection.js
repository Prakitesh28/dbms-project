import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'farmledger.db');

let dbInstance = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

  try {
    // Try native node:sqlite (Built-in on Node 22+)
    const { DatabaseSync } = await import('node:sqlite');
    const rawDb = new DatabaseSync(dbPath);
    rawDb.exec('PRAGMA foreign_keys = ON;');
    
    dbInstance = {
      isNodeSqlite: true,
      raw: rawDb,
      exec(sql) {
        return rawDb.exec(sql);
      },
      prepare(sql) {
        const stmt = rawDb.prepare(sql);
        return {
          all(...params) {
            return stmt.all(...params);
          },
          get(...params) {
            return stmt.get(...params);
          },
          run(...params) {
            return stmt.run(...params);
          }
        };
      },
      close() {
        rawDb.close();
      }
    };
    return dbInstance;
  } catch (err) {
    // Fallback to better-sqlite3 if available
    try {
      const Database = (await import('better-sqlite3')).default;
      const rawDb = new Database(dbPath);
      rawDb.pragma('foreign_keys = ON');
      dbInstance = rawDb;
      return dbInstance;
    } catch (fallbackErr) {
      throw new Error(`Failed to initialize SQLite database: ${err.message}; Fallback: ${fallbackErr.message}`);
    }
  }
}

export default getDb;

