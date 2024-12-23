import html_to_pdf from 'html-pdf-node';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Template function
const getTemplate = ({ title, author, content, coverImage }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        h1 {
            text-align: center;
            font-size: 2.5em;
            margin-bottom: 2rem;
            border-bottom: 2px solid #3498db;
            padding-bottom: 1rem;
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
            margin-bottom: 3rem;
            color: #666;
        }
        
        .content {
            text-align: justify;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${coverImage ? `<img src="${coverImage}" alt="Cover Image" class="cover-image">` : ''}
    <div class="author">By ${author}</div>
    <div class="content">
        ${content}
    </div>
</body>
</html>
`;

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { tema, author, wikiUrl, imageUrl } = JSON.parse(event.body);
    
    // Fetch Wikipedia content
    const response = await axios.get(wikiUrl);
    const $ = cheerio.load(response.data);
    
    // Get the main content
    const content = $('#mw-content-text').html();
    
    if (!content) {
      throw new Error('Failed to extract content from Wikipedia');
    }

    // Generate HTML content
    const htmlContent = getTemplate({
      title: tema,
      author: author,
      content: content,
      coverImage: imageUrl
    });

    // Options for PDF generation
    const options = {
      format: 'A4',
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      printBackground: true,
      preferCSSPageSize: true,
      timeout: 30000,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      waitForNetworkIdle: true
    };

    // Generate PDF
    const file = { content: htmlContent };
    const pdfBuffer = await html_to_pdf.generatePdf(file, options);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdf: pdfBuffer.toString('base64')
      })
    };
    
  } catch (error) {
    console.error('Error details:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        details: error.toString(),
        stack: error.stack
      })
    };
  }
};
