const Escritura = require('../models/Escritura');

// Verificar integridade de uma escritura específica
async function verifyOne(req, res) {
    try {
        const escritura = Escritura.findByIdOrUuid(req.params.id);

        if (!escritura) {
            return res.status(404).json({ error: 'Escritura não encontrada' });
        }

        const verification = Escritura.verifyIntegrity(escritura);

        res.json({
            escritura_id: escritura.id,
            uuid: escritura.uuid,
            livro: escritura.livro,
            folha: escritura.folha,
            ...verification
        });
    } catch (error) {
        console.error('Erro ao verificar integridade:', error);
        res.status(500).json({ error: 'Erro ao verificar integridade' });
    }
}

// Verificar integridade de todas as escrituras
async function verifyAll(req, res) {
    try {
        const escrituras = Escritura.findAll();
        const results = {
            total: escrituras.length,
            valid: 0,
            invalid: 0,
            no_hash: 0,
            violations: []
        };

        for (const escritura of escrituras) {
            const verification = Escritura.verifyIntegrity(escritura);

            if (verification.valid) {
                results.valid++;
            } else if (verification.reason === 'NO_HASH') {
                results.no_hash++;
            } else {
                results.invalid++;
                results.violations.push({
                    id: escritura.id,
                    uuid: escritura.uuid,
                    livro: escritura.livro,
                    folha: escritura.folha,
                    tipo: escritura.tipo,
                    ...verification
                });
            }
        }

        res.json(results);
    } catch (error) {
        console.error('Erro ao verificar integridades:', error);
        res.status(500).json({ error: 'Erro ao verificar integridades' });
    }
}

module.exports = {
    verifyOne,
    verifyAll
};
