def test_saude(client):
    assert client.get("/api/saude").json() == {"status": "ok"}


def test_margem_calculada_automaticamente(produto):
    # Exemplo da proposta: comprado a R$ 4,00 e vendido a R$ 5,00 gera margem de 20%.
    assert produto["margem_lucro"] == 20.0
    assert produto["preco_compra"] == 4.0
    assert produto["estoque_baixo"] is False


def test_quantidade_negativa_rejeitada(client):
    r = client.post(
        "/api/produtos",
        json={"nome": "X", "quantidade": -1, "estoque_minimo": 0, "preco_compra": 1, "preco_venda": 2},
    )
    assert r.status_code == 422


def test_nome_duplicado(client, produto):
    r = client.post(
        "/api/produtos",
        json={"nome": "arroz 5KG", "quantidade": 1, "estoque_minimo": 0, "preco_compra": 1, "preco_venda": 2},
    )
    assert r.status_code == 409


def test_editar_buscar_e_excluir(client, produto):
    pid = produto["id"]
    r = client.put(
        f"/api/produtos/{pid}",
        json={"nome": "Arroz tipo 1 5kg", "quantidade": 3, "estoque_minimo": 5, "preco_compra": 20, "preco_venda": 25},
    )
    assert r.status_code == 200
    assert r.json()["estoque_baixo"] is True

    assert len(client.get("/api/produtos", params={"busca": "tipo 1"}).json()) == 1
    assert len(client.get("/api/produtos", params={"estoque_baixo": True}).json()) == 1
    assert client.get("/api/produtos", params={"busca": "feijão"}).json() == []

    assert client.delete(f"/api/produtos/{pid}").status_code == 204
    assert client.get(f"/api/produtos/{pid}").status_code == 404


def test_entrada_e_saida(client, produto):
    pid = produto["id"]
    r = client.post("/api/movimentacoes", json={"produto_id": pid, "tipo": "entrada", "quantidade": 5, "observacao": " Fornecedor "})
    assert r.status_code == 201
    assert r.json()["produto"]["quantidade"] == 15
    assert r.json()["movimentacao"]["observacao"] == "Fornecedor"

    r = client.post("/api/movimentacoes", json={"produto_id": pid, "tipo": "saida", "quantidade": 15})
    assert r.json()["movimentacao"]["estoque_resultante"] == 0

    historico = client.get("/api/movimentacoes").json()
    assert [m["tipo"] for m in historico] == ["saida", "entrada"]


def test_saida_maior_que_estoque(client, produto):
    r = client.post("/api/movimentacoes", json={"produto_id": produto["id"], "tipo": "saida", "quantidade": 11})
    assert r.status_code == 422
    assert client.get(f"/api/produtos/{produto['id']}").json()["quantidade"] == 10


def test_historico_mantido_ao_excluir_produto(client, produto):
    client.post("/api/movimentacoes", json={"produto_id": produto["id"], "tipo": "entrada", "quantidade": 1})
    client.delete(f"/api/produtos/{produto['id']}")
    historico = client.get("/api/movimentacoes").json()
    assert historico[0]["produto_id"] is None
    assert historico[0]["produto_nome"] == "Arroz 5kg"
