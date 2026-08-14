require('dotenv').config();
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const sqlitePath = process.argv[2] || path.join(process.env.DATA_DIR || '.', 'escrituras.db');
const tables = [
  'users', 'escrituras', 'audit_logs', 'tipos_escritura', 'escreventes',
  'workflow_history', 'agendamentos', 'metas_mensais', 'metas_individuais', 'assinaturas_digitais',
];

function quoted(name) { return `"${String(name).replaceAll('"', '""')}"`; }

function usernameFromUser(user, usedUsernames) {
  const existing = String(user.username || '').trim().toLowerCase();
  if (existing) {
    usedUsernames.add(existing);
    return existing;
  }

  const parts = String(user.nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0] || (user.role === 'admin' ? 'admin' : 'usuario');
  const last = parts.length > 1 ? parts.at(-1) : (user.role === 'admin' ? 'sistema' : 'cartorio');
  const base = `${first}.${last}`;
  let candidate = base;
  let suffix = 2;
  while (usedUsernames.has(candidate)) candidate = `${base}${suffix++}`;
  usedUsernames.add(candidate);
  return candidate;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não configurada');
  const sqlite = new Database(sqlitePath, { readonly: true });
  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  const summary = {};
  try {
    await pg.query(fs.readFileSync(path.join(__dirname, 'postgres-schema.sql'), 'utf8'));
    await pg.query('BEGIN');
    await pg.query(`TRUNCATE ${tables.map(quoted).join(', ')} RESTART IDENTITY CASCADE`);
    const usedUsernames = new Set();
    for (const table of tables) {
      const exists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
      if (!exists) { summary[table] = 0; continue; }
      const sourceColumns = sqlite.prepare(`PRAGMA table_info(${quoted(table)})`).all().map((c) => c.name);
      const target = await pg.query('SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1', [table]);
      const targetColumns = new Set(target.rows.map((row) => row.column_name));
      const columns = sourceColumns.filter((column) => targetColumns.has(column));
      const rows = sqlite.prepare(`SELECT ${columns.map(quoted).join(', ')} FROM ${quoted(table)} ORDER BY id`).all();
      if (table === 'users' && targetColumns.has('username') && !columns.includes('username')) {
        columns.push('username');
      }
      for (const row of rows) {
        if (table === 'users' && columns.includes('username')) {
          row.username = usernameFromUser(row, usedUsernames);
          if (row.role === 'admin' && process.env.ADMIN_PASSWORD && columns.includes('senha_hash')) {
            row.senha_hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12);
          }
        }
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
