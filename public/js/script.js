// Progress bar function
function setProgress(percent) {
    const progressBar = document.querySelector('.progress');
    const progressText = document.querySelector('.progress-text');
    if (progressBar && progressText) {
        progressBar.style.width = percent + '%';
        progressText.textContent = Math.round(percent) + '%';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('ebookForm');
    const loadingSpinner = document.getElementById('loading');
    const resultDiv = document.getElementById('result');
    
    if (!form) {
        console.error('Form element not found');
        return;
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Reset UI
        loadingSpinner.style.display = 'block';
        
        try {
            // Get form data
            const tema = document.getElementById('tema');
            const author = document.getElementById('author');
            const wikiUrl = document.getElementById('wikiUrl');
            const imageUrl = document.getElementById('imageUrl');

            if (!tema || !author || !wikiUrl) {
                throw new Error('Required form fields are missing');
            }

            const formData = {
                tema: tema.value,
                author: author.value,
                wikiUrl: wikiUrl.value,
                imageUrl: imageUrl ? imageUrl.value : ''
            };
            
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeout = setTimeout(() => {
                controller.abort();
            }, 120000); // 2 minutes timeout
                
            try {
                // Send request to server with timeout
                const response = await fetch('/generate-ebook', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                    signal: controller.signal
                });
                    
                clearTimeout(timeout);
                    
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                    
                const data = await response.json();
                    
                if (data.success) {
                    loadingSpinner.style.display = 'none';
                    
                    // Create download link
                    const downloadLink = document.createElement('a');
                    downloadLink.href = data.downloadLink;
                    downloadLink.className = 'btn';
                    downloadLink.textContent = 'Download PDF';
                    downloadLink.download = ''; // This will use the server's filename
                    
                    // Clear previous results and add new download link
                    resultDiv.innerHTML = '';
                    resultDiv.appendChild(downloadLink);
                } else {
                    throw new Error(data.error || 'Failed to generate ebook');
                }
            } catch (fetchError) {
                if (fetchError.name === 'AbortError') {
                    throw new Error('Request timed out. Please try again.');
                }
                throw fetchError;
            } finally {
                clearTimeout(timeout);
            }
                
        } catch (error) {
            console.error('Error:', error);
            loadingSpinner.style.display = 'none';
            
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = error.message || 'An error occurred';
            resultDiv.innerHTML = '';
            resultDiv.appendChild(errorDiv);
        }
    });
    
    // Preview image when URL is entered
    const imageUrl = document.getElementById('imageUrl');
    const imagePreview = document.getElementById('imagePreview');
    
    if (imageUrl && imagePreview) {
        imageUrl.addEventListener('input', function() {
            const url = this.value;
            if (url) {
                const img = document.createElement('img');
                img.src = url;
                img.onerror = () => {
                    imagePreview.innerHTML = 'Invalid image URL';
                };
                img.onload = () => {
                    imagePreview.innerHTML = '';
                    imagePreview.appendChild(img);
                };
            } else {
                imagePreview.innerHTML = '';
            }
        });
    }
});
