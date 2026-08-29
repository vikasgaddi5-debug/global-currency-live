const express = require('express');
const router = express.Router();
const { getLatestRates, getHistoricalRates } = require('../services/fxProvider');

// GET /api/rates/latest?base=INR
router.get('/latest', async (req, res) => {
  const base = (req.query.base || 'USD').toUpperCase();
  try {
    const data = await getLatestRates(base);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'API_ERROR', message: err.message });
  }
});

// GET /api/rates/history?base=INR&target=USD&range=1M
router.get('/history', async (req, res) => {
  const base = (req.query.base || 'USD').toUpperCase();
  const target = (req.query.target || 'USD').toUpperCase();
  const range = req.query.range || '1M';
  try {
    const data = await getHistoricalRates(base, target, range);
    res.json(data);
  } catch (err) {
    const status = err.code === 'NO_HISTORICAL_DATA' ? 501 : 502;
    res.status(status).json({ error: err.code || 'API_ERROR', message: err.message });
  }
});

module.exports = router;
