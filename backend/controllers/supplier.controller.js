const supplierService = require('../services/supplier.service');

const getAll = async (req, res) => {
  try {
    const suppliers = await supplierService.getAll();
    res.json({ suppliers });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const getById = async (req, res) => {
  try {
    const supplier = await supplierService.getById(req.params.id);
    res.json({ supplier });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ message: 'Supplier name is required.' });
    }
    const supplier = await supplierService.create(req.body);
    res.status(201).json({ message: 'Supplier created successfully.', supplier });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const update = async (req, res) => {
  try {
    const supplier = await supplierService.update(req.params.id, req.body);
    res.json({ message: 'Supplier updated successfully.', supplier });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const remove = async (req, res) => {
  try {
    const result = await supplierService.remove(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

module.exports = { getAll, getById, create, update, remove };
