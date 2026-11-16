"""Dados de exemplo, usados apenas quando SEED_DATA=true e o banco está vazio."""

from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Produto

# (nome, quantidade, estoque mínimo, preço de compra, preço de venda)
PRODUTOS_EXEMPLO = [
    ("Arroz 5kg", 24, 10, "23.90", "31.90"),
    ("Feijão carioca 1kg", 8, 12, "6.40", "8.99"),
    ("Açúcar 1kg", 18, 10, "3.65", "4.89"),
    ("Café 500g", 6, 8, "16.90", "22.90"),
    ("Óleo de soja 900ml", 15, 10, "6.20", "8.49"),
    ("Leite integral 1L", 30, 20, "4.15", "5.49"),
    ("Macarrão 500g", 14, 10, "3.25", "4.79"),
    ("Sabão em pó 1kg", 7, 6, "10.50", "14.90"),
    ("Detergente 500ml", 20, 12, "1.85", "2.79"),
    ("Papel higiênico 12un", 5, 8, "13.90", "18.90"),
    ("Refrigerante 2L", 16, 12, "6.60", "9.49"),
    ("Biscoito recheado", 22, 10, "2.15", "3.49"),
    ("Farinha de trigo 1kg", 11, 8, "4.25", "5.89"),
    ("Sal 1kg", 19, 8, "1.80", "2.79"),
    ("Margarina 500g", 0, 6, "6.90", "9.79"),
]


def popular_se_vazio(db: Session) -> None:
    if db.scalar(select(func.count(Produto.id))):
        return
    for nome, quantidade, minimo, compra, venda in PRODUTOS_EXEMPLO:
        db.add(
            Produto(
                nome=nome,
                quantidade=quantidade,
                estoque_minimo=minimo,
                preco_compra=Decimal(compra),
                preco_venda=Decimal(venda),
            )
        )
    db.commit()
