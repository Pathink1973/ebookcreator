document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('ebookForm');
    const loadingDiv = document.getElementById('loading');
    const previewButton = document.getElementById('fetchPreview');
    const imagePreview = document.getElementById('imagePreview');

    // Handle image preview
    document.getElementById('imageUrl').addEventListener('input', (e) => {
        const url = e.target.value;
        if (url) {
            imagePreview.innerHTML = `<img src="${url}" alt="Preview">`;
        } else {
            imagePreview.innerHTML = '';
        }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        loadingDiv.style.display = 'flex';
        
        const formData = {
            tema: document.getElementById('tema').value,
            author: document.getElementById('author').value,
            wikiUrl: document.getElementById('wikiUrl').value,
            imageUrl: document.getElementById('imageUrl').value,
            options: {
                template: document.getElementById('template').value,
                includeToc: document.getElementById('includeToc').checked,
                includeImages: document.getElementById('includeImages').checked
            }
        };

        try {
            // Determine if we're running locally or on Netlify
            const isNetlify = window.location.hostname !== 'localhost';
            const endpoint = isNetlify ? '/.netlify/functions/generate-ebook' : '/generate-ebook';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.details || 'Failed to generate PDF');
            }

            let pdfBlob;
            if (isNetlify) {
                // Handle Netlify Function response (base64 encoded PDF)
                const data = await response.json();
                if (!data.pdf) {
                    throw new Error('No PDF data received from server');
                }
                
                const binaryString = atob(data.pdf);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                pdfBlob = new Blob([bytes], { type: 'application/pdf' });
            } else {
                // Handle local development response (binary PDF)
                pdfBlob = await response.blob();
            }

            // Create download link
            const filename = `${formData.tema.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
            const downloadUrl = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

        } catch (error) {
            console.error('Error details:', error);
            alert(`Error generating PDF: ${error.message}`);
        } finally {
            loadingDiv.style.display = 'none';
        }
    });
});
