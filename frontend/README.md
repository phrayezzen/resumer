# AI Resume Reviewer - Frontend

Modern Next.js web application for AI-powered resume screening. Supports both serverless (Vercel) and backend (FastAPI) modes.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your OPENAI_API_KEY
npm run dev
```

Visit `http://localhost:3000`

## Modes

**Demo Mode (Default):** Serverless functions on Vercel
- Set `NEXT_PUBLIC_USE_BACKEND=false`
- Perfect for demos, no backend needed

**Production Mode:** FastAPI backend
- Set `NEXT_PUBLIC_USE_BACKEND=true`  
- Set `NEXT_PUBLIC_API_URL=your_backend_url`
- Handles 3-5K applications

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add `OPENAI_API_KEY` environment variable
4. Deploy!

See full documentation in comments or README.
