import { useEffect, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  Package,
  Search,
} from "lucide-react";
import { EmptyState, Field, PageHeading } from "@/components/ui";
import { dateTime } from "@/lib/format";
import type { Movement, MovementInput, MovementType, Product } from "@/types";

export function Movements({
  products,
  movements,
  selectedProductId,
  onSelectedProductId,
  onRegister,
}: {
  products: Product[];
  movements: Movement[];
  selectedProductId: number | null;
  onSelectedProductId: (id: number | null) => void;
  onRegister: (input: MovementInput) => Promise<void>;
}) {
  const [type, setType] = useState<MovementType>("entrada");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const product = products.find((item) => item.id === selectedProductId);
  const amount = Number(quantity) || 0;
  const newStock = product ? product.quantity + (type === "entrada" ? amount : -amount) : 0;
  const filteredProducts = products.filter((item) =>
    item.name.toLowerCase().includes(productSearch.toLowerCase()),
  );

  useEffect(() => {
    if (product) setProductSearch(product.name);
  }, [selectedProductId]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectProduct(item: Product) {
    onSelectedProductId(item.id);
    setProductSearch(item.name);
    setShowResults(false);
    setError("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!product) return setError("Escolha um produto para continuar.");
    if (!Number.isInteger(amount) || amount <= 0)
      return setError("Informe uma quantidade inteira maior que zero.");
    if (type === "saida" && amount > product.quantity)
      return setError("Quantidade maior que o estoque atual");

    setSaving(true);
    try {
      await onRegister({ productId: product.id, type, quantity: amount, note });
      setQuantity("");
      setNote("");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeading
        title="Movimentações"
        description="Registre tudo o que entra e sai do seu estoque."
      />
      <section className="movement-layout">
        <form className="card movement-form" onSubmit={submit}>
          <div className="section-heading compact">
            <div>
              <h2>Nova movimentação</h2>
              <p>Escolha o produto e informe a quantidade.</p>
            </div>
          </div>
          <div className="field product-search-field">
            <span>Buscar produto</span>
            <div className="search-box form-search">
              <Search size={20} />
              <input
                value={productSearch}
                onFocus={() => setShowResults(true)}
                onChange={(event) => {
                  setProductSearch(event.target.value);
                  onSelectedProductId(null);
                  setShowResults(true);
                }}
                placeholder="Digite o nome do produto…"
              />
            </div>
            {showResults && (
              <div className="product-results">
                {filteredProducts.slice(0, 6).map((item) => (
                  <button type="button" key={item.id} onClick={() => selectProduct(item)}>
                    <Package size={18} />
                    <span>{item.name}</span>
                    <small>{item.quantity} un.</small>
                  </button>
                ))}
                {!filteredProducts.length && <p>Nenhum produto encontrado.</p>}
              </div>
            )}
          </div>
          <div className="field">
            <span>Tipo de movimentação</span>
            <div className="movement-types">
              <button
                type="button"
                className={type === "entrada" ? "selected entry" : ""}
                onClick={() => {
                  setType("entrada");
                  setError("");
                }}
              >
                <ArrowDownToLine size={24} />
                <strong>Entrada</strong>
                <small>Adicionar ao estoque</small>
              </button>
              <button
                type="button"
                className={type === "saida" ? "selected exit" : ""}
                onClick={() => {
                  setType("saida");
                  setError("");
                }}
              >
                <ArrowUpFromLine size={24} />
                <strong>Saída</strong>
                <small>Retirar do estoque</small>
              </button>
            </div>
          </div>
          <Field label="Quantidade">
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value);
                setError("");
              }}
              placeholder="Digite a quantidade"
            />
          </Field>
          <Field label="Observação (opcional)">
            <textarea
              rows={3}
              maxLength={255}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ex.: Entrega do fornecedor"
            />
          </Field>
          {product && (
            <div className={`stock-preview ${newStock < 0 ? "invalid" : ""}`}>
              <span>Como ficará o estoque</span>
              <strong>
                Estoque atual: {product.quantity} <ChevronRight size={20} /> Novo estoque:{" "}
                {newStock}
              </strong>
            </div>
          )}
          {error && (
            <div className="form-error">
              <AlertTriangle size={19} /> {error}
            </div>
          )}
          <button
            className={`button full-button ${type === "entrada" ? "primary" : "orange"}`}
            type="submit"
            disabled={saving}
          >
            {type === "entrada" ? <ArrowDownToLine size={21} /> : <ArrowUpFromLine size={21} />}
            {saving ? "Registrando…" : `Confirmar ${type === "entrada" ? "entrada" : "saída"}`}
          </button>
        </form>

        <section className="card history-card">
          <div className="section-heading compact">
            <div>
              <h2>Histórico</h2>
              <p>Últimas entradas e saídas registradas.</p>
            </div>
          </div>
          {movements.length ? (
            <div className="history-list">
              {movements.map((movement) => (
                <div className="history-row" key={movement.id}>
                  <div className={`movement-icon ${movement.type}`}>
                    {movement.type === "entrada" ? (
                      <ArrowDownToLine size={20} />
                    ) : (
                      <ArrowUpFromLine size={20} />
                    )}
                  </div>
                  <div className="history-main">
                    <strong>{movement.productName}</strong>
                    <span>
                      {dateTime.format(new Date(movement.date))}
                      {movement.note && ` · ${movement.note}`}
                    </span>
                  </div>
                  <div className="history-values">
                    <strong className={movement.type}>
                      {movement.type === "entrada" ? "+" : "−"}
                      {movement.quantity} un.
                    </strong>
                    <span>Saldo: {movement.resultingStock}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhuma movimentação ainda"
              text="As entradas e saídas registradas aparecerão aqui."
            />
          )}
        </section>
      </section>
    </>
  );
}
