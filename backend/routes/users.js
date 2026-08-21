const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireVisualizador } = require('../middleware/permissions');

// Lista reduzida para atribuição de responsáveis nos atos.
router.use(authenticateToken);
router.get('/options', requireVisualizador, userController.getAll);

// Administração completa de usuários.
router.use(requireAdmin);

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.remove);

module.exports = router;
