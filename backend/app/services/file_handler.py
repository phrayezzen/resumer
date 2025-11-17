"""File upload and storage service."""
from pathlib import Path
from typing import Optional
import aiofiles
import hashlib
import uuid
from datetime import datetime
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class FileHandler:
    """Service for handling file uploads and storage."""

    def __init__(self):
        self.upload_dir = Path(settings.upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save_upload(
        self,
        file_content: bytes,
        original_filename: str,
        applicant_id: int,
        document_type: str
    ) -> tuple[str, int]:
        """
        Save uploaded file to disk.

        Args:
            file_content: File content as bytes
            original_filename: Original filename
            applicant_id: ID of the applicant
            document_type: Type of document (resume, cover_letter, transcript)

        Returns:
            Tuple of (file_path, file_size_bytes)
        """
        # Create applicant-specific directory
        applicant_dir = self.upload_dir / f"applicant_{applicant_id}"
        applicant_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename
        file_extension = Path(original_filename).suffix
        unique_filename = f"{document_type}_{uuid.uuid4().hex[:8]}{file_extension}"
        file_path = applicant_dir / unique_filename

        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(file_content)

        logger.info(f"Saved file: {file_path} ({len(file_content)} bytes)")

        return str(file_path), len(file_content)

    @staticmethod
    def validate_pdf(file_content: bytes, filename: str) -> bool:
        """
        Validate that the file is a PDF.

        Args:
            file_content: File content
            filename: Original filename

        Returns:
            True if valid PDF, False otherwise
        """
        # Check file extension
        if not filename.lower().endswith('.pdf'):
            return False

        # Check PDF magic bytes
        if not file_content.startswith(b'%PDF'):
            return False

        return True

    @staticmethod
    def validate_file_size(file_content: bytes, max_size_mb: Optional[int] = None) -> bool:
        """
        Validate file size.

        Args:
            file_content: File content
            max_size_mb: Maximum size in MB (defaults to settings)

        Returns:
            True if within size limit, False otherwise
        """
        max_size = (max_size_mb or settings.max_file_size_mb) * 1024 * 1024
        return len(file_content) <= max_size

    @staticmethod
    def compute_file_hash(file_content: bytes) -> str:
        """Compute SHA-256 hash of file content."""
        return hashlib.sha256(file_content).hexdigest()

    def get_file_path(self, applicant_id: int, document_type: str) -> Optional[str]:
        """
        Get the file path for a specific document.

        Args:
            applicant_id: Applicant ID
            document_type: Document type

        Returns:
            File path if exists, None otherwise
        """
        applicant_dir = self.upload_dir / f"applicant_{applicant_id}"
        if not applicant_dir.exists():
            return None

        # Find file matching document type
        for file_path in applicant_dir.glob(f"{document_type}_*"):
            return str(file_path)

        return None

    async def delete_applicant_files(self, applicant_id: int) -> bool:
        """
        Delete all files for an applicant.

        Args:
            applicant_id: Applicant ID

        Returns:
            True if successful
        """
        applicant_dir = self.upload_dir / f"applicant_{applicant_id}"
        if applicant_dir.exists():
            import shutil
            shutil.rmtree(applicant_dir)
            logger.info(f"Deleted files for applicant {applicant_id}")
            return True
        return False
