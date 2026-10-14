# FullStack Engineering & Performance Architecture

A curated repository of production-grade Full-Stack modules, Node.js concurrency patterns, database performance benchmarks, and React/Next.js architectures.

---

## 📁 Repository Overview

This monorepo-style workspace contains 7 specialized full-stack modules:

| Module | Project Title & Core Architecture |
| :--- | :--- |
| **[`forgotPassword`](./forgotPassword)** | **E-Commerce Suite: Secure Auth (Password Reset Flow), Order Lifecycle & Live Currency Engine**<br>Enterprise authentication with SHA-256 tokens & Nodemailer, order lifecycle & exception management (returns, cancellations, refunds), live multi-currency auto-sync, and promo-code validation engine. Built with Express, Mongoose, and Next.js. |
| **[`mongo-benchmark`](./mongo-benchmark)** | **MongoDB Performance Benchmark: 2 Lakh Records Bulk Ingestion & B-Tree Index Optimization**<br>Empirical case study benchmarking 200,000 records. Evaluates Node.js Streams data generation, multi-threaded `mongoimport` CLI parallel workers, and `COLLSCAN` vs `IXSCAN` latency reduction (~200x speedup). |
| **[`indexing`](./indexing)** | **High-Throughput Bulk Data Ingestion: Node.js Streams, Batching & MongoDB Index Optimization**<br>Scalable ingestion pipeline examining Streams, sequential vs parallel `bulkWrite`, Libuv thread pool behavior, and worker thread isolation for CPU-intensive JSON processing. |
| **[`indexing_childProcess`](./indexing_childProcess)** | **Asynchronous Excel Ingestion via Node.js Child Process (Fork & IPC)**<br>Background job delegation pattern using Node.js `child_process.fork`. Offloads heavy Excel parsing and database upserts to an isolated worker process with sub-200ms fire-and-forget API response. |
| **[`nestedTask`](./nestedTask)** | **Hierarchical Task API: MongoDB ACID Transactions & $graphLookup Recursive Trees**<br>Multi-document MongoDB ACID Transactions (`startSession`, `startTransaction`, `commitTransaction`, `abortTransaction`) coupled with zero-loop recursive tree retrieval using MongoDB's `$graphLookup` aggregation. |
| **[`hooks`](./hooks)** | **React Custom Hooks: LazyLoader, Viewport Observers (IntersectionObserver) & Dynamic Layouts**<br>Production React custom hooks: `useOnScreen` (IntersectionObserver), `LazyLoader` viewport wrapper, dynamic table height calculators, and category state management. |
| **[`typescript_miniProject`](./typescript_miniProject)** | **TaskMaster TS: Type-Safe Task Dashboard (Next.js, TypeScript Union Types & LocalStorage Hook)**<br>Modern TaskMaster dashboard built with Next.js App Router, Tailwind CSS, custom `useLocalStorage` persistence, and strict TypeScript union types. |

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
