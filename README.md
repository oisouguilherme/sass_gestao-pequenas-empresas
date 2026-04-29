# SaaS Gestão para Pequenas Empresas

Sistema SaaS multi-tenant para gestão de pequenas empresas: PDV, ordens de serviço, clientes, produtos, usuários e relatórios.

## Stack

- **Backend:** Node.js · Express · TypeScript · Prisma · PostgreSQL · JWT · Zod · Bcrypt · Nodemailer
- **Frontend:** Vite · React 18 · TypeScript · Tailwind CSS v4 · React Query · React Router · Axios · React Hook Form · Zod

## Pré-requisitos

- Node.js 20+
- PostgreSQL 15+ rodando localmente
- npm 10+

## Setup

### 1. Banco de dados

Crie um banco vazio no Postgres local:

```bash
createdb saas_gestao
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# edite DATABASE_URL e os secrets JWT
npm install
npx prisma migrate dev   # aplica migrations
npx prisma db seed       # popula dados de exemplo
npm run dev
```

Backend sobe em `http://localhost:3333`. Verifique: `curl http://localhost:3333/health`.

#### Credenciais de seed

| Role     | E-mail              | Senha         |
| -------- | ------------------- | ------------- |
| ADMIN    | `admin@demo.com`    | `admin123`    |
| VENDEDOR | `vendedor@demo.com` | `vendedor123` |
| OPERADOR | `operador@demo.com` | `operador123` |

#### Endpoints principais

- `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/me`
- `GET|POST|PATCH|DELETE /users` (ADMIN para escrita)
- `GET|POST|PATCH|DELETE /products` · `GET /products/by-codigo/:codigo`
- `GET|POST|PATCH|DELETE /clients`
- `GET|POST|PATCH|DELETE /orders` · `PATCH /orders/:id/status` · `PUT /orders/:id/usuarios` · `PUT /orders/:id/produtos`
- `GET|POST /sales` · `POST /sales/:id/itens` · `DELETE /sales/:id/itens/:produtoId` · `PATCH /sales/:id/desconto` · `POST /sales/:id/finalizar` · `POST /sales/:id/cancelar`
- `GET /reports/sales?from&to&usuarioId&status`

#### E-mail em desenvolvimento

Sem `SMTP_*` configurados, o backend cria automaticamente uma conta no [Ethereal](https://ethereal.email/) e imprime no console o link de preview de cada e-mail enviado (ex.: ao atribuir usuários a uma OS).

### 3. Frontend

Em outro terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend sobe em `http://localhost:5173`.

#### Telas disponíveis

| Rota            | Acesso              | Descrição                                                            |
| --------------- | ------------------- | -------------------------------------------------------------------- |
| `/login`        | público             | Login por e-mail e senha                                             |
| `/`             | autenticado         | Dashboard com KPIs, OS recentes e ranking de vendas                  |
| `/sales`        | autenticado         | **PDV** com leitor de código (autofocus), desconto e finalização    |
| `/orders`       | autenticado         | Lista de OSs com filtros e criação; detalhe em abas (Dados/Usuários/Produtos/Status) |
| `/products`     | autenticado         | CRUD de produtos                                                     |
| `/clients`      | autenticado         | CRUD de clientes                                                     |
| `/users`        | ADMIN               | CRUD de usuários e papel (ADMIN/VENDEDOR/OPERADOR)                   |
| `/reports`      | ADMIN, VENDEDOR     | Relatório de vendas com filtros (período, usuário, status)            |

#### Fluxo de autenticação

- `accessToken` (15min) mantido **em memória** (nunca em `localStorage`).
- `refreshToken` em cookie **httpOnly + SameSite + Secure** com path `/auth`, rotacionado a cada uso.
- *Silent refresh* no boot da SPA + interceptor 401 → refresh automático → retry da request original.

## Estrutura

```
sass_gestao-pequenas-empresas/
├── backend/        # API Express + Prisma
│   └── src/
│       ├── app.ts
│       ├── server.ts
│       ├── modules/   # auth, users, products, clients, orders, sales, reports
│       └── shared/    # config, middlewares, errors, utils, mail
└── frontend/       # SPA Vite + React + Tailwind v4
    └── src/
        ├── pages/        # Login, Dashboard, Products, Clients, Users, Orders, Sales (PDV), Reports
        ├── components/   # ui/ + layout/
        ├── contexts/     # AuthContext
        └── lib/          # api (axios), format, types
```

## Roadmap (fases)

- ✅ **Fase 1** — Bootstrap (estrutura, deps, `/health`, página de teste com Tailwind)
- ✅ **Fase 2** — Modelagem Prisma + migrations + seed
- ✅ **Fase 3** — Camadas, infra compartilhada e Auth (JWT + refresh em cookie httpOnly)
- ✅ **Fase 4** — CRUDs de domínio (Users, Products, Clients, Orders, Sales)
- ✅ **Fase 5** — Serviço de e-mail (Nodemailer + Ethereal em dev)
- ✅ **Fase 6** — Relatórios
- ✅ **Fase 7** — Frontend completo (Login, Dashboard, PDV, OS, Produtos, Clientes, Usuários, Relatórios)
- ✅ **Fase 8** — Polimento + auditoria de segurança

## Segurança

- **Helmet** + `x-powered-by` desabilitado
- **CORS** restrito a `CORS_ORIGIN` com `credentials: true`
- **Rate limit** global (600 req / 15min) e mais agressivo no `/auth/login` (20 / 15min)
- **Senhas** com `bcryptjs` (10 rounds)
- **JWT**: access curto em memória, refresh httpOnly com **rotação** e revogação em DB (`sha256` no armazenamento)
- **Multi-tenant**: `empresaId` sempre vindo do token JWT — jamais do payload
- **Validação** com Zod em **todos** os endpoints
- **Erros padronizados** via `AppError` + handler global (mapeia Zod, Prisma P2002→409, P2025→404)

## Convenções

- **Multi-tenant**: toda query de domínio filtra por `empresaId` extraído do JWT — nunca do payload.
- **Soft delete** opcional via `deletedAt`.
- **REST API** com validação Zod, tratamento global de erros e códigos HTTP semânticos.
