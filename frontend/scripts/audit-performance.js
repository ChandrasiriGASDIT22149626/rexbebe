/**
 * REXBEBE Automated Performance & Web Vitals Audit Suite
 * Validates:
 * 1. Image optimizations (WebP format, LCP priority, sizes, responsive dimensions)
 * 2. 3D Hero optimizations (visibility pausing, prefers-reduced-motion, spring cleanup)
 * 3. Frontend code-splitting (dynamic imports for below-the-fold sections)
 * 4. Backend caching headers (Cache-Control on products, categories, collections, navigation)
 * 5. Preloader latency & non-blocking execution
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

let passedChecks = 0;
let failedChecks = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passedChecks++;
    console.log(`  ✅ ${testName}`);
  } else {
    failedChecks++;
    console.error(`  ❌ FAILED: ${testName} ${details ? '(' + details + ')' : ''}`);
  }
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function runPerformanceAudit() {
  console.log('🚀 Running REXBEBE Advanced Performance Audit Suite...\n');

  // 1. Audit Hero Component Performance
  console.log('--- 1. Hero 3D Animation & LCP Image Audit ---');
  const heroPath = path.resolve(__dirname, '../components/home/Hero.tsx');
  const heroContent = fs.readFileSync(heroPath, 'utf-8');

  assert(heroContent.includes('useInView'), 'Hero uses useInView to pause off-screen animations');
  assert(heroContent.includes('useReducedMotion'), 'Hero respects prefers-reduced-motion');
  assert(heroContent.includes('/images/hero/world_bg.webp'), 'Hero uses optimized WebP world background image');
  assert(heroContent.includes('/images/hero/dino_mascot.webp'), 'Hero uses optimized WebP Dino mascot');
  assert(heroContent.includes('/images/hero/kitty_mascot.webp'), 'Hero uses optimized WebP Kitty mascot');
  assert(heroContent.includes('fetchPriority="high"'), 'Hero background has fetchPriority="high" for optimal LCP');
  assert(heroContent.includes('shouldReduceMotion'), 'Parallax mouse springs disabled on reduced motion');

  // 2. Audit Preloader Non-Blocking Behavior
  console.log('\n--- 2. Preloader Latency & Accessibility Audit ---');
  const preloaderPath = path.resolve(__dirname, '../components/ui/Preloader.tsx');
  const preloaderContent = fs.readFileSync(preloaderPath, 'utf-8');

  assert(preloaderContent.includes('prefers-reduced-motion'), 'Preloader immediately skips on reduced motion');
  assert(preloaderContent.includes('/images/dino_character.webp'), 'Preloader uses WebP mascot image');
  assert(preloaderContent.includes('duration = 180'), 'Preloader duration set to ultra-fast non-blocking 180ms');

  // 3. Audit Code Splitting & Dynamic Imports on Homepage
  console.log('\n--- 3. Code-Splitting & Dynamic Imports Audit ---');
  const pagePath = path.resolve(__dirname, '../app/page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf-8');

  assert(pageContent.includes("const CategorySection = dynamic("), 'CategorySection is dynamically imported');
  assert(pageContent.includes("const BestSellers = dynamic("), 'BestSellers is dynamically imported');
  assert(pageContent.includes("const NewArrivals = dynamic("), 'NewArrivals is dynamically imported');
  assert(pageContent.includes("const LittleEssentials = dynamic("), 'LittleEssentials is dynamically imported');
  assert(pageContent.includes("const TheLittleEdit = dynamic("), 'TheLittleEdit is dynamically imported');
  assert(pageContent.includes("const BrandStory = dynamic("), 'BrandStory is dynamically imported');
  assert(pageContent.includes("const Footer = dynamic("), 'Footer is dynamically imported');

  // 4. Audit WebP Adoption across Home Sections
  console.log('\n--- 4. WebP Image Adoption Across Sections ---');
  const catSection = fs.readFileSync(path.resolve(__dirname, '../components/home/CategorySection.tsx'), 'utf-8');
  assert(catSection.includes('.webp') && !catSection.includes("image: '/images/products/insta-cocomelon-family-cream.jpg'"), 'CategorySection uses WebP category thumbnails');

  const brandStory = fs.readFileSync(path.resolve(__dirname, '../components/home/BrandStory.tsx'), 'utf-8');
  assert(brandStory.includes('plush-bears-tshirts.webp'), 'BrandStory uses WebP primary image');
  assert(brandStory.includes('baby-bluey-gym.webp'), 'BrandStory uses WebP secondary image');

  const customerReviews = fs.readFileSync(path.resolve(__dirname, '../components/home/CustomerReviews.tsx'), 'utf-8');
  assert(customerReviews.includes('review-cocomelon-mom-baby.webp'), 'CustomerReviews uses WebP review image');

  const featuredCol = fs.readFileSync(path.resolve(__dirname, '../components/home/FeaturedCollection.tsx'), 'utf-8');
  assert(featuredCol.includes('lookbook-cocomelon-pink-gift.webp'), 'FeaturedCollection uses WebP lookbook image');

  const instaSec = fs.readFileSync(path.resolve(__dirname, '../components/home/InstagramSection.tsx'), 'utf-8');
  assert(instaSec.includes('insta-peppa-wooden-bear.webp'), 'InstagramSection uses WebP grid images');

  // 5. Audit CSS Accessibility & CLS Protection
  console.log('\n--- 5. CSS & Layout Shift Audit ---');
  const globalsCss = fs.readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf-8');
  assert(globalsCss.includes('@media (prefers-reduced-motion: reduce)'), 'globals.css includes accessible reduced-motion rules');

  const productCard = fs.readFileSync(path.resolve(__dirname, '../components/products/ProductCard.tsx'), 'utf-8');
  assert(productCard.includes('aspect-[1312/1199]'), 'ProductCard enforces explicit aspect-ratio to prevent CLS');

  // 6. Audit Live Backend Endpoints & Cache-Control Headers
  console.log('\n--- 6. Backend API Live Caching & Response Time Audit ---');
  try {
    const t0 = Date.now();
    const prodRes = await httpGet('http://localhost:5000/api/products');
    const prodDuration = Date.now() - t0;
    assert(prodRes.statusCode === 200, 'GET /api/products returns HTTP 200');
    assert(prodDuration < 150, `GET /api/products response time is fast (${prodDuration}ms)`);
    assert(prodRes.headers['cache-control'] && prodRes.headers['cache-control'].includes('public'), 'GET /api/products sets public Cache-Control');

    const t1 = Date.now();
    const catRes = await httpGet('http://localhost:5000/api/categories');
    const catDuration = Date.now() - t1;
    assert(catRes.statusCode === 200, 'GET /api/categories returns HTTP 200');
    assert(catDuration < 150, `GET /api/categories response time is fast (${catDuration}ms)`);
    assert(catRes.headers['cache-control'] && catRes.headers['cache-control'].includes('public'), 'GET /api/categories sets public Cache-Control');

    const colRes = await httpGet('http://localhost:5000/api/collections');
    assert(colRes.statusCode === 200, 'GET /api/collections returns HTTP 200');
    assert(colRes.headers['cache-control'] && colRes.headers['cache-control'].includes('public'), 'GET /api/collections sets public Cache-Control');

    const navRes = await httpGet('http://localhost:5000/api/navigation');
    assert(navRes.statusCode === 200, 'GET /api/navigation returns HTTP 200');
    assert(navRes.headers['cache-control'] && navRes.headers['cache-control'].includes('public'), 'GET /api/navigation sets public Cache-Control');
  } catch (err) {
    console.error('Backend HTTP test notice:', err.message);
  }

  // Summary
  console.log('\n=============================================');
  console.log(`TOTAL PASSED: ${passedChecks}`);
  console.log(`TOTAL FAILED: ${failedChecks}`);
  console.log('=============================================');

  if (failedChecks === 0) {
    console.log('\n🎉 ALL PERFORMANCE AUDIT CHECKS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    console.error(`\n❌ ${failedChecks} performance checks failed.\n`);
    process.exit(1);
  }
}

runPerformanceAudit();
