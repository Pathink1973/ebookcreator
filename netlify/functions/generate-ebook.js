import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import axios from 'axios';
import * as cheerio from 'cheerio';

const getTemplate = ({ title, author, content, coverImage }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
        }
        img {
            max-width: 100%;
            height: auto;
        }
        .cover-image {
            max-height: 400px;
            margin: 2rem auto;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="author">By ${author}</div>
    ${coverImage ? `<img src="${coverImage}" alt="Cover" class="cover-image">` : ''}
    ${content}
</body>
</html>`;

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let browser = null;
  
  try {
    const { tema, author, wikiUrl, imageUrl } = JSON.parse(event.body);
    
    // Fetch Wikipedia content
    const response = await axios.get(wikiUrl);
    const $ = cheerio.load(response.data);
    const content = $('#mw-content-text').html();
    
    if (!content) {
      throw new Error('Failed to extract content');
    }

    // Initialize chromium
    await chromium.init();
    
    const executablePath = await chromium.executablePath();

    // Launch browser with the executable path
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless,
      defaultViewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      }
    });

    const page = await browser.newPage();
    
    await page.setContent(getTemplate({
      title: tema,
      author: author,
      content: content,
      coverImage: imageUrl
    }), {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdf: pdf.toString('base64') })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        details: error.toString(),
        stack: error.stack 
      })
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
