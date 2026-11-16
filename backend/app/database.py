"""Conexão com o banco de dados (SQLAlchemy)."""

import os
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()

connect_args: dict = {}
engine_options: dict = {"pool_pre_ping": True}

if settings.database_url.startswith("sqlite"):
    # Necessário para o SQLite funcionar com o servidor web (várias threads).
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL. O pooler do Supabase (porta 6543, "Transaction pooler") não aceita
    # "prepared statements"; desligá-los não atrapalha conexões diretas.
    connect_args = {"prepare_threshold": None}

if os.environ.get("VERCEL"):
    # Na Vercel cada requisição pode rodar em uma instância nova e efêmera. Em vez de
    # manter conexões abertas, abrimos e fechamos a cada uso; o pooler do Supabase
    # é quem reaproveita as conexões.
    engine_options = {"poolclass": NullPool}

engine = create_engine(settings.database_url, connect_args=connect_args, **engine_options)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    """Abre uma sessão por requisição e fecha ao final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
