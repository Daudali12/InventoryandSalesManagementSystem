const reportService = require('../services/report.service');

const getDashboard = async (req, res) => {
  try {
    const dashboard = await reportService.getDashboard();
    res.json(dashboard);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const getSalesReport = async (req, res) => {
  try {
    const report = await reportService.getSalesReport(req.query);
    res.json(report);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

const getInventoryReport = async (req, res) => {
  try {
    const report = await reportService.getInventoryReport();
    res.json(report);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  }
};

module.exports = { getDashboard, getSalesReport, getInventoryReport };
