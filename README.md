# EstoqueFácil

Sistema simples de cadastro de produtos e controle de estoque para pequenos mercados.
Projeto de Extensão — Engenharia de Software / Gestão de Projetos (UPE).

```
estoquefacil/
├── frontend/              React + Vite + TypeScript (telas)
│   └── src/
│       ├── App.tsx            Layout geral e navegação entre telas
│       ├── pages/             Telas: Login, Dashboard, Products, Movements, LowStock
│       ├── components/        Peças reutilizáveis: Sidebar, ProductModal, ConfirmModal, ui
│       ├── hooks/useEstoque.ts  Estado do estoque (carrega e altera dados via API)
│       ├── services/api.ts    ÚNICO arquivo que conversa com o backend
│       ├── lib/format.ts      Formatação (R$, %, datas) e regras de status do estoque
│       └── types.ts           Tipos de dados usados no frontend
│
├── backend/               API em Python (FastAPI + SQLAlchemy)
│   ├── app/
│   │   ├── main.py            Cria a API, CORS, rotas e tabelas
│   │   ├── config.py          Lê DATABASE_URL, CORS_ORIGINS, SEED_DATA
│   │   ├── database.py        Conexão com o banco
│   │   ├── models.py          Tabelas: produtos e movimentacoes
│   │   ├── schemas.py         Validação dos dados de entrada e saída
│   │   ├── auth.py            Login (/api/auth/login) e proteção das rotas
│   │   ├── routers/           Rotas /api/produtos e /api/movimentacoes
│   │   └── seed.py            15 produtos de exemplo
│   ├── tests/                 Testes automáticos (pytest)
│   ├── requirements.txt
│   └── Dockerfile
│
└── docker-compose.yml     PostgreSQL local para testes
```

## Como funciona

```
Navegador ──► frontend (React) ──► services/api.ts ──HTTP/JSON──► backend (FastAPI) ──► banco de dados
```

- A **margem de lucro** é calculada no backend: `(venda − compra) ÷ venda × 100`
  (comprado a R$ 4,00 e vendido a R$ 5,00 → 20%).
- A **quantidade nunca fica negativa**: o backend recusa saídas maiores que o estoque,
  e o banco tem uma regra (`CHECK`) que garante isso.
- Ao registrar uma movimentação, o estoque do produto é atualizado na mesma transação.
- Ao excluir um produto, o **histórico de movimentações é mantido**.

## Rodar no computador (desenvolvimento)

Pré-requisitos: **Python 3.11+** e **Node.js 20+**.

**1. Backend** (terminal 1):

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    |    Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # no Windows: copy .env.example .env
uvicorn app.main:app --reload
```

A API sobe em http://localhost:8000. A documentação interativa, onde dá para testar cada
rota, fica em **http://localhost:8000/docs**.

Por padrão o backend usa **SQLite** (um arquivo `estoquefacil.db`), então funciona sem
instalar banco nenhum, já com os 15 produtos de exemplo.

**2. Frontend** (terminal 2):

```bash
cd frontend
npm install
npm run dev
```

Abra **http://localhost:5173** e entre com o usuário **`adm123`** e a senha **`012345`**. Em desenvolvimento, o Vite redireciona as chamadas `/api`
para o backend em `localhost:8000`.

**Testes do backend:**

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

## Rotas da API

Todas as rotas de produtos e movimentações exigem login: envie o token recebido em
`/api/auth/login` no cabeçalho `Authorization: Bearer <token>`. No `/docs`, use o botão
**Authorize** para colar o token.

| Método | Rota | O que faz |
|---|---|---|
| POST | `/api/auth/login` | Entra no sistema (`{"usuario": "adm123", "senha": "012345"}`) e devolve o token |
| GET | `/api/auth/eu` | Confirma se o token ainda é válido |
| GET | `/api/produtos?busca=arroz&estoque_baixo=true` | Lista produtos (filtros opcionais) |
| GET | `/api/produtos/{id}` | Consulta um produto |
| POST | `/api/produtos` | Cadastra produto |
| PUT | `/api/produtos/{id}` | Edita produto |
| DELETE | `/api/produtos/{id}` | Exclui produto |
| GET | `/api/movimentacoes?limite=50` | Histórico de entradas e saídas |
| POST | `/api/movimentacoes` | Registra entrada ou saída e atualiza o estoque |
| GET | `/api/saude` | Verifica se a API e o banco estão no ar |

Exemplo de cadastro:

```json
POST /api/produtos
{ "nome": "Arroz 5kg", "quantidade": 24, "estoque_minimo": 10, "preco_compra": 23.90, "preco_venda": 31.90 }
```

## Conectar ao PostgreSQL

O backend escolhe o banco pela variável **`DATABASE_URL`** no arquivo `backend/.env`.
Não é preciso mudar código: as tabelas são criadas automaticamente na primeira execução.

**PostgreSQL local** (com Docker instalado):

```bash
docker compose up -d db
```

e no `backend/.env`:

```
DATABASE_URL=postgresql://estoquefacil:estoquefacil@localhost:5432/estoquefacil
```

**PostgreSQL na nuvem** (Neon, Supabase, Render, Railway...): crie o banco no provedor,
copie a *connection string* e cole em `DATABASE_URL`. URLs que começam com `postgres://`
ou `postgresql://` são aceitas; o backend ajusta o driver sozinho.

Para rodar os testes contra o PostgreSQL:

```bash
TEST_DATABASE_URL=postgresql://usuario:senha@host:5432/banco_de_teste pytest
```

> Use um banco **separado** para os testes: eles apagam as tabelas ao final.

## Hospedar na nuvem (Supabase + Vercel)

São três partes: o banco no **Supabase** e dois projetos na **Vercel** (backend e frontend),
ambos criados a partir deste mesmo repositório.

### 1. Banco de dados (Supabase)

1. Em [supabase.com](https://supabase.com), crie um projeto e **anote a senha do banco**.
2. No projeto, clique em **Connect** e copie a URL do **Transaction pooler** (porta `6543`):
   `postgresql://postgres.xxxx:[SUA-SENHA]@aws-0-xx.pooler.supabase.com:6543/postgres`
3. Troque `[SUA-SENHA]` pela senha. Se ela tiver caracteres especiais (`@ # / : ?`),
   escreva-os codificados (`@` → `%40`, `#` → `%23`), ou crie uma senha só com letras e números.

As tabelas são criadas sozinhas no primeiro acesso à API.

### 2. Backend (Vercel)

1. Na Vercel: **Add New → Project**, importe este repositório.
2. **Root Directory:** `backend` · **Framework Preset:** Other.
3. Em **Environment Variables**:
   - `DATABASE_URL` = URL do Supabase (passo 1)
   - `SECRET_KEY` = valor longo e aleatório (`python -c "import secrets; print(secrets.token_hex(32))"`)
   - `ADMIN_USUARIO` e `ADMIN_SENHA` = login do sistema (troque o padrão `adm123` / `012345`)
   - `SEED_DATA` = `true` só se quiser os 15 produtos de exemplo; senão `false`
   - `CORS_ORIGINS` = endereço do frontend (preencha depois do passo 3)
4. **Deploy.** Teste em `https://SEU-BACKEND.vercel.app/api/saude` → `{"status":"ok"}`.

O backend usa `backend/api/index.py` e `backend/vercel.json` para rodar como função serverless.

### 3. Frontend (Vercel)

1. **Add New → Project**, importe o **mesmo** repositório de novo.
2. **Root Directory:** `frontend` · **Framework Preset:** Vite (detectado sozinho).
3. Variável de ambiente: `VITE_API_URL` = endereço do backend, ex.: `https://SEU-BACKEND.vercel.app`
   (sem `/` no final).
4. **Deploy.**

### 4. Ligar os dois

Copie o endereço do frontend (ex.: `https://estoquefacil.vercel.app`), coloque em
`CORS_ORIGINS` no projeto do backend (**Settings → Environment Variables**) e faça
**Redeploy** do backend. Sem isso, o navegador bloqueia as chamadas e o login mostra erro.

> Variáveis da Vercel só valem depois de um novo deploy. Se mudar `VITE_API_URL`, faça
> redeploy do frontend; se mudar qualquer outra, do backend.

### Outras hospedagens

O backend também roda em qualquer serviço com Python ou Docker (Render, Railway, Fly.io):
instalação `pip install -r requirements.txt`, início
`uvicorn app.main:app --host 0.0.0.0 --port $PORT` (ou o `Dockerfile`), mesmas variáveis
de ambiente e health check em `/api/saude`.

## Próximos passos sugeridos

- **Vários usuários:** hoje existe um único login, definido na configuração. Se o mercado
  precisar de contas separadas, crie uma tabela de usuários com senhas criptografadas (bcrypt).
- **Migrações com Alembic:** o `create_all` cria tabelas novas, mas não altera tabelas
  existentes. Se a estrutura mudar depois que houver dados reais, use Alembic.
- **Backup:** ative o backup automático do provedor do PostgreSQL. A proposta lista a
  perda de dados como um dos riscos.
