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
            const response = await fetch('/generate-ebook', {
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

            // Get the filename from the Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
            const filename = filenameMatch ? filenameMatch[1] : `${formData.tema.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;

            // Get the PDF blob directly
            const pdfBlob = await response.blob();
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
