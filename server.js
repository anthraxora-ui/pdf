const express = require('express');
const cors = require('cors');
const app = express();

// Allow the frontend to talk to this server
app.use(cors());
// Allow large images to be sent
app.use(express.json({ limit: '50mb' }));

// ---------------------------------------------------------
// 1. PDF GENERATOR ROUTE (Already existed)
// ---------------------------------------------------------
app.post('/api/generate', async (req, res) => {
  // We use the existing logic from api/index.js
  const pdfHandler = require('./api/index.js');
  try {
    await pdfHandler(req, res);
  } catch (error) {
    console.error("PDF Error:", error);
    res.status(500).json({ error: error.message });
  }
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
