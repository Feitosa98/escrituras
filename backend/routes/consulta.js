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

        if (!/^(PP|EPTT|EPDV)\d{9}$/.test(codigoNorm) || !/^[A-Z2-9]{8,32}$/.test(senhaNorm)) {
            return res.status(404).json({
                error: 'Código de acompanhamento ou senha inválidos. Verifique os dados e tente novamente.'
            });
        }

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

module.exports = router;
