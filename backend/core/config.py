from typing import ClassVar

from pydantic_settings import BaseSettings
import urllib.parse

class Settings(BaseSettings):
    raw_password: ClassVar[str] = "P0stgres@l2026"
    encoded_password: ClassVar[str] = urllib.parse.quote_plus(raw_password)
    DATABASE_URL: str = f"postgresql+psycopg2://postgres:{encoded_password}@localhost:5432/transitops"
    SECRET_KEY: str = "transitops-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    MAX_LOGIN_ATTEMPTS: int = 5

    class Config:
        env_file = ".env"

settings = Settings()
