"""Configurações da aplicação, lidas de variáveis de ambiente ou do arquivo .env."""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Endereço do banco de dados.
    # - Desenvolvimento (padrão): SQLite em arquivo local, não precisa instalar nada.
    # - Produção: PostgreSQL, ex.: postgresql://usuario:senha@host:5432/estoquefacil
    database_url: str = "sqlite:///./estoquefacil.db"

    # Endereços do frontend autorizados a chamar a API (CORS), separados por vírgula.
    cors_origins: str = "http://localhost:5173"

    # Se True, cadastra os produtos de exemplo quando o banco estiver vazio.
    # Deixe False em produção para não misturar dados de teste com dados reais.
    seed_data: bool = False

    # Login do sistema. Em produção, troque usuário/senha e defina uma SECRET_KEY longa e
    # aleatória (ex.: python -c "import secrets; print(secrets.token_hex(32))").
    admin_usuario: str = "adm123"
    admin_senha: str = "012345"
    secret_key: str = "troque-esta-chave-em-producao"
    # Por quantas horas o login continua válido.
    token_horas: int = 12

    @field_validator("database_url")
    @classmethod
    def normalizar_url_postgres(cls, url: str) -> str:
        # Provedores de nuvem (Render, Railway, Heroku, Supabase, Neon...) costumam entregar
        # a URL como "postgres://" ou "postgresql://". O SQLAlchemy precisa saber qual
        # driver usar, então trocamos para "postgresql+psycopg://".
        for prefixo in ("postgres://", "postgresql://"):
            if url.startswith(prefixo):
                return "postgresql+psycopg://" + url[len(prefixo) :]
        return url

    @property
    def cors_origins_list(self) -> list[str]:
        return [origem.strip() for origem in self.cors_origins.split(",") if origem.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
