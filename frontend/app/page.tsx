import UploadForm from '@/components/UploadForm';

export default function Home() {
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Upload Resume for AI Screening</h1>
        <p className="text-lg text-gray-600">
          Upload applicant documents and get instant AI-powered screening results
        </p>
      </div>

      <UploadForm />

      <div className="max-w-2xl mx-auto mt-12 p-6 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-lg mb-3">How it works:</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Upload resume (required) and optionally cover letter and transcript</li>
          <li>AI analyzes the documents using GPT-4o</li>
          <li>Get detailed scores, strengths, weaknesses, and interview recommendation</li>
          <li>View all applicants ranked by score</li>
          <li>Identify top 15% candidates automatically</li>
        </ol>
      </div>
    </div>
  );
}
