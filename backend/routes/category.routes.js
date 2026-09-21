const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);
router.post('/', authorize('ADMIN', 'MANAGER'), categoryController.create);
router.put('/:id', authorize('ADMIN', 'MANAGER'), categoryController.update);
router.delete('/:id', authorize('ADMIN'), categoryController.remove);

module.exports = router;
