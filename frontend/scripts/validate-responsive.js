/**
 * REXBEBE Automated Responsive Design Verification Suite
 * Validates viewport configuration, responsive classes, touch targets, and overflow safeguards.
 */

const fs = require('fs');
const path = require('path');

let passedChecks = 0;
let warnings = 0;
let failedChecks = 0;

function check(title, condition, detail = '') {
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${title}`);
  } else {
    failedChecks++;
    console.error(`  ❌ [FAIL] ${title} - ${detail}`);
  }
}

function warn(title, detail = '') {
  warnings++;
  console.warn(`  ⚠️ [WARN] ${title} - ${detail}`);
}

console.log('\n📱 Starting REXBEBE Automated Responsive Design Verification Suite...\n');

// 1. Check Root Layout Viewport Metadata
const layoutPath = path.join(__dirname, '../app/layout.tsx');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  check('Viewport export present in Root Layout', layoutContent.includes('export const viewport: Viewport'));
  check('Viewport specifies width=device-width', layoutContent.includes("width: 'device-width'"));
  check('Viewport specifies initialScale=1', layoutContent.includes('initialScale: 1'));
  check('ThemeColor configured for mobile header aesthetic', layoutContent.includes('themeColor:'));
} else {
  failedChecks++;
  console.error('Root layout not found!');
}

// 2. Check Global CSS for responsive touch & motion utilities
const cssPath = path.join(__dirname, '../app/globals.css');
if (fs.existsSync(cssPath)) {
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  check('Touch-scrolling utility defined in globals.css', cssContent.includes('.touch-scroll'));
  check('No-scrollbar utility defined in globals.css', cssContent.includes('.no-scrollbar'));
  check('Accessible tap target utility defined in globals.css', cssContent.includes('.tap-target'));
  check('Prefers-reduced-motion media query implemented', cssContent.includes('prefers-reduced-motion: reduce'));
  check('WebKit smooth touch scrolling enabled', cssContent.includes('-webkit-overflow-scrolling: touch'));
} else {
  failedChecks++;
  console.error('globals.css not found!');
}

// 3. Check Mobile Header & Mobile Menu Drawer
const headerPath = path.join(__dirname, '../components/layout/Header.tsx');
if (fs.existsSync(headerPath)) {
  const headerContent = fs.readFileSync(headerPath, 'utf8');
  check('Customer header features fully functional search, theme toggle, wishlist, and cart', headerContent.includes('CartButtonHeader') && headerContent.includes('WishlistButtonHeader') && headerContent.includes('ThemeToggleButton') && headerContent.includes('SearchOverlay'));
}

const mobileMenuPath = path.join(__dirname, '../components/layout/MobileMenu.tsx');
if (fs.existsSync(mobileMenuPath)) {
  const menuContent = fs.readFileSync(mobileMenuPath, 'utf8');
  check('Body scroll locking on drawer open', menuContent.includes("document.body.style.overflow = 'hidden'"));
  check('Keyboard Escape key close listener implemented', menuContent.includes("e.key === 'Escape'"));
  check('Dynamic categories expandable submenus supported in mobile drawer', menuContent.includes('expandedNavId') && menuContent.includes('navigationConfig'));
  check('Touch targets meet ~44px accessibility sizing', menuContent.includes('min-h-[44px]'));
}

// 4. Check Hero Section Responsiveness
const heroPath = path.join(__dirname, '../components/home/Hero.tsx');
if (fs.existsSync(heroPath)) {
  const heroContent = fs.readFileSync(heroPath, 'utf8');
  check('Hero mascot scaled down gracefully on mobile', heroContent.includes('w-[160px]') && heroContent.includes('min-[400px]:w-[200px]'));
  check('Hero speech bubble prevents awkward overflow', heroContent.includes('whitespace-normal sm:whitespace-nowrap'));
  check('Hero typography is fluid across mobile breakpoints', heroContent.includes('text-4xl min-[400px]:text-5xl sm:text-6xl lg:text-7xl'));
  check('Hero 3D typography uses responsive balloon styling', heroContent.includes('balloon-text-pink') && heroContent.includes('balloon-text-green'));
}

// 5. Check Product Grid & Product Card Responsiveness
const productGridPath = path.join(__dirname, '../components/products/ProductGrid.tsx');
if (fs.existsSync(productGridPath)) {
  const gridContent = fs.readFileSync(productGridPath, 'utf8');
  check('ProductGrid adopts mobile 2-column layout', gridContent.includes('grid-cols-1 min-[360px]:grid-cols-2'));
}

const productCardPath = path.join(__dirname, '../components/products/ProductCard.tsx');
if (fs.existsSync(productCardPath)) {
  const cardContent = fs.readFileSync(productCardPath, 'utf8');
  check('ProductCard corner badges scale down to prevent card overflow', cardContent.includes('-top-1.5 -left-1.5') || cardContent.includes('top-2.5 right-2.5'));
  check('Responsive image sizes configured for product card', cardContent.includes('(max-width: 640px) 50vw'));
  check('ProductCard ADD TO CART button sized for mobile cards', cardContent.includes('py-2.5 sm:py-3') || (cardContent.includes('Add to Cart') && cardContent.includes('sm:hidden')));
}

// 6. Check Admin Responsiveness
const adminSidebarPath = path.join(__dirname, '../components/layout/AdminSidebar.tsx');
if (fs.existsSync(adminSidebarPath)) {
  const adminContent = fs.readFileSync(adminSidebarPath, 'utf8');
  check('AdminSidebar collapses on screens smaller than lg', adminContent.includes('hidden lg:flex'));
  check('AdminSidebar provides mobile floating drawer trigger', adminContent.includes('Toggle Admin Navigation Drawer'));
  check('AdminSidebar listens for open-admin-nav event', adminContent.includes('open-admin-nav'));
}

const adminHeaderPath = path.join(__dirname, '../components/layout/AdminHeader.tsx');
if (fs.existsSync(adminHeaderPath)) {
  const adminHeaderContent = fs.readFileSync(adminHeaderPath, 'utf8');
  check('AdminHeader includes mobile menu button for < lg screens', adminHeaderContent.includes('open-admin-nav'));
}

// 7. Check Footer Responsiveness
const footerPath = path.join(__dirname, '../components/layout/Footer.tsx');
if (fs.existsSync(footerPath)) {
  const footerContent = fs.readFileSync(footerPath, 'utf8');
  check('Footer legal links wrap gracefully on 320px screens', footerContent.includes('flex flex-wrap items-center justify-center') && (footerContent.includes('gap-x-4') || footerContent.includes('gap-x-3')));
  check('Footer accordions present for small screens', footerContent.includes('openAccordions'));
}

console.log('\n========================================');
console.log(`✅ Passed Checks: ${passedChecks}`);
console.log(`⚠️ Warnings:     ${warnings}`);
console.log(`❌ Failed Checks: ${failedChecks}`);
console.log('========================================\n');

if (failedChecks === 0) {
  console.log('🎉 ALL RESPONSIVE CHECKS PASSED SUCCESSFULLY!\n');
  process.exit(0);
} else {
  console.error('💥 SOME RESPONSIVE CHECKS FAILED!\n');
  process.exit(1);
}
