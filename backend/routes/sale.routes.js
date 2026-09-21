const express = require('express');
const router = express.Router();
const saleController = require('../controllers/sale.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', saleController.getAll);
router.get('/:id', saleController.getById);
router.post('/', saleController.create);
router.put('/:id/cancel', authorize('ADMIN', 'MANAGER'), saleController.cancel);

module.exports = router;
