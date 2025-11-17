# AI Resume Reviewer

Complete AI-powered resume screening system for automated applicant evaluation. Built for handling 3-5K applications per year.

## 🎯 Overview

This system automatically screens job applicants by analyzing resumes, cover letters, and transcripts using OpenAI GPT-4o. It identifies the top 15% of candidates and provides detailed analysis with scores, strengths, weaknesses, and interview recommendations.

## ✨ Features

- **AI-Powered Screening**: GPT-4o analyzes resumes, cover letters, and transcripts
- **Automatic Ranking**: Identifies top 15% of applicants automatically
- **Detailed Analysis**: Provides scores (0-100), strengths, weaknesses, and reasoning
- **Dual Architecture**: Works standalone (demo) or with backend (production)
- **Modern UI**: Clean, professional Next.js interface
- **RESTful API**: Complete backend with FastAPI

## 🏗️ Architecture

### Demo Mode (Proof of Concept)
```
Next.js Frontend (Vercel)
    ↓
Serverless Functions (Vercel)
    ↓
OpenAI GPT-4o
```
- Perfect for client demos
- No backend infrastructure needed
- Handles ~50 applicants
- Data stored in-memory

### Production Mode (Full Scale)
```
Next.js Frontend (Vercel)
    ↓
FastAPI Backend (Railway/Render/AWS)
    ↓
OpenAI GPT-4o + PostgreSQL
```
- Handles 3-5K+ applicants
- Persistent database
- Production-ready
- Scalable architecture

## 🚀 Quick Start

### For Demo/Testing

```bash
# Frontend only (serverless mode)
cd frontend
npm install
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local
npm run dev
```

Visit `http://localhost:3000`

### For Production

```bash
# Terminal 1: Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add your OPENAI_API_KEY to .env
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_USE_BACKEND=true in .env.local
npm run dev
```

## 📁 Project Structure

```
resume-reviewer/
├── frontend/           # Next.js web application
│   ├── app/           # Pages and API routes
│   ├── components/    # React components
│   ├── lib/           # Utilities and API client
│   └── types/         # TypeScript definitions
├── backend/           # FastAPI backend (optional for production)
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── models.py         # Database models
│   │   ├── routers/          # API endpoints
│   │   └── services/         # Business logic
│   └── requirements.txt
├── DEPLOYMENT.md      # Deployment guide
└── README.md          # This file
```

## 🎨 User Flow

1. **Upload**: User uploads resume (+ optional cover letter, transcript)
2. **Processing**: AI extracts text and analyzes documents
3. **Screening**: GPT-4o evaluates and scores the applicant
4. **Results**: Detailed screening with scores, strengths, weaknesses
5. **Ranking**: Automatic identification of top 15% candidates

## 🔧 Tech Stack

### Frontend
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- OpenAI GPT-4o API
- Vercel (deployment)

### Backend (Optional for Production)
- Python 3.9+
- FastAPI
- SQLAlchemy (ORM)
- SQLite → PostgreSQL
- OpenAI GPT-4o API

## 📊 Scoring System

Each applicant receives:
- **Overall Score** (0-100): Weighted composite
- **Resume Score** (0-100): Experience, skills, professionalism
- **Cover Letter Score** (0-100): Writing quality, enthusiasm, fit
- **Transcript Score** (0-100): GPA, coursework, consistency

**Recommendation Criteria:**
- Score ≥ 80: Highly recommended
- Score 70-79: Recommended
- Score 60-69: Borderline
- Score < 60: Not recommended

## 🚢 Deployment

### Quick Deploy (Demo Mode)

1. Push to GitHub
2. Import to Vercel
3. Add `OPENAI_API_KEY` environment variable
4. Deploy!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Production Deploy

1. Deploy backend to Railway/Render/AWS
2. Deploy frontend to Vercel
3. Connect via environment variables

No code changes needed to switch between modes!

## 📝 API Endpoints

### Frontend Serverless (Demo)
- `POST /api/applicants/upload` - Upload & screen applicant
- `GET /api/applicants` - List all applicants
- `GET /api/applicants/[id]` - Get applicant details
- `GET /api/applicants/top-candidates` - Get top 15%
- `GET /api/applicants/analytics/summary` - Get statistics

### Backend (Production)
- Same endpoints at `http://your-backend-url/api/...`
- Additional historical data endpoints
- Database persistence

## 🔐 Environment Variables

### Frontend
```env
OPENAI_API_KEY=sk-...                          # Required for serverless mode
NEXT_PUBLIC_USE_BACKEND=false                  # false=serverless, true=backend
NEXT_PUBLIC_API_URL=http://localhost:8000      # Backend URL (if using backend)
```

### Backend
```env
OPENAI_API_KEY=sk-...                          # Required
DATABASE_URL=sqlite:///./resume_reviewer.db     # Database connection
UPLOAD_DIR=./uploads                            # File storage directory
MAX_FILE_SIZE_MB=10                             # Max PDF size
```

## 💰 Cost Estimates

### Demo Mode (50 resumes)
- Vercel: Free
- OpenAI API: ~$1.50
- **Total**: ~$1.50

### Production Mode (3000 resumes)
- Vercel: Free
- Backend Hosting: $0-20/month
- OpenAI API: ~$90
- **Total**: ~$90-110

## 🛣️ Roadmap

### Phase 1: MVP (Complete ✅)
- PDF upload and screening
- AI-powered evaluation
- Top 15% identification
- Modern UI

### Phase 2: Enhanced Screening
- Web scraping (LinkedIn, Google)
- Historical data ML training
- Custom screening criteria per job
- Batch processing for Handshake PDFs

### Phase 3: Video Interviews
- GPT-4o video analysis
- Professionalism assessment
- Communication skills evaluation

### Phase 4: India Team Integration
- LinkedIn job posting integration
- High-volume application handling
- Advanced analytics dashboard

## 🧪 Testing

Tested with sample resume (scored 85/100):

```
✓ PDF upload and text extraction
✓ AI screening with GPT-4o
✓ Detailed score breakdown
✓ Strengths/weaknesses identification
✓ Interview recommendation
✓ Processing time: ~6 seconds
```

## 📚 Documentation

- [Frontend README](./frontend/README.md) - Frontend setup and usage
- [Backend README](./backend/README.md) - Backend setup and API docs
- [Deployment Guide](./DEPLOYMENT.md) - Deployment instructions

## 🐛 Troubleshooting

**Upload fails:**
- Check OpenAI API key is valid
- Ensure PDF is valid (not corrupted)
- Check file size (< 10MB for serverless)

**Build errors:**
- Run `npm install` in frontend/
- Run `pip install -r requirements.txt` in backend/

**API connection fails:**
- Verify backend is running
- Check `NEXT_PUBLIC_API_URL` is correct
- Ensure CORS is configured

## 🤝 Contributing

This is a client project. For issues or questions, contact the development team.

## 📄 License

Proprietary - All rights reserved

---

**Built with ❤️ using Next.js, FastAPI, and OpenAI GPT-4o**

Ready to revolutionize your hiring process! 🚀
