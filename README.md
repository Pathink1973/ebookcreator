# Ebook Creator - Wikipedia to PDF

A powerful web application that allows you to create, customize, and generate ebooks from Wikipedia articles. This tool helps you transform Wikipedia content into beautifully formatted ebooks with a professional layout, now with automatic PDF downloads and cloud deployment support!

## Features

- 📚 Create ebooks directly from Wikipedia URLs
- 🎨 Multiple professional templates (Modern, Classic, Academic)
- 📑 Automatic PDF generation and download
- 📱 Responsive design for better readability
- 🔍 Content preview functionality
- ⚡ Serverless deployment on Netlify
- 💾 Direct PDF download to your computer
- 🖼️ Custom cover image support
- 📋 Table of contents generation
- 🌐 Cloud-based processing

## Live Demo

Visit our live application at: [Your-Netlify-URL]

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

## Usage

### Local Development
1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

### Using the Application

1. Enter Wikipedia Article Details:
   - Paste the Wikipedia URL
   - Enter your name as the author
   - Add a cover image URL (optional)

2. Customize Your Ebook:
   - Choose from three templates (Modern, Classic, Academic)
   - Toggle table of contents
   - Enable/disable images

3. Generate and Download:
   - Click "Generate PDF"
   - Wait for processing
   - PDF will automatically download to your computer

## Project Structure

```
Ebook Creator V2/
├── public/                # Static files
│   ├── index.html        # Main application page
│   ├── pdf-template.html # PDF generation template
│   ├── style.css        # Main stylesheet
│   └── script.js        # Client-side JavaScript
├── server/               # Server-side code
│   ├── server.js        # Express server setup
│   └── templates.js     # Template handling
├── netlify/              # Netlify configuration
│   └── functions/       # Serverless functions
├── netlify.toml         # Netlify deployment config
└── package.json         # Project dependencies
```

## Deployment

This application is ready for deployment on Netlify:

1. Fork/Clone this repository
2. Connect your repository to Netlify
3. Deploy! (Netlify will automatically detect the configuration)

## Key Features Explained

### Automatic PDF Download
- PDFs are generated in the cloud
- Automatic download trigger
- No server storage required

### Template System
- Modern: Clean, minimalist design
- Classic: Traditional book layout
- Academic: Research-paper style

### Wikipedia Integration
- Automatic content extraction
- Maintains formatting and structure
- Handles references and citations

### Cloud Processing
- Serverless architecture
- Scalable PDF generation
- Fast processing times

## Troubleshooting

Common issues and solutions:

1. **PDF Generation Fails**
   - Check your Wikipedia URL is valid
   - Ensure cover image URL is accessible
   - Try a different browser if download doesn't start

2. **Local Development Issues**
   ```bash
   # If port 3000 is in use
   lsof -i :3000
   kill -9 [PID]
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Made with love by Patrício Brito©2024
