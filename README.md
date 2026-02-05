# Resumer

AI-powered job application review webapp for processing concatenated Handshake PDFs.

## Features

- Upload concatenated PDFs containing multiple job applications
- AI-powered candidate analysis using Claude
- Score candidates against your job description
- Interactive dashboard with filtering and sorting
- Export reports to PDF, Excel, or CSV
- Local storage using IndexedDB (browser-based, no server database needed)

## Getting Started

### Prerequisites

- Node.js 18+
- Anthropic API key (get one at https://console.anthropic.com/)

### Installation

```bash
npm install
```

### Configuration

Create a `.env.local` file with your Anthropic API key:

```
ANTHROPIC_API_KEY=your_api_key_here
```

### Running

Development:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

## Usage

1. **Upload PDF**: Drag and drop or click to upload a concatenated PDF containing multiple job applications
2. **Enter Job Description**: Paste the job description you want to evaluate candidates against
3. **Analyze**: Click "Analyze Applications" and wait for AI processing
4. **Review**: Browse the ranked candidate table, expand rows for details
5. **Export**: Download reports in PDF, Excel, or CSV format

## Architecture

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **AI**: Claude API via @anthropic-ai/sdk
- **PDF Parsing**: pdf-parse
- **Storage**: IndexedDB via Dexie.js
- **Export**: jsPDF, xlsx

## Project Structure

```
/app
  /page.tsx                    # Upload page
  /review/page.tsx             # Results dashboard
  /api/analyze/route.ts        # Main processing endpoint
  /api/analyze-stream/route.ts # Streaming endpoint with progress
/components
  /UploadZone.tsx
  /CandidateTable.tsx
  /CandidateRow.tsx
  /ScoreCell.tsx
  /TopPicksBanner.tsx
  /ExportButtons.tsx
  /ProgressIndicator.tsx
/services
  /pdf.service.ts              # PDF parsing
  /ai.service.ts               # Claude API integration
  /storage.service.ts          # IndexedDB storage
  /export.service.ts           # PDF/Excel/CSV export
/types
  /candidate.ts
  /session.ts
/lib
  /prompts.ts                  # Claude prompts
  /utils.ts
```

## License

MIT
