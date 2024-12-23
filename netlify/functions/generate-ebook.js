import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Template function
const getTemplate = ({ title, author, content, coverImage }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Open+Sans:wght@400;600&display=swap');
        
        body {
            font-family: 'Merriweather', serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        h1, h2, h3 {
            font-family: 'Open Sans', sans-serif;
            color: #2c3e50;
        }
        
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 2rem auto;
        }
        
        .cover-image {
            max-height: 400px;
            object-fit: contain;
        }
        
        .author {
            text-align: center;
            font-style: italic;
            margin-bottom: 2rem;
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
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let browser = null;
  
  try {
    const { tema, author, wikiUrl, imageUrl, options } = JSON.parse(event.body);
    
    // Fetch Wikipedia content
    const response = await axios.get(wikiUrl);
    const $ = cheerio.load(response.data);
    
    // Get the main content
    const content = $('#mw-content-text').html();
    
    if (!content) {
      throw new Error('Failed to extract content from Wikipedia');
    }

    // Launch browser with AWS Lambda Chrome
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true
    });

    const page = await browser.newPage();
    
    // Generate HTML content
    const htmlContent = getTemplate({
      title: tema,
      author: author,
      content: content,
      coverImage: imageUrl
    });
    
    // Set content with extended timeout
    await page.setContent(htmlContent, { 
      waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
      timeout: 30000 
    });
    
    // Generate PDF with specific settings
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      timeout: 30000
    });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdf: pdf.toString('base64')
      })
    };
    
  } catch (error) {
    console.error('Error details:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        details: error.toString()
      })
    };
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};
