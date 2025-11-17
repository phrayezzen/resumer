'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';

export default function UploadForm() {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position_applied: '',
  });

  const [resume, setResume] = useState<File | null>(null);

  const handleFileChange = (file: File | null) => {
    console.log(`handleFileChange called: file=${file?.name || 'null'}`);
    setResume(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const data = new FormData();

      // Add form fields
      if (formData.name) data.append('name', formData.name);
      if (formData.email) data.append('email', formData.email);
      if (formData.phone) data.append('phone', formData.phone);
      if (formData.position_applied) data.append('position_applied', formData.position_applied);

      // Add resume file
      if (resume) {
        console.log('Resume being sent:', `${resume.name} (${resume.size} bytes)`);
        data.append('resume', resume);
      }

      const response = await api.uploadApplicant(data);
      setSuccess(true);

      // Reset form
      setFormData({ name: '', email: '', phone: '', position_applied: '' });
      setResume(null);

      // Redirect to applicant detail after 1.5 seconds
      setTimeout(() => {
        window.location.href = `/applicants/${response.applicant_id}`;
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Upload Applicant Documents</h2>

        {/* Applicant Info */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="(123) 456-7890"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Position Applied</label>
            <input
              type="text"
              value={formData.position_applied}
              onChange={(e) => setFormData({ ...formData, position_applied: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Software Engineer"
            />
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <FileInput
            label="Resume (Required)"
            accept=".pdf"
            onChange={handleFileChange}
            required
          />
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            ✓ Upload successful! AI screening complete. Redirecting...
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading || !resume}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {uploading ? 'Uploading & Screening...' : 'Upload & Screen Applicant'}
        </button>
      </div>
    </form>
  );
}

function FileInput({
  label,
  accept,
  onChange,
  required = false,
}: {
  label: string;
  accept: string;
  onChange: (file: File | null) => void;
  required?: boolean;
}) {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    console.log('File selected:', file?.name, file?.size);
    setFileName(file?.name || null);
    onChange(file);
  };

  return (
    <div>
      <label className="block text-sm font-bold text-gray-900 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          required={required}
          className="hidden"
          id={`file-${label}`}
        />
        <label
          htmlFor={`file-${label}`}
          className={`flex items-center justify-center px-4 py-4 border-2 border-dashed rounded-lg cursor-pointer transition ${
            fileName
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50'
          }`}
        >
          <div className="flex items-center gap-3">
            {fileName ? (
              <>
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{fileName}</div>
                  <div className="text-xs text-gray-900">Click to change file</div>
                </div>
              </>
            ) : (
              <>
                <svg className="h-8 w-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div className="text-sm font-medium text-gray-900">Click to upload PDF</div>
              </>
            )}
          </div>
        </label>
      </div>
    </div>
  );
}
