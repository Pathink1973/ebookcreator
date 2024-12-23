# Ebook Creator - Wikipedia to PDF

A powerful web application that allows you to create, customize, and generate ebooks from various sources. This tool helps you transform web content into beautifully formatted ebooks with a professional layout.

🌐 **Live Demo**: [Wikipedia Ebook Creator](https://wikipedia-ebookcreator.netlify.app)

## Features

- 📚 Create ebooks from Wikipedia URLs
- 🎨 Customizable templates and styling
- 📑 Multiple format support (HTML to PDF)
- 📱 Responsive design for better readability
- 🔍 Preview functionality before final generation
- ⚡ Fast and efficient processing

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v12.0.0 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd Ebook Creator V2
```

2. Install dependencies:
```bash
npm install
```

## Local Development

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

## Deployment

This project is deployed on Netlify. To deploy your own version:

1. Fork this repository
2. Sign up for a [Netlify account](https://www.netlify.com)
3. Connect your GitHub repository to Netlify
4. Deploy with these settings:
   - Build command: `npm run build`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`

## Usage

1. Visit [Wikipedia Ebook Creator](https://wikipedia-ebookcreator.netlify.app)
2. Enter a Wikipedia URL in the input field
3. Click "Generate PDF"
4. Wait for the processing to complete
5. Your PDF will automatically download

## Project Structure

```
Ebook Creator V2/
├── public/              # Static files
│   ├── index.html      # Main application page
│   ├── pdf-template.html# PDF generation template
│   ├── css/           # Stylesheets
│   └── js/            # Client-side JavaScript
├── netlify/
│   └── functions/     # Serverless functions
│       ├── fetch-content.js
│       └── generate-pdf.js
└── package.json       # Project dependencies
```

## Troubleshooting

Common issues and solutions:

1. **PDF Generation Failed**
   - Make sure you're using a valid Wikipedia URL
   - Check if the article is accessible
   - Try refreshing the page and trying again

2. **Development Server Issues**
   ```bash
   npm run dev
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

Made by Patrício Brito 2024
