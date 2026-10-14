# FullStack Engineering & Performance Architecture

A curated repository of production-grade Full-Stack modules, Node.js concurrency patterns, database performance benchmarks, and React/Next.js architectures.

---

## 📁 Repository Overview

This monorepo-style workspace contains 7 specialized full-stack modules:

| Module | Core Concepts & Technologies |
| :--- | :--- |
| **[`forgotPassword`](./forgotPassword)** | Enterprise Authentication flow (crypto SHA-256 tokens, Nodemailer, anti-enumeration), Order lifecycle & exception management (returns, cancellations, refunds), live multi-currency auto-sync, and promo-code validation engine. Built with Express, Mongoose, and Next.js. |
| **[`mongo-benchmark`](./mongo-benchmark)** | Performance case study benchmarking 200,000 records. Evaluates Node.js Streams data generation, multi-threaded `mongoimport` CLI parallel workers, and `COLLSCAN` vs `IXSCAN` database latency reduction (~200x speedup). |
| **[`indexing`](./indexing)** | Scalable Node.js & MongoDB architecture examining Streams, sequential vs parallel `bulkWrite`, Libuv thread pool behavior, and worker thread isolation for heavy JSON processing. |
| **[`indexing_childProcess`](./indexing_childProcess)** | Background job delegation pattern using Node.js `child_process.fork`. Offloads heavy Excel parsing and database upserts to an isolated process with sub-200ms fire-and-forget API response. |
| **[`nestedTask`](./nestedTask)** | Multi-document MongoDB ACID Transactions (`startSession`, `startTransaction`, `commitTransaction`, `abortTransaction`) coupled with recursive tree retrieval using MongoDB's `$graphLookup` aggregation. |
| **[`hooks`](./hooks)** | Production React custom hooks: `useOnScreen` (IntersectionObserver), `LazyLoader` viewport wrapper, dynamic table height calculators, and category state management. |
| **[`typescript_miniProject`](./typescript_miniProject)** | Modern TaskMaster dashboard built with Next.js App Router, Tailwind CSS, custom `useLocalStorage` persistence, and strict TypeScript union types. |

---

## 🏛️ System Concurrency & Pipeline Architecture

```text
                                INTERNET / CLIENTS
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │ Express API Gateway   │
                            └───────────┬───────────┘
                                        │
                ┌───────────────────────┼───────────────────────┐
                ▼                       ▼                       ▼
      Standard Endpoints        Heavy CPU Tasks          Background Jobs
      (Auth, Orders, CRUD)     (JSON/Data Transforms)   (Excel / Bulk Ingestion)
                │                       │                       │
                ▼                       ▼                       ▼
         Main Event Loop          Worker Threads          Child Processes
                │               (worker_threads)      (child_process.fork)
                │                       │                       │
                └───────────────────────┼───────────────────────┘
                                        │
                                        ▼
                              Database Operations
                           (Mongoose / MongoDB Driver)
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
          ACID Transactions                       High-Throughput
       (Multi-Doc Sessions)                     (bulkWrite & Streams)
                    │                                       │
                    └───────────────────┬───────────────────┘
                                        │
                                        ▼
                                B-Tree Indexes
                             (COLLSCAN ➡️ IXSCAN)
```

---

## 🔐 Environment & Security

Sensitive credentials, database connections, and secrets are strictly excluded from version control via `.gitignore`.

To configure local environments, copy the provided `.env.example` templates:

```bash
# 1. ForgotPassword Backend
cp forgotPassword/backend/.env.example forgotPassword/backend/.env

# 2. NestedTask Backend
cp nestedTask/.env.example nestedTask/.env
```

---

## 🛠️ Quick Start

### 1. Prerequisites
- **Node.js** (v18.x or later)
- **MongoDB** (Local instance running at `mongodb://localhost:27017` or MongoDB Atlas URI)
- **npm** or **yarn**

### 2. Exploring Modules
Each subfolder is self-contained. Navigate to any module to inspect dependencies or launch dev servers:

```bash
# Example: Running the TaskMaster Next.js App
cd typescript_miniProject/my-ts-app
npm install
npm run dev

# Example: Running the Nested Task API
cd nestedTask
npm install
npm run dev
```

---

## 📜 License
This project is open-source and available under the MIT License.
