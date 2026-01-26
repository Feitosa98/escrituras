const express = require('express');
const router = express.Router();
const signatureController = require('../controllers/signatureController');
const { authenticateToken } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(authenticateToken);

router.post('/:id/sign', signatureController.sign);
router.get('/:id/verify', signatureController.verify);
router.get('/:id/signatures', signatureController.getSignatures);
router.get('/:id/verify-all', signatureController.verifyAll);

module.exports = router;
