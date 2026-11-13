# PrintPoint Centre – 3D Printer Reservation Management System

**Group:** LG 4  
**Project:** PrintPoint Centre  
**Technology Stack:** Node.js, Express.js, SQLite3  

---

## Overview

PrintPoint Centre is a reservation management backend system designed to manage 3D printers, designers, and printing reservations.

---

## Project Structure

```text
├── package.json
├── package-lock.json
├── server.js               # Express application entry point
├── .gitignore              # Ignored files (databases, node_modules, logs, etc.)
├── README.md               # Project documentation
├── scripts/
│   └── verify-db.js        # Comprehensive SQLite database verification script
└── src/
    └── database/
        ├── connection.js   # SQLite connection with PRAGMA foreign_keys = ON
        ├── schema.sql      # Database DDL (designers, printers, reservations)
        ├── init.js         # Non-destructive schema inspection & initialization
        └── seed.js         # Safe, repeatable seeding module
```

---

## Database Management Implementation

The database layer manages three interrelated relational tables:

1. **`designers`**: Stores designer profiles (`id`, `name`, `email` [UNIQUE]).
2. **`printers`**: Stores 3D printer hardware (`id`, `name`, `material`).
3. **`reservations`**: Manages reservation bookings (`id`, `designer_id`, `printer_id`, `created_at`).
   - Foreign key: `designer_id` references `designers(id)`.
   - Foreign key: `printer_id` references `printers(id)`.
   - Foreign key constraint checks are strictly enforced at runtime via `PRAGMA foreign_keys = ON;`.

---

## Setup & Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Verify Database
To verify database connectivity, tables, foreign keys, record counts, and database integrity:
```bash
npm run verify:db
```

### 3. Initialize / Seed Database
If working with a new setup:
```bash
node src/database/init.js
```

---

## Status & Division of Work

- **Database Management:** Complete and verified.
- **Routes & Middleware:** Pending implementation by respective team members (`src/routes/` and `src/middleware/`).
