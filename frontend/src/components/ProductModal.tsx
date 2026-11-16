import { useState, type FormEvent } from "react";
import { AlertTriangle, PackageCheck, X } from "lucide-react";
import { Field } from "@/components/ui";
import { calculateMargin, formatPercent } from "@/lib/format";
import type { Product, ProductInput } from "@/types";

type ProductDraft = {
  name: string;
  quantity: string;
  minimum: string;
  purchasePrice: string;
  salePrice: string;
};

export function ProductModal({
  product,
  onClose,
  onSave,
}: {
  product?: Product;
  onClose: () => void;
  /** Deve lançar um erro com mensagem amigável se o salvamento falhar. */
  onSave: (input: ProductInput) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ProductDraft>({
    name: product?.name ?? "",
    quantity: product?.quantity.toString() ?? "",
    minimum: product?.minimum.toString() ?? "",
    purchasePrice: product?.purchasePrice.toString() ?? "",
    salePrice: product?.salePrice.toString() ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProductDraft, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const purchase = Number(draft.purchasePrice) || 0;
  const sale = Number(draft.salePrice) || 0;
  const calculatedMargin = calculateMargin(purchase, sale);
  const hasLoss = sale > 0 && purchase > sale;

  function update(field: keyof ProductDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof ProductDraft, string>> = {};
    if (!draft.name.trim()) nextErrors.name = "Digite o nome do produto.";
    if (
      draft.quantity === "" ||
      !Number.isInteger(Number(draft.quantity)) ||
      Number(draft.quantity) < 0
    )
      nextErrors.quantity = "Informe um número inteiro igual ou maior que zero.";
    if (draft.minimum === "" || !Number.isInteger(Number(draft.minimum)) || Number(draft.minimum) < 0)
      nextErrors.minimum = "Informe um número inteiro igual ou maior que zero.";
    if (draft.purchasePrice === "" || Number(draft.purchasePrice) < 0)
      nextErrors.purchasePrice = "Informe um preço de compra válido.";
    if (draft.salePrice === "" || Number(draft.salePrice) < 0)
      nextErrors.salePrice = "Informe um preço de venda válido.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: draft.name.trim(),
        quantity: Number(draft.quantity),
        minimum: Number(draft.minimum),
        // Arredonda para centavos, como o banco armazena.
        purchasePrice: Math.round(purchase * 100) / 100,
        salePrice: Math.round(sale * 100) / 100,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Não foi possível salvar.");
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">{product ? "Atualizar cadastro" : "Novo cadastro"}</span>
            <h2 id="product-modal-title">{product ? "Editar produto" : "Cadastrar produto"}</h2>
            <p>Preencha as informações abaixo. É bem rapidinho.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar">
            <X size={23} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <Field label="Nome do produto" error={errors.name} className="full">
              <input
                autoFocus
                value={draft.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Ex.: Arroz 5kg"
                maxLength={120}
              />
            </Field>
            <Field label="Quantidade em estoque" error={errors.quantity}>
              <input
                type="number"
                min="0"
                step="1"
                value={draft.quantity}
                onChange={(event) => update("quantity", event.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Estoque mínimo" error={errors.minimum}>
              <input
                type="number"
                min="0"
                step="1"
                value={draft.minimum}
                onChange={(event) => update("minimum", event.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Preço de compra" error={errors.purchasePrice}>
              <div className="money-input">
                <span>R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.purchasePrice}
                  onChange={(event) => update("purchasePrice", event.target.value)}
                  placeholder="0,00"
                />
              </div>
            </Field>
            <Field label="Preço de venda" error={errors.salePrice}>
              <div className="money-input">
                <span>R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.salePrice}
                  onChange={(event) => update("salePrice", event.target.value)}
                  placeholder="0,00"
                />
              </div>
            </Field>
          </div>
          <div className={`margin-panel ${hasLoss ? "loss" : ""}`}>
            <div>
              <span>Margem de lucro calculada</span>
              <strong>{formatPercent(calculatedMargin)}</strong>
            </div>
            <p>Comprou a R$ 4,00 e vende a R$ 5,00 → margem de 20%</p>
          </div>
          {hasLoss && (
            <div className="loss-warning">
              <AlertTriangle size={20} />
              <span>Atenção: você terá prejuízo neste produto.</span>
            </div>
          )}
          {submitError && (
            <div className="form-error">
              <AlertTriangle size={19} /> {submitError}
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="button ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="button primary" disabled={saving}>
              <PackageCheck size={20} /> {saving ? "Salvando…" : "Salvar produto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
