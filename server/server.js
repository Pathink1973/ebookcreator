const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const mime = require('mime-types');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up directories
const publicDir = path.join(__dirname, '..', 'public');
const downloadsDir = path.join(__dirname, '..', 'downloads');

// Ensure downloads directory exists
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
}

// Function to fix Wikipedia image URLs
const fixWikipediaImageUrls = ($) => {
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
    return $;
};

// Function to preserve Wikipedia links
const preserveWikiLinks = ($) => {
    $('a').each((i, link) => {
        const href = $(link).attr('href');
        if (href) {
            // Convert relative Wikipedia links to absolute
            if (href.startsWith('/wiki/')) {
                $(link).attr('href', 'https://pt.wikipedia.org' + href);
            }
        }
    });
    return $;
};

// Function to wait for images to load
const waitForImages = async (page) => {
    await page.evaluate(async () => {
        const selectors = Array.from(document.getElementsByTagName('img'));
        await Promise.all(selectors.map((img) => {
            if (img.complete) return;
            return new Promise((resolve) => {
                img.addEventListener('load', resolve);
                img.addEventListener('error', resolve);
            });
        }));
    });
};

// API endpoint for generating ebook
app.post('/generate-ebook', async (req, res) => {
    let browser = null;
    try {
        const { tema, author, wikiUrl, imageUrl, options } = req.body;
        console.log('Received request:', { tema, author, wikiUrl, imageUrl, options });

        // Fetch Wikipedia content
        const response = await axios.get(wikiUrl);
        const $ = cheerio.load(response.data);

        // Clean up content and remove links
        $('#mw-navigation').remove();
        $('#footer').remove();
        $('.mw-jump-link').remove();
        $('.reference').remove();
        $('.mw-editsection').remove();

        // Remove all hyperlinks but keep their text
        $('a').each((i, link) => {
            $(link).replaceWith($(link).text());
        });

        // Fix image URLs
        fixWikipediaImageUrls($);

        // Get main content
        const content = $('#content').html();

        // Function to get template based on selected style
        const getTemplate = (style, tema, author, content, imageUrl) => {
            const commonLinkStyles = `
                a {
                    transition: all 0.2s ease;
                }
                a:hover {
                    opacity: 0.8;
                }
            `;

            switch (style) {
                case 'modern':
                    return `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <title>${tema}</title>
                            <style>
                                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                                
                                :root {
                                    --primary-color: #14A1D9;
                                    --text-color: #2D3748;
                                    --background: #FFFFFF;
                                }

                                body {
                                    font-family: 'Inter', sans-serif;
                                    line-height: 1.8;
                                    margin: 0;
                                    padding: 0;
                                    color: var(--text-color);
                                    background: var(--background);
                                }

                                .cover-page {
                                    min-height: 100vh;
                                    display: grid;
                                    grid-template-rows: 1fr auto 1fr;
                                    padding: 60px;
                                    background: white;
                                    position: relative;
                                    page-break-after: always;
                                }

                                .cover-content {
                                    display: flex;
                                    flex-direction: column;
                                    gap: 40px;
                                    max-width: 800px;
                                    margin: 0 auto;
                                    width: 100%;
                                }

                                .cover-image {
                                    width: 100%;
                                    height: auto;
                                    aspect-ratio: 16/9;
                                    object-fit: cover;
                                    margin-bottom: 60px;
                                }

                                .cover-title-section {
                                    display: flex;
                                    flex-direction: column;
                                    gap: 24px;
                                }

                                .cover-page h1 {
                                    font-size: 48px;
                                    font-weight: 700;
                                    line-height: 1.2;
                                    margin: 0;
                                    color: #000;
                                    letter-spacing: -0.02em;
                                }

                                .cover-page .author {
                                    font-size: 18px;
                                    font-weight: 400;
                                    color: #666;
                                    letter-spacing: 0.02em;
                                    text-transform: uppercase;
                                }

                                .cover-line {
                                    width: 40px;
                                    height: 3px;
                                    background: var(--primary-color);
                                    margin: 40px 0;
                                }

                                .content-page {
                                    background: white;
                                    padding: 60px 40px;
                                }

                                .content {
                                    max-width: 800px;
                                    margin: 0 auto;
                                }

                                h1, h2, h3, h4 {
                                    color: #1A202C;
                                    font-weight: 600;
                                    margin-top: 1.5em;
                                }

                                h2 {
                                    font-size: 28px;
                                    border-bottom: 2px solid #E2E8F0;
                                    padding-bottom: 10px;
                                    color: var(--primary-color);
                                }

                                h3 {
                                    font-size: 22px;
                                    color: #2D3748;
                                }

                                p {
                                    margin: 1.2em 0;
                                    font-size: 16px;
                                    color: #4A5568;
                                }

                                img {
                                    max-width: 100%;
                                    height: auto;
                                    border-radius: 12px;
                                    margin: 30px 0;
                                    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
                                }

                                ul, ol {
                                    padding-left: 20px;
                                    color: #4A5568;
                                }

                                li {
                                    margin: 8px 0;
                                }

                                blockquote {
                                    margin: 30px 0;
                                    padding: 20px 30px;
                                    border-left: 4px solid var(--gradient-start);
                                    background: linear-gradient(to right, #F7FAFC, white);
                                    font-style: italic;
                                    border-radius: 0 8px 8px 0;
                                }

                                table {
                                    width: 100%;
                                    border-collapse: collapse;
                                    margin: 30px 0;
                                    background: white;
                                    border-radius: 8px;
                                    overflow: hidden;
                                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                                }

                                th, td {
                                    padding: 15px;
                                    border: 1px solid #E2E8F0;
                                }

                                th {
                                    background: #F7FAFC;
                                    font-weight: 600;
                                    text-transform: uppercase;
                                    font-size: 14px;
                                    letter-spacing: 0.5px;
                                    color: var(--primary-color);
                                }

                                tr:nth-child(even) {
                                    background: #F7FAFC;
                                }

                                @media print {
                                    body {
                                        background: white;
                                    }
                                    .content-page {
                                        box-shadow: none;
                                    }
                                }
                            </style>
                        </head>
                        <body>
                            <div class="cover-page">
                                ${imageUrl ? `<img src="${imageUrl}" alt="Capa" class="cover-image">` : ''}
                                <div class="cover-content">
                                    <div class="cover-title-section">
                                        <h1>${tema}</h1>
                                        <div class="author">por ${author}</div>
                                    </div>
                                    <div class="cover-line"></div>
                                </div>
                            </div>
                            <div class="content-page">
                                <div class="content">
                                    ${content}
                                </div>
                            </div>
                        </body>
                        </html>
                    `;
                case 'classic':
                    return `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <title>${tema}</title>
                            <style>
                                @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap');
                                
                                body {
                                    font-family: 'Crimson Pro', 'Times New Roman', serif;
                                    line-height: 1.8;
                                    margin: 0;
                                    padding: 40px;
                                    color: #2F1810;
                                    background: #FDF8F5;
                                }

                                .book-cover {
                                    text-align: center;
                                    margin-bottom: 60px;
                                    padding: 60px 40px;
                                    border: double 6px #8B4513;
                                    background: #FFF9F5;
                                    page-break-after: always;
                                }

                                .cover-image {
                                    max-width: 400px;
                                    height: auto;
                                    margin: 20px auto 40px;
                                    box-shadow: 0 4px 8px rgba(139, 69, 19, 0.2);
                                }

                                h1 {
                                    font-size: 36px;
                                    text-align: center;
                                    color: #5C2810;
                                    margin: 20px 0;
                                    font-weight: 600;
                                    letter-spacing: 1px;
                                }

                                .author {
                                    text-align: center;
                                    font-style: italic;
                                    font-size: 20px;
                                    color: #8B4513;
                                    margin: 20px 0;
                                }

                                .content {
                                    max-width: 800px;
                                    margin: 0 auto;
                                    padding: 20px;
                                    background: #FFF9F5;
                                    border: 1px solid #DEC3B0;
                                }

                                h2 {
                                    color: #5C2810;
                                    font-size: 28px;
                                    margin-top: 40px;
                                    padding-bottom: 10px;
                                    border-bottom: 2px solid #DEC3B0;
                                    font-weight: 600;
                                }

                                h3 {
                                    color: #8B4513;
                                    font-size: 24px;
                                    margin-top: 30px;
                                }

                                p {
                                    margin: 1.2em 0;
                                    font-size: 18px;
                                    line-height: 1.8;
                                    text-align: justify;
                                }

                                img {
                                    max-width: 100%;
                                    height: auto;
                                    margin: 20px auto;
                                    display: block;
                                    border: 1px solid #DEC3B0;
                                    padding: 10px;
                                    background: white;
                                }

                                blockquote {
                                    margin: 30px 60px;
                                    padding: 20px;
                                    font-style: italic;
                                    border-left: 3px solid #8B4513;
                                    background: #FFF5EB;
                                }

                                table {
                                    width: 100%;
                                    border-collapse: collapse;
                                    margin: 30px 0;
                                    background: white;
                                }

                                th, td {
                                    padding: 15px;
                                    border: 1px solid #DEC3B0;
                                    text-align: left;
                                }

                                th {
                                    background: #FFF5EB;
                                    color: #5C2810;
                                    font-weight: 600;
                                }

                                ul, ol {
                                    padding-left: 30px;
                                }

                                li {
                                    margin: 10px 0;
                                    line-height: 1.6;
                                }

                                /* Decorative elements */
                                h2::before, h2::after {
                                    content: "❧";
                                    color: #8B4513;
                                    margin: 0 10px;
                                    font-size: 24px;
                                }

                                .book-cover::before {
                                    content: "✦";
                                    display: block;
                                    text-align: center;
                                    color: #8B4513;
                                    font-size: 24px;
                                    margin-bottom: 20px;
                                }

                                @media print {
                                    body {
                                        background: white;
                                    }
                                    .content {
                                        border: none;
                                    }
                                }
                            </style>
                        </head>
                        <body>
                            <div class="book-cover">
                                ${imageUrl ? `<img src="${imageUrl}" alt="Capa" class="cover-image">` : ''}
                                <h1>${tema}</h1>
                                <div class="author">por ${author}</div>
                            </div>
                            <div class="content">
                                ${content}
                            </div>
                        </body>
                        </html>
                    `;
                case 'academic':
                    return `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <title>${tema}</title>
                            <style>
                                @import url('https://fonts.googleapis.com/css2?family=Source+Serif+Pro:ital,wght@0,400;0,600;0,700;1,400&family=Source+Sans+Pro:wght@400;600&display=swap');
                                
                                :root {
                                    --primary-color: #14253D;
                                    --secondary-color: #465B7A;
                                    --accent-color: #1A365D;
                                    --light-gray: #F0F4F8;
                                }

                                body {
                                    font-family: 'Source Serif Pro', serif;
                                    line-height: 1.8;
                                    margin: 0;
                                    padding: 0;
                                    color: #1A1A1A;
                                    background: white;
                                }

                                .academic-cover {
                                    height: 100vh;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    text-align: center;
                                    padding: 60px;
                                    background: var(--light-gray);
                                    page-break-after: always;
                                }

                                .university-logo {
                                    width: 100%;
                                    max-width: 300px;
                                    height: auto;
                                    margin-bottom: 60px;
                                }

                                .cover-title {
                                    font-size: 32px;
                                    font-weight: 700;
                                    text-transform: uppercase;
                                    letter-spacing: 2px;
                                    color: var(--primary-color);
                                    margin: 0;
                                    padding: 30px 0;
                                    max-width: 800px;
                                    line-height: 1.4;
                                    border-top: 3px solid var(--primary-color);
                                    border-bottom: 3px solid var(--primary-color);
                                }

                                .cover-author {
                                    font-family: 'Source Sans Pro', sans-serif;
                                    font-size: 20px;
                                    margin-top: 40px;
                                    color: var(--secondary-color);
                                }

                                .cover-date {
                                    font-family: 'Source Sans Pro', sans-serif;
                                    font-size: 18px;
                                    margin-top: 20px;
                                    color: var(--secondary-color);
                                }

                                .content-wrapper {
                                    max-width: 800px;
                                    margin: 0 auto;
                                    padding: 60px 40px;
                                }

                                h1, h2, h3, h4 {
                                    font-family: 'Source Sans Pro', sans-serif;
                                    color: var(--primary-color);
                                    line-height: 1.4;
                                    margin-top: 2em;
                                }

                                h1 {
                                    font-size: 28px;
                                    text-transform: uppercase;
                                    letter-spacing: 1px;
                                }

                                h2 {
                                    font-size: 24px;
                                    padding-bottom: 10px;
                                    border-bottom: 2px solid var(--light-gray);
                                }

                                h3 {
                                    font-size: 20px;
                                    color: var(--secondary-color);
                                }

                                p {
                                    margin: 1.5em 0;
                                    font-size: 16px;
                                    line-height: 1.8;
                                    text-align: justify;
                                }

                                img {
                                    max-width: 100%;
                                    height: auto;
                                    margin: 30px auto;
                                    display: block;
                                    border: 1px solid var(--light-gray);
                                }

                                .figure {
                                    text-align: center;
                                    margin: 30px 0;
                                }

                                .figure img {
                                    margin-bottom: 10px;
                                }

                                .figure-caption {
                                    font-family: 'Source Sans Pro', sans-serif;
                                    font-size: 14px;
                                    color: var(--secondary-color);
                                    font-style: italic;
                                }

                                blockquote {
                                    margin: 2em 0;
                                    padding: 20px 30px;
                                    border-left: 4px solid var(--accent-color);
                                    background: var(--light-gray);
                                    font-style: italic;
                                }

                                table {
                                    width: 100%;
                                    border-collapse: collapse;
                                    margin: 2em 0;
                                    font-family: 'Source Sans Pro', sans-serif;
                                }

                                th, td {
                                    padding: 12px 15px;
                                    border: 1px solid var(--light-gray);
                                }

                                th {
                                    background: var(--light-gray);
                                    font-weight: 600;
                                    color: var(--primary-color);
                                }

                                tr:nth-child(even) {
                                    background: #FAFBFC;
                                }

                                ul, ol {
                                    padding-left: 20px;
                                    margin: 1.5em 0;
                                }

                                li {
                                    margin: 0.5em 0;
                                    line-height: 1.6;
                                }

                                .footnote {
                                    font-size: 14px;
                                    color: var(--secondary-color);
                                    margin-top: 2em;
                                    padding-top: 1em;
                                    border-top: 1px solid var(--light-gray);
                                }

                                @media print {
                                    .academic-cover {
                                        background: white;
                                    }
                                    @page {
                                        margin: 2.5cm;
                                    }
                                }
                            </style>
                        </head>
                        <body>
                            <div class="academic-cover">
                                ${imageUrl ? `<img src="${imageUrl}" alt="Logo" class="university-logo">` : ''}
                                <h1 class="cover-title">${tema}</h1>
                                <div class="cover-author">por ${author}</div>
                                <div class="cover-date">${new Date().toLocaleDateString('pt-BR', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric'
                                })}</div>
                            </div>
                            <div class="content-wrapper">
                                ${content}
                            </div>
                        </body>
                        </html>
                    `;
            }
        };

        // Get the template based on the selected style
        const htmlTemplate = getTemplate(options.template || 'modern', tema, author, content, imageUrl);

        // Create PDF
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1024, height: 768 });

        // Set content and wait for all resources
        await page.setContent(htmlTemplate, { 
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: 30000
        });

        // Make sure links are preserved in the PDF
        await page.evaluate(() => {
            const style = document.createElement('style');
            style.textContent = `
                a[href] {
                    color: inherit !important;
                    text-decoration: none !important;
                }
            `;
            document.head.appendChild(style);
        });

        await waitForImages(page);

        // Generate PDF with proper settings for link preservation
        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: { top: '1cm', right: '2cm', bottom: '2cm', left: '2cm' },
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: `
                <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
                    Página <span class="pageNumber"></span> de <span class="totalPages"></span>
                </div>
            `,
            preferCSSPageSize: true
        });

        // Save PDF
        const fileName = `${tema.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`;
        const filePath = path.join(downloadsDir, fileName);
        await fs.promises.writeFile(filePath, pdfBuffer);

        console.log('PDF generated successfully:', filePath);

        res.json({
            success: true,
            downloadLink: `/downloads/${fileName}`,
            message: 'E-book gerado com sucesso!'
        });

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao gerar o PDF: ' + error.message
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// Route for downloading files
app.get('/downloads/:filename', (req, res) => {
    const filePath = path.join(downloadsDir, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
