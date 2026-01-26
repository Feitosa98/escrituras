const DigitalSignature = require('../models/DigitalSignature');

// Assinar uma escritura
async function sign(req, res) {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Senha é obrigatória para assinar' });
        }

        const result = DigitalSignature.sign(id, req.user.id, password);
        res.json(result);
    } catch (error) {
        console.error('Erro ao assinar escritura:', error);
        res.status(500).json({ error: error.message });
    }
}

// Verificar assinatura
async function verify(req, res) {
    try {
        const { id } = req.params;
        const { userId } = req.query;

        const result = DigitalSignature.verify(id, userId || req.user.id);
        res.json(result);
    } catch (error) {
        console.error('Erro ao verificar assinatura:', error);
        res.status(500).json({ error: error.message });
    }
}

// Listar assinaturas de uma escritura
async function getSignatures(req, res) {
    try {
        const { id } = req.params;
        const signatures = DigitalSignature.getSignatures(id);
        res.json(signatures);
    } catch (error) {
        console.error('Erro ao listar assinaturas:', error);
        res.status(500).json({ error: error.message });
    }
}

// Verificar todas as assinaturas
async function verifyAll(req, res) {
    try {
        const { id } = req.params;
        const results = DigitalSignature.verifyAll(id);
        res.json(results);
    } catch (error) {
        console.error('Erro ao verificar assinaturas:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    sign,
    verify,
    getSignatures,
    verifyAll
};
