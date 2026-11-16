"""Ponto de entrada do backend na Vercel.

A Vercel roda a API como função serverless: este arquivo expõe o `app` do FastAPI e o
`vercel.json` encaminha todas as rotas para cá.
"""

import sys
from pathlib import Path

# Garante que a pasta "backend" (onde fica o pacote "app") esteja no caminho de importação.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402, F401

# Em serverless o evento de inicialização (lifespan) nem sempre roda, então criamos as
# tabelas que faltarem aqui, quando a função é carregada. Não altera tabelas existentes.
Base.metadata.create_all(bind=engine)
