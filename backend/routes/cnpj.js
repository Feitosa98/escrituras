const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireVisualizador } = require('../middleware/permissions');

const router = express.Router();
router.use(authenticateToken, requireVisualizador);

router.get('/:cnpj', async (req, res) => {
  const cnpj = String(req.params.cnpj || '').replace(/\D/g, '');
  if (cnpj.length !== 14) return res.status(400).json({ error: 'Informe um CNPJ com 14 dígitos' });
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${encodeURIComponent(cnpj)}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Cartorio-Santiago/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (response.status === 404) return res.status(404).json({ error: 'CNPJ não encontrado' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return res.json({
      cnpj: String(data.cnpj || cnpj).replace(/\D/g, ''),
      razaoSocial: String(data.razao_social || '').trim(),
      nomeFantasia: String(data.nome_fantasia || '').trim(),
      situacaoCadastral: String(data.descricao_situacao_cadastral || '').trim(),
      municipio: String(data.municipio || '').trim(),
      uf: String(data.uf || '').trim(),
    });
  } catch (error) {
    console.error('Erro na consulta de CNPJ:', error.message);
    return res.status(502).json({ error: 'Não foi possível consultar o CNPJ. Preencha os dados manualmente.' });
  }
});

module.exports = router;
