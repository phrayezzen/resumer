"""PDF text extraction service."""
import PyPDF2
import pdfplumber
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class PDFExtractor:
    """Service for extracting text from PDF files."""

    @staticmethod
    def extract_text_pypdf2(file_path: str) -> str:
        """
        Extract text using PyPDF2.
        Good for simple PDFs.
        """
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"PyPDF2 extraction failed for {file_path}: {str(e)}")
            return ""

    @staticmethod
    def extract_text_pdfplumber(file_path: str) -> str:
        """
        Extract text using pdfplumber.
        Better for complex layouts and tables.
        """
        try:
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"pdfplumber extraction failed for {file_path}: {str(e)}")
            return ""

    @classmethod
    def extract_text(cls, file_path: str, method: str = "both") -> str:
        """
        Extract text from PDF using specified method.

        Args:
            file_path: Path to PDF file
            method: Extraction method - "pypdf2", "pdfplumber", or "both" (default)

        Returns:
            Extracted text content
        """
        if not Path(file_path).exists():
            logger.error(f"File not found: {file_path}")
            return ""

        if method == "pypdf2":
            return cls.extract_text_pypdf2(file_path)
        elif method == "pdfplumber":
            return cls.extract_text_pdfplumber(file_path)
        else:  # "both" - try pdfplumber first, fallback to pypdf2
            text = cls.extract_text_pdfplumber(file_path)
            if not text or len(text) < 50:  # If extraction failed or got minimal text
                logger.info(f"Falling back to PyPDF2 for {file_path}")
                text = cls.extract_text_pypdf2(file_path)
            return text

    @staticmethod
    def extract_metadata(file_path: str) -> dict:
        """
        Extract PDF metadata.

        Returns:
            Dictionary with metadata (pages, author, title, etc.)
        """
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                metadata = {
                    "pages": len(pdf_reader.pages),
                    "author": pdf_reader.metadata.get("/Author", "") if pdf_reader.metadata else "",
                    "title": pdf_reader.metadata.get("/Title", "") if pdf_reader.metadata else "",
                    "subject": pdf_reader.metadata.get("/Subject", "") if pdf_reader.metadata else "",
                }
                return metadata
        except Exception as e:
            logger.error(f"Metadata extraction failed for {file_path}: {str(e)}")
            return {"pages": 0}

    @staticmethod
    def is_valid_pdf(file_path: str) -> bool:
        """
        Check if file is a valid PDF.

        Returns:
            True if valid PDF, False otherwise
        """
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                # Try to read first page
                if len(pdf_reader.pages) > 0:
                    _ = pdf_reader.pages[0]
                    return True
            return False
        except Exception as e:
            logger.error(f"PDF validation failed for {file_path}: {str(e)}")
            return False
