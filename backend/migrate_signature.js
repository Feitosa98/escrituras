const db = require('./database');
const crypto = require('crypto');

console.log('Iniciando migração: Assinatura Digital RSA...');

try {
    // Criar tabela de assinaturas digitais
    console.log('Criando tabela assinaturas_digitais...');
    db.exec(`
        CREATE TABLE IF NOT EXISTS assinaturas_digitais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            escritura_id INTEGER NOT NULL REFERENCES escrituras(id),
            user_id INTEGER NOT NULL REFERENCES users(id),
            hash_documento TEXT NOT NULL,
            assinatura TEXT NOT NULL,
            algoritmo TEXT DEFAULT 'RSA-SHA256',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(escritura_id, user_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_assinaturas_escritura ON assinaturas_digitais(escritura_id);
        CREATE INDEX IF NOT EXISTS idx_assinaturas_user ON assinaturas_digitais(user_id);
    `);
    console.log('✅ Tabela assinaturas_digitais criada.');

    // Adicionar campos de chaves RSA aos usuários
    const checkPublicKey = db.prepare("SELECT COUNT(*) as count FROM pragma_table_info('users') WHERE name='public_key'").get();
    const checkPrivateKey = db.prepare("SELECT COUNT(*) as count FROM pragma_table_info('users') WHERE name='private_key_encrypted'").get();

    if (checkPublicKey.count === 0) {
        console.log('Adicionando coluna public_key à tabela users...');
        db.exec('ALTER TABLE users ADD COLUMN public_key TEXT');
        console.log('✅ Coluna public_key adicionada.');
    }

    if (checkPrivateKey.count === 0) {
        console.log('Adicionando coluna private_key_encrypted à tabela users...');
        db.exec('ALTER TABLE users ADD COLUMN private_key_encrypted TEXT');
        console.log('✅ Coluna private_key_encrypted adicionada.');
    }

    // Gerar par de chaves RSA para o usuário admin
    console.log('\nGerando par de chaves RSA para usuário admin...');

    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    // Criptografar chave privada com senha padrão (em produção, usar senha do usuário)
    const password = 'admin123';
    const salt = crypto.randomBytes(16);
    const key = crypto.scryptSync(password, salt, 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encryptedPrivateKey = cipher.update(privateKey, 'utf8', 'hex');
    encryptedPrivateKey += cipher.final('hex');

    // Armazenar salt + iv + chave criptografada
    const encryptedData = JSON.stringify({
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        encrypted: encryptedPrivateKey
    });

    // Atualizar usuário admin com as chaves
    const updateKeys = db.prepare('UPDATE users SET public_key = ?, private_key_encrypted = ? WHERE email = ?');
    updateKeys.run(publicKey, encryptedData, 'admin@sistema.local');

    console.log('✅ Par de chaves RSA gerado para admin.');
    console.log('📊 Tamanho da chave: 2048 bits');
    console.log('🔐 Chave privada criptografada com AES-256');

    console.log('\n🎉 Migração de Assinatura Digital concluída com sucesso!');
    console.log('\n📋 Estrutura criada:');
    console.log('   - Tabela assinaturas_digitais');
    console.log('   - Campos public_key e private_key_encrypted em users');
    console.log('   - Par de chaves RSA para admin');

} catch (error) {
    console.error('❌ Erro na migração:', error.message);
    console.error(error);
    process.exit(1);
}
