"""Tabelas do banco de dados."""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def agora() -> datetime:
    return datetime.now(timezone.utc)


class Produto(Base):
    __tablename__ = "produtos"
    __table_args__ = (
        CheckConstraint("quantidade >= 0", name="ck_produtos_quantidade_nao_negativa"),
        CheckConstraint("estoque_minimo >= 0", name="ck_produtos_minimo_nao_negativo"),
        CheckConstraint("preco_compra >= 0", name="ck_produtos_preco_compra"),
        CheckConstraint("preco_venda >= 0", name="ck_produtos_preco_venda"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    quantidade: Mapped[int] = mapped_column(Integer, default=0)
    estoque_minimo: Mapped[int] = mapped_column(Integer, default=0)
    preco_compra: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    preco_venda: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=agora)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=agora, onupdate=agora
    )

    movimentacoes: Mapped[list["Movimentacao"]] = relationship(back_populates="produto")

    @property
    def margem_lucro(self) -> float:
        """Margem sobre o preço de venda: (venda - compra) / venda × 100.

        Ex.: comprado a R$ 4,00 e vendido a R$ 5,00 → 20%.
        """
        if self.preco_venda <= 0:
            return 0.0
        return round(float((self.preco_venda - self.preco_compra) / self.preco_venda * 100), 2)

    @property
    def estoque_baixo(self) -> bool:
        return self.quantidade < self.estoque_minimo


class Movimentacao(Base):
    __tablename__ = "movimentacoes"
    __table_args__ = (
        CheckConstraint("quantidade > 0", name="ck_movimentacoes_quantidade_positiva"),
        CheckConstraint("tipo IN ('entrada', 'saida')", name="ck_movimentacoes_tipo"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Se o produto for excluído, o histórico continua existindo (produto_id fica nulo).
    produto_id: Mapped[int | None] = mapped_column(
        ForeignKey("produtos.id", ondelete="SET NULL"), index=True, nullable=True
    )
    # Cópia do nome no momento da movimentação, para o histórico continuar legível.
    produto_nome: Mapped[str] = mapped_column(String(120))
    tipo: Mapped[str] = mapped_column(String(10))
    quantidade: Mapped[int] = mapped_column(Integer)
    estoque_resultante: Mapped[int] = mapped_column(Integer)
    observacao: Mapped[str | None] = mapped_column(String(255), nullable=True)
    data: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=agora, index=True)

    produto: Mapped[Produto | None] = relationship(back_populates="movimentacoes")
