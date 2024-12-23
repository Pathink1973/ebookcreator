const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const app = express();

// Serve static files from the public directory
app.use(express.static('public'));

// Handle JSON payloads
app.use(express.json({ limit: '50mb' }));

// Fetch Wikipedia content
app.post('/api/fetch-content', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url.includes('wikipedia.org')) {
            return res.status(400).json({ error: 'Only Wikipedia URLs are supported' });
        }

        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        
        // Remove unwanted elements
        $('.mw-editsection').remove();
        $('.reference').remove();
        $('#mw-navigation').remove();
        $('#footer').remove();
        
        const title = $('#firstHeading').text();
        const content = $('#mw-content-text').html();

        res.json({ title, content });
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});

// Generate PDF
app.post('/api/generate-pdf', async (req, res) => {
    let browser = null;
    try {
        const { content, title, author, template, includeToc, includeImages, includeReferences, imageUrl } = req.body;
        
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox']
        });
        const page = await browser.newPage();
        
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
                            color: #333;
                        }
                        .cover {
                            text-align: center;
                            margin-bottom: 40px;
                        }
                        .cover img {
                            max-width: 80%;
                            margin: 20px auto;
                        }
                        .cover h1 {
                            font-size: 28px;
                            margin: 20px 0;
                        }
                        .cover .author {
                            font-size: 18px;
                            color: #666;
                        }
                        h1 { 
                            color: #333;
                            font-size: 24px;
                            margin-bottom: 20px;
                        }
                        h2 {
                            color: #444;
                            font-size: 20px;
                            margin: 15px 0;
                        }
                        img {
                            max-width: 100%;
                            height: auto;
                        }
                        .content { 
                            font-size: 14px;
                        }
                        .toc {
                            margin: 20px 0;
                            padding: 20px;
                            background: #f5f5f5;
                            border-radius: 5px;
                        }
                        .toc h2 {
                            margin-top: 0;
                        }
                        .references {
                            margin-top: 40px;
                            padding-top: 20px;
                            border-top: 1px solid #ddd;
                        }
                        ${template === 'modern' ? `
                            body { font-family: 'Helvetica', sans-serif; }
                            h1, h2 { color: #2c3e50; }
                        ` : template === 'academic' ? `
                            body { font-family: 'Times New Roman', serif; }
                            .content { font-size: 12pt; }
                        ` : ''}
                    </style>
                </head>
                <body>
                    <div class="cover">
                        ${imageUrl ? `<img src="${imageUrl}" alt="Cover Image">` : ''}
                        <h1>${title}</h1>
                        ${author ? `<div class="author">By ${author}</div>` : ''}
                    </div>
                    
                    ${includeToc ? `
                        <div class="toc">
                            <h2>Table of Contents</h2>
                            <div id="toc-content"></div>
                        </div>
                    ` : ''}
                    
                    <div class="content">
                        ${content}
                    </div>
                    
                    ${includeReferences ? `
                        <div class="references">
                            <h2>References</h2>
                            <div id="references-content"></div>
                        </div>
                    ` : ''}
                </body>
            </html>
        `);

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="' + encodeURIComponent(title) + '.pdf"'
        });
        res.send(pdf);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
