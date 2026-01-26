const db = require('./database');
const crypto = require('crypto');

console.log('Iniciando migração: Adicionando Hash de Integridade...');

try {
    // Verificar se coluna já existe
    const checkColumn = db.prepare("SELECT COUNT(*) as count FROM pragma_table_info('escrituras') WHERE name='integrity_hash'").get();

    if (checkColumn.count === 0) {
        console.log('Adicionando coluna integrity_hash à tabela escrituras...');
        db.exec('ALTER TABLE escrituras ADD COLUMN integrity_hash TEXT');
        console.log('✅ Coluna integrity_hash adicionada.');
    } else {
        console.log('⚠️  Coluna integrity_hash já existe.');
    }

    // Função para calcular hash de integridade
    function calculateIntegrityHash(escritura) {
        // Campos críticos que compõem o hash (ordem importa!)
        const data = {
            tipo: escritura.tipo,
            selagem: escritura.selagem,
            livro: escritura.livro,
            folha: escritura.folha,
            outorgante: escritura.outorgante,
            outorgado: escritura.outorgado,
            escrevente: escritura.escrevente,
            tipo_livro: escritura.tipo_livro,
            mes: escritura.mes,
            ano: escritura.ano,
            observacao: escritura.observacao
        };

        // Gerar hash SHA-256
        const hash = crypto
            .createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');

        return hash;
    }

    // Gerar hashes para registros existentes
    const escrituras = db.prepare('SELECT * FROM escrituras WHERE integrity_hash IS NULL').all();
    const updateHash = db.prepare('UPDATE escrituras SET integrity_hash = ? WHERE id = ?');

    console.log(`Gerando hashes de integridade para ${escrituras.length} escrituras...`);

    let count = 0;
    db.transaction(() => {
        for (const e of escrituras) {
            const hash = calculateIntegrityHash(e);
            updateHash.run(hash, e.id);
            count++;
            if (count % 50 === 0) {
                console.log(`  Processadas ${count}/${escrituras.length}...`);
            }
        }
    })();

    console.log('✅ Hashes gerados para todas as escrituras.');

    // Criar índice para performance (opcional)
    try {
        db.exec('CREATE INDEX IF NOT EXISTS idx_escrituras_integrity ON escrituras(integrity_hash)');
        console.log('✅ Índice criado para integrity_hash.');
    } catch (e) {
        console.log('⚠️  Índice já existe.');
    }

    console.log('\n🎉 Migração de Hash de Integridade concluída com sucesso!');
    console.log('📊 Estatísticas:');
    console.log(`   - Total de escrituras: ${escrituras.length}`);
    console.log(`   - Hashes gerados: ${count}`);

} catch (error) {
    console.error('❌ Erro na migração:', error.message);
    console.error(error);
    process.exit(1);
}
