"""Rotas de movimentações: registrar entradas e saídas e consultar o histórico."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Movimentacao, Produto
from app.schemas import MovimentacaoCriar, MovimentacaoRegistrada, MovimentacaoSaida

router = APIRouter(prefix="/api/movimentacoes", tags=["Movimentações"])


@router.get("", response_model=list[MovimentacaoSaida])
def listar_movimentacoes(
    produto_id: int | None = Query(default=None),
    limite: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    consulta = select(Movimentacao).order_by(Movimentacao.data.desc(), Movimentacao.id.desc())
    if produto_id is not None:
        consulta = consulta.where(Movimentacao.produto_id == produto_id)
    return db.scalars(consulta.limit(limite)).all()


@router.post("", response_model=MovimentacaoRegistrada, status_code=status.HTTP_201_CREATED)
def registrar_movimentacao(dados: MovimentacaoCriar, db: Session = Depends(get_db)):
    # "with_for_update" trava a linha do produto no PostgreSQL até o fim da transação,
    # evitando que dois funcionários alterem o mesmo estoque ao mesmo tempo.
    produto = db.scalar(select(Produto).where(Produto.id == dados.produto_id).with_for_update())
    if produto is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produto não encontrado.")

    if dados.tipo == "entrada":
        novo_estoque = produto.quantidade + dados.quantidade
    else:
        novo_estoque = produto.quantidade - dados.quantidade
        if novo_estoque < 0:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT,
                f"Quantidade maior que o estoque atual ({produto.quantidade} un.).",
            )

    produto.quantidade = novo_estoque
    movimentacao = Movimentacao(
        produto_id=produto.id,
        produto_nome=produto.nome,
        tipo=dados.tipo,
        quantidade=dados.quantidade,
        estoque_resultante=novo_estoque,
        observacao=dados.observacao,
    )
    db.add(movimentacao)
    db.commit()
    db.refresh(produto)
    db.refresh(movimentacao)
    return {"movimentacao": movimentacao, "produto": produto}
