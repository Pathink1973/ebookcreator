document.getElementById('generatePdfButton').addEventListener('click', function() {
    const element = document.getElementById('pdfContent'); // ID do conteúdo a ser convertido
    html2pdf()
        .from(element)
        .set({
            margin: 1,
            filename: 'ebook.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        })
        .save();
});

document.getElementById('fetchPreview').addEventListener('click', async function() {
    const wikiUrl = document.getElementById('wikiUrl').value; // Get the Wikipedia URL
    const previewContainer = document.getElementById('preview'); // Container to display the preview

    // Clear previous content
    previewContainer.innerHTML = '';

    try {
        const response = await fetch(wikiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text(); // Get the response as text

        // Create a temporary DOM element to parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');

        // Extract the main content (you may need to adjust the selector based on the structure of the Wikipedia page)
        const mainContent = doc.querySelector('#bodyContent'); // Example selector for Wikipedia content
        if (mainContent) {
            previewContainer.innerHTML = mainContent.innerHTML; // Display the extracted content
        } else {
            previewContainer.innerHTML = '<p>Conteúdo não encontrado.</p>'; // Fallback message
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to fetch content. Please check the Wikipedia URL and try again.');
    }
}); 