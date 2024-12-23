import chromium from 'chrome-aws-lambda';
import { getTemplate } from '../../server/templates.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { tema, author, wikiUrl, imageUrl, options } = JSON.parse(event.body);
    
    // Fetch Wikipedia content
    const response = await axios.get(wikiUrl);
    const $ = cheerio.load(response.data);
    
    // Process content similar to your server.js
    const content = $('#mw-content-text').html();
    
    // Generate PDF using Puppeteer with chrome-aws-lambda
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
    });
    
    const page = await browser.newPage();
    
    // Use your template
    const template = getTemplate(options.template || 'modern');
    const htmlContent = template({
      title: tema,
      author: author,
      content: content,
      coverImage: imageUrl
    });
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    });
    
    await browser.close();
    
    // Return PDF as base64
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
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
