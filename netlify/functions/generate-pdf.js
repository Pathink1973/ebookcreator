const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

exports.handler = async (event, context) => {
  console.log('PDF Generation started');
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let browser = null;
  try {
    console.log('Parsing request body');
    const { content, title } = JSON.parse(event.body);
    
    console.log('Launching browser');
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    console.log('Creating new page');
    const page = await browser.newPage();
    
    console.log('Setting content');
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 40px; 
              line-height: 1.6;
            }
            h1 { 
              color: #333;
              font-size: 24px;
              margin-bottom: 20px;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            .content { 
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="content">${content}</div>
        </body>
      </html>
    `);

    console.log('Generating PDF');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    console.log('PDF generated successfully');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="' + encodeURIComponent(title) + '.pdf"'
      },
      body: pdf.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate PDF',
        details: error.message 
      })
    };
  } finally {
    if (browser !== null) {
      console.log('Closing browser');
      await browser.close();
    }
  }
};
