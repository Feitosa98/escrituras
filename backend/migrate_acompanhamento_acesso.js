const db = require('./database');

function addColumnIfMissing(table, name, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((column) => column.name === name)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
  }
}

function slugPart(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function usernameFromName(name, id) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  const first = slugPart(parts[0]);
  const last = slugPart(parts.length > 1 ? parts[parts.length - 1] : 'usuario');
  return `${first || 'usuario'}.${last || id}`;
}

function migrate() {
  addColumnIfMissing('users', 'username', 'TEXT');
  addColumnIfMissing('users', 'access_start', "TEXT NOT NULL DEFAULT '07:50'");
  addColumnIfMissing('users', 'access_end', "TEXT NOT NULL DEFAULT '18:30'");

  addColumnIfMissing('escrituras', 'acompanhamento_codigo', 'TEXT');
  addColumnIfMissing('escrituras', 'tipo_acompanhamento', 'TEXT');
  addColumnIfMissing('escrituras', 'gera_acompanhamento', 'INTEGER NOT NULL DEFAULT 1');
  addColumnIfMissing('escrituras', 'protocolo_data', 'DATE');

  const users = db.prepare('SELECT id, nome, username FROM users ORDER BY id').all();
  const used = new Set(
    users.map((user) => user.username).filter(Boolean).map((value) => value.toLowerCase())
  );
  const updateUsername = db.prepare('UPDATE users SET username = ? WHERE id = ?');

  const defaultAdmin = db.prepare('SELECT id, username FROM users WHERE email = ?').get('admin@sistema.local');
  if (defaultAdmin && (!defaultAdmin.username || defaultAdmin.username === 'administrador.usuario')) {
    const adminUsernameInUse = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE AND id != ?')
      .get('admin.sistema', defaultAdmin.id);
    if (!adminUsernameInUse) {
      updateUsername.run('admin.sistema', defaultAdmin.id);
      defaultAdmin.username = 'admin.sistema';
      used.add('admin.sistema');
    }
  }

  for (const user of users) {
    if (user.username || (user.id === defaultAdmin?.id && defaultAdmin.username)) continue;
    const base = usernameFromName(user.nome, user.id);
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate.toLowerCase())) candidate = `${base}${suffix++}`;
    updateUsername.run(candidate, user.id);
    used.add(candidate.toLowerCase());
  }

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
      ON users(username COLLATE NOCASE) WHERE username IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_escrituras_acompanhamento
      ON escrituras(acompanhamento_codigo) WHERE acompanhamento_codigo IS NOT NULL;
  `);

  db.prepare(`
    UPDATE escrituras
       SET protocolo_data = COALESCE(protocolo_data, DATE(created_at)),
           gera_acompanhamento = CASE WHEN senha_cliente IS NULL THEN 0 ELSE 1 END
  `).run();

  const acts = db.prepare(`
    SELECT id, tipo, created_at
      FROM escrituras
     WHERE acompanhamento_codigo IS NULL AND senha_cliente IS NOT NULL
     ORDER BY created_at, id
  `).all();
  const nextByBase = new Map();
  const saveTracking = db.prepare(`
    UPDATE escrituras
       SET acompanhamento_codigo = ?, tipo_acompanhamento = ?, gera_acompanhamento = 1
     WHERE id = ?
  `);
  for (const act of acts) {
    const prefix = String(act.tipo || '').toLowerCase().includes('procura') ? 'PP' : 'EPTT';
    const date = String(act.created_at || '').slice(0, 7).replace('-', '');
    const period = /^\d{6}$/.test(date) ? date : new Date().toISOString().slice(0, 7).replace('-', '');
    const base = `${prefix}${period}`;
    const sequence = nextByBase.get(base) || 0;
    saveTracking.run(`${base}${String(sequence).padStart(3, '0')}`, prefix, act.id);
    nextByBase.set(base, sequence + 1);
  }
}

migrate();

module.exports = { migrate };
