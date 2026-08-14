const express = require('express');
const router = express.Router();
const Escritura = require('../models/Escritura');

/**
 * POST /api/consulta
 * Rota PÚBLICA — sem autenticação
 * Consulta escritura pelo código de acompanhamento e senha do requerente
 */
router.post('/', (req, res) => {
    try {
        const codigo = req.body.codigo || req.body.acompanhamento || req.body.protocolo;
        const { senha } = req.body;

        if (!codigo || !senha) {
            return res.status(400).json({
                error: 'Código de acompanhamento e senha são obrigatórios'
            });
        }

        // Normalizar: maiúsculas e trim
        const codigoNorm = String(codigo).trim().toUpperCase();
        const senhaNorm = String(senha).trim().toUpperCase();

        const escritura = Escritura.findByAcompanhamento(codigoNorm, senhaNorm);

        if (!escritura) {
            return res.status(404).json({
                error: 'Código de acompanhamento ou senha inválidos. Verifique os dados e tente novamente.'
            });
        }

        res.json(escritura);
    } catch (error) {
        console.error('Erro na consulta pública:', error);
        res.status(500).json({ error: 'Erro ao consultar protocolo' });
    }
});

/**
 * Verifica se o código de acompanhamento existe, sem revelar dados.
 */
router.get('/:protocolo', (req, res) => {
    try {
        const prot = String(req.params.protocolo).trim().toUpperCase();
        const existe = require('../database')
            .prepare(`SELECT id FROM escrituras WHERE acompanhamento_codigo = ? AND gera_acompanhamento = 1`)
            .get(prot);

        res.json({ exists: !!existe });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao verificar protocolo' });
    }
});

module.exports = router;
