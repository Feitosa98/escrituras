const db = require('./database');
const crypto = require('crypto');

console.log('Iniciando migração: Adicionando UUIDs...');

try {
    // Verificar se colunas já existem
    const checkEscrituras = db.prepare("SELECT COUNT(*) as count FROM pragma_table_info('escrituras') WHERE name='uuid'").get();
    const checkUsers = db.prepare("SELECT COUNT(*) as count FROM pragma_table_info('users') WHERE name='uuid'").get();

    if (checkEscrituras.count === 0) {
        console.log('Adicionando coluna uuid à tabela escrituras...');
        db.exec('ALTER TABLE escrituras ADD COLUMN uuid TEXT');
        console.log('✅ Coluna uuid adicionada a escrituras.');
    } else {
        console.log('⚠️  Coluna uuid já existe em escrituras.');
    }

    if (checkUsers.count === 0) {
        console.log('Adicionando coluna uuid à tabela users...');
        db.exec('ALTER TABLE users ADD COLUMN uuid TEXT');
        console.log('✅ Coluna uuid adicionada a users.');
    } else {
        console.log('⚠️  Coluna uuid já existe em users.');
    }

    // Gerar UUIDs para registros existentes
    const escrituras = db.prepare('SELECT id FROM escrituras WHERE uuid IS NULL').all();
    const updateEscritura = db.prepare('UPDATE escrituras SET uuid = ? WHERE id = ?');

    console.log(`Gerando UUIDs para ${escrituras.length} escrituras...`);
    db.transaction(() => {
        for (const e of escrituras) {
            const uuid = crypto.randomUUID();
            updateEscritura.run(uuid, e.id);
        }
    })();
    console.log('✅ UUIDs gerados para escrituras.');

    // Gerar UUIDs para usuários
    const users = db.prepare('SELECT id FROM users WHERE uuid IS NULL').all();
    const updateUser = db.prepare('UPDATE users SET uuid = ? WHERE id = ?');

    console.log(`Gerando UUIDs para ${users.length} usuários...`);
    db.transaction(() => {
        for (const u of users) {
            const uuid = crypto.randomUUID();
            updateUser.run(uuid, u.id);
        }
    })();
    console.log('✅ UUIDs gerados para usuários.');

    // Criar índices únicos
    try {
        db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_escrituras_uuid ON escrituras(uuid)');
        console.log('✅ Índice único criado para escrituras.uuid');
    } catch (e) {
        console.log('⚠️  Índice já existe para escrituras.uuid');
    }

    try {
        db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid)');
        console.log('✅ Índice único criado para users.uuid');
    } catch (e) {
        console.log('⚠️  Índice já existe para users.uuid');
    }

    console.log('\n🎉 Migração concluída com sucesso!');

} catch (error) {
    console.error('❌ Erro na migração:', error.message);
    console.error(error);
    process.exit(1);
}
