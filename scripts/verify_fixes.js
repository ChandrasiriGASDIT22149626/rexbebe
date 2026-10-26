const fs = require('fs');

const cats = JSON.parse(fs.readFileSync('backend/data/categories.json', 'utf-8'));
const nav = JSON.parse(fs.readFileSync('backend/data/navigation.json', 'utf-8'));
const prods = JSON.parse(fs.readFileSync('backend/data/products.json', 'utf-8'));

console.log('=== VERIFICATION RESULTS ===');
const spuriousCat = cats.find(c => c.name === 'CATEGORIES' || c.id === 'grp-krish-boxer-1792335408509');
console.log('1. Spurious CATEGORIES in categories.json:', spuriousCat ? 'FAILED' : 'PASSED (Cleaned)');

const boxerCat = cats.find(c => c.slug === 'krish-boxer');
console.log('2. krish-boxer href in categories.json:', boxerCat?.href);
console.log('3. krish-boxer assigned products count:', boxerCat?.assignedProductIds?.length);

const newbornNav = nav.items.find(i => i.id === 'nav-newborn');
console.log('4. nav-newborn badge:', newbornNav?.badge ? `FAILED (${newbornNav.badge})` : 'PASSED (Removed)');

const navStr = JSON.stringify(nav);
console.log('5. CATEGORIES string in navigation.json:', navStr.includes('"CATEGORIES"') ? 'FAILED' : 'PASSED (Cleaned)');

const spidey = prods.find(p => p.id === 'prod-1792338599637');
console.log('6. prod-1792338599637 subcategory identity:', spidey?.subcategory);
console.log('============================');
