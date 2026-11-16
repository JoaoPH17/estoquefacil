# EstoqueFácil

Sistema simples de cadastro de produtos e controle de estoque para pequenos mercados.
Projeto de Extensão — Engenharia de Software / Gestão de Projetos (UPE).

```
estoquefacil/
├── frontend/              React + Vite + TypeScript (telas)
│   └── src/
│       ├── App.tsx            Layout geral e navegação entre telas
│       ├── pages/             Telas: Dashboard, Products, Movements, LowStock
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

Abra **http://localhost:5173**. Em desenvolvimento, o Vite redireciona as chamadas `/api`
para o backend em `localhost:8000`.

**Testes do backend:**

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

## Rotas da API

| Método | Rota | O que faz |
|---|---|---|
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

## Hospedar na nuvem

São três partes, que podem ficar em serviços diferentes:

**1. Banco de dados:** crie um PostgreSQL gerenciado e guarde a URL de conexão.

**2. Backend** (qualquer serviço que rode Python ou Docker, ex.: Render, Railway, Fly.io):
- Pasta raiz: `backend`
- Comando de instalação: `pip install -r requirements.txt`
- Comando de início: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  (ou use o `Dockerfile`, que já faz isso)
- Variáveis de ambiente:
  - `DATABASE_URL` = URL do PostgreSQL
  - `CORS_ORIGINS` = endereço do frontend publicado, ex.: `https://estoquefacil.vercel.app`
  - `SEED_DATA` = `false`
- Health check: `/api/saude`

**3. Frontend** (qualquer hospedagem de site estático, ex.: Vercel, Netlify, Cloudflare Pages):
- Pasta raiz: `frontend`
- Comando de build: `npm run build`
- Pasta publicada: `dist`
- Variável de ambiente: `VITE_API_URL` = endereço do backend publicado,
  ex.: `https://estoquefacil-api.onrender.com`

Depois de publicar o frontend, confira se o endereço dele está em `CORS_ORIGINS` no backend.
Sem isso, o navegador bloqueia as chamadas.

## Próximos passos sugeridos

- **Login:** hoje a API é aberta. Antes de colocar dados reais na internet, adicione
  autenticação (usuário e senha do mercado), por exemplo com tokens JWT no FastAPI.
- **Migrações com Alembic:** o `create_all` cria tabelas novas, mas não altera tabelas
  existentes. Se a estrutura mudar depois que houver dados reais, use Alembic.
- **Backup:** ative o backup automático do provedor do PostgreSQL. A proposta lista a
  perda de dados como um dos riscos.
