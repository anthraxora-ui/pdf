const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

// Increase memory limit for Vercel
chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let browser = null;
  try {
    // 1. Launch Browser
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // 2. Parse Request Body
    const { html, css, options } = req.body;

    if (!html) {
      throw new Error('Missing HTML content');
    }

    // 3. Set Content
    await page.setContent(html, {
      waitUntil: 'networkidle0', // Wait for external resources (fonts, images)
      timeout: 30000,
    });

    // 4. Inject CSS (optional)
    if (css) {
      await page.addStyleTag({ content: css });
    }

    // 5. Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: options?.marginTop || '0mm',
        right: options?.marginRight || '0mm',
        bottom: options?.marginBottom || '0mm',
        left: options?.marginLeft || '0mm',
      },
      displayHeaderFooter: options?.displayHeaderFooter || false,
    });

    // 6. Send Response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${options?.filename || 'document.pdf'}"`);
    res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF', 
      details: error.message 
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
