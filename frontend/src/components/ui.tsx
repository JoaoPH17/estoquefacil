import type { ReactNode } from "react";
import { PackageCheck, type LucideIcon } from "lucide-react";

export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`field ${className} ${error ? "has-error" : ""}`}>
      <span>{label}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  );
}

export function EmptyState({
  title,
  text,
  icon: Icon = PackageCheck,
  spin = false,
  children,
}: {
  title: string;
  text: string;
  icon?: LucideIcon;
  /** Faz o ícone girar (usado no "Carregando…"). */
  spin?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Icon size={34} className={spin ? "spin" : undefined} />
      <strong>{title}</strong>
      <span>{text}</span>
      {children}
    </div>
  );
}

export function Toast({ message }: { message: string }) {
  return (
    <div className="toast" role="status">
      <PackageCheck size={21} />
      {message}
    </div>
  );
}
