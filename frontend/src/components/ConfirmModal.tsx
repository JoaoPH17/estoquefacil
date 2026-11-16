import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import type { Product } from "@/types";

export function ConfirmModal({
  product,
  onCancel,
  onConfirm,
}: {
  product: Product;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir.");
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal confirm-modal" role="dialog" aria-modal="true">
        <div className="confirm-icon">
          <Trash2 size={27} />
        </div>
        <h2>Excluir produto?</h2>
        <p>
          Tem certeza que deseja excluir <strong>{product.name}</strong>? Esta ação não pode ser
          desfeita.
        </p>
        {error && (
          <div className="form-error">
            <AlertTriangle size={19} /> {error}
          </div>
        )}
        <div className="modal-actions">
          <button className="button ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button className="button danger-button" onClick={confirm} disabled={busy}>
            {busy ? "Excluindo…" : "Sim, excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
