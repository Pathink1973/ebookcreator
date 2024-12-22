import express from 'express';
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { getTemplate } from './templates.js';
import mime from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Ensure downloads directory exists
const downloadsDir = path.join(__dirname, '../public/downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Function to fix Wikipedia image URLs
const fixWikipediaImageUrls = ($) => {
    $('img').each((i, img) => {
        const src = $(img).attr('src');
        if (src) {
            let newSrc = src;
            
            // Fix protocol-relative URLs
            if (src.startsWith('//')) {
                newSrc = 'https:' + src;
            }
            // Fix relative URLs
            else if (src.startsWith('/')) {
                newSrc = 'https://pt.wikipedia.org' + src;
            }

            // Handle thumbnail URLs
            if (newSrc.includes('/thumb/')) {
                const parts = newSrc.split('/');
                if (parts.length > 2) {
                    const lastPart = parts[parts.length - 1];
                    // If it contains dimensions, modify them
                    if (lastPart.match(/\d+px-/)) {
                        parts[parts.length - 1] = lastPart.replace(/\d+px-/, '800px-');
                    }
                    newSrc = parts.join('/');
                }
            }

            // Update the src attribute
            $(img).attr('src', newSrc);
            
            // Remove any srcset to ensure our src is used
            $(img).removeAttr('srcset');
            $(img).removeAttr('data-file-width');
            $(img).removeAttr('data-file-height');
        }
    });

    // Fix image containers
    $('.thumb').each((i, elem) => {
        const $elem = $(elem);
        const $img = $elem.find('img').first();
        const $caption = $elem.find('.thumbcaption').first();
        
        if ($img.length) {
            const $figure = $('<figure>');
            $figure.append($img.clone());
            if ($caption.length) {
                const $figcaption = $('<figcaption>').html($caption.html());
                $figure.append($figcaption);
            }
            $elem.replaceWith($figure);
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
            return new Promise((resolve, reject) => {
                img.addEventListener('load', resolve);
                img.addEventListener('error', () => resolve()); // Resolve on error too, to prevent hanging
            });
        }));
    });
};

// Function to clean HTML tags from text
const cleanHtmlTags = (text) => {
    return text.replace(/<[^>]*>/g, '');
};

// API Routes
app.post('/generate-ebook', async (req, res) => {
    try {
        const { tema, author, wikiUrl, imageUrl, options } = req.body;
        
        if (!tema || !author || !wikiUrl) {
            return res.status(400).json({ 
                error: 'Missing required fields' 
            });
        }

        const content = await fetchWikipediaContent(wikiUrl, options);
        const pdfBuffer = await generatePDF({
            ...content,
            tema,
            author,
            imageUrl
        }, {
            ...options,
            template: options.template || 'modern' // Ensure template is passed
        });

        const fileName = `${tema.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, '../public/downloads', fileName);
        
        fs.writeFileSync(filePath, pdfBuffer);
        
        res.json({ 
            downloadLink: `/downloads/${fileName}`,
            message: 'E-book generated successfully!'
        });
    } catch (error) {
        console.error('Error generating ebook:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/preview', async (req, res) => {
    try {
        const { wikiUrl } = req.body;
        const content = await fetchWikipediaContent(wikiUrl, { 
            includeImages: true,
            includeToc: true,
            includeReferences: true
        });
        res.json({ content });
    } catch (error) {
        console.error('Error generating preview:', error);
        res.status(500).json({ error: error.message });
    }
});

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Helper functions below
const fetchWikipediaContent = async (wikiUrl, options) => {
    try {
        const titleMatch = wikiUrl.match(/\/wiki\/(.*)/);
        if (!titleMatch) throw new Error('Invalid Wikipedia URL');

        const title = decodeURIComponent(titleMatch[1]);
        const apiUrl = `https://pt.wikipedia.org/w/api.php?` + new URLSearchParams({
            action: 'parse',
            page: title,
            prop: 'text|sections|displaytitle',
            format: 'json',
            formatversion: '2',
            origin: '*'
        });

        const response = await axios.get(apiUrl);

        if (!response.data || !response.data.parse || !response.data.parse.text) {
            throw new Error('Failed to fetch Wikipedia content');
        }

        const $ = cheerio.load(response.data.parse.text);

        // Remove unwanted elements
        $('.mw-editsection').remove();
        $('.reference').remove();
        $('.error').remove();
        $('.noprint').remove();
        if (!options.includeReferences) {
            $('.references').remove();
        }

        // Process images if included
        if (options.includeImages) {
            fixWikipediaImageUrls($);
        } else {
            $('img').remove();
            $('.thumb').remove();
            $('.gallery').remove();
        }

        // Clean the title
        const displayTitle = cleanHtmlTags(response.data.parse.displaytitle || title);

        // Generate table of contents if needed
        let toc = '';
        if (options.includeToc) {
            toc = generateTableOfContents($);
        }

        // Process tables
        $('.wikitable').addClass('wiki-table');

        return {
            title: displayTitle,
            content: $.html(),
            toc: toc,
            references: options.includeReferences ? $('.references').html() : ''
        };
    } catch (error) {
        console.error('Error fetching Wikipedia content:', error);
        throw error;
    }
};

const generatePDF = async (content, options) => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Set viewport to A4 size
        await page.setViewport({
            width: 794, // A4 width in pixels at 96 DPI
            height: 1123, // A4 height in pixels at 96 DPI
        });

        // Set longer timeout for content loading
        await page.setDefaultNavigationTimeout(60000);

        // Get the template HTML
        const template = getTemplate(options.template || 'modern');
        const html = template(content, options);

        // Set the content
        await page.setContent(html, {
            waitUntil: ['networkidle0', 'domcontentloaded']
        });

        // Wait for fonts to load
        await page.evaluate(() => document.fonts.ready);
        
        // Wait for images to load
        await waitForImages(page);

        // Generate PDF
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '2cm',
                bottom: '2cm',
                left: '2cm',
                right: '2cm'
            }
        });

        return pdf;
    } finally {
        await browser.close();
    }
};

const generateTableOfContents = ($) => {
    const toc = [];
    let currentLevel = 0;
    
    $('h1, h2, h3, h4, h5, h6').each((i, elem) => {
        const level = parseInt(elem.tagName[1]);
        const text = $(elem).text().trim();
        const id = `section-${i}`;
        
        $(elem).attr('id', id);
        
        toc.push({
            level,
            text,
            id
        });
    });
    
    let html = '<ul>';
    let prevLevel = 1;
    
    toc.forEach(item => {
        while (item.level > prevLevel) {
            html += '<ul>';
            prevLevel++;
        }
        while (item.level < prevLevel) {
            html += '</ul>';
            prevLevel--;
        }
        
        html += `<li><a href="#${item.id}">${item.text}</a></li>`;
    });
    
    while (prevLevel > 1) {
        html += '</ul>';
        prevLevel--;
    }
    
    html += '</ul>';
    return html;
};

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
