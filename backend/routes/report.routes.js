const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/dashboard', reportController.getDashboard);
router.get('/sales', authorize('ADMIN', 'MANAGER'), reportController.getSalesReport);
router.get('/inventory', authorize('ADMIN', 'MANAGER'), reportController.getInventoryReport);

module.exports = router;
