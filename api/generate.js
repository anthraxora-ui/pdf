const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');

// Configure Vercel to allow up to 4MB payloads (Vercel's max is 4.5MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

export default async function handler(req, res) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Extract the SVG string and dimensions from the frontend request
    const { svg, width = 612, height = 792 } = req.body; // Default to US Letter size (8.5x11 inches at 72dpi)

    if (!svg) {
      return res.status(400).json({ error: 'Missing "svg" in request body' });
    }

    // Create a new PDF document in memory
    const doc = new PDFDocument({
      size: [width, height],
      margin: 0
    });

    // Collect the PDF data chunks as they are generated
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    
    // Create a promise that resolves when the PDF is completely finished
    const pdfPromise = new Promise((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);
    });

    // Draw the SVG (and any base64 <image> tags inside it) onto the PDF
    SVGtoPDF(doc, svg, 0, 0, {
      width: width,
      height: height,
      preserveAspectRatio: 'xMidYMid meet'
    });

    // Finalize the PDF document
    doc.end();

    // Wait for the buffer to be fully populated
    const pdfBuffer = await pdfPromise;

    // Send the binary PDF file back to the frontend
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
}