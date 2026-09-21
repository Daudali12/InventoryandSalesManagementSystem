const productService = require('../services/product.service');
const { formatPKR } = require('../utils/formatCurrency');

const handleCreateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name required.' });
    const category = await productService.createCategory(name);
    return res.status(201).json({ success: true, message: 'Category created.', data: category });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const handleGetCategories = async (req, res) => {
  try {
    const categories = await productService.getAllCategories();
    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const handleCreateProduct = async (req, res) => {
  try {
    const { name, price, costPrice, stockQuantity, categoryId } = req.body;
    if (!name || !price || !costPrice || stockQuantity === undefined || !categoryId) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    }
    const product = await productService.createProduct(req.body);
    return res.status(201).json({
      success: true,
      data: {
        ...product,
        formattedPrice: formatPKR(product.price),
        formattedCostPrice: formatPKR(product.costPrice),
      },
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const handleGetAllProducts = async (req, res) => {
  try {
    const products = await productService.getAllProducts(req.query.search);
    const formatted = products.map((item) => ({
      ...item,
      formattedPrice: formatPKR(item.price),
      formattedCostPrice: formatPKR(item.costPrice),
      isLowStock: item.stockQuantity <= item.lowStockThreshold,
    }));
    return res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const handleGetProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return res.status(200).json({
      success: true,
      data: {
        ...product,
        formattedPrice: formatPKR(product.price),
        formattedCostPrice: formatPKR(product.costPrice),
      },
    });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

const handleUpdateProduct = async (req, res) => {
  try {
    const updated = await productService.updateProduct(req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Product updated.', data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const handleDeleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id);
    return res.status(200).json({ success: true, message: 'Product deleted.' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const handleGetLowStockAlerts = async (req, res) => {
  try {
    const alerts = await productService.getLowStockAlerts();
    return res.status(200).json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  handleCreateCategory,
  handleGetCategories,
  handleCreateProduct,
  handleGetAllProducts,
  handleGetProductById,
  handleUpdateProduct,
  handleDeleteProduct,
  handleGetLowStockAlerts,
};