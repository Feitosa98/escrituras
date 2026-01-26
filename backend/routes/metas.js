const express = require('express');
const router = express.Router();
const metaController = require('../controllers/metaController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/permissions');

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Definir meta (apenas admin)
router.post('/', requireAdmin, metaController.setMeta);

// Buscar meta
router.get('/:mes/:ano', metaController.getMeta);

// Relatórios
router.get('/relatorio/individual/:userId/:mes/:ano', metaController.getRelatorioIndividual);
router.get('/relatorio/equipe/:mes/:ano', metaController.getRelatorioEquipe);
router.get('/ranking/:mes/:ano', metaController.getRanking);
router.get('/projecao/:mes/:ano', metaController.getProjecao);

module.exports = router;
