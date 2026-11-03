# REXBEBE Backend — Vercel Serverless Deployment Guide & Architectural Audit

This document provides the complete architectural audit, serverless configuration, production environment variable inventory, and readiness analysis for running the **REXBEBE Node.js + Express + TypeScript** backend on **Vercel Serverless Functions**.

---

## 1. Executive Summary & Readiness Verdict

> [!WARNING]
> **Readiness State: CONDITIONAL READINESS**
> The backend server architecture has been successfully adapted for Vercel Serverless execution via a dedicated serverless entry point (`backend/api/index.ts` without `app.listen()`), dynamic PostgreSQL connection pooling with SSL support, and safety guards against read-only filesystem cold-start crashes.
> 
> However, **deployment should not proceed to live production** until the two external cloud services (Hosted PostgreSQL Database and Cloud Object Storage for user uploads) are provisioned, as local filesystem writes and local Python OpenCV dependencies are fundamentally incompatible with Vercel's stateless serverless environment.

### Readiness Scorecard

| Category | Status | Notes |
| :--- | :---: | :--- |
| **Vercel Serverless Entry Point** | ✅ **READY** | Implemented at `backend/api/index.ts` (Zero `app.listen()`, cold-start DB/admin setup). |
| **Routing & URL Rewrites** | ✅ **READY** | Configured via `backend/vercel.json` mapping `/(.*)` to Express router. |
| **Express Middleware & APIs** | ✅ **READY** | All 22+ API route groups, JWT auth, and admin RBAC preserved. |
| **PostgreSQL Cloud Connectivity** | ✅ **READY** | Auto-detects cloud hosts (Neon, Supabase, RDS) with SSL & pool capping (`max: 3`). |
| **Payment Gateways (PayHere / OnePay)** | ✅ **READY** | Dynamic `FRONTEND_URL` and `BACKEND_URL` callback routing implemented. |
| **Koombiyo Delivery Integration** | ✅ **READY** | Native `fetch` HTTP client; outbound webhook endpoint `/api/webhooks/koombiyo` ready. |
| **Local File Uploads (`/uploads`)** | ⚠️ **BLOCKED** | Vercel filesystem is read-only and ephemeral. Cloudinary / S3 / Supabase Storage required. |
| **Python Recolor Engine (`/api/fabric`)**| ⚠️ **INCOMPATIBLE** | Python, OpenCV, and LibreOffice are not installed in Vercel Node runtime. |
| **Background Daemons / Cron Sync** | ⚠️ **INCOMPATIBLE** | Serverless functions freeze after response. Requires Vercel Cron or QStash. |

---

## 2. Vercel Project Settings

When creating the backend project in the [Vercel Dashboard](https://vercel.com/dashboard):

| Setting | Recommended Value | Explanation |
| :--- | :--- | :--- |
| **Framework Preset** | `Other` | Do not select Next.js for the Express backend; choose `Other`. |
| **Root Directory** | `backend` (or `rexbebe-main/backend`) | Points directly to the backend source folder. |
| **Build Command** | `npm run build` | Compiles TypeScript (`tsc`) and triggers `prisma generate`. |
| **Output Directory** | Leave empty (default) | Not applicable for Node.js API functions. |
| **Install Command** | `npm install` | Installs dependencies and runs `postinstall: prisma generate`. |
| **Node.js Version** | `20.x` | Matches production LTS and dependencies (`@prisma/client`, `pg`). |

---

## 3. Serverless Entry Point Implementation

### A. Vercel Serverless Handler (`backend/api/index.ts`)
Vercel looks for serverless function handlers in the `api/` directory. The handler imports the configured Express `app` without starting a standalone HTTP server:

```typescript
import app from '../src/app';
import { adminUserService } from '../src/services/adminUserService';

let isInitialized = false;

async function initServerless() {
  if (!isInitialized) {
    try {
      if (process.env.USE_POSTGRES === 'true' && process.env.DATABASE_URL) {
        await adminUserService.ensurePrimaryAdmin();
      }
    } catch (e) {
      console.warn('[Vercel Serverless] Cold-start admin check warning:', e);
    }
    isInitialized = true;
  }
}

export default async function handler(req: any, res: any) {
  await initServerless();
  return app(req, res);
}
```

> [!NOTE]
> - **Zero `app.listen()`**: Express is invoked as a stateless request handler function `(req, res)`.
> - **Cold-Start Optimization**: `initServerless()` runs once per warm lambda container lifecycle to verify admin user persistence without blocking subsequent API requests.

### B. Vercel Routing Configuration (`backend/vercel.json`)
Redirects all incoming REST API requests to the serverless function while preserving the full URL path for Express router dispatch:

```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api"
    }
  ]
}
```

---

## 4. Required Production Environment Variables

Configure these in **Vercel Project Settings > Environment Variables** (for `Production`, `Preview`, and `Development` environments).

> [!CAUTION]
> **Never commit real credentials or `.env` files into source control.** Use Vercel's encrypted environment variables manager.

| Variable Name | Required? | Example Production Value | Description & Security Purpose |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **YES** | `production` | Enables production optimizations, strict error handling, and SSL. |
| `USE_POSTGRES` | **YES** | `true` | Enforces PostgreSQL database mode across all 11 repositories. |
| `DATABASE_URL` | **YES** | `postgresql://user:pass@ep-xyz.neon.tech/rexbebe_db?sslmode=require` | External hosted PostgreSQL connection string (Neon, Supabase, RDS). |
| `DB_SSL` | Optional | `true` | Explicitly enables SSL with `{ rejectUnauthorized: false }`. |
| `DB_POOL_MAX` | Optional | `3` | Maximum connections per serverless lambda instance (prevents pool exhaustion). |
| `JWT_SECRET` | **YES** | `rexbebe_prod_sec_jwt_key_994827163829104` | 32+ character high-entropy key for JWT signature and admin tokens. |
| `JWT_EXPIRES_IN` | Optional | `8h` | Lifetime of admin and customer authentication tokens. |
| `FRONTEND_URL` | **YES** | `https://rexbebe.com` | Base storefront URL for PayHere redirect and order confirmation. |
| `BACKEND_URL` | **YES** | `https://api.rexbebe.com` | Public backend URL for PayHere webhook notifications (`notifyUrl`). |
| `ADMIN_INITIAL_EMAIL` | Optional | `admin@rexbebe.com` | Primary super-admin account email. |
| `ADMIN_INITIAL_USERNAME` | Optional | `admin` | Primary super-admin username. |
| `ADMIN_INITIAL_PASSWORD` | **YES** | `StrongSecretPassword2026!` | Initial password hashed into database on first boot. |
| `PAYHERE_MERCHANT_ID` | **YES** | `1234567` | Live PayHere Merchant ID from PayHere merchant portal. |
| `PAYHERE_SECRET` | **YES** | `live_payhere_secret_key_prod` | Live PayHere Merchant Secret used for MD5 payment verification. |
| `PAYHERE_SANDBOX` | **YES** | `false` | Set to `false` for real credit/debit card transactions in Sri Lanka. |
| `ONEPAY_MERCHANT_ID` | Optional | `onepay_live_id` | Live OnePay Merchant ID. |
| `ONEPAY_SECRET` | Optional | `onepay_live_secret` | Live OnePay Merchant Secret. |
| `KOOMBIYO_API_KEY` | **YES** | `live_koombiyo_key_...` | Official Koombiyo client API key for waybill generation. |
| `KOOMBIYO_API_PASSWORD` | **YES** | `live_koombiyo_pwd_...` | Official Koombiyo client API password. |
| `KOOMBIYO_BASE_URL` | **YES** | `https://client.koombiyodelivery.lk/clientapi/v2` | Official Koombiyo API v2 production endpoint. |
| `KOOMBIYO_WEBHOOK_SECRET` | Optional | `koombiyo_sec_...` | Secret token to authenticate inbound tracking status updates. |
| `SMTP_HOST` | Optional | `smtp.sendgrid.net` | Transactional email SMTP host. |
| `SMTP_PORT` | Optional | `587` | Transactional email SMTP port (usually 587 or 465). |
| `SMTP_USER` | Optional | `apikey` | Transactional email SMTP username. |
| `SMTP_PASSWORD` | Optional | `SG.xxxxxxxx` | Transactional email SMTP API key/password. |
| `SMTP_FROM` | Optional | `orders@rexbebe.com` | Verified sender address for order receipts and notifications. |

---

## 5. Incompatible Features & Serverless Architectural Constraints

Vercel Serverless Functions execute inside short-lived, stateless Amazon Linux 2 / AL2023 micro-VM containers. The following table identifies all incompatibilities and their mandatory production workarounds:

```
┌──────────────────────────────────────────────────────────────────────────┐
│               SERVERLESS ARCHITECTURAL COMPATIBILITY MATRIX              │
├──────────────────────────┬──────────────────────────┬────────────────────┤
│ Current Backend Feature  │ Serverless Compatibility │ Required Solution  │
├──────────────────────────┼──────────────────────────┼────────────────────┤
│ 1. Local Image Uploads   │ INCOMPATIBLE (Read-only) │ Cloud Object Store │
│ 2. Data Backups to Disk  │ INCOMPATIBLE (Ephemeral) │ Managed DB Backups │
│ 3. Python OpenCV Recolor │ INCOMPATIBLE (No Python) │ Separate Microsvc  │
│ 4. Background daemons    │ INCOMPATIBLE (Freeze)    │ Vercel Cron Jobs   │
│ 5. Execution Timeouts    │ 10s Hobby / 60s Pro      │ Fast Async Workers │
│ 6. Max Payload (4.5 MB)  │ Edge Body Size Limit     │ Direct Presigned S3│
└──────────────────────────┴──────────────────────────┴────────────────────┘
```

### Detailed Breakdown of Incompatibilities

### 1. Ephemeral & Read-Only Local Filesystem (`/uploads` & `/data`)
- **Root Cause**: On Vercel, the application directory (`/var/task`) is mounted strictly as **read-only**. Any attempt to write to `uploads/` or `data/*.json` throws `EROFS: read-only file system`. While `/tmp` is writable (up to 512 MB), files stored in `/tmp` are wiped when the lambda instance recycles and are **never shared** across parallel lambda instances.
- **Impact**: Product photo uploads (`POST /api/upload`) and reverse JSON sync (`reverseSyncService.ts`) will fail if attempting to write to disk.
- **Required Production Solution**:
  1. Migrate photo uploads from local disk to **Cloudinary**, **AWS S3**, **Supabase Storage**, or **Vercel Blob**.
  2. In `uploadRoutes.ts`, forward upload streams directly to cloud object storage and save the resulting permanent CDN URL (`https://res.cloudinary.com/...` or `https://s3.amazonaws.com/...`) in PostgreSQL.

### 2. Python OpenCV Fabric Recolor Engine (`src/routes/fabricRoutes.ts`)
- **Root Cause**: `fabricRoutes.ts` calls `child_process.execFile` invoking Python scripts (`src/python/fabric_recolor_engine.py`) using `python.exe` or LibreOffice Python with OpenCV (`cv2`) and NumPy.
- **Impact**: Vercel Node.js runtimes do **not** include Python, OpenCV, or system C++ image libraries. Any call to `/api/fabric/segment` or `/api/fabric/recolor` will fail with `ENOENT: spawn python not found`.
- **Required Production Solution**:
  If AI/OpenCV fabric recoloring is needed in production, host the Python script on a dedicated containerized service (e.g., [Railway](https://railway.app), [Render](https://render.com), or AWS Lambda with a custom Python OpenCV layer) and call it via HTTP from the Node.js backend.

### 3. Background Jobs & Long-Running Daemons
- **Root Cause**: Serverless functions immediately freeze (enter sleep state) once the HTTP response is dispatched. Background intervals (`setInterval`), recurring database syncs, or dangling asynchronous promises are paused or abruptly terminated.
- **Impact**: Any background task designed to run periodically (e.g. tracking waybills with Koombiyo or checking bank settlement discrepancies) cannot run as an in-process daemon.
- **Required Production Solution**:
  Use **Vercel Cron Jobs**. Add an endpoint (e.g. `POST /api/cron/sync-courier`) secured with a secret bearer token (`CRON_SECRET`), and configure `vercel.json`:
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/sync-courier",
        "schedule": "0 */4 * * *"
      }
    ]
  }
  ```

### 4. Vercel Execution Timeouts & Request Body Limits
- **Hobby Plan Timeout**: **10 seconds** maximum execution time per function invocation.
- **Pro Plan Timeout**: 15 seconds default (configurable up to **300 seconds** in `vercel.json`).
- **Request Body Limit**: **4.5 MB** maximum payload size. Any direct image upload over 4.5 MB sent through Vercel Serverless will return `413 Payload Too Large` from the Vercel edge router before reaching Express.
- **Solution**: Clients uploading high-resolution boutique photography (e.g. 5–8 MB) should request a presigned upload URL directly to cloud storage (S3/Cloudinary/Vercel Blob) rather than proxying raw bytes through the Express function.

---

## 6. External Hosted PostgreSQL Database Configuration

### A. Database Compatibility
The REXBEBE backend uses both **Prisma ORM** (`@prisma/client`) and native **node-postgres** (`pg.Pool`) in `src/config/database.ts` and `src/repositories/postgres/Postgres*.ts`. It is 100% compatible with standard PostgreSQL versions 14, 15, and 16.

Recommended cloud providers:
1. **Neon** (`https://neon.tech`) — Serverless PostgreSQL with auto-scaling and built-in connection pooling (`-pooler` connection strings).
2. **Supabase** (`https://supabase.com`) — Managed PostgreSQL with PgBouncer connection pooler (port `6543`).
3. **AWS RDS / Aurora PostgreSQL** — Enterprise PostgreSQL with AWS RDS Proxy.
4. **Render / Railway PostgreSQL** — Managed PostgreSQL with SSL.

### B. Connection Pooling Architecture
To prevent exhausting database connection limits across bursty serverless invocations, `src/config/database.ts` has been updated with serverless-optimized pool settings:

```typescript
const isServerlessOrProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
const useSsl =
  process.env.DB_SSL === 'true' ||
  dbUrl.includes('sslmode=require') ||
  dbUrl.includes('supabase.co') ||
  dbUrl.includes('neon.tech') ||
  dbUrl.includes('render.com') ||
  dbUrl.includes('aws.com') ||
  dbUrl.includes('aivencloud.com');

const poolConfig: any = {
  connectionString: dbUrl,
  max: isServerlessOrProd ? (Number(process.env.DB_POOL_MAX) || 3) : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

if (useSsl) {
  poolConfig.ssl = { rejectUnauthorized: false };
}
```

### C. Applying Database Migrations
Before deploying the serverless backend, the database tables must exist in the hosted cloud database. Run the Prisma migration from your local workstation or CI/CD pipeline pointing to the production database:

```bash
# On local workstation targeting production DB:
DATABASE_URL="postgresql://user:pass@host:5432/rexbebe_db?sslmode=require" npx prisma migrate deploy
```

---

## 7. Exact Code Changes Made for Vercel Preparation

The following non-breaking, production-grade modifications were implemented:

1. **Created Vercel Serverless Entry Point**:
   - `backend/api/index.ts`: Implemented stateless `handler(req, res)` exporting Express `app` without `app.listen()`.
2. **Created Vercel Routing Configuration**:
   - `backend/vercel.json`: Added URL rewrite mapping `/(.*)` to `/api` serverless handler.
3. **Hardened Upload Module Against Cold-Start Crash**:
   - `backend/src/routes/uploadRoutes.ts`: Wrapped top-level `fs.mkdirSync` directory initialization in `try...catch` so that import on read-only serverless filesystems does not throw uncaught fatal errors.
4. **Enhanced PostgreSQL Connection Pool for Cloud Databases**:
   - `backend/src/config/database.ts`: Added cloud provider SSL auto-detection (`ssl: { rejectUnauthorized: false }`) and serverless connection pooling limits (`max: 3`).
5. **Dynamic Payment Gateway URL Configuration**:
   - `backend/src/services/paymentService.ts`: Replaced hardcoded `localhost` URLs with dynamic `FRONTEND_URL` and `BACKEND_URL` environment variables for PayHere success, cancel, and callback routing.
6. **Asynchronous Admin User Lookup**:
   - `backend/src/services/adminUserService.ts` & `backend/src/controllers/authController.ts`: Updated `adminLogin` to query PostgreSQL `AdminUser` asynchronously with fallback to local seed data.

---

## 8. Step-by-Step Deployment Runbook

Follow these exact steps when ready to deploy:

### Step 1: Provision Cloud Database & Run Migrations
1. Create a cloud database instance on **Neon** or **Supabase**.
2. Copy the connection string with pooling enabled (e.g. port `6543` on Supabase or `-pooler` on Neon).
3. From the `rexbebe-main/backend` directory on your workstation, apply migrations:
   ```bash
   DATABASE_URL="<your-hosted-database-url>" npx prisma migrate deploy
   ```
4. Seed the primary super-admin account:
   ```bash
   DATABASE_URL="<your-hosted-database-url>" USE_POSTGRES=true npm run setup:admin
   ```

### Step 2: Configure Cloud Object Storage (for Photo Uploads)
1. Create a **Cloudinary** or **AWS S3 / Supabase Storage** bucket.
2. Update `uploadRoutes.ts` or set the storage credentials to route image uploads to the bucket.

### Step 3: Deploy to Vercel
1. In the Vercel Dashboard, click **Add New Project** and select the repository.
2. Under **Project Settings**:
   - **Framework Preset**: `Other`
   - **Root Directory**: `backend` (or `rexbebe-main/backend`)
   - **Build Command**: `npm run build`
3. Add all required environment variables listed in Section 4.
4. Click **Deploy**.

### Step 4: Verify Deployment Health
Once the deployment finishes, verify the live API:
```bash
# 1. Health check & PostgreSQL verification
curl -i https://<your-vercel-domain>/api/health

# Expected response:
# HTTP/2 200
# {"status":"online","database":{"connected":true,"engine":"PostgreSQL Server (node-postgres Pool)"}}

# 2. Public product catalog verification
curl -i https://<your-vercel-domain>/api/products

# 3. PayHere Webhook verification
curl -i https://<your-vercel-domain>/api/webhooks/koombiyo
```
