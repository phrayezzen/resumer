"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import applicants, historical
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Create FastAPI app
app = FastAPI(
    title="AI Resume Reviewer API",
    description="AI-powered resume screening system for automated applicant evaluation",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(applicants.router)
app.include_router(historical.router)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()
    logging.info("Database initialized successfully")


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "AI Resume Reviewer API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "applicants": "/api/applicants",
            "historical": "/api/historical"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
