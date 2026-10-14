# MongoDB Performance Benchmark: 2 Lakh Records Bulk Ingestion & B-Tree Index Optimization

A comprehensive performance case study benchmarking data generation via Node.js Streams, multi-threaded bulk insertion with mongoimport CLI, and MongoDB B-Tree indexing strategies on 200,000 records.

---

## 📊 Summary Benchmark Results

| Metric | Without Optimization / Index | With Optimization / Index | Improvement |
| :--- | :--- | :--- | :--- |
| **Data Generation** | Memory overflow in standard buffer | **< 1.5 seconds** (Node.js Streams) | Zero memory leak |
| **Bulk Import (GUI vs CLI)** | 3 - 5+ seconds (Compass GUI rendering) | **< 1.0 second** (`mongoimport` 4 workers) | **~300% faster** |
| **Search Stage** | `COLLSCAN` (Scanned 200,000 docs) | `IXSCAN` (B-Tree direct jump, 1 doc) | **99.99% fewer docs scanned** |
| **Query Latency** | 200ms – 400ms | **0ms – 2ms** | **~200x faster** |

---

## 🛠️ Step-by-Step Implementation

### Step 1: High-Performance Data Generation (Node.js Streams)
- **Challenge:** Creating 200,000 structured JSON records in memory can exhaust heap memory or freeze applications.
- **Solution:** Implemented `generator.js` using Node.js `fs.createWriteStream` to continuously stream generated objects to disk.
- **Result:** Generates 2 Lakh fully populated user records in under 1.5 seconds with minimal RAM consumption.

### Step 2: Multi-Threaded CLI Import
- **Command:**
  ```bash
  mongoimport --db companyDB --collection companyDB_indexing --file users_data.json --jsonArray --numInsertionWorkers 4
  ```
- **Why it is faster:** By enabling `--numInsertionWorkers 4`, import streams parallelize over 4 worker channels directly into MongoDB engine, bypassing GUI overhead.

### Step 3: Query Execution Analysis (`explain()`)

#### A. Without Index (Collection Scan - `COLLSCAN`)
```javascript
db.companyDB_indexing.find({ email: "user199999@example.com" }).explain("executionStats")
```
- **Execution Stage:** `COLLSCAN`
- **Total Documents Examined:** 200,000
- **Execution Time:** ~200ms - 400ms (high CPU consumption)

#### B. With Index (Index Scan - `IXSCAN`)
```javascript
db.companyDB_indexing.createIndex({ email: 1 })
db.companyDB_indexing.find({ email: "user199999@example.com" }).explain("executionStats")
```
- **Execution Stage:** `IXSCAN`
- **Total Documents Examined:** 1
- **Execution Time:** ~0ms - 2ms (direct B-Tree node hit)

---

## 💡 Key Takeaway
Index optimization transforms database operations from $O(n)$ full-table scans to $O(\log n)$ B-tree lookups, enabling Node.js backends to handle massive concurrency without database bottlenecks.
