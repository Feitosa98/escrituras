const db = require('./database');

const DEFAULT_CHECKLIST = [
  'Documentos das partes conferidos',
  'Certidões necessárias conferidas',
  'Minuta elaborada',
  'Minuta conferida',
  'Assinaturas coletadas',
  'Selagem concluída',
  'Traslado ou ato final entregue',
];

function migratePostgres() {
  db.exec(`
    ALTER TABLE escrituras ADD COLUMN IF NOT EXISTS responsavel_id BIGINT REFERENCES users(id);
    ALTER TABLE escrituras ADD COLUMN IF NOT EXISTS prazo_data DATE;
    ALTER TABLE escrituras ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
    ALTER TABLE escrituras ADD COLUMN IF NOT EXISTS archived_by BIGINT REFERENCES users(id);

    CREATE TABLE IF NOT EXISTS checklist_items (
      id BIGSERIAL PRIMARY KEY,
      escritura_id BIGINT NOT NULL REFERENCES escrituras(id) ON DELETE CASCADE,
      titulo TEXT NOT NULL,
      concluido INTEGER NOT NULL DEFAULT 0,
      ordem INTEGER NOT NULL DEFAULT 0,
      concluido_by BIGINT REFERENCES users(id),
      concluido_at TIMESTAMPTZ,
      created_by BIGINT REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_escrituras_responsavel ON escrituras(responsavel_id);
    CREATE INDEX IF NOT EXISTS idx_escrituras_prazo ON escrituras(prazo_data);
    CREATE INDEX IF NOT EXISTS idx_escrituras_arquivada ON escrituras(archived_at);
    CREATE INDEX IF NOT EXISTS idx_checklist_escritura ON checklist_items(escritura_id, ordem);
  `);
}

function migrateSqlite() {
  const columns = db.prepare('PRAGMA table_info(escrituras)').all();
  const has = (name) => columns.some((column) => column.name === name);
  if (!has('responsavel_id')) db.exec('ALTER TABLE escrituras ADD COLUMN responsavel_id INTEGER REFERENCES users(id)');
  if (!has('prazo_data')) db.exec('ALTER TABLE escrituras ADD COLUMN prazo_data DATE');
  if (!has('archived_at')) db.exec('ALTER TABLE escrituras ADD COLUMN archived_at DATETIME');
  if (!has('archived_by')) db.exec('ALTER TABLE escrituras ADD COLUMN archived_by INTEGER REFERENCES users(id)');
  db.exec(`
    CREATE TABLE IF NOT EXISTS checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      escritura_id INTEGER NOT NULL REFERENCES escrituras(id) ON DELETE CASCADE,
      titulo TEXT NOT NULL,
      concluido INTEGER NOT NULL DEFAULT 0,
      ordem INTEGER NOT NULL DEFAULT 0,
      concluido_by INTEGER REFERENCES users(id),
      concluido_at DATETIME,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_escrituras_responsavel ON escrituras(responsavel_id);
    CREATE INDEX IF NOT EXISTS idx_escrituras_prazo ON escrituras(prazo_data);
    CREATE INDEX IF NOT EXISTS idx_escrituras_arquivada ON escrituras(archived_at);
    CREATE INDEX IF NOT EXISTS idx_checklist_escritura ON checklist_items(escritura_id, ordem);
  `);
}

function ensureDefaultChecklist(escrituraId, userId) {
  const existing = db.prepare('SELECT COUNT(*) AS total FROM checklist_items WHERE escritura_id = ?').get(escrituraId);
  if (Number(existing?.total || 0) > 0) return;
  const insert = db.prepare(`
    INSERT INTO checklist_items (escritura_id, titulo, ordem, created_by)
    VALUES (?, ?, ?, ?)
  `);
  DEFAULT_CHECKLIST.forEach((titulo, index) => insert.run(escrituraId, titulo, index + 1, userId || null));
}

function migrate() {
  if (db.dialect === 'postgres') migratePostgres();
  else migrateSqlite();
}

if (require.main === module) {
  migrate();
  console.log('Migração de operação diária concluída.');
}

module.exports = { migrate, ensureDefaultChecklist, DEFAULT_CHECKLIST };
