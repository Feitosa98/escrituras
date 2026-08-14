require('dotenv').config();
const path = require('path');
const Database = require('better-sqlite3');
const { Client } = require('pg');

const sqlitePath = process.argv[2] || path.join(process.env.DATA_DIR || '.', 'escrituras.db');
const tables = [
  'users', 'escrituras', 'audit_logs', 'tipos_escritura', 'escreventes',
  'workflow_history', 'agendamentos', 'metas_mensais', 'metas_individuais', 'assinaturas_digitais',
];

function quoted(name) { return `"${String(name).replaceAll('"', '""')}"`; }

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não configurada');
  const sqlite = new Database(sqlitePath, { readonly: true });
  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  const summary = {};
  try {
    await pg.query('BEGIN');
    await pg.query(`TRUNCATE ${tables.map(quoted).join(', ')} RESTART IDENTITY CASCADE`);
    for (const table of tables) {
      const exists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
      if (!exists) { summary[table] = 0; continue; }
      const sourceColumns = sqlite.prepare(`PRAGMA table_info(${quoted(table)})`).all().map((c) => c.name);
      const target = await pg.query('SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1', [table]);
      const targetColumns = new Set(target.rows.map((row) => row.column_name));
      const columns = sourceColumns.filter((column) => targetColumns.has(column));
      const rows = sqlite.prepare(`SELECT ${columns.map(quoted).join(', ')} FROM ${quoted(table)} ORDER BY id`).all();
      for (const row of rows) {
        const values = columns.map((column) => row[column]);
        const params = values.map((_, index) => `$${index + 1}`).join(', ');
        await pg.query(`INSERT INTO ${quoted(table)} (${columns.map(quoted).join(', ')}) VALUES (${params})`, values);
      }
      if (targetColumns.has('id')) {
        await pg.query(`SELECT setval(pg_get_serial_sequence('${table}','id'), COALESCE((SELECT MAX(id) FROM ${quoted(table)}), 1), (SELECT COUNT(*) > 0 FROM ${quoted(table)}))`);
      }
      summary[table] = rows.length;
    }
    await pg.query('COMMIT');
    for (const [table, sourceCount] of Object.entries(summary)) {
      const { rows } = await pg.query(`SELECT COUNT(*)::int AS total FROM ${quoted(table)}`);
      if (rows[0].total !== sourceCount) throw new Error(`Divergência em ${table}: origem=${sourceCount}, destino=${rows[0].total}`);
    }
    console.log(JSON.stringify({ success: true, sqlitePath, tables: summary }, null, 2));
  } catch (error) {
    await pg.query('ROLLBACK');
    throw error;
  } finally {
    sqlite.close();
    await pg.end();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
