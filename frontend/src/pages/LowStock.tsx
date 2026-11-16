import { AlertTriangle, Package, PackagePlus } from "lucide-react";
import { EmptyState, PageHeading } from "@/components/ui";
import { stockState } from "@/lib/format";
import type { Product } from "@/types";

export function LowStock({
  products,
  onMovement,
}: {
  products: Product[];
  onMovement: (product: Product) => void;
}) {
  return (
    <>
      <PageHeading
        title="Estoque baixo"
        description="Veja o que precisa ser comprado para não faltar na prateleira."
      />
      <div className="low-alert">
        <div className="low-alert-icon">
          <AlertTriangle size={25} />
        </div>
        <div>
          <strong>
            {products.length
              ? `${products.length} ${products.length === 1 ? "produto precisa" : "produtos precisam"} de atenção`
              : "Seu estoque está em dia"}
          </strong>
          <span>Comece pelos itens mais críticos no topo da lista.</span>
        </div>
      </div>
      <section className="card low-stock-card">
        <div className="section-heading">
          <div>
            <h2>Lista de reposição</h2>
            <p>Ordenada do mais crítico ao menos crítico.</p>
          </div>
        </div>
        {products.length ? (
          <div className="low-list">
            {products.map((product, index) => {
              const missing = product.minimum - product.quantity;
              const percent = Math.min(100, (product.quantity / product.minimum) * 100);
              return (
                <div className="low-row" key={product.id}>
                  <span className="priority-number">{index + 1}</span>
                  <div
                    className={`product-symbol ${product.quantity === 0 ? "danger" : "warning"}`}
                  >
                    <Package size={22} />
                  </div>
                  <div className="low-info">
                    <div>
                      <strong>{product.name}</strong>
                      <span className={stockState(product).className}>
                        {stockState(product).label}
                      </span>
                    </div>
                    <div className="stock-bar">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <small>
                      {product.quantity} em estoque · Mínimo de {product.minimum}
                    </small>
                  </div>
                  <div className="missing-value">
                    <span>Faltam</span>
                    <strong>{missing} un.</strong>
                  </div>
                  <button className="button subtle" onClick={() => onMovement(product)}>
                    <PackagePlus size={19} /> Registrar entrada
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Nenhuma reposição necessária"
            text="Todos os produtos estão acima do estoque mínimo."
          />
        )}
      </section>
    </>
  );
}
