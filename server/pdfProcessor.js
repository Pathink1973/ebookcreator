// pdfProcessor.js
import { PDFDocument } from 'pdf-lib';

export async function gerarPDF(tema, numPaginas, imageUrl, author) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    page.drawText(`Tema: ${tema}\nAutor: ${author}\nNúmero de páginas: ${numPaginas}`);
    return pdfDoc.save();
}
