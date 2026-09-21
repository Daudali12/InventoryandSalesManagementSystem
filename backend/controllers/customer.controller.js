const customerService = require('../services/customer.service');

const getAll = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await customerService.getAll({ page, limit, search });
    res.json({
      customers: result.customers,
      data: result.customers,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const getById = async (req, res) => {
  try {
    const customer = await customerService.getById(req.params.id);
    res.json({ customer, data: customer });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ message: 'Customer name is required.' });
    }
    const customer = await customerService.create(req.body);
    res.status(201).json({ message: 'Customer created successfully.', customer, data: customer });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const update = async (req, res) => {
  try {
    const customer = await customerService.update(req.params.id, req.body);
    res.json({ message: 'Customer updated successfully.', customer, data: customer });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const remove = async (req, res) => {
  try {
    await customerService.remove(req.params.id);
    res.json({ message: 'Customer deleted successfully.' });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

module.exports = { getAll, getById, create, update, remove };
