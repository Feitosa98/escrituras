const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// Caminho do banco de dados
const isDev = process.env.NODE_ENV === 'development';
const dbPath = isDev
  ? path.join(__dirname, '../database/escrituras.db')
  : path.join(process.env.APPDATA || process.env.HOME, 'SistemaEscrituras', 'escrituras.db');

// Garantir que o diretório existe
const fs = require('fs');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Criar conexão
const db = new Database(dbPath, { verbose: console.log });

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Criar tabelas
db.exec(`
  -- Tabela de usuários
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'editor', 'visualizador')),
    ativo INTEGER DEFAULT 1,
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
    escrevente TEXT NOT NULL,
    tipo_livro TEXT NOT NULL,
    mes TEXT NOT NULL,
    ano TEXT NOT NULL,
    observacao TEXT,
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
`);

// Criar usuário admin padrão se não existir
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@sistema.local');

if (!adminExists) {
  const senhaHash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (nome, email, senha_hash, role)
    VALUES (?, ?, ?, ?)
  `).run('Administrador', 'admin@sistema.local', senhaHash, 'admin');

  console.log('✅ Usuário admin criado: admin@sistema.local / admin123');
}

console.log(`✅ Banco de dados inicializado: ${dbPath}`);

module.exports = db;
