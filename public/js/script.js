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
                    <a href="${result.downloadLink}" class="download-btn" target="_blank">
                        Download E-book
                    </a>
                </div>
            `;
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
