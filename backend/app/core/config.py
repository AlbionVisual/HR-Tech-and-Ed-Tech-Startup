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


settings = Settings()
