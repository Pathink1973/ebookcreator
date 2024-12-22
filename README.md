# Ebook Creator - Wikipedia to PDF

A powerful web application that allows you to create, customize, and generate ebooks from various sources. This tool helps you transform web content into beautifully formatted ebooks with a professional layout.

## Features

- 📚 Create ebooks from URLs or direct text input
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

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. Using the application:
   - Enter a URL or paste your content in the text area
   - Customize the appearance using the available options
   - Preview your ebook
   - Generate and download the final version

## Project Structure

```
Ebook Creator V2/
├── public/              # Static files
│   ├── index.html      # Main application page
│   ├── pdf-template.html# PDF generation template
│   ├── css/           # Stylesheets
│   └── js/            # Client-side JavaScript
├── server/             # Server-side code
│   ├── server.js      # Express server setup
│   └── templates.js   # Template handling
└── package.json       # Project dependencies
```

## Key Features Explained

### URL Content Extraction
- Automatically extracts content from provided URLs
- Maintains formatting and structure
- Handles various website layouts

### Custom Styling
- Choose from predefined templates
- Customize fonts, colors, and layouts
- Add custom CSS styling

### PDF Generation
- High-quality PDF output
- Maintains hyperlinks and formatting
- Optimized for different screen sizes

## Troubleshooting

Common issues and solutions:

1. **Port 3000 already in use**
   ```bash
   lsof -i :3000
   kill -9 [PID]
   ```

2. **Missing dependencies**
   ```bash
   npm install
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

Made by Patrício Brito © 2024
