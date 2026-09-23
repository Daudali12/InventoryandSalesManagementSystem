const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const supplierRoutes = require('./routes/supplier.routes');
const saleRoutes = require('./routes/sale.routes');
const orderRoutes = require('./routes/order.routes');
const reportRoutes = require('./routes/report.routes');
const customerRoutes = require('./routes/customer.routes');

const app = express();

app.disable('x-powered-by');
app.use('/api', cors(require('./config/cors').createCorsOptions()));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Inventory & Sales Management System API is running.',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', require('./routes/business.routes').router);
app.use('/api', require('./routes/analytics.routes'));
app.use('/api', (req, res, next) => {
  const logged = ['POST', 'PUT', 'DELETE'].includes(req.method) && /^\/(suppliers|categories|customers)(\/|$)/.test(req.path);
  if (logged) res.on('finish', () => { if (res.statusCode < 300 && req.user) require('./routes/business.routes').activity(require('./config/db').prisma, req, `${req.method} ${req.path}`, req.params.id).catch(console.error); });
  next();
});
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/orders', require('./middleware/auth.middleware').authenticate, (req, res) => res.status(410).json({ message: 'Use /api/purchases for supplier orders or /api/sales for checkout.' }));
app.use('/api/reports', reportRoutes);
app.use('/api/customers', customerRoutes);

// Global 404 handler for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: `API route ${req.method} ${req.originalUrl} not found.` });
});

const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')));

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || (err.code === 'P2002' || err.code === 'P2003' ? 409 : 500)).json({
    message: err.code === 'P2002' ? 'This value already exists.' : err.code === 'P2003' ? 'This record is linked to existing transactions.' : err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
if (require.main === module) app.listen(PORT, () => {
  console.log(`[SERVER RUNNING] Connected on port ${PORT}`);
});

module.exports = app;
