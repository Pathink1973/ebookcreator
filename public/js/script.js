document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('ebookForm');
    const imageUrl = document.getElementById('imageUrl');
    const imagePreview = document.getElementById('imagePreview');
    const fetchPreviewBtn = document.getElementById('fetchPreview');
    const previewContainer = document.getElementById('preview');
    const loading = document.getElementById('loading');

    // Form submission
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        loading.style.display = 'block';

        try {
            const formData = {
                tema: document.getElementById('tema').value,
                author: document.getElementById('author').value,
                wikiUrl: document.getElementById('wikiUrl').value,
                imageUrl: document.getElementById('imageUrl').value,
                options: {
                    template: document.getElementById('template').value,
                    includeToc: document.getElementById('includeToc').checked,
                    includeImages: document.getElementById('includeImages').checked,
                    includeReferences: document.getElementById('includeReferences').checked
                }
            };

            console.log('Sending request with data:', formData);

            const response = await fetch('/generate-ebook', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            document.getElementById('result').innerHTML = `
                <div class="success-message">
                    <p>E-book generated successfully!</p>
                    <button id="generatePDF" class="download-btn">Generate PDF</button>
                </div>
            `;

            document.getElementById('generatePDF').addEventListener('click', async () => {
                const title = document.getElementById('title').value || 'Untitled';
                const author = document.getElementById('author').value;
                const content = document.getElementById('content').value;
                const template = document.getElementById('template').value;
                const includeToc = document.getElementById('includeToc').checked;
                const includeReferences = document.getElementById('includeReferences').checked;
                const imageUrl = document.getElementById('imageUrl').value;

                // Create a new window for the PDF
                const printWindow = window.open('', '_blank');
                
                // Generate the HTML content
                const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                        <head>
                            <meta charset="UTF-8">
                            <title>${title}</title>
                            <style>
                                @media print {
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
                            <script>
                                window.onload = () => {
                                    window.print();
                                    setTimeout(() => window.close(), 1000);
                                };
                            </script>
                        </body>
                    </html>
                `;

                // Write the content to the new window
                printWindow.document.write(htmlContent);
                printWindow.document.close();
            });
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('result').innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        } finally {
            loading.style.display = 'none';
        }
    });
});
