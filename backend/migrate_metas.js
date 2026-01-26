const db = require('./database');

console.log('Iniciando migração: Sistema de Metas...');

try {
    // Criar tabela de metas mensais
    console.log('Criando tabela metas_mensais...');
    db.exec(`
        CREATE TABLE IF NOT EXISTS metas_mensais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mes TEXT NOT NULL,
            ano INTEGER NOT NULL,
            meta_total INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(mes, ano)
        );
        
        CREATE INDEX IF NOT EXISTS idx_metas_mes_ano ON metas_mensais(mes, ano);
    `);
    console.log('✅ Tabela metas_mensais criada.');

    // Criar tabela de metas individuais
    console.log('Criando tabela metas_individuais...');
    db.exec(`
        CREATE TABLE IF NOT EXISTS metas_individuais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meta_mensal_id INTEGER NOT NULL REFERENCES metas_mensais(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id),
            meta_quantidade INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(meta_mensal_id, user_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_metas_ind_meta ON metas_individuais(meta_mensal_id);
        CREATE INDEX IF NOT EXISTS idx_metas_ind_user ON metas_individuais(user_id);
    `);
    console.log('✅ Tabela metas_individuais criada.');

    // Criar meta exemplo para o mês atual
    const now = new Date();
    const mesAtual = String(now.getMonth() + 1).padStart(2, '0');
    const anoAtual = now.getFullYear();

    console.log(`\nCriando meta exemplo para ${mesAtual}/${anoAtual}...`);

    const checkMeta = db.prepare('SELECT id FROM metas_mensais WHERE mes = ? AND ano = ?').get(mesAtual, anoAtual);

    if (!checkMeta) {
        const insertMeta = db.prepare('INSERT INTO metas_mensais (mes, ano, meta_total) VALUES (?, ?, ?)');
        const result = insertMeta.run(mesAtual, anoAtual, 200);

        // Criar metas individuais para usuários ativos
        const users = db.prepare('SELECT id FROM users WHERE ativo = 1').all();
        const metaPorPessoa = Math.floor(200 / users.length);

        const insertMetaInd = db.prepare('INSERT INTO metas_individuais (meta_mensal_id, user_id, meta_quantidade) VALUES (?, ?, ?)');

        for (const user of users) {
            insertMetaInd.run(result.lastInsertRowid, user.id, metaPorPessoa);
        }

        console.log(`✅ Meta criada: ${200} escrituras (${metaPorPessoa} por pessoa)`);
    } else {
        console.log('⚠️  Meta já existe para este mês.');
    }

    console.log('\n🎉 Migração de Metas concluída com sucesso!');
    console.log('📊 Estrutura criada:');
    console.log('   - Tabela metas_mensais');
    console.log('   - Tabela metas_individuais');
    console.log('   - Meta exemplo criada');

} catch (error) {
    console.error('❌ Erro na migração:', error.message);
    console.error(error);
    process.exit(1);
}
