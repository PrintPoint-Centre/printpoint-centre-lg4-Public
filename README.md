# PrintPoint Centre – 3D Printer Reservation Management System

**Group:** LG 4  
**Project:** PrintPoint Centre  
**Technology Stack:** Node.js, Express.js, SQLite3

---

## Team Members & Responsibilities

1. **K. Prem Sai** – Backend Setup (`server.js`, middleware wiring, server startup)
2. **Kasula Thanish** – Database Management (`src/database/`, schema, init, seed, verification)
3. **A. Naga Manikanta** – REST API Development (`src/routes/designers.js`, `printers.js`, `reservations.js`)
4. **K. V. Chethan** – Validation and Search (`src/middleware/validate.js`, `errorHandler.js`, query filters)
5. **D. Sriketh** – Advanced Features and Documentation (`GET /printers/top`, `README.md`)

---

## Project Structure

```text
├── package.json
├── package-lock.json
├── server.js                         # Express application entry point
├── .gitignore                        # Ignored files (databases, node_modules, logs, etc.)
├── README.md                         # Project documentation
├── scripts/
│   ├── verify-db.js                  # 6-point SQLite database verification script
│   ├── display-tables.js             # Displays designers, printers, and reservations tables
│   ├── test-helper.js                # Shared HTTP test harness
│   ├── test-routes.js                # Core & 404 route tests
│   ├── test-designers-crud.js        # Designers CRUD tests
│   ├── test-printers-crud.js         # Printers CRUD tests
│   ├── test-reservations-crud.js     # Reservations CRUD tests
│   ├── test-reservation-details.js   # Joined reservation details tests
│   ├── test-step8-validation-search.js # Validation & search tests
│   └── test-top-printers.js          # Top 3 printers tests
└── src/
    ├── database/
    │   ├── connection.js             # SQLite connection with PRAGMA foreign_keys = ON
    │   ├── schema.sql                # Database DDL (designers, printers, reservations)
    │   ├── init.js                   # Non-destructive schema inspection & initialization
    │   └── seed.js                   # Safe, repeatable seeding module
    ├── middleware/
    │   ├── errorHandler.js           # Centralized 404 & error handling
    │   └── validate.js               # Input & parameter validation middleware
    ├── routes/
    │   ├── designers.js              # Designers CRUD & search routes
    │   ├── printers.js               # Printers CRUD, search, & top-3 routes
    │   └── reservations.js           # Reservations CRUD, details, & search routes
    └── utils/
        └── dbHelpers.js              # Promise-based SQLite query wrappers
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

## API Endpoints

### Core & Health
- `GET /` – API welcome message
- `GET /health` – Server and database health status

### Designers (`/designers`)
- `GET /designers` – List all designers (supports `?search=` / `?q=`)
- `GET /designers/:id` – Get designer by ID
- `POST /designers` – Create a designer (`{ name, email }`)
- `PUT /designers/:id` – Update a designer (`{ name, email }`)
- `DELETE /designers/:id` – Delete a designer (protected by FK constraint check)

### Printers (`/printers`)
- `GET /printers` – List all printers (supports `?search=` / `?q=` and `?material=`)
- `GET /printers/top` (alias `/printers/top-printers`) – Top 3 most reserved printers with `reservation_count`
- `GET /printers/:id` – Get printer by ID
- `POST /printers` – Create a printer (`{ name, material }`)
- `PUT /printers/:id` – Update a printer (`{ name, material }`)
- `DELETE /printers/:id` – Delete a printer (protected by FK constraint check)

### Reservations (`/reservations`)
- `GET /reservations` – List all reservations with designer & printer details (supports `?designer_id=`, `?printer_id=`, `?search=`)
- `GET /reservations/details` – Full joined reservation details
- `GET /reservations/:id` – Get reservation details by ID
- `POST /reservations` – Create a reservation (`{ designer_id, printer_id }`)
- `PUT /reservations/:id` – Update a reservation (`{ designer_id, printer_id }`)
- `DELETE /reservations/:id` – Delete a reservation

---

## Setup & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize & Verify Database
```bash
node src/database/init.js
npm run verify:db
npm run display:records
```

### 3. Start Server
```bash
npm start
```
The server runs on `http://localhost:3000` by default.

### 4. Run Test Scripts
```bash
npm run test:routes
npm run test:designers
npm run test:printers
npm run test:reservations
npm run test:reservation-details
npm run test:step8
npm run test:top-printers
```
