export type Page = "inicio" | "produtos" | "movimentacoes" | "estoque-baixo";

export type MovementType = "entrada" | "saida";

export type Product = {
  id: number;
  name: string;
  quantity: number;
  minimum: number;
  purchasePrice: number;
  salePrice: number;
  /** Calculada pelo backend, em %. */
  margin: number;
};

/** Dados enviados ao cadastrar ou editar um produto. */
export type ProductInput = Omit<Product, "id" | "margin">;

export type Movement = {
  id: number;
  /** Fica nulo se o produto foi excluído; o histórico é mantido. */
  productId: number | null;
  productName: string;
  type: MovementType;
  quantity: number;
  resultingStock: number;
  note?: string;
  date: string;
};

export type MovementInput = {
  productId: number;
  type: MovementType;
  quantity: number;
  note?: string;
};
