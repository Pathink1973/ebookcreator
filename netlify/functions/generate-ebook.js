const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const axios = require('axios');
const cheerio = require('cheerio');

// Função para buscar conteúdo da Wikipedia
async function getWikipediaContent(url) {
    try {
        console.log(`Buscando conteúdo da URL: ${url}`);
        const response = await axios.get(url, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        const $ = cheerio.load(response.data);

        // Remover elementos indesejados
        $('.mw-editsection, #mw-navigation, #footer, .navbox, .noprint, .mw-empty-elt, .mw-references-wrap, .reference, .mbox-small, #coordinates, #toc').remove();

        // Processar imagens
        $('img').each((i, img) => {
            const src = $(img).attr('src');
            if (src) {
                let newSrc = src.startsWith('//') ? `https:${src}` : `https://pt.wikipedia.org${src}`;
                $(img).attr('src', newSrc);
            }
        });

        const content = $('#mw-content-text').html();
        const title = $('#firstHeading').text();

        if (!content || !title) {
            throw new Error('Conteúdo ou título da página não encontrados.');
        }

        console.log('Conteúdo da Wikipedia obtido com sucesso.');
        return { content, title };
    } catch (error) {
        console.error('Erro ao buscar conteúdo da Wikipedia:', error.message);
        throw new Error('Falha ao buscar conteúdo da Wikipedia');
    }
}

exports.handler = async (event) => {
    let browser = null;

    try {
        console.log('Início do processamento do PDF.');

        const { tema, author, wikiUrl, imageUrl } = JSON.parse(event.body);

        // Validar parâmetros
        if (!tema || !author || !wikiUrl) {
            console.error('Parâmetros obrigatórios ausentes.');
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    error: 'Por favor, preencha todos os campos obrigatórios (tema, author e wikiUrl).',
                }),
            };
        }

        const wikiContent = await getWikipediaContent(wikiUrl);

        console.log('Iniciando Puppeteer...');
        browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath,
            headless: true,
            ignoreHTTPSErrors: true, // Ignorar erros HTTPS no ambiente serverless
        });
        console.log('Puppeteer iniciado com sucesso.');

        const page = await browser.newPage();
        await page.setViewport({ width: 1024, height: 768 });

        // Template HTML do PDF
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
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        text-align: center;
                        background: linear-gradient(135deg, #0D46E2, #0D46E2);
                        color: white;
                        page-break-after: always;
                    }
                    .cover img {
                        max-width: 70%;
                        border-radius: 10px;
                        margin-bottom: 20px;
                    }
                    .cover h1 {
                        font-size: 32px;
                        margin: 10px 0;
                    }
                    .content {
                        padding: 20px;
                        max-width: 800px;
                        margin: auto;
                    }
                    h1, h2, h3 {
                        color: #007AFE;
                    }
                </style>
            </head>
            <body>
                <div class="cover">
                    ${imageUrl ? `<img src="${imageUrl}" alt="Cover Image">` : ''}
                    <h1>${tema}</h1>
                    <p>Author: ${author}</p>
                </div>
                <div class="content">
                    ${wikiContent.content}
                </div>
            </body>
            </html>
        `;

        await page.setContent(template, { waitUntil: 'networkidle0' });

        console.log('Gerando PDF...');
        const pdf = await page.pdf({
            format: 'A4',
            margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' },
            printBackground: true,
        });

        await browser.close();
        console.log('PDF gerado com sucesso.');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${tema}_${author}.pdf"`,
            },
            body: pdf.toString('base64'),
            isBase64Encoded: true,
        };
    } catch (error) {
        console.error('Erro ao gerar o PDF:', error.message);

        if (browser) await browser.close();

        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: 'Erro ao gerar o PDF. Verifique os parâmetros e tente novamente.',
            }),
        };
    }
};
