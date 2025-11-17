/**
 * PDF text extraction utilities for serverless functions
 */

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for pdf-parse (CommonJS module)
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
}

export function validatePDF(buffer: Buffer): boolean {
  // Check PDF magic bytes
  const pdfHeader = buffer.toString('utf8', 0, 5);
  return pdfHeader === '%PDF-';
}
