'use client';

import { useCallback, useState } from 'react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function UploadZone({ onFileSelect, disabled }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      setFileName(files[0].name);
      onFileSelect(files[0]);
    }
  }, [onFileSelect, disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileName(files[0].name);
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-lg p-12 text-center transition-all
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />

      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>

        {fileName ? (
          <div>
            <p className="text-lg font-medium text-gray-900">{fileName}</p>
            <p className="text-sm text-gray-500">PDF selected - ready to analyze</p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium text-gray-900">
              Drop your PDF here
            </p>
            <p className="text-sm text-gray-500">
              or click to browse
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400">
          Supports concatenated Handshake PDFs with multiple applications
        </p>
      </div>
    </div>
  );
}
