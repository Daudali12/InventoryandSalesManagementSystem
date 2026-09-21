const orderService = require('../services/order.service');

const getAll = async (req, res) => {
  try {
    const result = await orderService.getAll(req.query);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const getById = async (req, res) => {
  try {
    const order = await orderService.getById(req.params.id);
    res.json({ order });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const create = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required.' });
    }

    const order = await orderService.create({
      items,
      userId: req.user.id,
      paymentMethod: req.body.paymentMethod,
      discount: req.body.discount,
      notes: req.body.notes,
    });
    res.status(201).json({ message: 'Order created successfully.', order });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    if (!paymentMethod) {
      return res.status(400).json({ message: 'Payment method is required.' });
    }

    const order = await orderService.updateStatus(req.params.id, paymentMethod);
    res.json({ message: 'Order updated successfully.', order });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

module.exports = { getAll, getById, create, updateStatus };