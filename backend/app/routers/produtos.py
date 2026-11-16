"""Rotas de produtos: cadastrar, consultar, editar, excluir e buscar."""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Produto
from app.schemas import ProdutoAtualizar, ProdutoCriar, ProdutoSaida

router = APIRouter(prefix="/api/produtos", tags=["Produtos"])


def buscar_ou_404(db: Session, produto_id: int) -> Produto:
    produto = db.get(Produto, produto_id)
    if produto is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produto não encontrado.")
    return produto


def garantir_nome_unico(db: Session, nome: str, ignorar_id: int | None = None) -> None:
    consulta = select(Produto.id).where(func.lower(Produto.nome) == nome.lower())
    if ignorar_id is not None:
        consulta = consulta.where(Produto.id != ignorar_id)
    if db.scalar(consulta) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, f'Já existe um produto chamado "{nome}".')


@router.get("", response_model=list[ProdutoSaida])
def listar_produtos(
    busca: str | None = Query(default=None, description="Parte do nome do produto"),
    estoque_baixo: bool = Query(default=False, description="Só produtos abaixo do mínimo"),
    db: Session = Depends(get_db),
):
    consulta = select(Produto).order_by(Produto.nome)
    if busca:
        consulta = consulta.where(Produto.nome.ilike(f"%{busca.strip()}%"))
    if estoque_baixo:
        consulta = consulta.where(Produto.quantidade < Produto.estoque_minimo)
    return db.scalars(consulta).all()


@router.get("/{produto_id}", response_model=ProdutoSaida)
def obter_produto(produto_id: int, db: Session = Depends(get_db)):
    return buscar_ou_404(db, produto_id)


@router.post("", response_model=ProdutoSaida, status_code=status.HTTP_201_CREATED)
def criar_produto(dados: ProdutoCriar, db: Session = Depends(get_db)):
    garantir_nome_unico(db, dados.nome)
    produto = Produto(**dados.model_dump())
    db.add(produto)
    db.commit()
    db.refresh(produto)
    return produto


@router.put("/{produto_id}", response_model=ProdutoSaida)
def atualizar_produto(produto_id: int, dados: ProdutoAtualizar, db: Session = Depends(get_db)):
    produto = buscar_ou_404(db, produto_id)
    garantir_nome_unico(db, dados.nome, ignorar_id=produto_id)
    for campo, valor in dados.model_dump().items():
        setattr(produto, campo, valor)
    db.commit()
    db.refresh(produto)
    return produto


@router.delete("/{produto_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_produto(produto_id: int, db: Session = Depends(get_db)):
    produto = buscar_ou_404(db, produto_id)
    # O histórico de movimentações é mantido, apenas desvinculado do produto.
    for movimentacao in produto.movimentacoes:
        movimentacao.produto_id = None
    db.delete(produto)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
