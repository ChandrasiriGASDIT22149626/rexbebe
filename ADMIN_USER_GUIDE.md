# REXBEBE Admin Panel — Complete Store Owner User Guide

Welcome to the **REXBEBE Store Management Suite**! This manual is written in simple, everyday English so that you or any member of your staff can comfortably run your worldwide baby-clothing business without technical or programming knowledge.

---

## Table of Contents

1. [Logging In to Your Admin Panel](#1-logging-in-to-your-admin-panel)
2. [Navigating the Dashboard (Store Overview)](#2-navigating-the-dashboard-store-overview)
3. [Checking Global Visitor Insights](#3-checking-global-visitor-insights)
4. [Managing Customer Orders](#4-managing-customer-orders)
5. [Managing Inventory & Variant Stock](#5-managing-inventory--variant-stock)
6. [Updating the Homepage with Homepage Studio](#6-updating-the-homepage-with-homepage-studio)
7. [Managing Categories & Header Navigation](#7-managing-categories--header-navigation)
8. [Adding & Editing Baby Clothing Products](#8-adding--editing-baby-clothing-products)
9. [Previewing Content (Desktop & Mobile)](#9-previewing-content-desktop--mobile)
10. [Publishing & Saving Drafts](#10-publishing--saving-drafts)
11. [Managing Customer Feedback & Reviews](#11-managing-customer-feedback--reviews)
12. [Managing Admin Users & Permissions](#12-managing-admin-users--permissions)
13. [Configuring Store, Shipping & Payment Settings](#13-configuring-store-shipping--payment-settings)
14. [Frequently Asked Questions & Helpful Tips](#14-frequently-asked-questions--helpful-tips)

---

## 1. Logging In to Your Admin Panel

### How to Access:
- Open your web browser and go to your store admin address: `https://your-store.com/admin` (or `http://localhost:3000/admin` when working locally).
- When prompted, sign in with your authorized administrator email and password.
- You will be greeted with the main dashboard: **"Welcome to REXBEBE Store Management"**.

> **Security Tip**: Always log out when you finish using a shared or public computer. Never share your password with unauthorized individuals.

---

## 2. Navigating the Dashboard (Store Overview)

The **Store Overview** (`/admin` or `/admin/store-overview`) is your central command center. At a glance, it shows how your boutique is performing today, this week, or this month.

### 4 Main Sidebar Sections:
1. **Store Management**:
   - **Store Overview**: High-level sales, orders, and stock summary.
   - **Global Visitor Insights**: Country traffic, popular products, and device breakdown.
   - **Orders**: Full order fulfillment workflow and customer delivery status.
   - **Inventory**: Variant-level stock numbers, low-stock warnings, and stock logs.
2. **Website Management**:
   - **Homepage Studio**: Visual editor for every section of the homepage.
   - **Website Pages**: Content pages (About Us, Sizing Guide, Care Guide, FAQs).
   - **Categories & Navigation**: Header dropdown menus, age groups, and collections.
   - **Product Catalogue**: Baby outfits, gallery photos, sizes, and pricing.
   - **Collections**: Curated seasonal selections (e.g., Autumn Cashmere, Newborn Gift Sets).
   - **Customer Feedback & Reviews**: Product ratings, reviews, suggestions, and support questions.
   - **Media Library**: Upload and manage store images and banners.
3. **Business Management**:
   - **Customers**: Customer records, order frequency, and contact details.
   - **Promotions & Sale**: Seasonal sale discounts and promotional banners.
   - **Reports**: Store revenue and order volume reports over time.
4. **Admin Settings**:
   - **Admin Users & Permissions**: Staff accounts, roles, and security audit trail.
   - **Store Settings**: Business profile, international markets, shipping rates, and payment gateways.

### How to Use the Overview Dashboard:
- **Date Filters**: Click **Today**, **Last 7 Days**, **Last 30 Days**, or **All Time** at the top right to instantly recalculate performance metrics.
- **Accurate Sales Figures**: The Total Sales number reflects **only paid customer orders**. Cancelled orders, pending checkouts, and refunds are strictly excluded so you never see inflated numbers.
- **Clickable Cards**: Click any card (e.g., *Low Stock Products* or *New Orders*) to immediately jump to the relevant management page with that filter already turned on.

---

## 3. Checking Global Visitor Insights

Your baby boutique reaches families all over the world. The **Global Visitor Insights** page (`/admin/visitors`) shows where parents are browsing from.

### What You Can See:
- **Worldwide Reach**: A map summary and table showing visitors by country (e.g., Sri Lanka, United States, United Kingdom, Germany, UAE, Australia).
- **Most Visited Outfits**: See which baby rompers and dresses are attracting the most views so you know what to keep in stock.
- **Device Usage**: See what percentage of parents shop on mobile phones versus desktop computers.
- **Referral Sources**: Find out whether shoppers came from Google, Instagram, Pinterest, or direct links.

### Privacy & Server IP Inspector:
- Click the top button: **Show Privacy & Server IP Inspector**.
- Authorized managers can inspect recent visit timestamps, approximate country, and requested pages.
- **Important**: Country locations are estimates provided by network servers. In accordance with international privacy laws, no private personal details or exact home addresses are ever collected.

---

## 4. Managing Customer Orders

The **Orders Management** page (`/admin/orders`) lets you fulfill orders and keep customers updated.

### Order List & Filters:
- Filter orders by status: **All Orders**, **New Orders**, **Processing**, **Packed**, **Shipped**, **Delivered**, or **Cancelled**.
- Filter by payment: **Paid**, **Payment Pending**, or **Failed**.
- Use the search bar to find an order by customer name or order number (e.g., `RXB-2026-9041`).

### How to Fulfill an Order:
1. Click **View Order** or **Manage** next to any order row.
2. In the **Order Details** window that opens:
   - Check the **Customer Name, Email, and Phone Number**.
   - Check the **Delivery Address** and country.
   - Review ordered baby outfits, including the exact **size** (e.g., `0–3M`) and **color** (e.g., `Blush Pink`).
   - Check the **Payment Status** (verified securely from the payment gateway).
3. Under **Fulfillment Status**, click the appropriate button as you prepare the package:
   - Click **Processing** when you begin preparing the package.
   - Click **Packed** when the clothes are wrapped in luxury tissue and boxed.
   - Click **Shipped** when handed over to the courier (enter the courier tracking number in the field provided).
   - Click **Delivered** once the package arrives at the customer's door.
4. **Internal Staff Notes**: Add a note (e.g., *"Customer requested baby gift ribbon"*). These notes are visible only to your staff and are never shown to the customer.
5. Click **Close** when finished. All changes save immediately to the store database.

---

## 5. Managing Inventory & Variant Stock

The **Inventory Management** page (`/admin/inventory`) ensures you never run out of popular baby sizes.

### Understanding Variant Stock:
Baby clothing comes in multiple sizes and colors. A romper might have 25 units in `0–3M Blush Pink`, but only 4 units in `3–6M Ivory Cream`. The inventory screen tracks each variant separately.

### How to Adjust Stock:
1. Find the product and variant in the inventory table.
2. **Quick Adjustment**: Click the **+** or **–** button next to the current quantity to quickly add or remove stock.
3. **Manual Entry**: Click into the stock number box, type the new quantity (e.g., `50`), and click the checkmark to save.
4. **Low Stock Alerts**: Any variant with 5 or fewer items will automatically show a warning badge: **Low Stock Warning**.
5. **Stock Adjustment History**: Click the top button **View Stock Adjustment History** to view a complete audit log showing who changed stock, when it happened, the old quantity, and the new quantity.

---

## 6. Updating the Homepage with Homepage Studio

The **Homepage Studio** (`/admin/website/homepage`) lets you customize the entire homepage from top to bottom without touching any code.

### 19 Editable Sections:
1. Announcement Bar (top promotional message, free shipping notice)
2. Main Header (brand logo and navigation styling)
3. Header Navigation (category menus)
4. Hero Headline & Description (welcome message and slogan)
5. Hero Buttons (links to shop collections)
6. Hero Background & 3D Animation
7. Trust & Benefits Bar (e.g., Organic Cotton, Hypoallergenic, Free Worldwide Shipping)
8. Category Quick Buttons
9. Featured Products Showcase
10. New Arrivals Carousel
11. Brand Story & Heritage
12. Featured Collections Banners
13. Promotional Sale Banners
14. Customer Testimonials & Reviews
15. Newsletter Subscription Box
16. Instagram / Social Media Gallery
17. Footer Links & Customer Service
18. Payment Icons
19. Copyright & Legal Notices

### How to Edit a Section:
1. Click the section you wish to change (e.g., **Hero Headline**).
2. Enter your new heading text, description, or button destination (e.g., `/collections/spring-luxury`).
3. To upload a new picture, click **Upload Image** and select a photo from your computer.
4. Toggle **Section Visible** on or off if you want to temporarily hide seasonal promotions.
5. Click **Save Draft** to store your changes safely without showing them to customers yet.
6. Click **Live Preview (Desktop & Mobile)** to verify how your homepage looks.
7. Click **Publish Homepage Changes** to make them live on the website immediately.

---

## 7. Managing Categories & Header Navigation

The **Categories & Navigation** page (`/admin/navigation`) controls what shoppers see in the top website menu.

### How to Add a Main Category:
1. Click **+ Add Main Category**.
2. Type the category name (e.g., `GIRLS` or `NEWBORN`).
3. Set the display order (`1` for leftmost, `2` for next, etc.).
4. Choose whether to make it visible or draft.
5. Click **Save**.

### How to Add Submenu Dropdown Items:
1. Locate the parent category (e.g., `GIRLS`).
2. Click **+ Add Submenu Item**.
3. Type the submenu name (e.g., `Party Dresses` or `Cashmere Rompers`).
4. Enter the page title and a short friendly description.
5. Check the baby outfits that should appear when a parent opens this category.
6. Click **Publish Category**. The dropdown menu and dynamic category page are updated automatically.

---

## 8. Adding & Editing Baby Clothing Products

The **Product Catalogue** (`/admin/products`) lets you manage your entire clothing collection.

### Step-by-Step: Adding a New Baby Outfit:
1. Click the **+ Add Baby Outfit** button at the top right.
2. **Basic Information**:
   - **Product Name**: e.g., `Aurelia Organic Cashmere Romper`.
   - **SKU Code**: e.g., `RXB-ROM-001` (unique product identifier).
   - **Category**: Select the category (e.g., `Rompers` or `Dresses`).
   - **Description**: Describe the softness, organic certification, and snap button convenience.
3. **Product Photos**:
   - Click **Upload Photos** to pick pictures from your computer.
   - Click **Set as Main Image** on the primary picture.
4. **Pricing & Stock**:
   - **Selling Price**: The price charged at checkout (e.g., `18500`).
   - **Original Price**: If on sale, enter the regular price (e.g., `22000`). The website will automatically display a **Sale Tag** showing the savings.
5. **Sizes & Colors**:
   - Click each size you offer: `Newborn (0–3M)`, `3–6M`, `6–12M`, `1–2Y`.
   - Click each color: `Ivory Cream`, `Blush Pink`, `Sage Mist`.
   - Set the inventory quantity for each combination.
6. **Badges**:
   - Check **✨ New Arrival** to feature in the New Arrivals carousel.
   - Check **★ Best Seller** to highlight popular favorites.
7. Click **Save Draft** or **Publish Outfit**.

---

## 9. Previewing Content (Desktop & Mobile)

Never push changes blindly! REXBEBE includes built-in live preview tools.

### How to Preview:
- In **Homepage Studio**, **Product Editor**, or **Category Editor**, click the **Preview** button.
- A live window will display the real website design using your draft changes.
- Click **Desktop** at the top to see the widescreen computer view.
- Click **Mobile** to verify that text, images, and buttons fit comfortably on smartphone screens.
- When satisfied, close the preview and click **Publish**.

---

## 10. Publishing & Saving Drafts

The store uses a safe two-stage workflow:

- **Save Draft**: Saves your edits to the admin database so you can take a break and come back later. **Customers cannot see drafts.**
- **Publish Changes**: Pushes your saved changes to the public website immediately.
- **Unpublish / Hide**: If an item is out of season or undergoing revision, click **Hide from Website** (eye icon) to turn it back into a draft without deleting it.

---

## 11. Managing Customer Feedback & Reviews

The **Customer Feedback & Reviews** page (`/admin/feedback`) organizes all customer communications into four clear tabs:

1. **Product Reviews**: Customer ratings (1 to 5 stars) and feedback on specific baby outfits.
   - Click **Approve** to make a review visible on the product page.
   - Click **Hide** to remove inappropriate or spam comments.
2. **Website Feedback**: Comments on browsing experience, speed, or suggestions.
3. **Customer Suggestions**: New clothing ideas, requested sizes, or color preferences.
4. **Support Inquiries**: Customer questions regarding shipping, sizing, or order status.
   - Click **Mark Reviewed** once you have addressed the inquiry.
   - Add **Internal Staff Notes** to record follow-up actions taken.

---

## 12. Managing Admin Users & Permissions

The **Admin Users & Permissions** page (`/admin/users`) lets you control staff access securely.

### 4 Predefined Roles:
1. **Super Admin / Store Owner**:
   - Complete access to all store operations, finances, settings, and staff accounts.
2. **Store Manager**:
   - Can manage orders, stock, inventory, products, and categories.
3. **Content Manager**:
   - Can edit Homepage Studio, website pages, categories, and media library.
4. **Customer Support**:
   - Can view orders, customer details, and customer feedback. Cannot change store settings or prices.

### How to Add a Staff Member:
1. Click **+ Add Administrator**.
2. Type their **Full Name** and **Email Address**.
3. Select their **Role** (e.g., `Store Manager` or `Customer Support`).
4. Set an initial secure password.
5. Click **Create Administrator**.
6. The user is immediately saved to the store's secure credentials store.

### Suspending an Account:
- To temporarily disable a staff member's access, toggle their status button from **Active** to **Suspended**.

### Audit Trail:
- Click **View Security Audit Trail** to view a timestamped record of every staff login, price change, and status update.

---

## 13. Configuring Store, Shipping & Payment Settings

The **Store Settings** page (`/admin/settings`) houses your boutique's operational rules:

### Tabs:
1. **General Store Info**: Store Name, Contact Email, Customer Support Phone, Store Currency (`LKR` or `USD`), and Address.
2. **International Markets**: Turn on/off international sales for regions like United States, United Kingdom, Europe, and UAE.
3. **Shipping & Delivery**:
   - Standard Delivery Fee (e.g., `LKR 750`).
   - Express Delivery Fee (e.g., `LKR 1,500`).
   - **Free Shipping Threshold** (e.g., Free delivery on orders over `LKR 25,000`).
   - Estimated delivery time frames (e.g., `2–4 business days`).
4. **Payment Gateways**:
   - Toggle **Credit / Debit Cards** (Visa, MasterCard, Amex via secure payment gateway).
   - Toggle **Cash on Delivery (COD)**.
   - Toggle **Bank Transfer / PayHere**.
   - Manage sandbox/production gateway credentials securely on the server.
5. **Security & Audit Logs**: Review security settings, session timeouts, and server security events.

---

## 14. Frequently Asked Questions & Helpful Tips

**Q: Will editing a homepage section affect my customer's checkout?**  
A: No. Content edits in Homepage Studio are safely separated from checkout and payment processing.

**Q: Can I accidentally delete an active product?**  
A: Every delete action requires confirmation. You can also simply click **Hide from Website** if you want to take an outfit off the shelves without losing its description, photos, and size history.

**Q: Why don't my sales numbers include cancelled orders?**  
A: The REXBEBE system strictly calculates sales using **verified paid transactions only**. This ensures you always have an honest, accurate picture of your earnings for accounting and tax purposes.

**Q: How do I backup my store data?**  
A: All orders, products, inventory changes, and settings are saved automatically to persistent backend data files (`backend/data/`). Regular server backups ensure your business data is always safe.

---

*Thank you for choosing REXBEBE — crafting luxury, gentle comfort for little ones worldwide.*
