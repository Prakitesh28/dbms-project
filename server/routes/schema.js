import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();

// GET /api/schema
// Introspects database catalog via SQLite PRAGMAs & sqlite_master
router.get('/', async (req, res) => {
  try {
    const db = await getDb();

    // 1. Fetch all user tables
    const tableRows = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name ASC
    `).all();

    const tables = [];
    for (const { name: tableName } of tableRows) {
      // Columns from PRAGMA table_info
      const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
      
      // Foreign keys from PRAGMA foreign_key_list
      const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${tableName})`).all();

      // Indexes from PRAGMA index_list
      const indexes = db.prepare(`PRAGMA index_list(${tableName})`).all();

      // Row count
      const countRow = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();

      // Table DDL from sqlite_master
      const ddlRow = db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`).get(tableName);

      tables.push({
        name: tableName,
        rowCount: countRow ? countRow.count : 0,
        columns: columns.map(c => ({
          cid: c.cid,
          name: c.name,
          type: c.type,
          notnull: c.notnull === 1,
          defaultValue: c.dflt_value,
          pk: c.pk === 1
        })),
        foreignKeys: foreignKeys.map(fk => ({
          id: fk.id,
          seq: fk.seq,
          targetTable: fk.table,
          fromColumn: fk.from,
          toColumn: fk.to,
          onUpdate: fk.on_update,
          onDelete: fk.on_delete
        })),
        indexes: indexes.map(idx => ({
          name: idx.name,
          unique: idx.unique === 1
        })),
        ddl: ddlRow ? ddlRow.sql : ''
      });
    }

    // 2. Fetch all views
    const viewRows = db.prepare(`
      SELECT name, sql FROM sqlite_master 
      WHERE type = 'view'
      ORDER BY name ASC
    `).all();

    const views = [];
    for (const v of viewRows) {
      const columns = db.prepare(`PRAGMA table_info(${v.name})`).all();
      views.push({
        name: v.name,
        ddl: v.sql,
        columns: columns.map(c => ({
          name: c.name,
          type: c.type
        }))
      });
    }

    // 3. Fetch all triggers
    const triggerRows = db.prepare(`
      SELECT name, tbl_name as targetTable, sql FROM sqlite_master 
      WHERE type = 'trigger'
      ORDER BY name ASC
    `).all();

    res.json({
      databaseEngine: 'SQLite 3 (Portable SQL Schema)',
      tableCount: tables.length,
      viewCount: views.length,
      triggerCount: triggerRows.length,
      tables,
      views,
      triggers: triggerRows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
