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
                throw new Error('Failed to generate PDF');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
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
            errorMessage.textContent = 'An error occurred. Please try again.';
            errorMessage.style.display = 'block';
        } finally {
            loadingSpinner.style.display = 'none';
            generateBtn.disabled = false;
        }
    });
});
