import type { Product } from "@/types";

export const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const dateTime = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatPercent(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

/** Mesma fórmula do backend; usada para a prévia ao vivo no formulário. */
export function calculateMargin(purchasePrice: number, salePrice: number) {
  if (salePrice <= 0) return 0;
  return ((salePrice - purchasePrice) / salePrice) * 100;
}

export function isLowStock(product: Product) {
  return product.quantity < product.minimum;
}

export function stockState(product: Product) {
  if (product.quantity === 0) return { label: "Zerado", className: "status zero" };
  if (isLowStock(product)) return { label: "Baixo", className: "status low" };
  return { label: "OK", className: "status ok" };
}
