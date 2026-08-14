const express = require('express');
const router = express.Router();
const agendamentoController = require('../controllers/agendamentoController');
const { authenticateToken } = require('../middleware/auth');

// Todas as rotas de agendamentos requerem autenticação
router.use(authenticateToken);

router.get('/', agendamentoController.getAll);
router.get('/:id', agendamentoController.getById);
router.post('/', agendamentoController.create);
router.patch('/:id', agendamentoController.update);
router.delete('/:id', agendamentoController.remove);

module.exports = router;
