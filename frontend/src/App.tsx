import { useEffect, useState } from "react";
import { Box, Loader2, Menu, WifiOff } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ProductModal } from "@/components/ProductModal";
import { Sidebar } from "@/components/Sidebar";
import { EmptyState, Toast } from "@/components/ui";
import { useEstoque } from "@/hooks/useEstoque";
import { Dashboard } from "@/pages/Dashboard";
import { LowStock } from "@/pages/LowStock";
import { Movements } from "@/pages/Movements";
import { Products } from "@/pages/Products";
import type { Page, Product } from "@/types";

function App() {
  const estoque = useEstoque();
  const [page, setPage] = useState<Page>("inicio");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productModal, setProductModal] = useState<Product | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [toast, setToast] = useState("");
  const [movementProductId, setMovementProductId] = useState<number | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function navigate(nextPage: Page) {
    setPage(nextPage);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startMovement(product?: Product) {
    if (product) setMovementProductId(product.id);
    navigate("movimentacoes");
  }

  function renderPage() {
    if (estoque.loading) {
      return <EmptyState icon={Loader2} spin title="Carregando…" text="Buscando os dados do estoque." />;
    }
    if (estoque.loadError) {
      return (
        <EmptyState icon={WifiOff} title="Não foi possível carregar" text={estoque.loadError}>
          <button className="button primary" onClick={() => void estoque.reload()}>
            Tentar novamente
          </button>
        </EmptyState>
      );
    }
    switch (page) {
      case "inicio":
        return (
          <Dashboard
            products={estoque.products}
            lowProducts={estoque.lowProducts}
            onNavigate={navigate}
            onNewProduct={() => setProductModal("new")}
            onMovement={startMovement}
          />
        );
      case "produtos":
        return (
          <Products
            products={estoque.products}
            onNew={() => setProductModal("new")}
            onEdit={setProductModal}
            onDelete={setDeleteTarget}
          />
        );
      case "movimentacoes":
        return (
          <Movements
            products={estoque.products}
            movements={estoque.movements}
            selectedProductId={movementProductId}
            onSelectedProductId={setMovementProductId}
            onRegister={async (input) => {
              await estoque.registerMovement(input);
              setToast(`${input.type === "entrada" ? "Entrada" : "Saída"} registrada!`);
            }}
          />
        );
      case "estoque-baixo":
        return <LowStock products={estoque.lowProducts} onMovement={startMovement} />;
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        open={sidebarOpen}
        lowCount={estoque.lowProducts.length}
        onNavigate={navigate}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-content">
        <header className="mobile-header">
          <button
            className="icon-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={24} />
          </button>
          <div className="mobile-brand">
            <Box size={22} />
            EstoqueFácil
          </div>
        </header>

        <div className="page-container">{renderPage()}</div>
      </main>

      {productModal && (
        <ProductModal
          product={productModal === "new" ? undefined : productModal}
          onClose={() => setProductModal(null)}
          onSave={async (input) => {
            await estoque.saveProduct(input, productModal === "new" ? undefined : productModal.id);
            setProductModal(null);
            setToast("Produto salvo!");
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          product={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await estoque.removeProduct(deleteTarget.id);
            setDeleteTarget(null);
            setToast("Produto excluído.");
          }}
        />
      )}
      {toast && <Toast message={toast} />}
    </div>
  );
}

export default App;
