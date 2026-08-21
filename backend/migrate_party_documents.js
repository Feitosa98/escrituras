const db = require('./database');

if (db.dialect !== 'postgres') {
  const columns = db.prepare("PRAGMA table_info(escrituras)").all();
  const hasColumn = (name) => columns.some((column) => column.name === name);

  if (!hasColumn('cpf_cnpj_outorgante')) {
    db.exec('ALTER TABLE escrituras ADD COLUMN cpf_cnpj_outorgante TEXT');
  }
  if (!hasColumn('cpf_cnpj_outorgado')) {
    db.exec('ALTER TABLE escrituras ADD COLUMN cpf_cnpj_outorgado TEXT');
  }

  db.exec('CREATE INDEX IF NOT EXISTS idx_escrituras_cpf_outorgante ON escrituras(cpf_cnpj_outorgante)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_escrituras_cpf_outorgado ON escrituras(cpf_cnpj_outorgado)');
}

module.exports = true;
