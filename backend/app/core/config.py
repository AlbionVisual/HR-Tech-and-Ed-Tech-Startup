from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "HR/Ed Tech API"
    environment: str = "local"
    api_v1_prefix: str = "/api/v1"

    gemini_api_key: str = ""
    openrouter_api_key: str = ""
    aiai_api_key: str = ""

    ai_default_provider: str = "openrouter"
    ai_cors_origins: str = "http://localhost:5273,https://albionvisual.github.io"
    ai_timeout_seconds: float = 120.0
    ai_max_messages: int = 100
    ai_max_message_chars: int = 50_000

    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    aiai_base_url: str = "https://api.aiai.by/v1"
    openrouter_site_url: str = "http://localhost:5273"
    openrouter_app_name: str = "Interview MVP"

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/hrtech"
    database_pool_size: int = 10
    database_echo: bool = False

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.ai_cors_origins.split(",") if item.strip()]

    def api_key_for(self, provider: str) -> str:
        return str(getattr(self, f"{provider}_api_key", "") or "")


settings = Settings()
