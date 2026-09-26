# StockSense 📦

**A modular, real-time inventory management system for streamlined stock operations.**

StockSense is an inventory management system designed to digitize and simplify everyday stock operations. Whether you're receiving shipments, moving inventory between locations, processing deliveries, or adjusting physical counts, StockSense keeps everything centralized, traceable, and auditable.

---

## 😩 The Problem

Many businesses still manage inventory using spreadsheets, physical registers, and disconnected systems.

This can lead to:

- Inaccurate stock counts
- Manual calculation errors
- Difficulty tracking stock movements
- Poor visibility across warehouse locations
- Delays when processing receipts and deliveries
- Lack of a reliable audit trail

StockSense addresses these problems by providing a centralized system where inventory operations are recorded and stock levels are updated automatically.

---

## 💡 Our Solution

StockSense acts as a **single source of truth for inventory operations**.

Instead of manually calculating stock changes, users perform the physical workflow — such as receiving a shipment or validating a delivery — and the application handles the corresponding stock updates.

Every inventory movement is recorded in a stock ledger, providing a clear history of:

- What changed
- When it changed
- Where it changed
- Which operation caused the change

---

## ✨ Features

### 🔐 Authentication

- User login and signup
- OTP-based password recovery
- Secure authentication using Supabase Auth

### 📊 Real-Time Dashboard

Monitor inventory activity from a centralized dashboard.

- Current stock levels
- Low-stock alerts
- Pending receipts
- Scheduled transfers
- Recent inventory activity

### 📥 Receipts

Manage incoming inventory from suppliers or other sources.

1. Create a receipt
2. Add the received items
3. Validate the receipt
4. Stock levels are updated automatically

Once validated, the corresponding stock quantities are increased through the database transaction.

### 📤 Deliveries

Manage outgoing inventory and customer deliveries.

1. Create a delivery
2. Select the required products and quantities
3. Validate the delivery
4. Stock levels are automatically decreased

The system prevents the frontend from directly performing stock calculations.

### 🔄 Internal Transfers

Move inventory between warehouse locations without changing the overall quantity of stock.

For example:

- Main Warehouse → Production Floor
- Warehouse A → Warehouse B
- Storage Area → Dispatch Area

The transfer updates the relevant location-level stock quantities while maintaining the overall inventory quantity.

### ⚖️ Stock Adjustments

Handle differences between recorded inventory and physical inventory.

Examples include:

- Damaged products
- Missing items
- Incorrect physical counts
- Newly discovered stock

Each adjustment is recorded so that the reason for the stock change remains traceable.

### 📒 Stock Ledger

Every stock movement is recorded in an audit ledger.

The ledger provides visibility into:

- Stock increases
- Stock decreases
- Transfers
- Adjustments
- Operation timestamps
- Related inventory operations

If the ledger is configured as append-only, previously recorded stock movements cannot be modified or deleted through the application.

---

## 🧠 Architecture

A key design decision in StockSense is that **stock calculations are handled by the database rather than the frontend**.

Consider a situation where two warehouse employees validate deliveries at nearly the same time.

If both users performed stock calculations in the frontend, concurrent operations could potentially result in race conditions or incorrect stock levels.

To avoid this, StockSense delegates the critical inventory operation to PostgreSQL.

When a user validates an operation:

1. Next.js receives the request.
2. The server invokes the PostgreSQL function `validate_operation` through Supabase RPC.
3. PostgreSQL validates the operation.
4. Relevant stock records are updated.
5. A stock ledger entry is created.
6. The operation status is updated.
7. The transaction returns the result to the application.

The database handles these operations atomically.

### Architecture Flow

```mermaid
sequenceDiagram
    participant Staff as Warehouse Staff
    participant App as Next.js Server
    participant DB as PostgreSQL

    Staff->>App: Validate receipt
    App->>DB: Call validate_operation()

    activate DB
    DB->>DB: Validate operation status
    DB->>DB: Update stock_levels
    DB->>DB: Insert stock_ledger entry
    DB->>DB: Mark operation as completed
    DB-->>App: Transaction result
    deactivate DB

    App-->>Staff: Display updated status
