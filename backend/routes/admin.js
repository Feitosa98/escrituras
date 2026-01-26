const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireEditor } = require('../middleware/permissions');

// Todas requerem login
router.use(authenticateToken);

// === TIPOS DE ESCRITURA ===
// Leitura liberada para todos autenticados (para popular selects no cadastro)
router.get('/tipos-escritura', adminController.getTipos);

// Escrita restrita
router.post('/tipos-escritura', requireEditor, adminController.createTipo);
router.put('/tipos-escritura/:id', requireEditor, adminController.updateTipo);

// === ESCREVENTES ===
router.get('/escreventes', adminController.getEscreventes);
router.post('/escreventes', requireAdmin, adminController.createEscrevente);
router.put('/escreventes/:id', requireAdmin, adminController.updateEscrevente);

module.exports = router;
