# High-Performance Node.js & MongoDB Indexing Architecture

This module demonstrates high-throughput data processing and indexing strategies in Node.js and MongoDB, handling large-scale data ingestion without blocking the Event Loop.

---

## 🏛️ System Architecture

```text
                                INTERNET
                                    │
                                    ▼
                           ┌────────────────┐
                           │ Load Balancer  │
                           └────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
         Node Process 1      Node Process 2      Node Process 3
           (Cluster)           (Cluster)           (Cluster)
                │                   │                   │
        ┌───────┴───────┐   ┌───────┴───────┐   ┌───────┴───────┐
        │ Main Thread   │   │ Main Thread   │   │ Main Thread   │
        └───────┬───────┘   └───────┬───────┘   └───────┬───────┘
                │                   │                   │
        ┌───────┼───────────────────┼───────────────────┐
        │       │                   │                   │
        ▼       ▼                   ▼                   ▼
   Event Loop  Async I/O      Worker Thread      Child Process
        │           │               │                  │
        │           │               │                  │
        │           │         Heavy CPU Work      Python/Java
        │           │         JSON Parsing        Scripts
        │           │         Image Resize
        │           │         Encryption
        │           │
        ▼           ▼
  Libuv Thread Pool
  ┌────┬────┬────┬────┐
  │ T1 │ T2 │ T3 │ T4 │
  └────┴────┴────┴────┘
        │
        ▼
    File System
    DNS Lookup
    Crypto
    Compression

                │
                ▼
         Stream Processing
                │
                ▼
      Read Large Files in Chunks
                │
                ▼
        Batching / Chunking
                │
                ▼
      Promise.all (Parallel Batches)
                │
                ▼
             MongoDB
                │
                ▼
             Indexes
                │
                ▼
       Fast Search / Update / Upsert
```

---

## 🔑 Key Concepts Explored

1. **Streams vs In-Memory Buffers**:
   - Streaming large datasets chunk-by-chunk prevents Node process memory exhaustion (`HEAP_LIMIT_EXCEEDED`).
2. **Batching & `bulkWrite`**:
   - Replacing single sequential inserts with chunked `bulkWrite` operations reduces network roundtrips to MongoDB.
3. **Parallel Batch Execution**:
   - Orchestrating batches via `Promise.all` with `{ ordered: false }` allows MongoDB to process writes concurrently across shards/threads.
4. **Worker Thread Isolation**:
   - Offloading CPU-intensive JSON parsing and transformations to separate threads keeps the Node.js Event Loop free for incoming HTTP requests.
