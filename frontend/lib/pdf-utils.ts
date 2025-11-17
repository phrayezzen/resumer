/**
 * PDF validation utilities for serverless functions
 */

export function validatePDF(buffer: Buffer): boolean {
  // Check PDF magic bytes
  const pdfHeader = buffer.toString('utf8', 0, 5);
  return pdfHeader === '%PDF-';
}
