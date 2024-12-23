document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const generateBtn = document.getElementById('generateBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');

    async function fetchWikipediaContent(url) {
        try {
            const response = await fetch('/.netlify/functions/fetch-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch content');
            }

            return response.json();
        } catch (error) {
            console.error('Error fetching content:', error);
            throw error;
        }
    }

    async function generatePDF(content, title) {
        try {
            const response = await fetch('/.netlify/functions/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, title })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate PDF');
            }

            // Get the PDF as a blob
            const pdfBlob = await response.blob();
            
            // Create object URL for the PDF
            const pdfUrl = URL.createObjectURL(pdfBlob);
            
            // Open PDF in new window
            window.open(pdfUrl, '_blank');
            
            // Clean up the object URL after a delay
            setTimeout(() => {
                URL.revokeObjectURL(pdfUrl);
            }, 100);

        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }

    generateBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        
        if (!url) {
            errorMessage.textContent = 'Please enter a Wikipedia URL';
            errorMessage.style.display = 'block';
            return;
        }

        if (!url.includes('wikipedia.org')) {
            errorMessage.textContent = 'Please enter a valid Wikipedia URL';
            errorMessage.style.display = 'block';
            return;
        }

        try {
            errorMessage.style.display = 'none';
            loadingSpinner.style.display = 'block';
            generateBtn.disabled = true;

            const { title, content } = await fetchWikipediaContent(url);
            await generatePDF(content, title);

        } catch (error) {
            errorMessage.textContent = error.message || 'An error occurred. Please try again.';
            errorMessage.style.display = 'block';
        } finally {
            loadingSpinner.style.display = 'none';
            generateBtn.disabled = false;
        }
    });
});
