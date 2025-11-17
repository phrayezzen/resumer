from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    openai_api_key: str
    database_url: str = "sqlite:///./resume_reviewer.db"
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 10

    # Screening configuration
    top_candidate_percentage: float = 0.15  # Top 15%
    min_score_threshold: int = 60  # Minimum score to be considered

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

# Ensure upload directory exists
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
