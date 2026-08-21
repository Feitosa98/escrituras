const express = require('express');
const router = express.Router();
const escrituraController = require('../controllers/escrituraController');
const { authenticateToken } = require('../middleware/auth');
const { requireEditor, requireVisualizador } = require('../middleware/permissions');

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas estáticas (devem vir ANTES de /:id)
router.get('/stats', requireVisualizador, escrituraController.getStats);
router.get('/stats/atividade-hoje', requireVisualizador, escrituraController.atividadeHoje);
router.get('/meu-trabalho', requireVisualizador, escrituraController.meuTrabalho);
router.post('/import', requireEditor, escrituraController.importBulk);

// Rotas de leitura
router.get('/', requireVisualizador, escrituraController.getAll);
router.get('/:id', requireVisualizador, escrituraController.getById);
router.get('/:id/historico', requireVisualizador, escrituraController.getHistorico);
router.get('/:id/checklist', requireVisualizador, escrituraController.getChecklist);

// Rotas de escrita
router.post('/', requireEditor, escrituraController.create);
router.put('/:id', requireEditor, escrituraController.update);
router.patch('/:id/status', requireEditor, escrituraController.updateStatus);
router.patch('/:id/operacao', requireEditor, escrituraController.updateOperation);
router.patch('/:id/restaurar', requireEditor, escrituraController.restore);
router.post('/:id/checklist', requireEditor, escrituraController.addChecklistItem);
router.patch('/:id/checklist/:itemId', requireEditor, escrituraController.updateChecklistItem);
router.delete('/:id/checklist/:itemId', requireEditor, escrituraController.removeChecklistItem);
router.delete('/:id', requireEditor, escrituraController.remove);

module.exports = router;
