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
npm run dev
```

Backend sobe em `http://localhost:3333`. Verifique: `curl http://localhost:3333/health`.

> Migrations e seed serão adicionados na **Fase 2**.

### 3. Frontend

Em outro terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend sobe em `http://localhost:5173`.

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
        ├── pages/
        ├── components/
        ├── services/
        ├── hooks/
        ├── contexts/
        └── layouts/
```

## Roadmap (fases)

- ✅ **Fase 1** — Bootstrap (estrutura, deps, `/health`, página de teste com Tailwind)
- ⏳ **Fase 2** — Modelagem Prisma + migrations + seed
- ⏳ **Fase 3** — Camadas, infra compartilhada e Auth (JWT + refresh em cookie httpOnly)
- ⏳ **Fase 4** — CRUDs de domínio (Users, Products, Clients, Orders, Sales)
- ⏳ **Fase 5** — Serviço de e-mail (Nodemailer + Ethereal em dev)
- ⏳ **Fase 6** — Relatórios
- ⏳ **Fase 7** — Frontend completo (telas)
- ⏳ **Fase 8** — Qualidade, segurança, README final

## Convenções

- **Multi-tenant**: toda query de domínio filtra por `empresaId` extraído do JWT — nunca do payload.
- **Soft delete** opcional via `deletedAt`.
- **REST API** com validação Zod, tratamento global de erros e códigos HTTP semânticos.
