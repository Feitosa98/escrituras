import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import process from 'node:process';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;
const archiveKey = process.env.MIGRATION_ARCHIVE_KEY;
const output = process.argv[2];
if (!databaseUrl || !archiveKey || archiveKey.length < 24 || !output) {
  throw new Error('Use DATABASE_URL, MIGRATION_ARCHIVE_KEY (24+ caracteres) e informe o arquivo de saida');
}

const tables = [
  'users', 'tipos_escritura', 'escreventes', 'escrituras', 'audit_logs',
  'workflow_history', 'agendamentos', 'checklist_items', 'metas_mensais',
  'metas_individuais', 'assinaturas_digitais',
];
const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  const snapshot = { format: 1, created_at: new Date().toISOString(), tables: {} };
  await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
  for (const table of tables) {
    const exists = await client.query('SELECT to_regclass($1) IS NOT NULL AS exists', [`public.${table}`]);
    snapshot.tables[table] = exists.rows[0]?.exists
      ? (await client.query(`SELECT * FROM "${table}" ORDER BY id`)).rows
      : [];
  }
  await client.query('COMMIT');
  const plain = Buffer.from(JSON.stringify(snapshot), 'utf8');
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(archiveKey, salt, 200_000, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  await fs.writeFile(output, Buffer.concat([Buffer.from('HST1'), salt, iv, tag, encrypted]), { mode: 0o600 });
  const counts = Object.fromEntries(tables.map((table) => [table, snapshot.tables[table].length]));
  console.log(JSON.stringify({ output, counts }));
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  throw error;
} finally {
  await client.end();
}

