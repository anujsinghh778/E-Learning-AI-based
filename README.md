# Nirmal Masala Bhandar - Heritage Spice & Tea Shop (Jodhpur)

A premium, full-stack, single-page e-commerce storefront for a heritage spice shop based in the old city bazaar of Jodhpur, Rajasthan. 

This project bridges traditional local spice-trading craft with modern, quick-commerce capabilities, featuring dynamic category loading, persistent shopping cart, checkout processing, local review submission, and database storage.

## Features

1. **Rich Heritage Aesthetics**:
   - Designed around Jodhpur bazaar visual themes, featuring a warm ink-brown palette (`#140d09`), glowing gold (`#dfad3c`) and copper (`#b86927`) accent tones, and parchment text readability.
   - Inline SVG of a custom heritage brass scale in the hero.
   - Clean custom typography with **Fraunces** for display headers, **Work Sans** for UI copy, and **IBM Plex Mono** for bazaar-style receipt pricing tags.

2. **Full-Stack Database Architecture**:
   - SQLite integration using Node.js's native `node:sqlite` module (available in Node.js 22.x+). No native compiler requirements during installation!
   - Relational schema including: `categories`, `products`, `reviews`, `contact_messages`, `orders`, and `order_items`.
   - Auto-creation and seeding of categories, signature spices, and mock reviews on first run.

3. **Secure Checkout & Order Lifecycle**:
   - Server-side validation of cart items and prices directly against database records to prevent client-side price tampering.
   - Synchronous transactional insertion of order and item details.
   - Immediate order number dispatch (e.g. `NMB-2026-XXXX`).

4. **Dynamic Frontend Client (`public/`)**:
   - Responsive layouts suitable for screens of all sizes (desktop down to mobile).
   - Category filtering chips to instantly request relevant items from the API.
   - Interactive slide-out Cart Drawer with quantity adjustment, items sum, and checkout transitions.
   - Interactive star rating picker for submitting customer reviews with instant list re-rendering.
   - Fully functional contact message submissions saved in the database.

---

## Folder Structure

```
antigravity/
├── public/                 # Static frontend assets
│   ├── index.html          # Semantic HTML5 layout
│   ├── styles.css          # Design system stylesheet
│   └── app.js              # State manager & AJAX consumer
├── db.js                   # node:sqlite database configuration & seeds
├── server.js               # Express application REST routes
├── package.json            # Project dependencies & startup scripts
└── README.md               # User documentation (this file)
```

---

## Setup & Running Locally

### Prerequisites

- **Node.js**: Version **22.5.0** or higher is required since the project utilizes the built-in experimental `node:sqlite` module.

### Installation

1. Open a terminal inside the project directory:
   ```bash
   npm install
   ```

2. Start the local server:
   ```bash
   npm start
   ```

3. Open your browser and navigate to:
   [http://localhost:3000](http://localhost:3000)

*Note: For development, you can use `npm run dev` to watch code changes.*

---

## REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/categories` | `GET` | Retrieve all spice categories |
| `/api/products` | `GET` | Retrieve all products (supports query `?category_id=X`) |
| `/api/products/:id` | `GET` | Retrieve details for a single product |
| `/api/reviews` | `GET` | Get all submitted reviews (newest first) |
| `/api/reviews` | `POST` | Post a new customer review (JSON body: `{ name, rating, comment }`) |
| `/api/contact` | `POST` | Send a contact/wholesale message (JSON body: `{ name, email, phone, message }`) |
| `/api/orders` | `POST` | Create a new order (JSON body: `{ customer_name, customer_email, customer_phone, customer_address, items: [{ product_id, quantity }] }`) |
| `/api/orders/:id` | `GET` | Get details for an order and its items |
