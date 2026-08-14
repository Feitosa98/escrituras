const db = require('./database');

const columns = db.pragma('table_info(escrituras)');

if (!columns.some((column) => column.name === 'email_cliente')) {
  db.exec('ALTER TABLE escrituras ADD COLUMN email_cliente TEXT');
  console.log('✅ Campo de e-mail do cliente adicionado.');
}
