import { useState } from "react";
import { Edit3, Package, Plus, Search, Trash2, X } from "lucide-react";
import { EmptyState, PageHeading } from "@/components/ui";
import { currency, formatPercent, stockState } from "@/lib/format";
import type { Product } from "@/types";

export function Products({
  products,
  onNew,
  onEdit,
  onDelete,
}: {
  products: Product[];
  onNew: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = products.filter((product) =>
    product.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <div className="heading-with-action">
        <PageHeading
          title="Produtos"
          description={`${products.length} produtos cadastrados no estoque.`}
        />
        <button className="button primary large" onClick={onNew}>
          <Plus size={21} /> Cadastrar produto
        </button>
      </div>
      <div className="search-box">
        <Search size={22} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar produto pelo nome…"
          aria-label="Buscar produto pelo nome"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Limpar busca">
            <X size={20} />
          </button>
        )}
      </div>
      <section className="card table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Quantidade</th>
                <th>Estoque mínimo</th>
                <th>Preço de compra</th>
                <th>Preço de venda</th>
                <th>Margem</th>
                <th className="actions-cell">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const state = stockState(product);
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="table-product">
                        <div className="product-symbol neutral">
                          <Package size={19} />
                        </div>
                        <strong>{product.name}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="quantity-cell">
                        <strong>{product.quantity} un.</strong>
                        <span className={state.className}>{state.label}</span>
                      </div>
                    </td>
                    <td>{product.minimum} un.</td>
                    <td>{currency.format(product.purchasePrice)}</td>
                    <td>{currency.format(product.salePrice)}</td>
                    <td>
                      <strong className="margin-value">{formatPercent(product.margin)}</strong>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="icon-action"
                        onClick={() => onEdit(product)}
                        title="Editar produto"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        className="icon-action delete"
                        onClick={() => onDelete(product)}
                        title="Excluir produto"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <EmptyState
            title={products.length ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            text={
              products.length
                ? "Tente buscar por outro nome."
                : "Clique em “Cadastrar produto” para começar."
            }
          />
        )}
      </section>
    </>
  );
}
