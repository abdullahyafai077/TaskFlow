# TaskFlow

### Real-time, multi-tenant project management — built like a product, not a tutorial.

TaskFlow is a **Linear / mini-Jira style** SaaS board where teams collaborate inside isolated **workspaces**, manage **projects**, move **tasks** across a live Kanban, and see an **activity stream** update the moment something changes — for everyone in that workspace only.

| | |
|---|---|
| **Frontend** | Next.js 16 · App Router · TypeScript · Tailwind CSS · Zustand · @dnd-kit |
| **Backend** | Express · MongoDB (Mongoose) · JWT · Socket.io rooms |
| **Patterns** | Multi-tenancy · RBAC · Optimistic UI · Audit logging · Modular API |

---

## Why this exists

Most portfolio “todo apps” are a single list + one user. Real teams need:

- Separate spaces for different teams/clients (**multi-tenancy**)
- Different powers for different people (**RBAC**)
- Instant updates without refresh (**realtime rooms**)
- A board that feels snappy (**optimistic drag-and-drop**)
- A trail of who did what (**audit / activity feed**)

TaskFlow implements those production concerns end-to-end so you can demo **system design**, not just CRUD.

---

## Features

- **Auth** — Register / login with JWT (`Authorization: Bearer`)
- **Workspaces** — Create orgs; invite members by email (must be registered)
- **Projects** — Multiple boards per workspace
- **Kanban tasks** — Status, priority, tags, assignee, subtasks
- **Optimistic DnD** — Drag cards; UI updates instantly, server reconciles
- **Socket.io rooms** — `workspace_{id}` — events never leak across tenants
- **Live activity** — e.g. *“Ali moved Design mockups to Done”*
- **Role-based UI + API** — Settings and deletes gated by role

### Roles at a glance

| Role | Workspace settings | Add members | Create projects | Tasks (create/update/move) | Delete tasks |
|------|:------------------:|:-----------:|:---------------:|:--------------------------:|:------------:|
| **Admin** | Yes | Yes | Yes | Yes | Yes |
| **Manager** | View | No | Yes | Yes | Yes |
| **Member** | No | No | No | Yes | No |

---

## Architecture

```
┌─────────────────────┐         REST + JWT          ┌─────────────────────┐
│  Next.js Client     │ ──────────────────────────► │  Express API         │
│  Zustand · DnD UI   │                             │  Auth · RBAC · CRUD  │
│  Activity sidebar   │ ◄──── Socket.io rooms ────► │  Audit · Emit        │
└─────────────────────┘                             └──────────┬──────────┘
                                                               │
                                                               ▼
                                                         MongoDB Atlas
```

**Data model:** `User` → `Workspace` (members + roles) → `Project` → `Task` (+ `AuditLog`)

Realtime is **scoped**: clients `join('workspace_' + id)` after JWT + membership checks. Global broadcast is intentionally not used.

---

## Quick start

### Prerequisites

- Node.js 18+
- MongoDB Atlas (or local Mongo) with your IP whitelisted

### 1 — API

```bash
cd Server
cp .env.example .env
# Set MONGO_URI, JWT_SECRET, CLIENT_ORIGIN=http://localhost:3000
npm install
npm run dev
# → http://localhost:5000
```

### 2 — Web app

```bash
cd Client
cp .env.local.example .env.local
npm install
npm run dev
# → http://localhost:3000
```

### 3 — Two-minute demo

1. Open `/register` → create an account  
2. Create a **workspace**  
3. Create a **project** → open the board  
4. Add tasks → drag across **Todo / In Progress / Done**  
5. Watch **Live activity**  
6. Second browser (or incognito) → same login/workspace → moves sync live  
7. **Settings** (Admin) → invite another registered user by email  

---

## API surface (high level)

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` |
| Workspaces | `GET/POST /api/workspaces` · `GET/PATCH /api/workspaces/:id` · `POST .../members` |
| Projects | `GET/POST /api/workspaces/:id/projects` · `PATCH/DELETE /api/projects/:id` |
| Tasks | `GET/POST /api/projects/:id/tasks` · `PATCH/DELETE /api/tasks/:id` · `POST .../reorder` |
| Activity | `GET /api/workspaces/:id/activity` |

**Socket** (token in `handshake.auth.token`): `workspace:join` / `workspace:leave` → events `task:created` · `task:updated` · `task:deleted` · `task:reordered` · `activity:new`

---

## Repository layout

```
TaskFlow/
├── Client/                 # Next.js App Router
│   ├── app/(auth)/         # Login · Register
│   ├── app/(app)/          # Protected shell · workspace · board · settings
│   ├── components/         # UI · layout · board · activity
│   ├── stores/             # Zustand (auth + board)
│   └── lib/                # API · socket · types
├── Server/
│   ├── index.js            # Entry
│   └── src/
│       ├── models/         # User · Workspace · Project · Task · AuditLog
│       ├── middleware/     # Auth · RBAC · errors
│       ├── routes/         # REST modules
│       └── services/       # Socket rooms · audit
└── docs/
    └── PROJECT-GUIDE-URDU.md   # Roman Urdu deep-dive (for explainers)
```

---

## What to say in interviews

- **Multi-tenancy:** tasks always belong to a project *and* a workspace; sockets are room-scoped so Tenant A never sees Tenant B.  
- **RBAC:** middleware enforces `Admin | Manager | Member` on the server — UI alone is not security.  
- **Optimistic UI:** Kanban moves update locally first, then `reorder` persists; failures roll back.  
- **Observability for humans:** every meaningful mutation writes an `AuditLog` and streams to the room.

---

## License

MIT — use it, fork it, ship it in your portfolio.

---

**Built for portfolio depth:** auth · tenancy · roles · realtime · optimistic UX · modular full-stack architecture.
