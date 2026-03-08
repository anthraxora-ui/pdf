let chromium;
try {
  chromium = require('@sparticuz/chromium');
} catch (error) {
  console.log("Running on Railway, skipping Vercel chromium package");
}const puppeteer = require('puppeteer-core');

// Increase memory limit for Vercel
chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let browser = null;
  try {
    // 1. Launch Browser
    let launchOptions = {};
    
    if (process.env.CHROME_PATH) {
      // Railway / Docker environment
      launchOptions = {
        executablePath: process.env.CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      };
    } else {
      // Vercel / AWS Lambda environment
      launchOptions = {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      };
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    // 2. Parse Request Body
    const { html, css, options, headerTemplate, footerTemplate } = req.body;

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
      displayHeaderFooter: true,
      headerTemplate: headerTemplate || `
        <div style="font-size: 12px; width: 100%; text-align: center; color: #333; padding-bottom: 10px; border-bottom: 1px solid #ddd; margin: 0 20px;">
          <span style="font-weight: bold;">MathPro</span> - Generated Document
        </div>
      `,
      footerTemplate: footerTemplate || `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #777; padding-top: 10px; border-top: 1px solid #ddd; margin: 0 20px;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
      margin: {
        top: options?.marginTop || '40mm',
        right: options?.marginRight || '20mm',
        bottom: options?.marginBottom || '40mm',
        left: options?.marginLeft || '20mm',
      },
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
