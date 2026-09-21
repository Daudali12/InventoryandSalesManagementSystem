const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', supplierController.getAll);
router.get('/:id', supplierController.getById);
router.post('/', authorize('ADMIN', 'MANAGER'), supplierController.create);
router.put('/:id', authorize('ADMIN', 'MANAGER'), supplierController.update);
router.delete('/:id', authorize('ADMIN'), supplierController.remove);

module.exports = router;
