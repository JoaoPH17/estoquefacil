import { Box, ClipboardList, LayoutDashboard, Package, TriangleAlert, X } from "lucide-react";
import type { Page } from "@/types";

const navItems: { id: Page; label: string; icon: typeof Box }[] = [
  { id: "inicio", label: "Início", icon: LayoutDashboard },
  { id: "produtos", label: "Produtos", icon: Package },
  { id: "movimentacoes", label: "Movimentações", icon: ClipboardList },
  { id: "estoque-baixo", label: "Estoque baixo", icon: TriangleAlert },
];

export function Sidebar({
  page,
  open,
  lowCount,
  onNavigate,
  onClose,
}: {
  page: Page;
  open: boolean;
  lowCount: number;
  onNavigate: (page: Page) => void;
  onClose: () => void;
}) {
  return (
    <>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Box size={25} strokeWidth={2.2} />
          </div>
          <span>EstoqueFácil</span>
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="Fechar menu">
            <X size={22} />
          </button>
        </div>
        <nav className="nav-list" aria-label="Menu principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${page === item.id ? "active" : ""}`}
                onClick={() => onNavigate(item.id)}
              >
                <Icon size={21} />
                <span>{item.label}</span>
                {item.id === "estoque-baixo" && lowCount > 0 && (
                  <span className="nav-count">{lowCount}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="market-card">
          <div className="market-avatar">MS</div>
          <div>
            <strong>Mercado Super Bom</strong>
            <span>Controle de estoque</span>
          </div>
        </div>
      </aside>

      {open && <button className="sidebar-backdrop" onClick={onClose} aria-label="Fechar menu" />}
    </>
  );
}
