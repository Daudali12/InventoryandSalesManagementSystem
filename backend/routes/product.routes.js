const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.use(verifyToken);

router.get('/categories', productController.handleGetCategories);
router.post('/categories', authorizeRoles('ADMIN'), productController.handleCreateCategory);

router.get('/low-stock', productController.handleGetLowStockAlerts);

router.get('/', productController.handleGetAllProducts);
router.get('/:id', productController.handleGetProductById);
router.post('/', authorizeRoles('ADMIN'), productController.handleCreateProduct);
router.put('/:id', authorizeRoles('ADMIN'), productController.handleUpdateProduct);
router.delete('/:id', authorizeRoles('ADMIN'), productController.handleDeleteProduct);

module.exports = router;