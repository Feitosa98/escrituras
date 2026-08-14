/**
 * Migração: Adiciona protocolo e senha_cliente nas escrituras
 * Formato protocolo: PROT-2026-000006
 * Senha: 8 caracteres alfanuméricos
 */
const db = require('./database');
const crypto = require('crypto');

function generateSenha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem ambiguidade (0/O, 1/I/l)
  let senha = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    senha += chars[bytes[i] % chars.length];
  }
  return senha;
}

function generateProtocolo(id, ano) {
  const numPadded = String(id).padStart(6, '0');
  return `PROT-${ano}-${numPadded}`;
}

console.log('Iniciando migração de Protocolo...');

try {
  const tableInfo = db.pragma('table_info(escrituras)');
  const hasProtocolo = tableInfo.some(col => col.name === 'protocolo');
  const hasSenha = tableInfo.some(col => col.name === 'senha_cliente');

  if (!hasProtocolo) {
    db.exec(`ALTER TABLE escrituras ADD COLUMN protocolo TEXT;`);
    console.log('✅ Coluna protocolo adicionada.');
  }

  if (!hasSenha) {
    db.exec(`ALTER TABLE escrituras ADD COLUMN senha_cliente TEXT;`);
    console.log('✅ Coluna senha_cliente adicionada.');
  }

  // Criar índice único no protocolo
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_escrituras_protocolo ON escrituras(protocolo)
    WHERE protocolo IS NOT NULL;
  `);

  // Gerar protocolo e senha para escrituras que ainda não têm
  const semProtocolo = db.prepare(
    `SELECT id, ano FROM escrituras WHERE protocolo IS NULL OR senha_cliente IS NULL`
  ).all();

  if (semProtocolo.length > 0) {
    const updateStmt = db.prepare(
      `UPDATE escrituras SET protocolo = ?, senha_cliente = ? WHERE id = ?`
    );

    const updateMany = db.transaction((rows) => {
      for (const row of rows) {
        const prot = generateProtocolo(row.id, row.ano || new Date().getFullYear());
        const senha = generateSenha();
        updateStmt.run(prot, senha, row.id);
      }
    });

    updateMany(semProtocolo);
    console.log(`✅ Protocolo e senha gerados para ${semProtocolo.length} escrituras existentes.`);
  } else {
    console.log('ℹ️  Todas as escrituras já possuem protocolo.');
  }

} catch (error) {
  console.error('❌ Erro na migração de protocolo:', error.message);
}

console.log('Migração de protocolo concluída.');
