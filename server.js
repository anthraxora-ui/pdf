const express = require('express');
const handler = require('./api/index');
const app = express();
const port = process.env.PORT || 3000;

// Increase payload limit for large HTML/images
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/', (req, res) => {
  res.send('MathPro PDF Service is running');
});

// Route to the Vercel handler
app.all('/api/generate', (req, res) => {
  return handler(req, res);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
