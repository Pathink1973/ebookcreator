const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const axios = require('axios');
const cheerio = require('cheerio');

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
                $(img).attr('src', newSrc);
            }
        });

        const content = $('#mw-content-text').html();
        const title = $('#firstHeading').text();
        
        return { content, title };
    } catch (error) {
        console.error('Erro ao buscar conteúdo da Wikipedia:', error);
        throw new Error('Falha ao buscar conteúdo da Wikipedia');
    }
}

exports.handler = async (event, context) => {
    let browser = null;
    
    try {
        const { tema, author, wikiUrl, imageUrl, includeToc, includeImages, includeReferences } = JSON.parse(event.body);

        if (!tema || !author || !wikiUrl) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    error: 'Por favor, preencha todos os campos obrigatórios'
                })
            };
        }

        const wikiContent = await getWikipediaContent(wikiUrl);

        browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: process.env.CHROME_EXECUTABLE_PATH || await chromium.executablePath,
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1024, height: 768 });

        // Generate PDF with your existing template
        const template = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
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
                        height: 100vh;
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
                </style>
            </head>
            <body>
                <div class="cover">
                    ${imageUrl ? `<img src="${imageUrl}" alt="Cover">` : ''}
                    <h1>${tema}</h1>
                    <div class="author">${author}</div>
                </div>
                <div class="content">
                    ${wikiContent.content}
                </div>
            </body>
            </html>
        `;

        await page.setContent(template, { waitUntil: 'networkidle0' });

        const pdf = await page.pdf({
            format: 'A4',
            margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' },
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: `
                <div style="font-size: 10px; text-align: center; width: 100%;">
                    <span class="pageNumber"></span> / <span class="totalPages"></span>
                </div>
            `,
            printBackground: true
        });

        await browser.close();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${tema}_${author}.pdf"`
            },
            body: pdf.toString('base64'),
            isBase64Encoded: true
        };

    } catch (error) {
        console.error('Erro:', error);
        
        if (browser) {
            await browser.close();
        }

        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: 'Ocorreu um erro ao gerar o ebook. Por favor, tente novamente.'
            })
        };
    }
};
