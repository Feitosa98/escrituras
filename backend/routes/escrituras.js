const express = require('express');
const router = express.Router();
const escrituraController = require('../controllers/escrituraController');
const { authenticateToken } = require('../middleware/auth');
const { requireEditor, requireVisualizador } = require('../middleware/permissions');

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas de leitura (visualizador pode acessar)
router.get('/', requireVisualizador, escrituraController.getAll);
router.get('/stats', requireVisualizador, escrituraController.getStats);
router.get('/:id', requireVisualizador, escrituraController.getById);

// Rotas de escrita (apenas editor ou admin)
router.post('/import', requireEditor, escrituraController.importBulk); // Importação deve vir antes de create ou :id
router.post('/', requireEditor, escrituraController.create);
router.put('/:id', requireEditor, escrituraController.update);
router.delete('/:id', requireEditor, escrituraController.remove);

module.exports = router;
