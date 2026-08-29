const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET /api/events?currency=USD
// Returns economic calendar / market events for a currency if a provider is
// configured. Never fabricates events — returns an empty, clearly-labeled
// list if no provider is set up, per app requirement #19.
router.get('/', async (req, res) => {
  const currency = (req.query.currency || '').toUpperCase();
  const apiKey = process.env.ECONOMIC_EVENTS_API_KEY;
  const baseUrl = process.env.ECONOMIC_EVENTS_PROVIDER_BASE_URL;

  if (!apiKey || !baseUrl) {
    return res.json({ events: [], available: false, reason: 'No economic events provider configured' });
  }

  try {
    const response = await axios.get(baseUrl, {
      params: { access_key: apiKey, currency },
      timeout: 8000,
    });
    const events = (response.data.events || []).map((e) => ({
      currency: e.currency,
      title: e.title || e.event,
      dateTime: e.date || e.datetime,
      importance: e.importance || 'unknown',
      verified: true,
    }));
    res.json({ events, available: true });
  } catch (err) {
    res.status(502).json({ events: [], available: false, error: err.message });
  }
});

module.exports = router;
