"""Ponto de entrada da API do EstoqueFácil.

Rodar localmente:  uvicorn app.main:app --reload
Documentação interativa: http://localhost:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routers import movimentacoes, produtos
from app.seed import popular_se_vazio

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Cria as tabelas que ainda não existem. Para mudanças de estrutura em um banco
    # que já tem dados, o próximo passo é adotar migrações com Alembic (ver README).
    Base.metadata.create_all(bind=engine)
    if settings.seed_data:
        with SessionLocal() as db:
            popular_se_vazio(db)
    yield


app = FastAPI(
    title="EstoqueFácil API",
    description="Cadastro de produtos e controle de estoque para pequenos mercados.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(produtos.router)
app.include_router(movimentacoes.router)


@app.get("/api/saude", tags=["Sistema"])
def saude():
    """Verifica se a API e o banco de dados estão respondendo (útil para a hospedagem)."""
    with engine.connect() as conexao:
        conexao.execute(text("SELECT 1"))
    return {"status": "ok"}
