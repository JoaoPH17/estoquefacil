from fastapi.testclient import TestClient

from app.main import app


def test_login_correto(client):
    r = client.post("/api/auth/login", json={"usuario": "adm123", "senha": "012345"})
    assert r.status_code == 200
    assert r.json()["usuario"] == "adm123"
    assert r.json()["token"]


def test_login_senha_errada(client):
    r = client.post("/api/auth/login", json={"usuario": "adm123", "senha": "000000"})
    assert r.status_code == 401
    assert r.json()["detail"] == "Usuário ou senha incorretos."


def test_login_usuario_errado(client):
    r = client.post("/api/auth/login", json={"usuario": "admin", "senha": "012345"})
    assert r.status_code == 401


def test_rotas_exigem_login(client):
    anonimo = TestClient(app)
    assert anonimo.get("/api/produtos").status_code == 401
    assert anonimo.get("/api/movimentacoes").status_code == 401
    assert anonimo.get("/api/produtos", headers={"Authorization": "Bearer invalido"}).status_code == 401
    assert anonimo.get("/api/saude").status_code == 200


def test_token_valido(client):
    assert client.get("/api/auth/eu").json() == {"usuario": "adm123"}
