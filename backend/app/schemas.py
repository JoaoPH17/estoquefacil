"""Formatos de entrada e saída da API (validação com Pydantic)."""

from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, field_validator

# Valores em reais: validados como Decimal (sem erro de arredondamento) e enviados como número.
Dinheiro = Annotated[
    Decimal,
    Field(ge=0, max_digits=10, decimal_places=2),
    PlainSerializer(float, return_type=float),
]


class ProdutoBase(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    quantidade: int = Field(ge=0, description="Não pode ser negativa")
    estoque_minimo: int = Field(ge=0)
    preco_compra: Dinheiro
    preco_venda: Dinheiro

    @field_validator("nome")
    @classmethod
    def limpar_nome(cls, valor: str) -> str:
        valor = " ".join(valor.split())
        if not valor:
            raise ValueError("O nome do produto é obrigatório.")
        return valor


class ProdutoCriar(ProdutoBase):
    pass


class ProdutoAtualizar(ProdutoBase):
    pass


class ProdutoSaida(ProdutoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    margem_lucro: float = Field(description="Calculada automaticamente, em %")
    estoque_baixo: bool
    criado_em: datetime
    atualizado_em: datetime


class MovimentacaoCriar(BaseModel):
    produto_id: int
    tipo: Literal["entrada", "saida"]
    quantidade: int = Field(gt=0)
    observacao: str | None = Field(default=None, max_length=255)

    @field_validator("observacao")
    @classmethod
    def limpar_observacao(cls, valor: str | None) -> str | None:
        if valor is None:
            return None
        valor = valor.strip()
        return valor or None


class MovimentacaoSaida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    produto_id: int | None
    produto_nome: str
    tipo: Literal["entrada", "saida"]
    quantidade: int
    estoque_resultante: int
    observacao: str | None
    data: datetime


class MovimentacaoRegistrada(BaseModel):
    """Resposta ao registrar uma movimentação: o registro e o produto já atualizado."""

    movimentacao: MovimentacaoSaida
    produto: ProdutoSaida
