const saleService = require('../services/sale.service');

const create = async (req, res) => {
  try {
    const { items, customerName, customerPhone, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required and must not be empty.' });
    }

    const sale = await saleService.create({
      items,
      customerName,
      customerPhone,
      notes,
      userId: req.user.id,
    });

    res.status(201).json({ message: 'Sale created successfully.', sale });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const getAll = async (req, res) => {
  try {
    const result = await saleService.getAll(req.query);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const getById = async (req, res) => {
  try {
    const sale = await saleService.getById(req.params.id);
    res.json({ sale });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const cancel = async (req, res) => {
  try {
    const sale = await saleService.cancel(req.params.id, req.user.id);
    res.json({ message: 'Sale cancelled successfully. Stock has been restored.', sale });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

module.exports = { create, getAll, getById, cancel };
