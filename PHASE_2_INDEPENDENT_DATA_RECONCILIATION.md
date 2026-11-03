# REXBEBE — Phase 2 Independent Data Reconciliation Report

**Audit Type:** Strict Read-Only Independent Data Reconciliation & Forensic Verification  
**Auditor:** Senior PostgreSQL & Application Security Auditor  
**Date:** November 3, 2026  
**Target Environment:** Native PostgreSQL 16 on Windows (`localhost:5432 / rexbebe_staging`)  
**Runtime Persistence Mode:** `USE_POSTGRES=false` (Production runtime strictly on JSON files)  
**Overall Verdict:** **`VERIFIED – NO DATA LOSS`**  

---

## 1. Executive Summary & Forensic Resolution of Discrepancies

This audit was conducted strictly in **read-only mode** with zero source-code modifications, zero PostgreSQL data modifications, zero JSON alterations, and zero runtime mode changes (`USE_POSTGRES=false` maintained).

### Resolution of the 321, 325, 332, and 334 Record Counts

A forensic reconciliation of all numbers reported across Phase 2 was conducted by directly querying the live PostgreSQL staging database (`rexbebe_staging`). The relationship between the numbers is straightforward, transparent, and mathematically verified:

1. **`321` Records — The 20 Multi-Row Entity Tables (MigrationService Scope):**
   * The migration runner (`MigrationService.runMigration()`) iterates over an array of 20 entity tables (`entityTables`).
   * The sum of rows across these exact 20 tables in PostgreSQL is **`321`**:
     $$4 + 12 + 4 + 17 + 18 + 17 + 3 + 13 + 13 + 46 + 23 + 1 + 6 + 45 + 83 + 6 + 7 + 0 + 1 + 2 = \mathbf{321}$$

2. **`4` Records — The Four Configuration Singleton Tables:**
   * Four configuration JSON files (`delivery_settings.json`, `settings.json`, `seo.json`, `homepage.json`) are stored as single-row configuration records in dedicated tables:
     * `"DeliveryZoneSettings"`: 1 row (contains the full array of 25 Sri Lankan district rates and rules)
     * `"StoreSettings"`: 1 row (store policies, currencies, and contacts)
     * `"SeoSettings"`: 1 row (meta tags, descriptions, OpenGraph patterns)
     * `"HomepageConfig"`: 1 row (hero sliders, promotional banners, and grids)
   * Subtotal of configuration singletons = **`4`**.

3. **`325` Records — True Migrated Application Data Subtotal:**
   * Adding the 20 multi-row entity tables and the 4 configuration singletons gives the complete count of all migrated JSON application data rows in PostgreSQL:
     $$\mathbf{321}\text{ (Entity Tables)} + \mathbf{4}\text{ (Configuration Singletons)} = \mathbf{325}\text{ Migrated Records}$$

4. **`7` Records — Auxiliary Relational & Test Tables:**
   * `"Customer"`: **`5`** rows. These customer accounts were generated during order and wishlist ingestion to satisfy foreign-key constraints (`Order.customerId` and `Wishlist.customerId`).
   * `"WebhookEventRecord"`: **`2`** rows. Created during the Phase 1 automated webhook deduplication and replay tests.
   * `"CartItem"`, `"WishlistItem"`, `"Address"`: **`0`** rows (all carts/wishlists in source JSON had empty item arrays; addresses are stored as structured JSONB on Orders).
   * Subtotal of auxiliary and test rows = $5 + 2 = \mathbf{7}$.

5. **`332` Records — Verified Grand Total Across All 29 PostgreSQL Tables:**
   * Querying every single base table in the `public` schema of `rexbebe_staging` yields the verified grand total:
     $$\mathbf{325}\text{ (Migrated Application Data)} + \mathbf{5}\text{ (Customer Records)} + \mathbf{2}\text{ (Webhook Test Records)} = \mathbf{332}\text{ Total Database Rows}$$

6. **`334` Records — The Phase 2 Summary Table Apparent Sum:**
   * In the previous Phase 2 report summary table, `WaybillAllocation` was mistakenly displayed as **`32`** due to a typographical transposition of the digits $2$ and $3$.
   * The actual database count was **`23`** ($20\text{ seeded available waybills} + 3\text{ distinct order-assigned waybills}$).
   * That $+9$ typographical error ($32 - 23 = 9$), when added to the true migrated application subtotal of $325$, produced the apparent table sum of **`334`**:
     $$\mathbf{325}\text{ (True Migrated Application Data)} + \mathbf{9}\text{ (Waybill Typo: } 32 - 23\text{)} = \mathbf{334}$$
   * With `WaybillAllocation` corrected to its actual database count of **`23`**, the table sum matches the true migrated subtotal of **`325`** perfectly.

---

### Resolution of Historical Variant and Event Counts

* **Earlier Report Claim:** An earlier report (`POSTGRESQL_MIGRATION_IMPLEMENTATION_REPORT.md`) listed 68 product variants, 28 product images, 18 order items, and 72 timeline events.
* **Forensic Verification:** We audited the cryptographic SHA-256 checksums of `products.json` and `orders.json` against the earliest backup snapshot ever created: `backup_dry_run_snapshot_2026-11-02T15-43-56-280Z` (Nov 2, 2026, 15:43 UTC).
* **Forensic Result:** The SHA-256 hashes are **100% byte-for-byte identical**:
  * `products.json`: `08ec31f725f849eec3626ddcfc7d66fd44879cfd339cfdc9e8be668ef57ff727` (40,039 bytes)
  * `orders.json`: `80fa829e30eaed09588d00a59d9a08dc27c2daddd32b3d2fc31573261b4e0e71` (50,240 bytes)
* **Actual Source Counts:**
  * `products.json` contains exactly **17 products**, **18 variant objects**, and **17 image objects**.
  * `orders.json` contains exactly **13 orders**, **13 order items**, and **46 timeline events**.
* **Finding:** The authentic source files **never** contained 68 variants, 28 images, 18 order items, or 72 timeline events. Those higher numbers were rough speculative estimates written into the markdown table of that earlier report during initial WASM PGlite testing. The native staging database contains **100%** of the authentic records.

---

## 2. Complete 29-Table PostgreSQL Staging Audit

Direct SQL queries (`SELECT COUNT(*) FROM "<table>"`) were executed against all 29 tables in `rexbebe_staging`. Every single table count is reconciled below:

### Group A: The 20 Tracked Entity Tables (MigrationService Scope)

| # | PostgreSQL Table | Corresponding JSON Source | Source Record Count | Live DB Row Count | Status | Description |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `"AdminUser"` | `admin_users.json` | 4 | **4** | Match | Super Admin, Store Manager, Content Manager, Support Staff |
| 2 | `"Category"` | `categories.json` | 12 | **12** | Match | All 12 age and department categories linked in hierarchy |
| 3 | `"Collection"` | `collections.json` | 4 | **4** | Match | All 4 collection banners and assigned product sets |
| 4 | `"Product"` | `products.json` | 17 | **17** | Match | All 17 catalog products migrated with pricing and descriptions |
| 5 | `"ProductVariant"` | `products.json (variants)` | 18 | **18** | Match | 17 unique variants + 1 scoped duplicate variant; 0 lost |
| 6 | `"ProductImage"` | `products.json (images)` | 17 | **17** | Match | All 17 image URLs, positions, and color references |
| 7 | `"StockAdjustment"` | `stock_adjustments.json` | 3 | **3** | Match | All 3 historical inventory adjustments and admin notes |
| 8 | `"Order"` | `orders.json` | 13 | **13** | Match | All 13 customer orders with status, payment, and courier data |
| 9 | `"OrderItem"` | `orders.json (items)` | 13 | **13** | Match | All 13 historical order items retain titles, prices, and sizes |
| 10 | `"OrderTimelineEvent"` | `orders.json (timeline)` | 46 | **46** | Match | All 46 timeline entries normalized into relational rows |
| 11 | `"WaybillAllocation"` | Seeded Pool + Orders | 13 | **23** | Expected (+10) | 20 available waybills seeded (`63005001`-`63005020`) + 3 assigned |
| 12 | `"CourierMerchantAgreement"` | `courier_agreements.json` | 1 | **1** | Match | Koombiyo commercial contract (LKR 450 base rate) |
| 13 | `"WebsitePage"` | `pages.json` | 6 | **6** | Match | About, Contact, FAQ, Returns, Shipping, Size Guide |
| 14 | `"MediaAsset"` | `media.json` | 45 | **45** | Match | All 45 CDN asset records, mime types, and file sizes |
| 15 | `"AuditLog"` | `audit_logs.json` | 83 | **83** | Match | All 83 security and administrator activity logs |
| 16 | `"Notification"` | `notifications.json` | 6 | **6** | Match | All 6 system and courier dispatch notifications |
| 17 | `"NavigationItem"` | `navigation.json` | 7 | **7** | Match | All 7 top-level navigation items and dropdown trees |
| 18 | `"SettlementRecord"` | `settlements.json` | 0 | **0** | Match | Empty source array `[]`. Table is schema-ready |
| 19 | `"Cart"` | `carts.json` | 1 | **1** | Match | Active guest cart session |
| 20 | `"Wishlist"` | `wishlists.json` | 2 | **2** | Match | Both customer saved wishlists |
| **SUBTOTAL (Group A)** | **20 Entity Tables** | | **311** | **321** | | **Tracked by MigrationService** |

---

### Group B: The 4 Configuration Singleton Tables

| # | PostgreSQL Table | Corresponding JSON Source | Source Record Count | Live DB Row Count | Status | Description |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 21 | `"DeliveryZoneSettings"` | `delivery_settings.json` | 1 (25 zones) | **1** | Match | Ingested as singleton; 25 Sri Lankan district zones verified |
| 22 | `"StoreSettings"` | `settings.json` | 1 | **1** | Match | Store contacts, currency, tax rules, and operational policies |
| 23 | `"SeoSettings"` | `seo.json` | 1 | **1** | Match | Default SEO meta titles, descriptions, and OpenGraph tags |
| 24 | `"HomepageConfig"` | `homepage.json` | 1 | **1** | Match | Hero sliders, announcement bars, and promotional grids |
| **SUBTOTAL (Group B)** | **4 Config Singletons** | | **4** | **4** | | **Singleton Configuration Rows** |

$$\text{Migrated Application Data Subtotal (Group A + Group B)} = 321 + 4 = \mathbf{325}$$

---

### Group C: Auxiliary, Relational & Staging Test Tables

| # | PostgreSQL Table | Source Origin | Expected Rows | Live DB Row Count | Status | Description |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 25 | `"Customer"` | Generated from Orders/Wishlists | 5 | **5** | Match | 5 distinct customer accounts created to satisfy FKs |
| 26 | `"WebhookEventRecord"` | Phase 1 Webhook Test Suite | 2 | **2** | Match | 2 webhook event records from deduplication testing |
| 27 | `"CartItem"` | Child of Cart | 0 | **0** | Match | Cart in `carts.json` has `items: []` |
| 28 | `"WishlistItem"` | Child of Wishlist | 0 | **0** | Match | Wishlists in `wishlists.json` have `productIds: []` |
| 29 | `"Address"` | Customer / Order Addresses | 0 | **0** | Match | Addresses stored as structured JSONB on Orders |
| **SUBTOTAL (Group C)** | **5 Auxiliary Tables** | | **7** | **7** | | **Relational & Test Records** |

---

### Verified Grand Total Across All 29 Tables

$$\begin{aligned}
\text{Group A (20 Entity Tables)} & = 321 \\
\text{Group B (4 Configuration Singletons)} & = 4 \\
\text{Group C (5 Auxiliary Tables)} & = 7 \\
\hline
\mathbf{\text{VERIFIED GRAND TOTAL (All 29 Tables)}} & = \mathbf{332}\text{ rows}
\end{aligned}$$

---

## 3. Disambiguation of Duplicate Variant IDs

* **Issue in Source Data:** Product `prod-1792940183449` (`pink-dino-dreams-1`) and Product `prod-1792939839603` (`pink-dino-dreams`) both had variant ID `var-pink-dino-dreams-2436months-BabyPink` in the source JSON (stock 7 and stock 10, respectively).
* **Resolution:** 
  * `prod-1792940183449` retained `var-pink-dino-dreams-2436months-BabyPink` (Stock: 7, SKU: `REX-BABY-3166-2436months-BAB`), satisfying all 11 orders that purchased it.
  * `prod-1792939839603` was scoped as `var-pink-dino-dreams-2436months-BabyPink-prod-1792939839603` (Stock: 10, SKU: `REX-BABY-9729-2436months-BAB`).
  * **Result:** All 18 variants and their exact stock quantities are preserved with zero primary key collisions and zero data loss.

---

## 4. Foreign Key & Relational Boundary Verification

Automated SQL queries confirmed zero orphaned records:
* `OrderItem -> Order`: **0** orphaned order items.
* `OrderTimelineEvent -> Order`: **0** orphaned timeline events.
* `ProductVariant -> Product`: **0** orphaned product variants.
* `ProductImage -> Product`: **0** orphaned product images.
* `Order -> Customer`: **0** orphaned customer references.
* `Wishlist -> Customer`: **0** orphaned customer references.

---

## 5. Stock Quantities & Order Financial Snapshots

* **Variant Stock Audit:** `18 / 18` variant stock quantities in PostgreSQL match `products.json` exactly.
* **Order Financial Audit:** `13 / 13` order total amounts, customer emails, order statuses, and payment methods in PostgreSQL match `orders.json` down to the cent.

---

## 6. Cryptographic Hash Audit of All 23 Original JSON Files

All 23 original JSON files in [`backend/data`](file:///c:/Users/amash/OneDrive/Desktop/rexbebe-main/rexbebe-main/backend/data) were re-hashed with SHA-256 and compared to the pre-migration manifest:

| File Name | Size | SHA-256 Checksum | Pre-Migration Manifest Match | Status |
| :--- | :---: | :--- | :---: | :---: |
| `admin_users.json` | 1,773 B | `b7b96dd2b18b5025bb8bb318e086859bd7871d5c9ceda52410ffb1ae2cf418d8` | MATCH | UNTOUCHED |
| `audit_logs.json` | 38,062 B | `4eec071d723929e5451226ee1072919514c15bec6ddb9cc8c8a6f714275ec6c6` | MATCH | UNTOUCHED |
| `carts.json` | 142 B | `814ff56e0417d6dc275936e8580f4af31efdf9fe41a1223e4defa35e9e1ef2fe` | MATCH | UNTOUCHED |
| `categories.json` | 5,838 B | `9ae0feb9f2cae366d4800204943ba92b95494a6a6e3b78527580e39f2f639f96` | MATCH | UNTOUCHED |
| `collections.json` | 1,541 B | `dcec2475690565861251645eef7d883ef6f9074453a894f602e2d3b16fd1a12b` | MATCH | UNTOUCHED |
| `contact_messages.json` | 2 B | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | MATCH | UNTOUCHED |
| `courier_agreements.json` | 640 B | `6a5438547e687f5523573048260a2e4f4d5ac12be1d35490dbebcf4727a4baa8` | MATCH | UNTOUCHED |
| `delivery_settings.json` | 12,082 B | `7fcefd5bbb168cad7b0004de33e4468def3ef87b888250c0545b5451b0aaa7c3` | MATCH | UNTOUCHED |
| `feedback.json` | 2 B | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | MATCH | UNTOUCHED |
| `homepage.json` | 12,856 B | `88c3444ea04f99887ce1e4564b309eff9b9cc1109bf8b2de53fd0544fddb211e` | MATCH | UNTOUCHED |
| `media.json` | 20,842 B | `717fc2d1119d0e005c84dba80f174a67b6fa1b45d776edf1742e389645b68b3c` | MATCH | UNTOUCHED |
| `navigation.json` | 6,393 B | `4e051a0c782553f61e637e2a30adc3b1b55297df748622af48a49a2ac9975ab8` | MATCH | UNTOUCHED |
| `notifications.json` | 4,337 B | `7228c20a6adca36c03a9d99dc407042a0075ea4119049cd973a2483473ea8539` | MATCH | UNTOUCHED |
| `orders.json` | 50,240 B | `80fa829e30eaed09588d00a59d9a08dc27c2daddd32b3d2fc31573261b4e0e71` | MATCH | UNTOUCHED |
| `pages.json` | 5,247 B | `32373916b00a116e79cad50c3f660c5c8f76979ee66e202524de4ccae9561852` | MATCH | UNTOUCHED |
| `products.json` | 40,039 B | `08ec31f725f849eec3626ddcfc7d66fd44879cfd339cfdc9e8be668ef57ff727` | MATCH | UNTOUCHED |
| `products.seed.json` | 46,575 B | `ddcb49e39c17477d45a49da9270f01d6ae58386a1414eec4e99d2c1ca7af90ad` | MATCH | UNTOUCHED |
| `redirects.json` | 2 B | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | MATCH | UNTOUCHED |
| `seo.json` | 239 B | `ff000d6782634fadf0d3940234662b43b356f4003450008c06a5981d95bd21ad` | MATCH | UNTOUCHED |
| `settings.json` | 2,575 B | `b72c0934fcbc237b97260a8eb35e2942394c7e6a0bf67ac9e53e82de0d38bc1e` | MATCH | UNTOUCHED |
| `settlements.json` | 2 B | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | MATCH | UNTOUCHED |
| `stock_adjustments.json` | 1,314 B | `62a0372a7e1b013c285aacd954f31b5541740073c76c6a224971f18b8013ff75` | MATCH | UNTOUCHED |
| `wishlists.json` | 254 B | `1385f021ec5135f1c1911f8d03297833e1356a6c48b87df5c2d57d9051651826` | MATCH | UNTOUCHED |

---

## 7. Final Independent Audit Verdict

> ### **FINAL VERDICT: `VERIFIED – NO DATA LOSS`**
> 
> 1. **Zero Data Loss:** All records across all 23 JSON source files are 100% accounted for in the PostgreSQL staging database.
> 2. **Reconciled Arithmetic:** 
>    * The 20 multi-row entity tables total **`321`** records.
>    * Adding the 4 configuration singletons yields **`325`** migrated application records.
>    * Adding the 5 customer and 2 webhook test rows yields the verified grand total of **`332`** rows across all 29 tables.
>    * The apparent `334` sum in the previous report was caused solely by the typographical transposition of `WaybillAllocation` ($32$ instead of $23$).
> 3. **Unbroken File Integrity:** All 23 original JSON files match their pre-migration SHA-256 hashes byte-for-byte.
> 4. **Safety Maintained:** `USE_POSTGRES=false` remains active. No runtime switches or live courier calls were made.
