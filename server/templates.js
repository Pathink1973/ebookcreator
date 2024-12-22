const escapeHtml = (unsafe) => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

export const getTemplate = (templateType) => {
    const templates = {
        modern: (content, options) => `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Open+Sans:wght@400;600&display=swap');
                        
                        body {
                            font-family: 'Merriweather', serif;
                            line-height: 1.8;
                            margin: 0;
                            padding: 0;
                            color: #2C3E50;
                            background-color: #ffffff;
                        }

                        .page {
                            margin: 2cm;
                            position: relative;
                        }

                        .cover-page {
                            height: 100vh;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            text-align: center;
                            page-break-after: always;
                            background-color: #f8f9fa;
                            padding: 3cm 2cm;
                        }

                        .cover-page .title {
                            font-size: 36px;
                            margin-bottom: 0.5cm;
                            color: #2C3E50;
                            font-weight: 700;
                            letter-spacing: -0.5px;
                            line-height: 1.2;
                            font-family: 'Open Sans', sans-serif;
                        }

                        .cover-page .author {
                            font-family: 'Open Sans', sans-serif;
                            font-size: 18px;
                            color: #7f8c8d;
                            margin-bottom: 2cm;
                        }

                        .cover-page .cover-image {
                            max-width: 80%;
                            max-height: 50vh;
                            object-fit: contain;
                            margin: 0 auto;
                            border-radius: 4px;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                        }

                        h1, h2, h3, h4, h5, h6 {
                            font-family: 'Open Sans', sans-serif;
                            margin-top: 2em;
                            margin-bottom: 1em;
                            color: #34495e;
                            page-break-after: avoid;
                            line-height: 1.4;
                        }

                        h1 { 
                            font-size: 28px; 
                            border-bottom: 2px solid #3498db; 
                            padding-bottom: 0.3em;
                            margin-top: 3em;
                        }
                        
                        h2 { 
                            font-size: 24px; 
                            color: #2980b9;
                            margin-top: 2.5em;
                        }
                        
                        h3 { 
                            font-size: 20px; 
                            color: #3498db;
                            margin-top: 2em;
                        }

                        p {
                            margin-bottom: 1.5em;
                            text-align: justify;
                            hyphens: auto;
                            font-size: 11pt;
                            line-height: 1.8;
                        }

                        img {
                            max-width: 100%;
                            height: auto;
                            margin: 2em auto;
                            display: block;
                            page-break-inside: avoid;
                        }

                        figure {
                            margin: 2em 0;
                            text-align: center;
                            page-break-inside: avoid;
                            background-color: #f8f9fa;
                            padding: 1em;
                            border-radius: 4px;
                        }

                        figure img {
                            max-width: 90%;
                            margin: 0 auto;
                            border-radius: 2px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }

                        figcaption {
                            font-family: 'Open Sans', sans-serif;
                            font-size: 0.9em;
                            color: #666;
                            margin-top: 1em;
                            font-style: italic;
                            line-height: 1.4;
                            padding: 0 1em;
                        }

                        .table-of-contents {
                            background-color: #f8f9fa;
                            padding: 2em;
                            margin: 2em 0;
                            border-radius: 5px;
                            font-family: 'Open Sans', sans-serif;
                            page-break-after: always;
                            border: 1px solid #e1e8ed;
                        }

                        .table-of-contents h2 {
                            color: #2C3E50;
                            border-bottom: 1px solid #bdc3c7;
                            padding-bottom: 0.5em;
                            margin-top: 0;
                        }

                        .table-of-contents ul {
                            list-style-type: none;
                            padding-left: 0;
                        }

                        .table-of-contents li {
                            margin: 0.5em 0;
                            padding-left: 1.5em;
                            position: relative;
                        }

                        .table-of-contents li:before {
                            content: "•";
                            position: absolute;
                            left: 0.5em;
                            color: #3498db;
                        }

                        .table-of-contents a {
                            color: #2980b9;
                            text-decoration: none;
                            line-height: 1.6;
                        }

                        blockquote {
                            margin: 2em 0;
                            padding: 1em 2em;
                            border-left: 4px solid #3498db;
                            background-color: #f8f9fa;
                            font-style: italic;
                            page-break-inside: avoid;
                            color: #34495e;
                        }

                        .wiki-table {
                            width: 100%;
                            margin: 2em 0;
                            border-collapse: collapse;
                            page-break-inside: avoid;
                            font-family: 'Open Sans', sans-serif;
                        }

                        .wiki-table th {
                            background-color: #34495e;
                            color: white;
                            padding: 12px;
                            text-align: left;
                            font-weight: 600;
                        }

                        .wiki-table td {
                            padding: 10px;
                            border: 1px solid #bdc3c7;
                            line-height: 1.6;
                        }

                        .wiki-table tr:nth-child(even) {
                            background-color: #f8f9fa;
                        }

                        .references {
                            margin-top: 3em;
                            padding-top: 2em;
                            border-top: 2px solid #bdc3c7;
                            font-size: 10pt;
                            font-family: 'Open Sans', sans-serif;
                        }

                        .references h2 {
                            font-size: 24px;
                            color: #2C3E50;
                            margin-top: 1em;
                        }

                        @page {
                            size: A4;
                            margin: 2cm;
                            @top-right {
                                content: counter(page);
                                font-family: 'Open Sans', sans-serif;
                                font-size: 9pt;
                                color: #95a5a6;
                            }
                        }

                        @page :first {
                            margin: 0;
                            @top-right {
                                content: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="cover-page">
                        <div class="title">${content.title}</div>
                        <div class="author">por ${content.author || 'Autor'}</div>
                        ${content.imageUrl ? `<img src="${content.imageUrl}" class="cover-image" alt="Cover">` : ''}
                    </div>
                    
                    <div class="page">
                        ${options.includeToc ? `
                            <div class="table-of-contents">
                                <h2>Índice</h2>
                                ${content.toc}
                            </div>
                        ` : ''}
                        
                        ${content.content}
                        
                        ${options.includeReferences ? `
                            <div class="references">
                                <h2>Referências</h2>
                                ${content.references || ''}
                            </div>
                        ` : ''}
                    </div>
                </body>
            </html>
        `,
        classic: (content, options) => `
            <html>
                <head>
                    <style>
                        body {
                            font-family: 'Times New Roman', serif;
                            line-height: 1.5;
                            margin: 1.5cm;
                        }
                        h1 { font-size: 28px; text-align: center; }
                    </style>
                </head>
                <body>
                    ${options.includeToc ? content.toc : ''}
                    <h1>${content.title}</h1>
                    ${content.content}
                </body>
            </html>
        `,
        academic: (content, options) => `
            <html>
                <head>
                    <style>
                        body {
                            font-family: 'Calibri', sans-serif;
                            line-height: 1.8;
                            margin: 2.5cm;
                        }
                        h1 { font-size: 24px; margin-bottom: 2cm; }
                        .references { margin-top: 2cm; }
                    </style>
                </head>
                <body>
                    ${options.includeToc ? content.toc : ''}
                    <h1>${content.title}</h1>
                    ${content.content}
                </body>
            </html>
        `
    };
    return templates[templateType] || templates.modern;
}; 