const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const { html_to_text } = require('html-to-text');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { content, title } = JSON.parse(event.body);

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    
    // Set content with your template
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            .content { line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="content">${content}</div>
        </body>
      </html>
    `);

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="' + encodeURIComponent(title) + '.pdf"',
      },
      body: pdf.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate PDF', details: error.message }),
    };
  }
};
