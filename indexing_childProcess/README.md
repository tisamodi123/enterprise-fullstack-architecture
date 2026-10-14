# Asynchronous Excel Processing via Node.js Child Processes

A high-performance pattern demonstrating how to offload heavy file parsing and database upserts to an isolated Child Process (`child_process.fork`) without blocking the Node.js Event Loop.

---

## 🚀 Architectural Pattern

1. **Fire-and-Forget Ingestion**:
   - The client uploads an Excel file via `POST /api/import-excel`.
   - The main Express thread forks a new Child Process, transfers the file path, and immediately returns a response in **< 200ms**.
   - Client is never left hanging on a long loading spinner.

2. **Isolated Processing**:
   - `workers/excel-worker.js` parses Excel rows, converts them into batch operations, and executes bulk database upserts in its own isolated memory and V8 heap.
   - Heavy CPU utilization does not affect the responsiveness of other API routes on the main server.

3. **IPC (Inter-Process Communication)**:
   - Worker communicates progress, completion status, and error metrics back to the parent process via IPC messages (`process.send()` and `child.on('message')`).
