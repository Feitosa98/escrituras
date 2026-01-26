const express = require('express');
const router = express.Router();
const integrityController = require('../controllers/integrityController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/permissions');

// Todas as rotas requerem autenticação e permissão de admin
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/verify/:id', integrityController.verifyOne);
router.get('/verify-all', integrityController.verifyAll);

module.exports = router;
