# 🚀 TaskFlow — Multi-tenant Project Management API

TaskFlow is a production-ready, multi-tenant project management backend API built with **Node.js, Express, TypeScript, PostgreSQL (Prisma ORM), Redis, and BullMQ**.

---

## 📌 Live Deployment & Documentation Links

| Resource | Live Link / Location |
| --- | --- |
| **Live Backend API** | [`https://taskflow-project-management-api.vercel.app`](https://taskflow-project-management-api.vercel.app) |
| **Interactive Swagger Docs** | [`https://taskflow-project-management-api.vercel.app/api-docs`](https://taskflow-project-management-api.vercel.app/api-docs) |
| **Health Check Endpoint** | [`https://taskflow-project-management-api.vercel.app/health`](https://taskflow-project-management-api.vercel.app/health) |
| **Live Frontend App** | [`https://task-flow-management-smoky.vercel.app`](https://task-flow-management-smoky.vercel.app) |
| **GitHub Repository** | [`https://github.com/sherramu143/taskflow-project-management-api`](https://github.com/sherramu143/taskflow-project-management-api) |
| **Postman Collection** | [`docs/TaskFlow.postman_collection.json`](file:///d:/taskflow/docs/TaskFlow.postman_collection.json) |

---

## ⚙️ Environment Variables Setup (`.env`)

### 1️⃣ Cloud Production Environment (Vercel + Neon + Upstash)

Set these environment variables in your **Vercel Project Settings → Environment Variables**:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# PostgreSQL Database (Neon Serverless Cloud Database)
DATABASE_URL=postgresql://neondb_owner:npg_mY1MyIiW0rUz@ep-patient-wind-axvmnm6m.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=30

# Redis Cache & BullMQ Queue (Upstash Cloud Redis)
REDIS_HOST=gorgeous-mullet-146735.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=gQAAAAAAAj0vAAIgcDI1YTFhYWJkMTE5MDg0YzJlYTgzNzMwOWJlN2MzMjg4OA
REDIS_URL=rediss://default:gQAAAAAAAj0vAAIgcDI1YTFhYWJkMTE5MDg0YzJlYTgzNzMwOWJlN2MzMjg4OA@gorgeous-mullet-146735.upstash.io:6379

# JWT Security Secrets & Token TTL
JWT_SECRET=super-secret-access-token-key-taskflow-2026
JWT_REFRESH_SECRET=super-secret-refresh-token-key-taskflow-2026
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10
```

---

### 2️⃣ Local Development Environment (`.env`)

For running locally on your computer with a local PostgreSQL or Docker setup:

```env
PORT=3000
NODE_ENV=development

# Local PostgreSQL Database
DATABASE_URL=postgresql://taskflow:taskflow123@127.0.0.1:5434/taskflow_db?schema=public

# Local Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secrets
JWT_SECRET=super-secret-access-token-key-taskflow-2026
JWT_REFRESH_SECRET=super-secret-refresh-token-key-taskflow-2026
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10
```

---

## 🛠️ How to Run the Project from Scratch

### Method 1: Running with Docker Compose (Recommended 1-Command Setup)

> **Prerequisites:** Install [Docker Desktop](https://www.docker.com/)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sherramu143/taskflow-project-management-api.git
   cd taskflow-project-management-api
   ```

2. **Start all services in Docker**:
   ```bash
   docker-compose up --build
   ```
   *This automatically builds and launches PostgreSQL, Redis, Express API Server, and Background Worker with database migrations and seed data.*

3. **Access Services**:
   - API Server: `http://localhost:3000`
   - Swagger UI: `http://localhost:3000/api-docs`

---

### Method 2: Running Locally Without Docker

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment variables**:
   Copy `.env.example` to `.env` and fill in your PostgreSQL and Redis database connection strings.

3. **Push Prisma Database Schema & Seed Data**:
   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Push schema to database
   npx prisma db push

   # Seed default users & organizations
   npm run build && npm run prisma:seed
   ```

4. **Start API Server and Worker**:
   ```bash
   # Terminal 1: API Server
   npm run dev

   # Terminal 2: Background Worker
   npm run dev:worker
   ```

---

### Method 3: Live End-to-End Test Suite Execution

Run the complete 15-step End-to-End automated test suite against the live production server:

```bash
# Test Live Vercel Deployment
node test-e2e.js

# Test Local Server
$env:LIVE_URL="http://localhost:3000"; node test-e2e.js
```

---

## 📖 Complete API Documentation & Endpoints

### 🔑 1. Authentication Endpoints

#### `POST /auth/register` — Register User & Organization
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "name": "Jane Doe",
    "organizationName": "Acme Engineering"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "user": {
      "id": "b30c8bb8-42e5-4c97-b333-bd6a93baabc4",
      "email": "user@example.com",
      "name": "Jane Doe"
    },
    "organization": {
      "id": "1dacc899-b687-4573-a2f5-79891f11b19a",
      "name": "Acme Engineering",
      "role": "org_admin"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1Ni...",
      "refreshToken": "dabe9b207f7b2024..."
    }
  }
  ```

#### `POST /auth/login` — Login User
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response (`200 OK`)**: Returns JWT `accessToken` & `refreshToken`.

#### `POST /auth/refresh` — Refresh Access Token
- **Request Body**: `{ "refreshToken": "YOUR_REFRESH_TOKEN" }`
- **Response (`200 OK`)**: Returns new rotated `accessToken` & `refreshToken`.

---

### 📂 2. Project Endpoints
> ⚠️ Requires Header: `Authorization: Bearer <accessToken>`

#### `POST /projects` — Create Project
- **Body**: `{ "name": "TaskFlow Portal", "description": "TypeScript Dashboard" }`
- **Response (`201 Created`)**: Returns project object with `id`.

#### `GET /projects` — List Organization Projects
- **Query Params**: `page=1&limit=10` or `cursor=<uuid>`
- **Response (`200 OK`)**: Scoped strictly to the user's organization.

#### `GET /projects/:id` — Get Project Details

#### `PATCH /projects/:id` — Update Project
- **Body**: `{ "name": "Updated Project Name" }`

#### `GET /projects/:id/dashboard` — Project Status Dashboard
- **Response (`200 OK`)**:
  ```json
  {
    "projectId": "f10aa0be-9356-451a-86b1-a5e5a3e41e85",
    "statusCounts": {
      "todo": 3,
      "in_progress": 2,
      "review": 1,
      "done": 5
    }
  }
  ```

#### `DELETE /projects/:id` — Soft Delete Project (Admin Only)

---

### 📋 3. Task Management Endpoints
> ⚠️ Requires Header: `Authorization: Bearer <accessToken>`

#### `POST /projects/:projectId/tasks` — Create Task
- **Body**:
  ```json
  {
    "title": "Configure BullMQ Redis Queue",
    "description": "Handle assignment notification jobs",
    "priority": "urgent",
    "status": "todo",
    "dueDate": "2026-12-31T23:59:59.000Z"
  }
  ```
- **Enums**:
  - `priority`: `low` | `medium` | `high` | `urgent`
  - `status`: `todo` | `in_progress` | `review` | `done`

#### `GET /tasks` — List Tasks (With Filters & Full-Text Search)
- **Query Params**: `status=todo`, `priority=high`, `search=Redis`, `page=1`, `limit=10`

#### `POST /tasks/:id/assign` — Assign User & Trigger Background Queue Job
- **Body**: `{ "userId": "ASSIGNED_USER_UUID" }`
- **Response (`200 OK`)**: Enqueues email notification job into Upstash Redis queue.

#### `PATCH /tasks/bulk-status` — Bulk Update Task Status
- **Body**:
  ```json
  {
    "taskIds": ["task-uuid-1", "task-uuid-2"],
    "status": "done"
  }
  ```

#### `DELETE /tasks/:id` — Soft Delete Task

---

### 💬 4. Task Comments Endpoints

#### `POST /tasks/:id/comments` — Add Comment to Task
- **Body**: `{ "content": "Code review passed. Moving to production." }`

#### `GET /tasks/:id/comments` — List Task Comments

---

### ⚡ 5. Background Queue Jobs & Health Check

#### `GET /jobs/:id` — Get BullMQ Queue Job Status
- **Response (`200 OK`)**: `{ "id": "job-id", "state": "completed", "progress": 100 }`

#### `GET /health` — Health Check
- **Response (`200 OK`)**: `{ "status": "ok", "timestamp": "2026-08-23T01:24:00.000Z" }`

---

## 🧪 6. Automated Testing Suite

```bash
# Run Unit Tests (bcrypt, JWT tokens, Zod validation, Pagination helpers)
npm test

# Run End-to-End Live Verification Test Suite
node test-e2e.js
```
