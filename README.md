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

---

## 🚀 Complete SEO & Technical Architecture

REXBEBE includes comprehensive, production-grade technical, on-page, and e-commerce SEO natively integrated across the storefront and admin suite.

### 1. Metadata & Open Graph Architecture
- **Centralized SEO Config (`frontend/config/seoConfig.ts`)**: Authoritative configuration containing brand legal identity, Sri Lankan physical store metadata (142 Galle Road, Colombo 03), geo-coordinates, canonical domain resolver, and title formatters.
- **Dynamic Database Metadata (`frontend/services/serverSeoService.ts`)**: Dynamically resolves metadata for products (`/products/[slug]`), categories (`/categories/[slug]`, `/[...categoryPath]`), and collections (`/collections/[slug]`) from active database records.
- **Title Deduping**: Uses Next.js absolute title formatting (`{ absolute: ... }`) to eliminate duplicate branding suffixes (prevents `| REXBEBE | REXBEBE`).
- **OpenGraph & Twitter Cards**: High-resolution 1200×630 social share images with `.webp` fallbacks and dynamic product image integration.

### 2. Structured Data (JSON-LD)
Valid, schema.org-compliant JSON-LD schemas embedded directly in server-rendered HTML:
- **`Organization`**: Brand name, logo, official contact, social profiles.
- **`WebSite`**: Site name, canonical URL, and Sitelinks Searchbox (`PotentialAction`).
- **`LocalBusiness / ClothingStore`**: Genuine flagship boutique details (142 Galle Road, Colombo 03, Sri Lanka; opening hours, LKR currency, payment methods accepted).
- **`Product & Offer`**: Accurate product title, description, real prices in `LKR`, current availability (`InStock` / `OutOfStock`), price valid dates, return policy (`MerchantReturnPolicy` for LK), and standard islandwide delivery details.
- **Authentic Reviews Rule**: Review ratings and aggregate ratings are only included in JSON-LD when genuine customer review data exists (`reviewCount > 0`).
- **`BreadcrumbList`**: Full hierarchical navigation structure on every category, collection, and product page.

### 3. Admin SEO Management Suite
Authorized staff can manage complete SEO metadata directly within the Admin panel:
- **Products Form (`/admin/products`)**: Step 6 "SEO & Meta" tab with custom URL slug, SEO Title (character counter), SEO Meta Description (character counter), individual Image Alt Text for every uploaded photograph, and live Google Search snippet preview.
- **Categories Form (`/admin/categories`)**: URL slug input, SEO Title, SEO Description, Image Alt Text, and Google SERP preview.
- **Collections Form (`/admin/collections`)**: URL slug input, Banner Image Alt Text, SEO Title, SEO Description, and Google SERP preview.
- **Automatic 301 Redirects**: Modifying the slug of an existing public product, category, or collection automatically creates a permanent 301 redirect in `data/redirects.json` (`fromPath` $\rightarrow$ `toPath`) to maintain search equity and prevent 404 broken links.

### 4. Dynamic XML Sitemap & Robots Directives
- **`/sitemap.xml`**: Dynamically generates fresh sitemaps from active database records including all published products, categories, collections, and informational pages (`/about`, `/contact`, `/shipping`, `/returns`, `/size-guide`, `/reviews`, `/faq`, etc.).
- **`/robots.txt`**: Directs search engine crawlers to `https://rexbebe.com/sitemap.xml`, explicitly disallows private routes (`/admin/**`, `/cart`, `/checkout`, `/account`, `/order-tracking`, `/order`), while guaranteeing public assets (`/images/`, `/uploads/`, `/_next/`) remain freely crawlable.

### 5. Automated Image Optimization Pipeline
- **Next-Gen WebP Pipeline**: 85 product and editorial images converted to high-efficiency WebP format (~80–85 quality) reducing asset payload by 76% (saving ~59 MB).
- **Automatic Conversion on Upload**: New images uploaded via the Admin panel are automatically converted to optimized WebP versions before saving.
- **Dedicated Grid Thumbnails**: Generates `-thumb.webp` variants for ultra-fast storefront product card rendering with zero layout shift (`CLS = 0`).

---

## 📋 Post-Deployment Steps Requiring Your Google Account Access

To activate live search indexing and performance monitoring after deploying to production:

### 1. Google Search Console (GSC) Setup
1. Log in to [Google Search Console](https://search.google.com/search-console).
2. Click **Add Property** and select **URL Prefix**: `https://rexbebe.com`.
3. Choose the **HTML Tag** verification method.
4. Copy the verification code token from the `content="..."` attribute (e.g. `abcdef123456...`).
5. Add this token to your production environment variables:
   ```bash
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="your-verification-code-here"
   ```
6. Redeploy or restart your frontend, then click **Verify** in Google Search Console.

### 2. Sitemap Submission
1. In Google Search Console, navigate to the **Sitemaps** section in the left menu.
2. In the "Add a new sitemap" input, enter `sitemap.xml`.
3. Click **Submit**. Googlebot will queue and crawl all eligible public URLs.

### 3. Google Analytics 4 (GA4) & Conversion Tracking
1. Create a GA4 property in the [Google Analytics Admin Console](https://analytics.google.com).
2. Create a Web Data Stream for `https://rexbebe.com` and obtain your **Measurement ID** (format: `G-XXXXXXXXXX`).
3. Set your production environment variable:
   ```bash
   NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
   ```
4. The storefront is pre-configured with GA4 e-commerce events:
   - `view_item`: Triggered on product detail page view.
   - `add_to_cart`: Triggered when an item is added to the cart.
   - `begin_checkout`: Triggered on initiating checkout.
   - `purchase`: Triggered upon successful order completion.

### 4. Rich Results & Schema Validation
1. Visit the [Google Rich Results Test](https://search.google.com/test/rich-results).
2. Test representative public URLs:
   - Homepage: `https://rexbebe.com/`
   - Product Detail: `https://rexbebe.com/products/pink-dino-dreams-1`
   - Category: `https://rexbebe.com/categories/baby`
   - Collection: `https://rexbebe.com/collections/everyday-essentials`
3. Verify that `Product`, `Offer`, `BreadcrumbList`, `Organization`, and `ClothingStore` schemas show "Valid".

