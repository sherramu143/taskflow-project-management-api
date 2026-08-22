# TaskFlow System Architecture

TaskFlow is designed following Clean Architecture principles, ensuring strict separation of concerns, strong multi-tenant data isolation, asynchronous background task processing, and high testability.

---

## Technical Stack

| Layer | Technology |
|---|---|
| **Language & Runtime** | Node.js (v20+), Express.js, TypeScript |
| **Database** | PostgreSQL 16 (Relational Schema, Custom Indexes, Foreign Keys, Soft Delete, PostgreSQL Enums) |
| **ORM & Migrations** | Prisma ORM 5 |
| **Job Queue & Cache** | Redis 7 + BullMQ 5 |
| **Authentication & RBAC** | JWT (15-min TTL), Refresh Token Rotation (7-day TTL), bcrypt (Cost 12), Rate Limiter (10 req/min/IP) |
| **Input Validation** | Zod 3 |
| **API Documentation** | OpenAPI 3.0 + Swagger UI (`/api-docs`), Postman Collection |
| **Testing** | Jest + ts-jest + Supertest |
| **Containerization** | Docker & Docker Compose (`api`, `worker`, `postgres`, `redis`) |

---

## Architectural Layers

```
                     +---------------------------------------+
                     |           Client / API Call           |
                     +-------------------+-------------------+
                                         |
                                         v
                     +-------------------+-------------------+
                     |       Express REST API Server         |
                     |  (Auth, Rate Limit, Scoped Middleware)|
                     +---------+-------------------+---------+
                               |                   |
            +------------------+                   +-------------------+
            v                                                          v
+-----------+-----------+                                  +-----------+-----------+
|    PostgreSQL DB      |                                  |   Redis + BullMQ Queue|
| (Schema, Enums, Soft  |                                  | (Task Assignment Jobs |
|  Delete, FTS, Indexes)|                                  |  & Email Dispatcher)  |
+-----------------------+                                  +-----------+-----------+
                                                                       ^
                                                                       |
                                                           +-----------+-----------+
                                                           |   Background Worker   |
                                                           | (Retry, Backoff, DLQ) |
                                                           +-----------------------+
```

1. **Routes Layer (`src/routes`)**: Defines REST endpoints, maps URLs to controllers, and applies rate limiting and auth middleware.
2. **Controller Layer (`src/controllers`)**: Validates request parameters via Zod, passes validated inputs to services, and converts service results to standard JSON responses.
3. **Service Layer (`src/services`)**: Contains core business logic, tenant scoping rules, transaction management, and queue enqueueing.
4. **Data Access Layer (`src/prisma`)**: Prisma client providing type-safe interaction with PostgreSQL.
5. **Background Worker (`src/worker.ts`)**: Independent process listening to Redis queue, handling retries (3 attempts, 1s->2s->4s backoff), DLQ state logging, and global rate limiting (50 emails/min).

---

## Multi-Tenant Security Strategy

- **Context Attachment**: `authenticateToken` middleware verifies the JWT access token and resolves active organization membership (`req.orgId`, `req.user`, `req.role`).
- **Client Input Isolation**: `org_id` passed in request bodies or parameters is **never trusted**. All database queries are explicitly filtered by `req.orgId`.
- **Cross-Tenant Protection**: If a user attempts to access a resource (project or task) belonging to another organization, the service detects the mismatch and returns a strict `403 Forbidden` (`CROSS_TENANT_FORBIDDEN`) response without leaking data.

---

## Async Background Email Queue & Consistency

- **Transaction & Enqueue**: Upon assigning a task to a user, the database assignment record is created in a Prisma transaction. Immediately after, an email dispatch job is added to BullMQ.
- **5-Second Deduplication**: Job ID includes a 5-second bucket hash (`assign-email-{taskId}-{userId}-{timeBucket}`) preventing duplicate assignment notifications.
- **Retry & Exponential Backoff**: Failed jobs are retried up to 3 times with exponential backoff delays (1s, 2s, 4s). On exhaustion, jobs transition to a Dead Letter state.
