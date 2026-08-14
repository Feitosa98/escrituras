/**
 * Migração: Novo fluxo de trabalho com 6 etapas livres
 * Expande o CHECK constraint da coluna status e atualiza registros antigos
 */
const db = require('./database');

const NOVOS_STATUS = [
  'Abertura de protocolo',
  'Orçamento / Documentação',
  'Minuta / Solicitações',
  'Assinatura',
  'Prenotação',
  'Concluído',
];

// Status antigos mapeados para novos
const MAPA_STATUS = {
  'Em andamento':        'Abertura de protocolo',
  'Aguardando cliente':  'Orçamento / Documentação',
};

function migrarFluxo() {
  try {
    // 1. Verificar se a tabela já foi migrada (checar pelo CHECK constraint)
    const schema = db.prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='escrituras'"
    ).get();

    const jaTemNovoStatus = schema?.sql?.includes('Abertura de protocolo');
    if (jaTemNovoStatus) {
      console.log('✅ Tabela já possui novo fluxo. Migração ignorada.');
      return;
    }

    console.log('🔄 Iniciando migração do fluxo de status...');

    db.prepare('BEGIN').run();

    // 2. Criar tabela temporária com novo CHECK constraint
    db.prepare(`
      CREATE TABLE escrituras_new AS SELECT * FROM escrituras WHERE 0
    `).run();

    // Recriar com o schema correto (novo CHECK)
    db.prepare('DROP TABLE escrituras_new').run();

    db.prepare(`
      CREATE TABLE escrituras_new (
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
        created_by INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        uuid TEXT,
        integrity_hash TEXT,
        status TEXT DEFAULT 'Abertura de protocolo' CHECK(status IN (
          'Abertura de protocolo',
          'Orçamento / Documentação',
          'Minuta / Solicitações',
          'Assinatura',
          'Prenotação',
          'Concluído'
        )),
        prazo_dias INTEGER DEFAULT 0,
        valor_receita REAL DEFAULT 0.0,
        protocolo TEXT,
        senha_cliente TEXT
      )
    `).run();

    // 3. Copiar dados mapeando status antigos -> novos
    const escrituras = db.prepare('SELECT * FROM escrituras').all();
    const insert = db.prepare(`
      INSERT INTO escrituras_new (
        id, tipo, selagem, livro, folha, outorgante, outorgado, email_cliente, escrevente,
        tipo_livro, mes, ano, observacao, created_by, updated_by,
        created_at, updated_at, uuid, integrity_hash, status,
        prazo_dias, valor_receita, protocolo, senha_cliente
      ) VALUES (
        @id, @tipo, @selagem, @livro, @folha, @outorgante, @outorgado, @email_cliente, @escrevente,
        @tipo_livro, @mes, @ano, @observacao, @created_by, @updated_by,
        @created_at, @updated_at, @uuid, @integrity_hash, @status,
        @prazo_dias, @valor_receita, @protocolo, @senha_cliente
      )
    `);

    let migrados = 0;
    for (const e of escrituras) {
      const statusAntigo = e.status || 'Em andamento';
      const statusNovo = NOVOS_STATUS.includes(statusAntigo)
        ? statusAntigo
        : (MAPA_STATUS[statusAntigo] || 'Abertura de protocolo');

      insert.run({ email_cliente: null, ...e, status: statusNovo });
      if (statusAntigo !== statusNovo) migrados++;
    }

    // 4. Substituir tabela
    db.prepare('DROP TABLE escrituras').run();
    db.prepare('ALTER TABLE escrituras_new RENAME TO escrituras').run();

    // 5. Recriar índices
    db.prepare('CREATE INDEX IF NOT EXISTS idx_escrituras_livro_folha ON escrituras(livro, folha)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_escrituras_tipo ON escrituras(tipo)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_escrituras_ano ON escrituras(ano)').run();
    db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_escrituras_protocolo ON escrituras(protocolo) WHERE protocolo IS NOT NULL').run();

    db.prepare('COMMIT').run();

    console.log(`✅ Fluxo migrado com sucesso!`);
    console.log(`   - ${escrituras.length} escrituras processadas`);
    console.log(`   - ${migrados} tiveram status atualizado para o novo fluxo`);
    console.log(`   - Novos status: ${NOVOS_STATUS.join(', ')}`);

  } catch (error) {
    db.prepare('ROLLBACK').run();
    console.error('❌ Erro na migração de fluxo:', error.message);
    throw error;
  }
}

module.exports = { migrarFluxo };
