# Nested Task Management with MongoDB ACID Transactions & Hierarchical Trees

A resilient REST API demonstrating multi-document ACID transactions, activity auditing, and hierarchical nested task trees using MongoDB's `$graphLookup` aggregation.

---

## ⚡ Core Highlights

1. **MongoDB ACID Transactions (`session`)**:
   - Ensures atomicity between updating a task and creating an audit record in `ActivityLog`.
   - If either operation fails, `session.abortTransaction()` automatically rolls back all database modifications to prevent data inconsistency.

2. **Zero-Loop Hierarchical Trees (`$graphLookup`)**:
   - Fetches complete deeply nested subtask hierarchies in a single database roundtrip using MongoDB's `$graphLookup` aggregation pipeline.
   - Eliminates the $N+1$ query problem associated with recursive database querying.

3. **Audit Trails**:
   - Automatically tracks IP addresses, modifying user IDs, timestamps, and action descriptions for full governance.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/tasks` | Create a new top-level task or subtask |
| `GET` | `/api/tasks` | Get all top-level tasks |
| `GET` | `/api/tasks/:parentId/subtasks` | Get immediate subtasks of a parent |
| `GET` | `/api/tasks/tree` | Get recursive hierarchical tree via `$graphLookup` |
| `PUT` | `/api/tasks/:taskId` | Transactional task update + audit log creation |

---

## ⚙️ Quick Start

```bash
npm install
cp .env.example .env
npm run dev # or node server.js
```
