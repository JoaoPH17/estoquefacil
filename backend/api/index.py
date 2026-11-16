"""Ponto de entrada do backend na Vercel.

A Vercel roda a API como função serverless: este arquivo expõe o `app` do FastAPI e o
`vercel.json` encaminha todas as rotas para cá.
"""

import sys
from pathlib import Path

# Garante que a pasta "backend" (onde fica o pacote "app") esteja no caminho de importação.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app, preparar_banco  # noqa: E402, F401

# Em serverless o evento de inicialização (lifespan) nem sempre roda, então preparamos o
# banco aqui, quando a função é carregada. É seguro rodar mais de uma vez ou em paralelo.
preparar_banco()
