# REXBEBE — SEO LAUNCH & POST-DEPLOYMENT CHECKLIST

Use this step-by-step checklist when deploying the REXBEBE website to Vercel and connecting your live production domain.

---

## Phase 1: Vercel Environment Configuration
- [ ] Log in to the [Vercel Dashboard](https://vercel.com).
- [ ] Select the `rexbebe` project.
- [ ] Navigate to **Settings** -> **Environment Variables**.
- [ ] Add the following Production variables:
  - `NEXT_PUBLIC_SITE_URL`: `https://rexbebe.com` (replace with your actual verified live domain).
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID`: `G-XXXXXXXXXX` (your real Google Analytics 4 Measurement ID).
- [ ] Trigger a redeployment on the `main` branch to pick up the production variables.

---

## Phase 2: Domain & Canonical URL Verification
- [ ] Under **Settings** -> **Domains**, verify that your custom domain is connected.
- [ ] Select your primary domain preference (e.g., `https://rexbebe.com` or `https://www.rexbebe.com`).
- [ ] Confirm that Vercel is set to **Redirect to primary domain** for the alternate (e.g. `www.rexbebe.com` -> `rexbebe.com`).
- [ ] Verify that HTTPS/SSL certificate is valid and issued.
- [ ] Check that browsing `https://rexbebe.com/` shows `<link rel="canonical" href="https://rexbebe.com" />`.

---

## Phase 3: Robots & Sitemap Verification
- [ ] In your browser, open `https://your-domain.com/robots.txt`.
  - [ ] Confirm `User-agent: *` is present.
  - [ ] Confirm `Allow: /` is present.
  - [ ] Confirm `Disallow: /admin/` and other private paths are present.
  - [ ] Confirm `Sitemap: https://your-domain.com/sitemap.xml` is displayed.
- [ ] Open `https://your-domain.com/sitemap.xml`.
  - [ ] Confirm the browser displays a valid XML sitemap without errors.
  - [ ] Confirm all URLs begin with your live production domain (not `localhost` or `vercel.app`).
  - [ ] Confirm published products are listed.

---

## Phase 4: Google Search Console (GSC) Setup
- [ ] Open [Google Search Console](https://search.google.com/search-console).
- [ ] Click **Add Property** and choose **Domain** (e.g., `rexbebe.com`).
- [ ] Add the DNS TXT record provided by Google to your domain registrar (e.g. Cloudflare, Namecheap, GoDaddy).
- [ ] Once verified, go to **Sitemaps** in the left sidebar.
- [ ] Enter `sitemap.xml` and click **Submit**.
- [ ] Ensure the status shows `Success`.
- [ ] Use the **URL Inspection** tool to inspect:
  - Homepage: `https://your-domain.com/`
  - A product page: `https://your-domain.com/products/aurelia-organic-cashmere-romper`
  - A category page: `https://your-domain.com/categories/baby-clothing`
- [ ] Confirm that Googlebot can fetch the page and reads the `Product` structured data.

---

## Phase 5: Google Merchant Center (Google Shopping)
- [ ] If listing products on Google Shopping, open [Google Merchant Center](https://merchants.google.com).
- [ ] Complete business information and claim your website domain.
- [ ] Go to **Products** -> **Feeds** -> **Add primary feed**.
- [ ] Select country of sale and language.
- [ ] Choose **Scheduled fetch**.
- [ ] Feed URL: `https://your-domain.com/api/feed/google-merchant`.
- [ ] Set fetch frequency to **Daily**.
- [ ] Trigger an initial fetch and review reported products for any attribute warnings.

---

## Phase 6: Google Analytics 4 (GA4) Validation
- [ ] Navigate to your live website with browser developer tools or Google Tag Assistant.
- [ ] Verify that Google Analytics 4 tag fires on page load.
- [ ] In GA4 Realtime reports, verify active user visits.
- [ ] Test the e-commerce purchase funnel:
  - Add item to cart -> View cart -> Checkout.
  - Confirm events (`view_item`, `add_to_cart`, `begin_checkout`) appear in GA4 DebugView.

---

## Phase 7: Ongoing Monitoring & Maintenance
- [ ] Check Search Console **Page indexing** report bi-weekly for any 404s or crawl anomalies.
- [ ] Check **Enhancements** tab for `Products`, `Breadcrumbs`, and `Merchant listings` status.
- [ ] When adding new catalog products or collections, verify they appear automatically in `/sitemap.xml` and `/api/feed/google-merchant`.
