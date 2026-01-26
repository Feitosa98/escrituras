const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Rotas públicas
router.post('/login', authController.login);

// Rotas protegidas
router.get('/me', authenticateToken, authController.me);

module.exports = router;
