import os

# Banco de teste separado, definido antes de importar a aplicação.
# Para testar contra PostgreSQL, rode: TEST_DATABASE_URL=postgresql://... pytest
os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL", "sqlite:///./teste.db")
os.environ["SEED_DATA"] = "false"

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    with TestClient(app) as c:
        r = c.post("/api/auth/login", json={"usuario": "adm123", "senha": "012345"})
        c.headers["Authorization"] = f"Bearer {r.json()['token']}"
        yield c
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def produto(client):
    resposta = client.post(
        "/api/produtos",
        json={
            "nome": "Arroz 5kg",
            "quantidade": 10,
            "estoque_minimo": 5,
            "preco_compra": 4.00,
            "preco_venda": 5.00,
        },
    )
    assert resposta.status_code == 201
    return resposta.json()
