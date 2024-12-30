const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const server = require('http').createServer(app);

// Configure server timeouts and limits
server.timeout = 300000; // 5 minutes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Set up directories
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

// Function to get Wikipedia content
async function getWikipediaContent(url) {
    try {
        const response = await axios.get(url, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        let $ = cheerio.load(response.data);
        
        // Remove unwanted elements
        $('.mw-editsection, #mw-navigation, #footer, .navbox, .noprint, .mw-empty-elt, .mw-references-wrap, .reference, .mbox-small, #coordinates, #toc').remove();
        
        // Process images
        $('img').each((i, img) => {
            const src = $(img).attr('src');
            if (src) {
                let newSrc = src;
                if (src.startsWith('//')) {
                    newSrc = 'https:' + src;
                } else if (src.startsWith('/')) {
                    newSrc = 'https://pt.wikipedia.org' + src;
                }
                
                // Fix thumbnail URLs
                if (newSrc.includes('/thumb/')) {
                    newSrc = newSrc.split('/thumb/').join('/');
                    newSrc = newSrc.replace(/\/\d+px-[^\/]+$/, '');
                }
                
                $(img).attr('src', newSrc);
                $(img).attr('loading', 'lazy');
                $(img).removeAttr('srcset');
                $(img).removeAttr('width');
                $(img).removeAttr('height');
            }
        });

        // Process links
        $('a').each((i, link) => {
            const href = $(link).attr('href');
            if (href && href.startsWith('/wiki/')) {
                $(link).attr('href', 'https://pt.wikipedia.org' + href);
            }
            $(link).attr('target', '_blank');
        });

        // Get the main content
        const content = $('#mw-content-text').html();
        const title = $('#firstHeading').text();
        
        return { content, title };
    } catch (error) {
        console.error('Erro ao buscar conteúdo da Wikipedia:', error);
        throw new Error('Falha ao buscar conteúdo da Wikipedia');
    }
}

// Function to generate PDF template
async function generateTemplate(tema, author, wikiContent, imageUrl) {
    const style = `
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Open+Sans:wght@400;600&display=swap');
        
        body {
            font-family: 'Open Sans', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            font-size: 11pt;
        }
        
        .cover {
            min-height: 100vh;
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: linear-gradient(135deg, #0D46E2 0%, #0D46E2 100%);
            color: white;
            padding: 0;
            margin: 0;
            page-break-after: always;
        }
        
        .cover img {
            max-width: 70%;
            max-height: 50vh;
            object-fit: cover;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            margin-bottom: 2rem;
        }
        
        .cover h1 {
            font-family: 'Merriweather', serif;
            font-size: 32pt;
            margin: 1rem 0;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .cover .author {
            font-size: 14pt;
            margin-top: 1rem;
            opacity: 0.9;
        }
        
        .content {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: white;
        }
        
        .content h1, .content h2, .content h3 {
            font-family: 'Merriweather', serif;
            color: #007AFE;
            margin-top: 2rem;
            line-height: 1.3;
        }
        
        .content h1 {
            font-size: 24pt;
            border-bottom: 2px solid #007AFE;
            padding-bottom: 0.5rem;
        }
        
        .content h2 {
            font-size: 20pt;
            color: #333;
        }
        
        .content h3 {
            font-size: 16pt;
            color: #444;
        }
        
        .content p {
            margin: 1rem 0;
            text-align: justify;
            hyphens: auto;
            line-height: 1.8;
        }
        
        .content img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 2rem auto;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .content a {
            color: #007AFE;
            text-decoration: none;
            transition: all 0.3s ease;
        }
        
        .content a:hover {
            color: #0056b3;
            text-decoration: underline;
        }

        .content ul, .content ol {
            margin: 1rem 0;
            padding-left: 2rem;
        }

        .content li {
            margin: 0.5rem 0;
            line-height: 1.6;
        }

        .content blockquote {
            margin: 2rem 0;
            padding: 1rem 2rem;
            border-left: 4px solid #007AFE;
            background: #f8f9fa;
            font-style: italic;
        }
        
        @page {
            margin: 2cm;
            size: A4;
            @bottom-center {
                content: counter(page);
            }
        }
        
        @media print {
            body {
                counter-reset: page;
            }
            
            .content {
                max-width: none;
                padding: 0;
            }

            .content h1, .content h2, .content h3 {
                color: #007AFE !important;
            }

            .content h1 {
                border-bottom-color: #007AFE !important;
            }

            .content a {
                color: #007AFE !important;
            }

            .content blockquote {
                border-left-color: #007AFE !important;
            }

            .page-number::after {
                counter-increment: page;
                content: counter(page);
            }
        }
    `;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>${style}</style>
        </head>
        <body>
            <div class="cover">
                ${imageUrl ? `<img src="${imageUrl}" alt="Cover">` : ''}
                <h1>${tema}</h1>
                <div class="author">por ${author}</div>
            </div>
            <div class="content">
                ${wikiContent.content}
            </div>
            <div class="page-number"></div>
        </body>
        </html>
    `;
}

app.post('/generate-ebook', async (req, res) => {
    let browser = null;
    try {
        const { tema, author, wikiUrl, imageUrl } = req.body;

        if (!tema || !author || !wikiUrl) {
            return res.status(400).json({
                success: false,
                error: 'Por favor, preencha todos os campos obrigatórios'
            });
        }

        if (!wikiUrl.includes('wikipedia.org')) {
            return res.status(400).json({
                success: false,
                error: 'Por favor, forneça um URL válido da Wikipedia'
            });
        }

        // Fetch Wikipedia content
        const wikiContent = await getWikipediaContent(wikiUrl);
        
        // Generate HTML template
        const htmlTemplate = await generateTemplate(tema, author, wikiContent, imageUrl);

        // Launch browser with optimized settings
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--font-render-hinting=none'
            ]
        });

        const page = await browser.newPage();
        
        // Set viewport for A4 size
        await page.setViewport({
            width: 794, // A4 width at 96 DPI
            height: 1123, // A4 height at 96 DPI
            deviceScaleFactor: 2
        });

        // Wait for content to load
        await page.setContent(htmlTemplate, { 
            waitUntil: ['load', 'networkidle0'],
            timeout: 60000
        });

        // Generate PDF with page numbers in footer
        const date = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const sanitizedTema = tema.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
        const sanitizedAuthor = author.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
        const filename = `${sanitizedTema}_${sanitizedAuthor}_${wikiContent.title}_${date}.pdf`;
        const pdfPath = path.join(downloadsDir, filename);

        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '1cm',
                right: '1cm',
                bottom: '2cm',
                left: '1cm'
            },
            displayHeaderFooter: true,
            footerTemplate: `
                <div style="width: 100%; font-size: 10px; text-align: center; color: #666; padding: 10px 0;">
                    <span class="pageNumber"></span>
                </div>
            `,
            headerTemplate: ' ',
            preferCSSPageSize: true
        });

        res.json({
            success: true,
            downloadLink: `/downloads/${filename}`
        });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({
            success: false,
            error: 'Ocorreu um erro ao gerar o ebook. Por favor, tente novamente.'
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

app.use('/downloads', express.static(downloadsDir));

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
