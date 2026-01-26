const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');

// Caminho correto do banco no AppData
const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'SistemaEscrituras', 'escrituras.db');
console.log('Conectando ao banco em:', dbPath);

const db = new sqlite3.Database(dbPath);

console.log('--- RELATÓRIO DE IMPORTAÇÃO ---');

db.serialize(() => {
    db.get("SELECT COUNT(*) as count FROM escrituras", (err, row) => {
        if (err) {
            console.error("Erro ao contar:", err.message);
        } else {
            console.log(`✅ TOTAL DE ESCRITURAS: ${row.count}`);
        }
    });

    db.all("SELECT id, tipo, livro, folha, created_at FROM escrituras ORDER BY id DESC LIMIT 5", (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            console.log("\n📋 ÚLTIMAS 5 IMPORTADAS:");
            if (rows.length === 0) {
                console.log("   (Nenhuma escritura encontrada)");
            } else {
                rows.forEach(row => {
                    console.log(`   [ID ${row.id}] ${row.tipo} - L:${row.livro}/F:${row.folha} em ${row.created_at}`);
                });
            }
        }
    });
});

db.close();
