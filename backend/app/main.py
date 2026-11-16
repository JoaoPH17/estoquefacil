"""Ponto de entrada da API do EstoqueFácil.

Rodar localmente:  uvicorn app.main:app --reload
Documentação interativa: http://localhost:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth import exigir_login
from app.auth import router as auth_router
from app.config import get_settings
from app.database import Base, engine
from app.routers import movimentacoes, produtos
from app.seed import popular_se_vazio

settings = get_settings()


def preparar_banco() -> None:
    """Cria as tabelas que ainda não existem e, se SEED_DATA=true, os produtos de exemplo.

    Na nuvem (ex.: Vercel) várias cópias da API podem iniciar ao mesmo tempo. No PostgreSQL
    usamos uma trava (advisory lock) para que só uma faça isso por vez; as outras esperam
    e encontram tudo pronto. Para mudanças de estrutura em um banco que já tem dados, o
    próximo passo é adotar migrações com Alembic (ver README).
    """
    with engine.begin() as conexao:
        if conexao.dialect.name == "postgresql":
            conexao.execute(text("SELECT pg_advisory_xact_lock(7461)"))
        Base.metadata.create_all(bind=conexao)
        if settings.seed_data:
            with Session(bind=conexao) as db:
                popular_se_vazio(db)


@asynccontextmanager
async def lifespan(_: FastAPI):
    preparar_banco()
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

app.include_router(auth_router)
# Produtos e movimentações só podem ser acessados por quem fez login.
app.include_router(produtos.router, dependencies=[Depends(exigir_login)])
app.include_router(movimentacoes.router, dependencies=[Depends(exigir_login)])


@app.get("/api/saude", tags=["Sistema"])
def saude():
    """Verifica se a API e o banco de dados estão respondendo (útil para a hospedagem)."""
    with engine.connect() as conexao:
        conexao.execute(text("SELECT 1"))
    return {"status": "ok"}
