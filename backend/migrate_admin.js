const db = require('./database');

console.log('Iniciando migração de tabelas administrativas...');

try {
    // Tipos de Escritura
    db.exec(`
    CREATE TABLE IF NOT EXISTS tipos_escritura (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT UNIQUE NOT NULL,
        ativo INTEGER DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_tipos_escritura_nome ON tipos_escritura(nome);
    `);
    console.log('✅ Tabela tipos_escritura verificada.');

    // Escreventes
    db.exec(`
    CREATE TABLE IF NOT EXISTS escreventes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        ativo INTEGER DEFAULT 1
    );
    `);
    console.log('✅ Tabela escreventes verificada.');

    // Popular Tipos de Escritura com dados existentes
    const tipos = db.prepare("SELECT DISTINCT tipo FROM escrituras WHERE tipo IS NOT NULL AND tipo != ''").all();
    console.log(`Encontrados ${tipos.length} tipos de escritura existentes.`);

    const insertTipo = db.prepare('INSERT OR IGNORE INTO tipos_escritura (nome) VALUES (?)');
    let countTipos = 0;

    db.transaction(() => {
        for (const t of tipos) {
            if (!t.tipo) continue;
            const result = insertTipo.run(t.tipo.trim());
            if (result.changes > 0) countTipos++;
        }
    })();
    console.log(`✅ Migrados ${countTipos} tipos para a nova tabela.`);

    // Popular Escreventes com dados existentes
    const escreventes = db.prepare("SELECT DISTINCT escrevente FROM escrituras WHERE escrevente IS NOT NULL AND escrevente != ''").all();
    console.log(`Encontrados ${escreventes.length} escreventes existentes.`);

    const insertEscr = db.prepare('INSERT OR IGNORE INTO escreventes (nome) VALUES (?)');
    let countEscr = 0;

    db.transaction(() => {
        for (const e of escreventes) {
            // Verificar se já existe (não temos unique constraint no nome do escrevente, mas vamos evitar duplicar agora)
            const exists = db.prepare('SELECT id FROM escreventes WHERE nome = ?').get(e.escrevente.trim());
            if (!exists) {
                insertEscr.run(e.escrevente.trim());
                countEscr++;
            }
        }
    })();
    console.log(`✅ Migrados ${countEscr} escreventes para a nova tabela.`);

    console.log('Migração concluída com sucesso!');

} catch (error) {
    console.error('❌ Erro na migração:', error);
}
