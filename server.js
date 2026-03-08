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

// ---------------------------------------------------------
// 2. GROQ / LLAMA 3.3 ROUTE
// ---------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}` // Hiding the key!
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// 3. GEMINI ROUTE
// ---------------------------------------------------------
app.post('/api/gemini', async (req, res) => {
  try {
    const model = req.body.model || "gemini-3.1-pro-preview";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    // Remove model from body before sending to Google
    const bodyData = { ...req.body };
    delete bodyData.model;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// 4. NAPKIN AI ROUTES
// ---------------------------------------------------------
// Generate Diagram
app.post('/api/napkin', async (req, res) => {
  try {
    const response = await fetch("https://api.napkin.ai/v1/visual", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${process.env.NAPKIN_API_KEY}` // Hiding the key!
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check Status
app.get('/api/napkin/status/:id', async (req, res) => {
  try {
    const response = await fetch(`https://api.napkin.ai/v1/visual/${req.params.id}/status`, {
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${process.env.NAPKIN_API_KEY}`
      }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download SVG safely
app.get('/api/napkin/download', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    const response = await fetch(targetUrl, {
      headers: {
        "Authorization": `Bearer ${process.env.NAPKIN_API_KEY}`
      }
    });
    const svgText = await response.text();
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svgText);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// START SERVER
// ---------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
