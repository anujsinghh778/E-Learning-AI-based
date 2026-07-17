const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Resolve database path (supports custom paths for persistent hosting like Render)
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'data.db');

// Ensure parent directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

console.log(`Database connected successfully at: ${dbPath}`);

// Initialize schema and seed data if tables do not exist
function initDatabase() {
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');

  // Create tables with upgraded columns
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      price REAL NOT NULL,
      unit TEXT NOT NULL,
      description TEXT,
      image TEXT,
      origin TEXT,
      health_benefits TEXT,
      heritage_story TEXT,
      in_stock INTEGER DEFAULT 1,
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'Pending',
      payment_method TEXT DEFAULT 'COD',
      payment_status TEXT DEFAULT 'Pending',
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );
  `);

  // Seed Categories if empty
  const categoryCountQuery = db.prepare('SELECT COUNT(*) as count FROM categories');
  const categoryCountResult = categoryCountQuery.get();
  
  if (categoryCountResult.count === 0) {
    console.log('Seeding initial categories...');
    const insertCategory = db.prepare(`
      INSERT INTO categories (name, slug, description, image) 
      VALUES (?, ?, ?, ?)
    `);

    const categories = [
      ['Whole Spices', 'whole-spices', 'Hand-selected, sun-dried premium spices from Rajasthan and Malabar.', '/images/whole_spices.png'],
      ['Ground Masala', 'ground-masala', 'Freshly stone-ground spices blended from three-generation family recipes.', '/images/ground_masalas.png'],
      ['Signature Chai', 'signature-chai', 'Hand-blended black teas with rich aromatic spices and herbs.', '/images/signature_chai.png'],
      ['Dry Fruits', 'dry-fruits', 'Crunchy, premium quality nuts and dried fruits sourced directly.', '/images/dry_fruits.png'],
      ['Pickles & Ghee', 'pickles-ghee', 'Traditional Rajasthani pickles and 100% pure granular desi cow ghee.', '/images/pickles_ghee.png']
    ];

    for (const cat of categories) {
      insertCategory.run(cat[0], cat[1], cat[2], cat[3]);
    }
  }

  // Seed Products if empty
  const productCountQuery = db.prepare('SELECT COUNT(*) as count FROM products');
  const productCountResult = productCountQuery.get();

  if (productCountResult.count === 0) {
    console.log('Seeding initial products...');
    
    // Get category map of name -> ID
    const catMap = {};
    const allCats = db.prepare('SELECT id, name FROM categories').all();
    allCats.forEach(cat => {
      catMap[cat.name] = cat.id;
    });

    const insertProduct = db.prepare(`
      INSERT INTO products (category_id, name, slug, price, unit, description, image, origin, health_benefits, heritage_story, in_stock) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const products = [
      // Whole Spices
      [
        catMap['Whole Spices'], 
        'Cumin Seeds (Jeera)', 
        'cumin-seeds', 
        120.00, 
        '200g', 
        'Bold, highly aromatic cumin seeds sourced from the dry desert plains of Rajasthan.', 
        '/images/whole_spices.png',
        'Thar Desert, Rajasthan',
        'Powerful digestive aid, rich in iron, and helps boost immune response.',
        'Sourced directly from farmers in the arid lands of Jaisalmer and Barmer. Our cumin seeds are harvested after the winter dew clears, giving them their characteristic bold size and strong, earth-like fragrance.'
      ],
      [
        catMap['Whole Spices'], 
        'Green Cardamom (Elaichi)', 
        'green-cardamom', 
        350.00, 
        '100g', 
        'Extra-large, deep green cardamom pods from Munnar hills, bursting with sweet herbal oils.', 
        '/images/whole_spices.png',
        'Munnar, Kerala',
        'Natural breath freshener, aids in lowering blood pressure, and improves respiration.',
        'Selected at Munnar\'s oldest private auctions. These 8mm jumbo pods are carefully dried inside traditional firewood smokehouses to preserve their deep green hue and sweet eucalyptus undertones.'
      ],
      [
        catMap['Whole Spices'], 
        'Black Pepper (Kali Mirch)', 
        'black-pepper', 
        160.00, 
        '150g', 
        'Tellicherry black pepper, sun-dried to perfection with a sharp, complex heat.', 
        '/images/whole_spices.png',
        'Wayanad, Kerala',
        'Enhances nutrient absorption, supports gut health, and acts as a strong antioxidant.',
        'Our Tellicherry peppercorns are left on the vine longer to ripen fully, giving them a larger size and a complex, fruity heat that lingers on the palate.'
      ],
      [
        catMap['Whole Spices'], 
        'Cloves (Laung)', 
        'cloves', 
        180.00, 
        '100g', 
        'Selected hand-picked cloves with intense spice oil content and deep woody aroma.', 
        '/images/whole_spices.png',
        'Kanyakumari, Tamil Nadu',
        'Contains strong anti-inflammatory properties, supports liver health, and relieves toothaches.',
        'Harvested by hand from trees grown on coastal hills where the sea breeze helps develop the highest concentration of eugenol oil.'
      ],

      // Ground Masala
      [
        catMap['Ground Masala'], 
        'Jodhpuri Mathania Lal Mirch', 
        'jodhpuri-mathania-lal-mirch', 
        180.00, 
        '200g', 
        'Jodhpur’s famous Mathania red chili, stone-ground to preserve its bright crimson color and smoky heat.', 
        '/images/ground_masalas.png',
        'Mathania, Rajasthan',
        'Rich in Vitamin C, boosts metabolism, and helps clear congestion.',
        'The pride of Marwari kitchens. Our Mathania chilies are slow-ground on heavy, cool granite stones to ensure the volatile oils do not burn off, delivering an authentic smoky taste and royal red appearance.'
      ],
      [
        catMap['Ground Masala'], 
        'Shahi Garam Masala', 
        'shahi-garam-masala', 
        150.00, 
        '100g', 
        'Our secret family blend of 18 whole spices, stone-ground in small batches for royal depth.', 
        '/images/ground_masalas.png',
        'Jodhpur Bazaar Blend',
        'Improves digestion, boosts metabolism, and fights bloating.',
        'This 18-spice recipe has been handed down through three generations of the Nirmal family. We roast the spices lightly on brass plates before grinding them to unlock a royal fragrance.'
      ],
      [
        catMap['Ground Masala'], 
        'Royal Haldi (Turmeric)', 
        'royal-haldi', 
        90.00, 
        '250g', 
        'High-curcumin turmeric powder from Salem, ground slowly to preserve its healing oils.', 
        '/images/ground_masalas.png',
        'Salem, Tamil Nadu',
        'Strong anti-inflammatory, powerful healing agent, and rich in curcumin.',
        'Our turmeric is sourced from premium Salem roots containing over 5% curcumin. It is boiled, dried, and ground under cold-process conditions to retain its medicinal properties and deep gold color.'
      ],
      [
        catMap['Ground Masala'], 
        'Special Aromatic Chai Masala', 
        'special-chai-masala', 
        140.00, 
        '100g', 
        'A comforting blend of dry ginger, cardamom, cinnamon, nutmeg, and black pepper.', 
        '/images/ground_masalas.png',
        'Jodhpur Family Recipe',
        'Excellent remedy for colds, throat irritation, and improves digestion.',
        'A pinch of this masala turns any regular tea into a soothing, royal beverage. Prepared with high amounts of sun-dried Sonth (dry ginger) and fresh green cardamom pods.'
      ],

      // Signature Chai
      [
        catMap['Signature Chai'], 
        'Marwar Royal Blend', 
        'marwar-royal-blend', 
        210.00, 
        '250g', 
        'Premium Assam CTC blended with crushed cardamom, ginger, and dried rose petals.', 
        '/images/signature_chai.png',
        'Assam & Rajasthan',
        'Invigorates the mind, rich in antioxidants, and relieves morning fatigue.',
        'The daily fuel of Jodhpur. We blend a strong, malty CTC tea from upper Assam gardens with hand-crushed spices and dried red rose petals for a royal, floral aroma.'
      ],
      [
        catMap['Signature Chai'], 
        'Kesar Elaichi Chai', 
        'kesar-elaichi-chai', 
        280.00, 
        '250g', 
        'Luxury blend of fine CTC tea, Kashmiri saffron strands, and premium green cardamom pods.', 
        '/images/signature_chai.png',
        'Kashmir & Kerala Blend',
        'Supports skin health, fights cell damage, and relaxes the nervous system.',
        'An opulent tea blend for special guests. We inflected it with genuine threads of Kashmiri Kesar (Saffron) and a heavy hand of cardamom for a truly royal aroma.'
      ],

      // Dry Fruits
      [
        catMap['Dry Fruits'], 
        'Premium Mamra Almonds', 
        'premium-mamra-almonds', 
        650.00, 
        '250g', 
        'Rare, curved Mamra almonds from organic farms, rich in natural almond oil and nutrients.', 
        '/images/dry_fruits.png',
        'Kabul Valleys',
        'Excellent source of Vitamin E, improves memory, and supports heart health.',
        'Unlike flat California almonds, our Mamra almonds are grown using traditional organic water methods, resulting in a curved nut with up to 10% more natural oils and a crunchier bite.'
      ],
      [
        catMap['Dry Fruits'], 
        'Salted Roasted Cashews (Kaju)', 
        'salted-roasted-cashews', 
        380.00, 
        '250g', 
        'Jumbo Jodhpur-roasted cashews, lightly salted and roasted to crunchy perfection.', 
        '/images/dry_fruits.png',
        'Panruti, Tamil Nadu',
        'Source of healthy fats, rich in copper and magnesium for bone health.',
        'We hand-select Jumbo W180 cashews (the king of cashews) and roast them in small batches with sea salt, keeping them crunchy, buttery, and large.'
      ],

      // Pickles & Ghee
      [
        catMap['Pickles & Ghee'], 
        'Heritage Ker Sangri Pickle', 
        'heritage-ker-sangri-pickle', 
        240.00, 
        '400g', 
        'Authentic Rajasthani desert berry (Ker) and bean (Sangri) pickle, cured in cold-pressed mustard oil.', 
        '/images/pickles_ghee.png',
        'Thar Desert, Rajasthan',
        'Natural probiotic source, aids gut microflora, and rich in fiber.',
        'Sourced from thorny desert shrubs. Cured in clay pots with cold-pressed mustard oil, fenugreek, fennel seeds, and Mathania chili. The taste of Marwari culture.'
      ],
      [
        catMap['Pickles & Ghee'], 
        'Pure Desi A2 Cow Ghee', 
        'pure-desi-cow-ghee', 
        420.00, 
        '500ml', 
        'Traditional Bilona method ghee churned from curd of A2 cow milk, yielding a rich, granular texture.', 
        '/images/pickles_ghee.png',
        'Jodhpur Goshala',
        'Boosts immunity, enhances joint lubrication, and rich in fat-soluble vitamins.',
        'Made from the milk of grass-fed indigenous cows. We boil the milk, set it to curd, and churn it using wood paddles (Bilona method). The butter is then slowly heated to yield a sweet, granular ghee.'
      ]
    ];

    for (const prod of products) {
      insertProduct.run(...prod);
    }
  }

  // Seed Reviews if empty
  const reviewCountQuery = db.prepare('SELECT COUNT(*) as count FROM reviews');
  const reviewCountResult = reviewCountQuery.get();

  if (reviewCountResult.count === 0) {
    console.log('Seeding initial reviews...');
    const insertReview = db.prepare(`
      INSERT INTO reviews (name, rating, comment, date) 
      VALUES (?, ?, ?, ?)
    `);

    const reviews = [
      ['Ramesh Chandra Sharma', 5, 'Nirmal Masala Bhandar has been our family shop for 40 years. Their Jodhpuri Mathania Lal Mirch has unmatched aroma and color. Highly recommend!', '2026-06-15 10:30:00'],
      ['Priya Shekhawat', 5, 'The Kesar Elaichi Chai is absolute luxury! And the local delivery is incredibly fast, reached my house in Shastri Nagar within 20 minutes.', '2026-07-02 14:15:00'],
      ['Major Sunil Anand', 4, 'Very high-quality whole spices. The green cardamom is large and fresh. Glad to see they are online now.', '2026-07-05 18:45:00']
    ];

    for (const rev of reviews) {
      insertReview.run(rev[0], rev[1], rev[2], rev[3]);
    }
  }
}

// Initialize database schema and data
initDatabase();

// Initialize CRDT table
function initCrdtDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS crdt_ops (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      sender TEXT NOT NULL,
      site TEXT,
      clock INTEGER,
      char TEXT,
      origin_site TEXT,
      origin_clock INTEGER,
      target_site TEXT,
      target_clock INTEGER
    );
  `);
}
initCrdtDatabase();

// Export database operations wrapper
module.exports = {
  // CRDT specific database actions
  getCrdtOps: (sinceSeq) => {
    const stmt = db.prepare(`
      SELECT * FROM crdt_ops 
      WHERE seq > ? 
      ORDER BY seq ASC
    `);
    const rows = stmt.all(sinceSeq || 0);
    // Convert back to nested JS objects to match frontend formatting
    return rows.map(row => {
      const op = {
        seq: row.seq,
        type: row.type,
        sender: row.sender
      };
      if (row.type === 'insert') {
        op.node = {
          id: { site: row.site, clock: row.clock },
          char: row.char,
          deleted: false,
          origin: row.origin_site ? { site: row.origin_site, clock: row.origin_clock } : null
        };
      } else if (row.type === 'delete') {
        op.targetId = { site: row.target_site, clock: row.target_clock };
      }
      return op;
    });
  },

  insertCrdtOp: (op) => {
    let stmt;
    let runResult;
    if (op.type === 'insert') {
      stmt = db.prepare(`
        INSERT INTO crdt_ops (type, sender, site, clock, char, origin_site, origin_clock)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      runResult = stmt.run(
        op.type,
        op.sender,
        op.node.id.site,
        op.node.id.clock,
        op.node.char,
        op.node.origin ? op.node.origin.site : null,
        op.node.origin ? op.node.origin.clock : null
      );
    } else if (op.type === 'delete') {
      stmt = db.prepare(`
        INSERT INTO crdt_ops (type, sender, target_site, target_clock)
        VALUES (?, ?, ?, ?)
      `);
      runResult = stmt.run(
        op.type,
        op.sender,
        op.targetId.site,
        op.targetId.clock
      );
    }
    
    const seq = runResult.lastInsertRowid;
    return { ...op, seq };
  },

  resetCrdtDatabase: () => {
    db.exec('DELETE FROM crdt_ops;');
    db.exec('DELETE FROM sqlite_sequence WHERE name = \'crdt_ops\';');
  },

  // Legacy shop endpoints
  getCategories: () => {
    return db.prepare('SELECT * FROM categories').all();
  },
  
  getProducts: (categoryId, search, minPrice, maxPrice, sortBy) => {
    let sql = 'SELECT * FROM products WHERE in_stock = 1';
    const params = [];
    
    if (categoryId && categoryId !== 'all') {
      sql += ' AND category_id = ?';
      params.push(categoryId);
    }
    
    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ? OR heritage_story LIKE ? OR origin LIKE ?)';
      const likeQuery = `%${search}%`;
      params.push(likeQuery, likeQuery, likeQuery, likeQuery);
    }
    
    if (minPrice !== undefined && minPrice !== null && !isNaN(minPrice)) {
      sql += ' AND price >= ?';
      params.push(minPrice);
    }
    
    if (maxPrice !== undefined && maxPrice !== null && !isNaN(maxPrice)) {
      sql += ' AND price <= ?';
      params.push(maxPrice);
    }
    
    if (sortBy) {
      if (sortBy === 'price-asc') {
        sql += ' ORDER BY price ASC';
      } else if (sortBy === 'price-desc') {
        sql += ' ORDER BY price DESC';
      } else if (sortBy === 'name-asc') {
        sql += ' ORDER BY name ASC';
      } else {
        sql += ' ORDER BY id ASC';
      }
    } else {
      sql += ' ORDER BY id ASC';
    }
    
    return db.prepare(sql).all(...params);
  },

  getProductById: (id) => {
    return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  },

  getReviews: () => {
    return db.prepare('SELECT * FROM reviews ORDER BY date DESC').all();
  },

  addReview: (name, rating, comment) => {
    return db.prepare(`
      INSERT INTO reviews (name, rating, comment, date) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(name, rating, comment);
  },

  addContactMessage: (name, email, phone, message) => {
    return db.prepare(`
      INSERT INTO contact_messages (name, email, phone, message, date) 
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(name, email, phone, message);
  },

  createOrder: (customerName, customerEmail, customerPhone, customerAddress, totalAmount, paymentMethod, paymentStatus, items) => {
    // Generate order number e.g., NMB-2026-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `NMB-${new Date().getFullYear()}-${randomSuffix}`;

    db.exec('BEGIN TRANSACTION;');
    try {
      // Insert Order
      const orderStmt = db.prepare(`
        INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, customer_address, total_amount, status, payment_method, payment_status, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?, CURRENT_TIMESTAMP)
      `);
      const orderRes = orderStmt.run(orderNumber, customerName, customerEmail, customerPhone, customerAddress, totalAmount, paymentMethod, paymentStatus);
      const orderId = orderRes.lastInsertRowid;

      // Insert Items
      const itemStmt = db.prepare(`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `);

      for (const item of items) {
        itemStmt.run(orderId, item.product_id, item.quantity, item.price);
      }

      db.exec('COMMIT;');
      return { id: orderId, orderNumber, totalAmount, paymentMethod, paymentStatus };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  getOrderByNumber: (orderNumber) => {
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
    if (!order) return null;

    const items = db.prepare(`
      SELECT oi.*, p.name, p.unit, p.image 
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order.id);

    return { ...order, items };
  },

  updateOrderStatus: (id, status) => {
    return db.prepare(`
      UPDATE orders 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(status, id);
  }
};
