import { useCallback, useEffect, useMemo, useState } from "react";
import * as api from "@/services/api";
import { isLowStock } from "@/lib/format";
import type { Movement, MovementInput, Product, ProductInput } from "@/types";

/**
 * Estado do estoque vindo do backend. As telas usam este hook em vez de chamar a API
 * diretamente. As funções de alteração lançam `ApiError` em caso de erro, para que a
 * tela mostre a mensagem ao usuário.
 */
export function useEstoque() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [productList, movementList] = await Promise.all([
        api.listProducts(),
        api.listMovements(),
      ]);
      setProducts(productList);
      setMovements(movementList);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Erro ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const lowProducts = useMemo(
    () =>
      products
        .filter(isLowStock)
        .sort((a, b) => a.quantity / a.minimum - b.quantity / b.minimum),
    [products],
  );

  async function saveProduct(input: ProductInput, id?: number) {
    const saved = id ? await api.updateProduct(id, input) : await api.createProduct(input);
    setProducts((current) => {
      const next = id
        ? current.map((item) => (item.id === id ? saved : item))
        : [...current, saved];
      return next.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    });
    if (id) {
      // Mantém o nome atualizado no histórico exibido.
      setMovements((current) =>
        current.map((m) => (m.productId === id ? { ...m, productName: saved.name } : m)),
      );
    }
    return saved;
  }

  async function removeProduct(id: number) {
    await api.deleteProduct(id);
    setProducts((current) => current.filter((item) => item.id !== id));
    setMovements((current) => current.map((m) => (m.productId === id ? { ...m, productId: null } : m)));
  }

  async function registerMovement(input: MovementInput) {
    const { movement, product } = await api.createMovement(input);
    setProducts((current) => current.map((item) => (item.id === product.id ? product : item)));
    setMovements((current) => [movement, ...current]);
    return movement;
  }

  return {
    products,
    movements,
    lowProducts,
    loading,
    loadError,
    reload,
    saveProduct,
    removeProduct,
    registerMovement,
  };
}
