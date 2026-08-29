require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const ratesRouter = require('./routes/rates');
const eventsRouter = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Basic rate limiting to protect the FX provider quota and prevent abuse.
const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 }); // 60 req/min/IP
app.use('/api/', limiter);

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/rates', ratesRouter);
app.use('/api/events', eventsRouter);

// Centralized error handler as a safety net for unhandled errors in routes.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`Global Currency Live backend listening on port ${PORT}`);
  console.log(`FX provider: ${process.env.FX_PROVIDER || 'open_er_api (default)'}`);
});
