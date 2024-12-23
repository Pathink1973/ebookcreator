document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded');
    const urlInput = document.getElementById('urlInput');
    const generateBtn = document.getElementById('generateBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');

    async function fetchWikipediaContent(url) {
        console.log('Fetching content from:', url);
        try {
            const response = await fetch('/.netlify/functions/fetch-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            console.log('Fetch response status:', response.status);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch content');
            }

            const data = await response.json();
            console.log('Content fetched successfully');
            return data;
        } catch (error) {
            console.error('Error fetching content:', error);
            throw error;
        }
    }

    async function generatePDF(content, title) {
        console.log('Generating PDF for:', title);
        try {
            const response = await fetch('/.netlify/functions/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, title })
            });

            console.log('PDF generation response status:', response.status);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate PDF');
            }

            console.log('PDF generated, getting blob');
            const pdfBlob = await response.blob();
            console.log('Got PDF blob, size:', pdfBlob.size);
            
            const pdfUrl = URL.createObjectURL(pdfBlob);
            console.log('Created object URL:', pdfUrl);
            
            console.log('Opening PDF in new window');
            window.open(pdfUrl, '_blank');
            
            setTimeout(() => {
                URL.revokeObjectURL(pdfUrl);
                console.log('Cleaned up object URL');
            }, 1000);

        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }

    if (generateBtn) {
        console.log('Generate button found');
        generateBtn.addEventListener('click', async () => {
            console.log('Generate button clicked');
            const url = urlInput.value.trim();
            
            if (!url) {
                console.log('No URL provided');
                errorMessage.textContent = 'Please enter a Wikipedia URL';
                errorMessage.style.display = 'block';
                return;
            }

            if (!url.includes('wikipedia.org')) {
                console.log('Invalid URL:', url);
                errorMessage.textContent = 'Please enter a valid Wikipedia URL';
                errorMessage.style.display = 'block';
                return;
            }

            try {
                console.log('Starting PDF generation process');
                errorMessage.style.display = 'none';
                loadingSpinner.style.display = 'block';
                generateBtn.disabled = true;

                const { title, content } = await fetchWikipediaContent(url);
                console.log('Content fetched, title:', title);
                await generatePDF(content, title);
                console.log('PDF generation complete');

            } catch (error) {
                console.error('Error in main process:', error);
                errorMessage.textContent = error.message || 'An error occurred. Please try again.';
                errorMessage.style.display = 'block';
            } finally {
                loadingSpinner.style.display = 'none';
                generateBtn.disabled = false;
            }
        });
    } else {
        console.error('Generate button not found in the DOM');
    }
});
