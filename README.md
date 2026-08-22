# TaskFlow — Multi-tenant Project Management Backend

TaskFlow is a production-ready, multi-tenant project management backend built with **Node.js, Express, TypeScript, PostgreSQL, Prisma ORM, Redis, and BullMQ**.

---

## Technical Features & Highlights

- **Data Modeling & Database Design (Task 01)**:
  - 7 Normalized Tables: `users`, `organizations`, `org_members`, `projects`, `tasks`, `task_assignments`, `comments`, and `refresh_tokens`.
  - Documented Foreign Keys with `CASCADE` rules.
  - PostgreSQL Enums: `Status` (`todo`, `in_progress`, `review`, `done`), `Priority` (`low`, `medium`, `high`, `urgent`), `Role` (`org_admin`, `member`).
  - Performance-optimized multi-column indexes (`tasks(org_id, status)`, `tasks(org_id, priority)`, `tasks(project_id, deleted_at)`).
  - ★ **Soft Delete** (`deleted_at`) on projects and tasks.
  - ★ **Full-Text Search** on task title and description.
  - Database seed script populating 2 Orgs, 5 Users, Projects, 10+ Tasks, Assignments, and Comments.

- **Authentication & RBAC Security (Task 02)**:
  - Password hashing with **bcrypt cost factor 12**.
  - JWT Access Token (15-min TTL) & Refresh Tokens (7-day TTL) stored in DB with **Refresh Token Rotation** and revocation support.
  - Organization-level Role-Based Access Control (`org_admin`, `member`).
  - Automatic multi-tenant context middleware enforcing strict `org_id` scoping.
  - **Cross-tenant 403 Forbidden** protection.
  - Auth rate limiting: **10 requests/minute/IP**.

- **REST API (Task 03)**:
  - Clean Route → Controller → Service → Data separation.
  - Full CRUD for Projects and Tasks.
  - Flexible Filters: Status, Priority, Assignee, Due-Date range, and Full-Text Search.
  - Dual Pagination: Offset-based (`page`, `limit`, `total`) and Cursor-based (`cursor`, `next_cursor`).
  - Zod validation and consistent JSON error response structure.
  - Task Assignment & Unassignment.
  - Project Dashboard with status counts.
  - ★ **Bulk task status update**.

- **Background Jobs & Worker (Task 04)**:
  - **Redis + BullMQ** queue processing asynchronous task assignment email notifications.
  - Transactional consistency handling for DB assignment + Queue enqueueing.
  - ★ **5-second deduplication** key preventing duplicate assignment emails.
  - Worker process with **3 retry attempts** and **exponential backoff** (1s → 2s → 4s).
  - Failed job exhaustion auto-moves to Dead Letter Queue (DLQ).
  - Global email rate limit: **50 emails/minute**.
  - `GET /jobs/:id` status tracking (`pending`, `active`, `completed`, `failed`).

- **Testing & API Documentation (Task 05)**:
  - Unit tests for Auth, Task Validation, and Pagination helpers.
  - Integration tests for Login Flow, Task CRUD, and Cross-Tenant 403 enforcement.
  - Interactive **Swagger UI** available locally at `http://localhost:3000/api-docs`.
  - Importable **Postman Collection** in `docs/TaskFlow.postman_collection.json`.
  - Single-command **Docker Compose** orchestration for API, Worker, PostgreSQL, and Redis.

---

## Setup Instructions & Quickstart

### Prerequisites
- [Node.js v20+](https://nodejs.org/)

---

### Method 1: Running with Docker Compose (Recommended)

> **Requires:** [Docker & Docker Compose](https://www.docker.com/)

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/taskflow-backend.git
   cd taskflow-backend
   ```

2. Create `.env` from `.env.example`:
   ```bash
   # Linux / macOS:
   cp .env.example .env

   # Windows (PowerShell / CMD):
   copy .env.example .env
   ```

3. Start all services (`api`, `worker`, `postgres`, `redis`):
   ```bash
   docker-compose up --build
   ```

4. Access the services:
   - **REST API**: `http://localhost:3000`
   - **Interactive Swagger UI**: `http://localhost:3000/api-docs`

> **Note:** The Docker Compose setup maps PostgreSQL to port `5434` on your host machine to avoid conflicts with any locally installed PostgreSQL instances.

---

### Method 2: Running Locally (Without Docker)

Use this method if you have PostgreSQL and Redis installed directly on your machine.

#### Step 1 — Install dependencies

```bash
npm install
```

#### Step 2 — Create PostgreSQL Database & User

Open **psql** (or pgAdmin) and run the following SQL as your `postgres` superuser:

```sql
CREATE USER taskflow WITH PASSWORD 'taskflow123';
CREATE DATABASE taskflow_db OWNER taskflow;
GRANT ALL PRIVILEGES ON DATABASE taskflow_db TO taskflow;
```

Or run it all at once from your terminal:

```bash
# macOS / Linux
psql -U postgres -c "CREATE USER taskflow WITH PASSWORD 'taskflow123';"
psql -U postgres -c "CREATE DATABASE taskflow_db OWNER taskflow;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE taskflow_db TO taskflow;"

# Windows (PowerShell) — use your PostgreSQL bin path
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE USER taskflow WITH PASSWORD 'taskflow123';"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE taskflow_db OWNER taskflow;"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE taskflow_db TO taskflow;"
```

#### Step 3 — Setup Redis (No Docker)

**Option A — macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Option B — Linux (apt):**
```bash
sudo apt install redis-server
sudo service redis-server start
```

**Option C — Windows (WSL recommended):**
```bash
# Inside a WSL terminal (Ubuntu):
sudo apt install redis-server
sudo service redis-server start
```

**Option D — Windows native (Memurai):**
Download and install [Memurai](https://www.memurai.com/) — a Redis-compatible server for Windows. It runs as a Windows service on port `6379` automatically.

**Option E — Redis Cloud (Free tier):**
Sign up at [Redis Cloud](https://redis.com/try-free/) and update your `.env` with the provided host, port, and password.

#### Step 4 — Configure Environment Variables

Copy `.env.example` to `.env` and update the values to match your local setup:

```env
PORT=3000
NODE_ENV=development

# Update host/port to match your local PostgreSQL
DATABASE_URL=postgresql://taskflow:taskflow123@localhost:5432/taskflow_db?schema=public

# On Windows, if localhost fails, use 127.0.0.1:
# DATABASE_URL=postgresql://taskflow:taskflow123@127.0.0.1:5432/taskflow_db?schema=public

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secrets
JWT_SECRET=super-secret-access-token-key-taskflow-2026
JWT_REFRESH_SECRET=super-secret-refresh-token-key-taskflow-2026
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

#### Step 5 — Run Database Migrations & Seed

```bash
# Push schema to your local PostgreSQL
npx prisma db push

# Build the project
npm run build

# Seed with default test data (5 users, 2 orgs, 10 tasks)
npm run prisma:seed
```

#### Step 6 — Start the API & Worker

```bash
# Terminal 1: API Server
npm run dev

# Terminal 2: Background Worker
npm run dev:worker
```

#### ✅ Local Setup Checklist (No Docker)

| Step | Command / Action |
|---|---|
| 1. Create DB user & database | `psql -U postgres` → run SQL above |
| 2. Start Redis | Homebrew / apt / WSL / Memurai |
| 3. Configure `.env` | Set `DATABASE_URL`, `REDIS_HOST` |
| 4. Push schema | `npx prisma db push` |
| 5. Build & seed | `npm run build && npm run prisma:seed` |
| 6. Start API | `npm run dev` |
| 7. Start Worker | `npm run dev:worker` (new terminal) |
| 8. Verify | Open `http://localhost:3000/api-docs` |

---

## Running Automated Tests

> **Requires:** PostgreSQL and Redis running (via Docker or locally). Tests connect to your real database.

```bash
# Run full test suite (unit + integration)
npm test

# Run with coverage report
npm run test:coverage
```

All **23 tests** should pass across 6 test suites:

| Suite | Coverage |
|---|---|
| `unit/auth.test.ts` | bcrypt hashing, JWT generation & verification |
| `unit/taskValidation.test.ts` | Zod schema validation rules |
| `unit/pagination.test.ts` | Offset & cursor pagination helpers |
| `integration/authFlow.test.ts` | Register, Login, Token Rotation |
| `integration/taskCrud.test.ts` | Project/Task CRUD, assignment, background jobs |
| `integration/crossTenant.test.ts` | Cross-org 403 Forbidden enforcement |

---

## Default Seeded Credentials for Testing

| Email | Password | Organization | Role |
|---|---|---|---|
| `admin@acme.com` | `Password123!` | Acme Corporation | `org_admin` |
| `member1@acme.com` | `Password123!` | Acme Corporation | `member` |
| `member2@acme.com` | `Password123!` | Acme Corporation | `member` |
| `admin@stark.com` | `Password123!` | Stark Tech | `org_admin` |
| `member@stark.com` | `Password123!` | Stark Tech | `member` |

---

## Project Structure

```
taskflow/
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
├── jest.config.ts
├── .env.example
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app.ts                 # Express Application setup
│   ├── index.ts               # HTTP Server launcher
│   ├── worker.ts              # BullMQ worker process
│   ├── config/                # Environment configuration
│   ├── middleware/            # Auth, Rate Limiter, Error Handler, RBAC
│   ├── controllers/           # Auth, Projects, Tasks, Jobs Controllers
│   ├── services/              # Business Logic & Multi-tenant Scoping
│   ├── queues/                # BullMQ Queue instance & job helpers
│   ├── utils/                 # Pagination, Zod validators, Token helpers, Errors
│   └── docs/                  # Swagger OpenAPI spec
├── tests/
│   ├── setup.ts               # Test DB hooks
│   ├── unit/                  # Unit tests (Auth, Pagination, Validation)
│   └── integration/           # Integration tests (Login, CRUD, Cross-tenant 403)
├── docs/
│   ├── ARCHITECTURE.md        # Architecture & Data Flow
│   └── TaskFlow.postman_collection.json
└── README.md
```
