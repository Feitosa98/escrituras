const db = require('./database');

console.log('Iniciando migração de Workflow...');

try {
  // Verificar se a coluna status já existe
  const tableInfo = db.pragma('table_info(escrituras)');
  const hasStatus = tableInfo.some(col => col.name === 'status');

  if (!hasStatus) {
    db.exec(`
      ALTER TABLE escrituras ADD COLUMN status TEXT DEFAULT 'Em andamento' CHECK(status IN ('Concluído', 'Em andamento', 'Aguardando cliente'));
      ALTER TABLE escrituras ADD COLUMN prazo_dias INTEGER DEFAULT 0;
      ALTER TABLE escrituras ADD COLUMN valor_receita REAL DEFAULT 0.0;
    `);
    console.log('✅ Colunas de Workflow (status, prazo_dias, valor_receita) adicionadas com sucesso.');
  } else {
    console.log('ℹ️ As colunas de Workflow já existem.');
  }

  // Tabela para Histórico de Mudanças de Status (opcional para o Kanban)
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      escritura_id INTEGER REFERENCES escrituras(id) ON DELETE CASCADE,
      status_anterior TEXT,
      status_novo TEXT NOT NULL,
      observacao TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_workflow_history_escritura ON workflow_history(escritura_id);
  `);
  console.log('✅ Tabela workflow_history verificada/criada.');
  
} catch (error) {
  console.error('❌ Erro durante a migração:', error.message);
}

console.log('Migração concluída.');
