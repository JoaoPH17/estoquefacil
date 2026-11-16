import {
  AlertTriangle,
  ArrowDownToLine,
  ChevronRight,
  Package,
  Plus,
  TrendingUp,
} from "lucide-react";
import { EmptyState, PageHeading } from "@/components/ui";
import { formatPercent, stockState } from "@/lib/format";
import type { Page, Product } from "@/types";

export function Dashboard({
  products,
  lowProducts,
  onNavigate,
  onNewProduct,
  onMovement,
}: {
  products: Product[];
  lowProducts: Product[];
  onNavigate: (page: Page) => void;
  onNewProduct: () => void;
  onMovement: (product?: Product) => void;
}) {
  const averageMargin = products.length
    ? products.reduce((sum, product) => sum + product.margin, 0) / products.length
    : 0;
  const cards = [
    { label: "Total de produtos", value: String(products.length), icon: Package, tone: "green" },
    {
      label: "Produtos com estoque baixo",
      value: String(lowProducts.length),
      icon: AlertTriangle,
      tone: "red",
      action: () => onNavigate("estoque-baixo"),
    },
    {
      label: "Margem de lucro média",
      value: formatPercent(averageMargin),
      icon: TrendingUp,
      tone: "purple",
    },
  ];

  return (
    <>
      <div className="dashboard-heading">
        <PageHeading
          title="Olá! Veja como está o estoque hoje."
          description="Um resumo simples do Mercado Super Bom."
        />
        <span className="today">
          {new Intl.DateTimeFormat("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(new Date())}
        </span>
      </div>

      <section className="summary-grid" aria-label="Resumo do estoque">
        {cards.map((card) => {
          const Icon = card.icon;
          const content = (
            <>
              <div className={`summary-icon ${card.tone}`}>
                <Icon size={23} />
              </div>
              <div className="summary-content">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </div>
              {card.action && <ChevronRight className="summary-arrow" size={22} />}
            </>
          );
          return card.action ? (
            <button className="summary-card clickable" onClick={card.action} key={card.label}>
              {content}
            </button>
          ) : (
            <div className="summary-card" key={card.label}>
              {content}
            </div>
          );
        })}
      </section>

      <section className="quick-actions">
        <div>
          <h2>Ações rápidas</h2>
          <p>O que você precisa fazer agora?</p>
        </div>
        <div className="action-buttons">
          <button className="button primary large" onClick={onNewProduct}>
            <Plus size={21} /> Cadastrar produto
          </button>
          <button className="button secondary large" onClick={() => onMovement()}>
            <ArrowDownToLine size={21} /> Registrar entrada/saída
          </button>
        </div>
      </section>

      <section className="card restock-card">
        <div className="section-heading">
          <div>
            <h2>Precisa repor</h2>
            <p>Produtos mais próximos de acabar.</p>
          </div>
          <button className="text-button" onClick={() => onNavigate("estoque-baixo")}>
            Ver todos <ChevronRight size={18} />
          </button>
        </div>
        {lowProducts.length ? (
          <div className="restock-list">
            {lowProducts.slice(0, 5).map((product) => (
              <div className="restock-row" key={product.id}>
                <div className={`product-symbol ${product.quantity === 0 ? "danger" : "warning"}`}>
                  <Package size={21} />
                </div>
                <div className="restock-name">
                  <strong>{product.name}</strong>
                  <span>Estoque mínimo: {product.minimum} un.</span>
                </div>
                <div className="restock-quantity">
                  <span>Quantidade</span>
                  <strong>{product.quantity} un.</strong>
                </div>
                <span className={stockState(product).className}>{stockState(product).label}</span>
                <button className="button subtle small" onClick={() => onMovement(product)}>
                  Repor
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Tudo certo por aqui!"
            text="Nenhum produto está abaixo do estoque mínimo."
          />
        )}
      </section>
    </>
  );
}
