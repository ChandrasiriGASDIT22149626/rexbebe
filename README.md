# REXBEBE - Premium Baby & Toddler E-Commerce Architecture

REXBEBE is built using a modern decoupled full-stack architecture with strict separation between **Frontend** and **Backend**.

## Architecture Overview

```text
rexbebe/
│
├── frontend/ (Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion)
│   ├── app/
│   │   ├── (storefront)/ ... Public Shop Pages
│   │   └── admin/        ... Protected Admin Dashboard
│   ├── components/       ... Modular UI Components
│   ├── services/         ... REST API Client Services
│   ├── hooks/            ... Custom React Hooks
│   ├── types/            ... Shared TypeScript Interfaces
│   └── utils/            ... Helper Functions
│
├── backend/ (Node.js, TypeScript, Express, Prisma ORM, PostgreSQL Schema)
│   ├── src/
│   │   ├── config/       ... Environment & Database Config
│   │   ├── controllers/  ... REST Route Handlers
│   │   ├── services/     ... Core Business Logic & Audit Trail
│   │   ├── routes/       ... Express API Routers
│   │   ├── middleware/   ... Auth, Validation & Rate Limiting
│   │   ├── repositories/ ... Database Access Layer
│   │   └── app.ts        ... Application Bootstrap
│   └── prisma/
│       └── schema.prisma ... Relational PostgreSQL Schema
│
├── README.md
├── .gitignore
└── package.json
```

## Running the Application

### 1. Backend Server (Port 5000)
```bash
cd backend
npm install
npm run dev
```
- REST API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

### 2. Frontend Application (Port 3000)
```bash
cd frontend
npm install
npm run dev
```
- Customer Storefront: `http://localhost:3000`
- Admin Dashboard: `http://localhost:3000/admin`

## Key Features & Security Architecture
- Strict API Separation: Frontend NEVER directly accesses PostgreSQL or Payment gateway secrets.
- Business Logic Enforcement: Prices, inventory validation, and order totals are computed server-side in the backend.
- Full Relational Database: PostgreSQL schema with User, Customer, Address, Product, ProductVariant, Inventory, Cart, Order, Payment, Delivery, Coupon, Wishlist, Return, Review, and AuditLog models.
- Interactive Storefront & Admin Portal.
