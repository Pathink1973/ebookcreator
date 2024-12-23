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
            const response = await fetch('/.netlify/functions/generate-ebook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }

            const data = await response.json();
            
            // Convert base64 to PDF and trigger download
            const pdfContent = atob(data.pdf);
            const pdfBlob = new Blob([new Uint8Array([...pdfContent].map(char => char.charCodeAt(0)))], 
                                   { type: 'application/pdf' });
            
            const downloadUrl = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${formData.tema.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

        } catch (error) {
            console.error('Error:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            loadingDiv.style.display = 'none';
        }
    });
});
