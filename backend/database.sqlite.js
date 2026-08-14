const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// Caminho do banco de dados
const isDev = process.env.NODE_ENV === 'development';
const dataDir = process.env.DATA_DIR || path.join(process.env.APPDATA || process.env.HOME, 'SistemaEscrituras');
const dbPath = isDev
  ? path.join(__dirname, '../database/escrituras.db')
  : path.join(dataDir, 'escrituras.db');

// Garantir que o diretório existe
const fs = require('fs');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Criar conexão
const db = new Database(dbPath, isDev ? { verbose: console.log } : {});

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Criar tabelas
db.exec(`
  -- Tabela de usuários
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    senha_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'editor', 'visualizador')),
    ativo INTEGER DEFAULT 1,
    access_start TEXT NOT NULL DEFAULT '07:50',
    access_end TEXT NOT NULL DEFAULT '18:30',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela de escrituras
  CREATE TABLE IF NOT EXISTS escrituras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    selagem DATE,
    livro TEXT NOT NULL,
    folha TEXT NOT NULL,
    outorgante TEXT NOT NULL,
    outorgado TEXT,
    email_cliente TEXT,
    escrevente TEXT NOT NULL,
    tipo_livro TEXT NOT NULL,
    mes TEXT NOT NULL,
    ano TEXT NOT NULL,
    observacao TEXT,
    acompanhamento_codigo TEXT,
    tipo_acompanhamento TEXT,
    gera_acompanhamento INTEGER NOT NULL DEFAULT 1,
    protocolo_data DATE,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela de logs de auditoria
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    acao TEXT NOT NULL,
    tabela TEXT,
    registro_id INTEGER,
    dados_anteriores TEXT,
    dados_novos TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Índices para performance
  CREATE INDEX IF NOT EXISTS idx_escrituras_livro_folha ON escrituras(livro, folha);
  CREATE INDEX IF NOT EXISTS idx_escrituras_tipo ON escrituras(tipo);
  CREATE INDEX IF NOT EXISTS idx_escrituras_ano ON escrituras(ano);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
  -- Tabelas Auxiliares
  -- Tipos de Escritura
  CREATE TABLE IF NOT EXISTS tipos_escritura (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT UNIQUE NOT NULL,
    ativo INTEGER DEFAULT 1
  );

  -- Escreventes
  CREATE TABLE IF NOT EXISTS escreventes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id),
    ativo INTEGER DEFAULT 1
  );

  -- Índices
  CREATE INDEX IF NOT EXISTS idx_tipos_escritura_nome ON tipos_escritura(nome);

  -- Agendamentos / Ações nas escrituras
  CREATE TABLE IF NOT EXISTS agendamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    escritura_id INTEGER REFERENCES escrituras(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    titulo TEXT NOT NULL,
    descricao TEXT,
    data_agendada DATETIME NOT NULL,
    concluido INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data_agendada);
  CREATE INDEX IF NOT EXISTS idx_agendamentos_user ON agendamentos(user_id);
  CREATE INDEX IF NOT EXISTS idx_agendamentos_escritura ON agendamentos(escritura_id);
`);

// Compatibilidade com bancos criados por versões anteriores do sistema.
// As colunas precisam existir antes da criação do administrador padrão.
const userColumns = db.prepare('PRAGMA table_info(users)').all();
const hasUserColumn = (name) => userColumns.some((column) => column.name === name);
if (!hasUserColumn('username')) db.exec('ALTER TABLE users ADD COLUMN username TEXT');
if (!hasUserColumn('access_start')) db.exec("ALTER TABLE users ADD COLUMN access_start TEXT NOT NULL DEFAULT '07:50'");
if (!hasUserColumn('access_end')) db.exec("ALTER TABLE users ADD COLUMN access_end TEXT NOT NULL DEFAULT '18:30'");

// Criar usuário admin padrão se não existir
const adminEmail = process.env.ADMIN_EMAIL || 'admin@sistema.local';
const adminPassword = process.env.ADMIN_PASSWORD || (isDev ? 'admin123' : null);
const adminExists = db.prepare("SELECT id FROM users WHERE email = ? OR role = 'admin' ORDER BY id LIMIT 1").get(adminEmail);

if (!adminExists) {
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD deve ser configurada em produção');
  }
  const senhaHash = bcrypt.hashSync(adminPassword, 12);
  db.prepare(`
    INSERT INTO users (nome, username, email, senha_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run('Administrador do Sistema', 'admin.sistema', adminEmail, senhaHash, 'admin');

  console.log('✅ Usuário administrador criado: admin.sistema');
}

console.log(`✅ Banco de dados inicializado: ${dbPath}`);

module.exports = db;
