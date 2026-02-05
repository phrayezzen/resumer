# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Development server on localhost:3000
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

## Environment Setup

Requires `ANTHROPIC_API_KEY` in `.env.local` (see `.env.example`).

## Architecture Overview

Resumer is a Next.js 14 application that processes concatenated Handshake job application PDFs and scores candidates against job descriptions using Claude AI.

### Data Flow

1. **PDF Upload** (`/page.tsx`) - User uploads concatenated PDF + job description
2. **Stream Processing** (`/api/analyze-stream/route.ts`) - Server-Sent Events endpoint:
   - Parses PDF text using `pdf-parse`
   - Claude identifies applicant boundaries (where each resume starts/ends)
   - Claude analyzes each candidate against job description
3. **Results** (`/review/page.tsx`) - Interactive dashboard with scores, sorting, filtering, export

### Key Patterns

**Service Layer** (`services/`): Isolated business logic
- `ai.service.ts` - Claude API integration with prompts from `lib/prompts.ts`
- `pdf.service.ts` - PDF parsing and text extraction
- `storage.service.ts` - IndexedDB via Dexie.js (browser-only, no server DB)
- `export.service.ts` - PDF/Excel/CSV generation

**Client-Side Storage**: All session data persists in browser IndexedDB. No server database.

**Streaming for UX**: `/api/analyze-stream` uses ReadableStream with SSE format (`data: JSON\n\n`) for real-time progress updates during long-running AI processing.

### Configuration Notes

- `next.config.mjs`: 50MB body size limit for large PDFs; webpack fallbacks disable Node.js modules in browser
- API timeout: 5 minutes (300 sec) for AI processing
- Text truncation: First 100k chars sent to Claude for applicant boundary detection

### Type System

Core types in `types/`:
- `Candidate` - Applicant with scores (skillsMatch, experience, education, cultureFit), analysis, user overrides
- `Session` - Analysis run container (jobDescription, pdfData, candidates[])
- `ProcessingStatus` - Real-time progress tracking with status enum
