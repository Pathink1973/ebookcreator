const chromium = require('chrome-aws-lambda');

exports.handler = async function (event, context) {
    let browser = null;
    try {
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Method not allowed' }),
            };
        }

        const { content, title, author, template, includeToc, includeImages, includeReferences, imageUrl } = JSON.parse(event.body);

        // Launch browser with minimal options
        browser = await chromium.puppeteer.launch({
            args: [
                ...chromium.args,
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ],
            defaultViewport: {
                width: 1200,
                height: 800
            },
            executablePath: await chromium.executablePath,
            headless: true,
            ignoreHTTPSErrors: true
        });

        const page = await browser.newPage();

        // Set content with timeout
        await Promise.race([
            page.setContent(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
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
                                page-break-after: always;
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
                                page-break-after: always;
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
                            @media print {
                                .page-break {
                                    page-break-before: always;
                                }
                            }
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
            `, { waitUntil: 'networkidle0', timeout: 25000 }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Content loading timeout')), 25000)
            )
        ]);

        // Wait for images with timeout
        await Promise.race([
            page.evaluate(() => {
                return Promise.all(
                    Array.from(document.images)
                        .filter(img => !img.complete)
                        .map(img => new Promise((resolve, reject) => {
                            img.onload = resolve;
                            img.onerror = reject;
                        }))
                );
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Image loading timeout')), 10000)
            )
        ]).catch(err => console.warn('Image loading warning:', err));

        // Generate PDF with timeout
        const pdf = await Promise.race([
            page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
                preferCSSPageSize: true,
                timeout: 30000
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('PDF generation timeout')), 30000)
            )
        ]);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.pdf"`,
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
                details: error.message,
                stack: error.stack 
            })
        };
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
};
