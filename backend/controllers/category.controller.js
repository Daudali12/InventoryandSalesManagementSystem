const categoryService = require('../services/category.service');

const getAll = async (req, res) => {
  try {
    const categories = await categoryService.getAll();
    res.json({ categories });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const getById = async (req, res) => {
  try {
    const category = await categoryService.getById(req.params.id);
    res.json({ category });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ message: 'Category name is required.' });
    }
    const category = await categoryService.create(req.body);
    res.status(201).json({ message: 'Category created successfully.', category });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const update = async (req, res) => {
  try {
    const category = await categoryService.update(req.params.id, req.body);
    res.json({ message: 'Category updated successfully.', category });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const remove = async (req, res) => {
  try {
    const result = await categoryService.remove(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

module.exports = { getAll, getById, create, update, remove };
