/**
 * Comunicação com o backend (FastAPI).
 *
 * O backend usa nomes em português (nome, preco_venda...) e o frontend usa os tipos de
 * `types.ts`. As funções `toProduct` / `fromProductInput` fazem essa tradução, então o
 * restante do frontend não precisa saber como a API organiza os dados.
 */
import type { Movement, MovementInput, Product, ProductInput } from "@/types";

/** Vazio em desenvolvimento (usa o proxy do Vite); em produção, o endereço da API. */
const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

// ---------- Login (sessão) ----------

const TOKEN_KEY = "estoquefacil.token";
const USER_KEY = "estoquefacil.usuario";

export type Session = { token: string; user: string };

export function getSession(): Session | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);
  return token && user ? { token, user } : null;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Chamado quando a API responde 401 (token expirado/inválido). Definido pelo App. */
let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  const token = getSession()?.token;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError("Não foi possível conectar ao servidor. Verifique a internet.", 0);
  }

  if (response.status === 401 && token) {
    clearSession();
    onUnauthorized();
  }

  if (!response.ok) {
    let message =
      response.status >= 500
        ? "O servidor não está respondendo. Tente novamente em instantes."
        : "Algo deu errado. Tente novamente.";
    try {
      const body = await response.json();
      if (typeof body.detail === "string") message = body.detail;
      else if (Array.isArray(body.detail)) message = "Verifique os dados informados.";
    } catch {
      /* resposta sem JSON */
    }
    throw new ApiError(message, response.status);
  }

  return response.status === 204 ? (undefined as T) : response.json();
}

// ---------- Formatos da API ----------

type ApiProduct = {
  id: number;
  nome: string;
  quantidade: number;
  estoque_minimo: number;
  preco_compra: number;
  preco_venda: number;
  margem_lucro: number;
};

type ApiMovement = {
  id: number;
  produto_id: number | null;
  produto_nome: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  estoque_resultante: number;
  observacao: string | null;
  data: string;
};

function toProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.nome,
    quantity: p.quantidade,
    minimum: p.estoque_minimo,
    purchasePrice: p.preco_compra,
    salePrice: p.preco_venda,
    margin: p.margem_lucro,
  };
}

function fromProductInput(p: ProductInput) {
  return {
    nome: p.name,
    quantidade: p.quantity,
    estoque_minimo: p.minimum,
    preco_compra: p.purchasePrice,
    preco_venda: p.salePrice,
  };
}

function toMovement(m: ApiMovement): Movement {
  return {
    id: m.id,
    productId: m.produto_id,
    productName: m.produto_nome,
    type: m.tipo,
    quantity: m.quantidade,
    resultingStock: m.estoque_resultante,
    note: m.observacao ?? undefined,
    date: m.data,
  };
}

// ---------- Login ----------

export async function login(user: string, password: string): Promise<Session> {
  const data = await request<{ token: string; usuario: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ usuario: user, senha: password }),
  });
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, data.usuario);
  return { token: data.token, user: data.usuario };
}

// ---------- Produtos ----------

export async function listProducts(): Promise<Product[]> {
  return (await request<ApiProduct[]>("/api/produtos")).map(toProduct);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const data = await request<ApiProduct>("/api/produtos", {
    method: "POST",
    body: JSON.stringify(fromProductInput(input)),
  });
  return toProduct(data);
}

export async function updateProduct(id: number, input: ProductInput): Promise<Product> {
  const data = await request<ApiProduct>(`/api/produtos/${id}`, {
    method: "PUT",
    body: JSON.stringify(fromProductInput(input)),
  });
  return toProduct(data);
}

export async function deleteProduct(id: number): Promise<void> {
  await request<void>(`/api/produtos/${id}`, { method: "DELETE" });
}

// ---------- Movimentações ----------

export async function listMovements(limit = 50): Promise<Movement[]> {
  return (await request<ApiMovement[]>(`/api/movimentacoes?limite=${limit}`)).map(toMovement);
}

export async function createMovement(
  input: MovementInput,
): Promise<{ movement: Movement; product: Product }> {
  const data = await request<{ movimentacao: ApiMovement; produto: ApiProduct }>(
    "/api/movimentacoes",
    {
      method: "POST",
      body: JSON.stringify({
        produto_id: input.productId,
        tipo: input.type,
        quantidade: input.quantity,
        observacao: input.note,
      }),
    },
  );
  return { movement: toMovement(data.movimentacao), product: toProduct(data.produto) };
}
