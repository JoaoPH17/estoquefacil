import { useState, type FormEvent } from "react";
import { Box, Eye, EyeOff, Loader2, LogIn, PackageCheck, ShieldCheck, TriangleAlert } from "lucide-react";
import { Field } from "@/components/ui";
import * as api from "@/services/api";

/** Tela de login. Usuário e senha são conferidos pelo backend (/api/auth/login). */
export function Login({
  notice,
  onLogin,
}: {
  /** Aviso opcional, ex.: "Sessão expirada". */
  notice?: string;
  onLogin: (session: api.Session) => void;
}) {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user.trim() || !password) {
      setError("Preencha o usuário e a senha.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      onLogin(await api.login(user.trim(), password));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-hero" aria-hidden="true">
        <div className="login-brand">
          <div className="brand-icon">
            <Box size={25} strokeWidth={2.2} />
          </div>
          <span>EstoqueFácil</span>
        </div>
        <div className="login-hero-text">
          <h2>Seu estoque organizado, sem complicação.</h2>
          <p>Cadastre produtos, registre entradas e saídas e saiba na hora o que está acabando.</p>
        </div>
        <ul className="login-perks">
          <li>
            <PackageCheck size={20} /> Controle de produtos e margens
          </li>
          <li>
            <TriangleAlert size={20} /> Alertas de estoque baixo
          </li>
          <li>
            <ShieldCheck size={20} /> Acesso protegido por senha
          </li>
        </ul>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <div className="login-brand mobile-only">
            <div className="brand-icon">
              <Box size={25} strokeWidth={2.2} />
            </div>
            <span>EstoqueFácil</span>
          </div>

          <div className="login-heading">
            <h1>Entrar</h1>
            <p>Acesse o controle de estoque do mercado.</p>
          </div>

          {(error || notice) && (
            <div className={`login-alert ${error ? "error" : "info"}`} role="alert">
              {error || notice}
            </div>
          )}

          <Field label="Usuário">
            <input
              type="text"
              autoComplete="username"
              autoFocus
              placeholder="Digite seu usuário"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              disabled={loading}
            />
          </Field>

          <Field label="Senha">
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </Field>

          <button type="submit" className="button primary large login-submit" disabled={loading}>
            {loading ? <Loader2 size={19} className="spin" /> : <LogIn size={19} />}
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="login-footer">Projeto de Extensão — UPE</p>
      </section>
    </div>
  );
}
