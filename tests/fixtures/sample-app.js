/**
 * Test Express Application
 * Simple app for testing CopilotFlow functionality
 */

const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello from test app!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.post('/data', (req, res) => {
  const { name, value } = req.body;

  if (!name || !value) {
    return res.status(400).json({ error: 'Name and value required' });
  }

  res.json({
    message: 'Data received',
    data: { name, value },
  });
});

// Error handling
app.use((err, req, res) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
