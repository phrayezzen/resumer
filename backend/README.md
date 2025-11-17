# AI Resume Reviewer Backend

AI-powered resume screening system that automatically evaluates job applicants based on their resume, cover letter, and transcript. Built with FastAPI and OpenAI GPT-4o.

## Features

- **AI-Powered Screening**: Uses GPT-4o vision to analyze PDF documents directly
- **Automated Ranking**: Automatically ranks applicants and identifies top 15%
- **Comprehensive Evaluation**: Scores resumes, cover letters, and transcripts separately
- **RESTful API**: Full CRUD operations with filtering and analytics
- **Historical Data**: Track past hiring outcomes for future ML improvements
- **Background Processing**: Asynchronous AI screening for fast upload response

## Tech Stack

- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **OpenAI GPT-4o**: AI model for document analysis
- **SQLite**: Database (easily upgradable to PostgreSQL)
- **PyPDF2/pdfplumber**: PDF text extraction (backup to vision)

## Installation

### Prerequisites

- Python 3.9+
- OpenAI API key

### Setup

1. Clone the repository and navigate to backend:
```bash
cd resume-reviewer/backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```bash
cp .env.example .env
```

5. Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your_actual_api_key_here
DATABASE_URL=sqlite:///./resume_reviewer.db
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
```

## Usage

### Start the Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### API Documentation

Interactive API docs (Swagger UI): `http://localhost:8000/docs`

Alternative docs (ReDoc): `http://localhost:8000/redoc`

## API Endpoints

### Applicants

#### Upload Applicant Documents
```bash
POST /api/applicants/upload
```
Upload resume, cover letter, and/or transcript PDFs with applicant metadata.

**Form Data:**
- `resume` (file, optional): Resume PDF
- `cover_letter` (file, optional): Cover letter PDF
- `transcript` (file, optional): Transcript PDF
- `name` (string, optional): Applicant name
- `email` (string, optional): Email address
- `phone` (string, optional): Phone number
- `position_applied` (string, optional): Position title
- `source` (string, default: "handshake"): Application source

**Example with curl:**
```bash
curl -X POST "http://localhost:8000/api/applicants/upload" \
  -F "resume=@resume.pdf" \
  -F "cover_letter=@cover_letter.pdf" \
  -F "transcript=@transcript.pdf" \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "position_applied=Software Engineer"
```

**Response:**
```json
{
  "message": "Successfully uploaded documents for applicant",
  "applicant_id": 1,
  "documents_uploaded": 3,
  "screening_started": true
}
```

#### List All Applicants
```bash
GET /api/applicants/?skip=0&limit=100&min_score=70&recommended_only=false
```

**Query Parameters:**
- `skip`: Pagination offset (default: 0)
- `limit`: Max results (default: 100)
- `min_score`: Filter by minimum score (optional)
- `recommended_only`: Show only recommended candidates (default: false)

#### Get Top Candidates
```bash
GET /api/applicants/top-candidates?percentage=15.0
```
Returns top X% of applicants (default 15%).

**Response:**
```json
{
  "total_count": 100,
  "top_percentage": 15.0,
  "candidates": [...]
}
```

#### Get Screening Summary
```bash
GET /api/applicants/analytics/summary
```
Returns analytics about all screenings.

**Response:**
```json
{
  "total_applicants": 100,
  "screened_count": 95,
  "pending_count": 5,
  "top_15_percent_count": 14,
  "average_score": 72.5,
  "recommended_count": 28
}
```

#### Get Applicant Details
```bash
GET /api/applicants/{applicant_id}
```
Get detailed information including documents and screening results.

#### Delete Applicant
```bash
DELETE /api/applicants/{applicant_id}
```
Delete applicant and all associated files.

### Historical Data

#### Upload Historical Hire
```bash
POST /api/historical/upload
```
Upload data about past hires for future ML training.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "hired_date": "2023-06-15T00:00:00",
  "position": "Analyst",
  "resume_text": "...",
  "cover_letter_text": "...",
  "transcript_text": "...",
  "outcome": "positive",
  "outcome_notes": "Excellent performer, promoted after 8 months",
  "tenure_months": 18,
  "performance_rating": 4.5
}
```

#### List Historical Hires
```bash
GET /api/historical/?outcome=positive
```

#### Get Historical Stats
```bash
GET /api/historical/stats
```

## How It Works

### 1. Document Upload
- User uploads PDF documents (resume, cover letter, transcript)
- System validates PDFs and saves to disk
- Metadata stored in SQLite database
- Text extracted as backup (using PyPDF2/pdfplumber)

### 2. AI Screening (Background Task)
- GPT-4o vision reads PDF documents directly
- AI evaluates based on comprehensive criteria:
  - Resume: Experience, skills, professionalism
  - Cover Letter: Writing quality, enthusiasm, fit
  - Transcript: GPA, coursework, consistency
- Generates scores (0-100) for each component
- Provides strengths, weaknesses, and reasoning
- Makes interview recommendation

### 3. Ranking
- All applicants ranked by overall score
- Percentile calculated for each applicant
- Top 15% automatically identified

### 4. Results
- API provides filtered views of candidates
- Frontend can retrieve top performers
- Detailed reasoning available for each decision

## Scoring Criteria

### Overall Score (0-100)
Weighted composite of:
- **Resume (40%)**: Relevant experience, skills, presentation
- **Cover Letter (30%)**: Writing quality, company research, enthusiasm
- **Transcript (30%)**: GPA, coursework, academic performance

### Recommendations
- Score ≥ 80: Strong candidate, highly recommended
- Score 70-79: Good candidate, recommended
- Score 60-69: Fair candidate, borderline
- Score < 60: Below threshold, not recommended

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database connection
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── routers/
│   │   ├── applicants.py    # Applicant endpoints
│   │   └── historical.py    # Historical data endpoints
│   └── services/
│       ├── ai_screener.py   # OpenAI GPT-4o integration
│       ├── pdf_extractor.py # PDF text extraction
│       ├── file_handler.py  # File upload/storage
│       └── ranker.py        # Ranking algorithms
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## Database Schema

### Applicants
- Core applicant information (name, email, phone)
- Application metadata (source, position, dates)

### Documents
- Uploaded PDF files
- File paths and metadata
- Extracted text content

### ScreeningResults
- AI-generated scores and analysis
- Strengths and weaknesses
- Interview recommendations
- Rankings and percentiles

### HistoricalHires
- Past hiring data
- Outcomes (positive/negative)
- Performance metrics
- For future ML model training

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `DATABASE_URL`: Database connection string (default: SQLite)
- `UPLOAD_DIR`: Directory for uploaded files (default: ./uploads)
- `MAX_FILE_SIZE_MB`: Maximum PDF file size (default: 10 MB)

### Screening Settings

Edit `app/config.py` to adjust:
- `top_candidate_percentage`: Percentage for top candidates (default: 15%)
- `min_score_threshold`: Minimum score to consider (default: 60)

## Future Enhancements

### Phase 2 (Already Planned)
- [ ] Web scraping (LinkedIn, Google searches)
- [ ] Video interview AI (GPT-4o video analysis)
- [ ] India team LinkedIn integration
- [ ] Advanced analytics dashboard

### Phase 3
- [ ] Fine-tuning on historical data
- [ ] Custom screening criteria per job posting
- [ ] Automated email notifications
- [ ] Integration with ATS systems
- [ ] PostgreSQL migration for production

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black app/
```

### Type Checking
```bash
mypy app/
```

## Deployment

### Production Checklist
1. Switch to PostgreSQL database
2. Set up proper CORS origins
3. Configure file storage (S3, etc.)
4. Add authentication/authorization
5. Set up monitoring and logging
6. Use production ASGI server (Gunicorn + Uvicorn)
7. Set up HTTPS
8. Configure rate limiting

### Example Production Command
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## Troubleshooting

### Common Issues

**OpenAI API Errors:**
- Ensure your API key is valid and has credits
- Check rate limits if processing many applicants
- Vision API may have size limits on PDFs

**PDF Extraction Issues:**
- Some PDFs may be scanned images (vision handles this)
- Complex layouts may need pdfplumber instead of PyPDF2
- Text extraction is backup - vision is primary method

**Database Locked (SQLite):**
- SQLite doesn't handle high concurrency well
- Migrate to PostgreSQL for production

## Support

For issues or questions, please open an issue on GitHub.

## License

MIT License - See LICENSE file for details
