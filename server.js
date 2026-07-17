const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
// Serve frontend static assets from public/ folder
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// CRDT API & SSE Setup
let sseClients = [];

function broadcastToSse(message, excludeSiteId = null) {
  const payload = `data: ${JSON.stringify(message)}\n\n`;
  sseClients.forEach(client => {
    if (!excludeSiteId || client.siteId !== excludeSiteId) {
      try {
        client.res.write(payload);
      } catch (err) {
        // SSE connection might have closed
      }
    }
  });
}

// Keep SSE connections alive
setInterval(() => {
  sseClients.forEach(client => {
    try {
      client.res.write(': keepalive\n\n');
    } catch (err) {
      // ignore
    }
  });
}, 20000);

// Seed CRDT Genesis Document
function seedGenesisDoc() {
  db.resetCrdtDatabase();
  
  const text = "Welcome to the Collaborative CRDT Editor!\n\nThis is an observability dashboard showing how conflict-free text replication (RGA) works under the hood.\n\nQuick steps to test:\n1. Type concurrently in Alice and Bob.\n2. Toggle Charlie offline, make edits in Charlie, edit elsewhere, and reconnect.\n3. Watch the sync log below to see sequence numbers and node ties resolving.\n";
  
  let lastId = null;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const clock = i + 1;
    const nodeId = { site: 'A', clock };
    const op = {
      type: 'insert',
      sender: 'A',
      node: {
        id: nodeId,
        char,
        deleted: false,
        origin: lastId
      }
    };
    db.insertCrdtOp(op);
    lastId = nodeId;
  }
}

// Seed on startup if database is empty
const initialOps = db.getCrdtOps(0);
if (initialOps.length === 0) {
  console.log('Seeding initial CRDT genesis document...');
  seedGenesisDoc();
}

// GET /api/crdt/stream - SSE connection endpoint
app.get('/api/crdt/stream', (req, res) => {
  const siteId = req.query.siteId;
  if (!siteId) {
    return res.status(400).json({ error: 'siteId query parameter is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Establish stream

  const client = { siteId, res };
  sseClients.push(client);
  
  console.log(`Site ${siteId} connected to real-time SSE stream.`);

  // Send an initial connected status
  res.write(`data: ${JSON.stringify({ type: 'status', message: 'connected' })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c !== client);
    console.log(`Site ${siteId} disconnected from SSE stream.`);
  });
});

// GET /api/crdt/ops - Fetch operations for catch-up syncing
app.get('/api/crdt/ops', (req, res) => {
  try {
    const since = parseInt(req.query.since || 0, 10);
    const ops = db.getCrdtOps(since);
    res.json({ status: 'success', data: ops });
  } catch (error) {
    console.error('Error fetching CRDT ops:', error);
    res.status(500).json({ status: 'error', error: 'Failed to fetch ops' });
  }
});

// POST /api/crdt/ops - Submit a new operation
app.post('/api/crdt/ops', (req, res) => {
  try {
    const op = req.body;
    if (!op || !op.type || !op.sender) {
      return res.status(400).json({ status: 'error', error: 'Invalid operation format' });
    }
    const insertedOp = db.insertCrdtOp(op);
    
    // Broadcast real-time update to all other online replicas
    broadcastToSse({ type: 'op', op: insertedOp }, op.sender);
    
    res.status(201).json({ status: 'success', data: insertedOp });
  } catch (error) {
    console.error('Error inserting CRDT op:', error);
    res.status(500).json({ status: 'error', error: 'Failed to record operation' });
  }
});

// POST /api/crdt/cursor - Ephemeral cursor broadcast
app.post('/api/crdt/cursor', (req, res) => {
  try {
    const { siteId, posId } = req.body;
    if (!siteId) {
      return res.status(400).json({ status: 'error', error: 'siteId is required' });
    }
    
    // Broadcast cursor to other online replicas
    broadcastToSse({ type: 'cursor', siteId, posId }, siteId);
    
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error broadcasting cursor:', error);
    res.status(500).json({ status: 'error', error: 'Failed to broadcast cursor' });
  }
});

// POST /api/crdt/reset - Reset the DB and re-seed the genesis document
app.post('/api/crdt/reset', (req, res) => {
  try {
    console.log('Resetting CRDT database and seeding genesis document...');
    seedGenesisDoc();
    
    // Notify all connected clients to reload/reset
    broadcastToSse({ type: 'reset' });
    
    res.json({ status: 'success', message: 'CRDT database reset and seeded successfully' });
  } catch (error) {
    console.error('Error resetting CRDT database:', error);
    res.status(500).json({ status: 'error', error: 'Failed to reset database' });
  }
});

// API Routes (Legacy)

// GET /api/categories
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.getCategories();
    res.json({ status: 'success', data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ status: 'error', error: 'Failed to fetch categories' });
  }
});

// GET /api/products (supports category_id, search, min_price, max_price, sort query parameters)
app.get('/api/products', (req, res) => {
  try {
    const categoryId = req.query.category_id;
    const search = req.query.search || null;
    const minPrice = req.query.min_price ? parseFloat(req.query.min_price) : null;
    const maxPrice = req.query.max_price ? parseFloat(req.query.max_price) : null;
    const sort = req.query.sort || null;

    const products = db.getProducts(categoryId, search, minPrice, maxPrice, sort);
    res.json({ status: 'success', data: products });
  } catch (error) {
    console.error('Error fetching products with filters:', error);
    res.status(500).json({ status: 'error', error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
app.get('/api/products/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const product = db.getProductById(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', error: 'Product not found' });
    }
    res.json({ status: 'success', data: product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ status: 'error', error: 'Failed to fetch product' });
  }
});

// GET /api/reviews
app.get('/api/reviews', (req, res) => {
  try {
    const reviews = db.getReviews();
    res.json({ status: 'success', data: reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ status: 'error', error: 'Failed to fetch reviews' });
  }
});

// POST /api/reviews
app.post('/api/reviews', (req, res) => {
  try {
    const { name, rating, comment } = req.body;
    
    // Validation
    if (!name || !rating || !comment) {
      return res.status(400).json({ status: 'error', error: 'Name, rating, and comment are required' });
    }
    const score = parseInt(rating, 10);
    if (isNaN(score) || score < 1 || score > 5) {
      return res.status(400).json({ status: 'error', error: 'Rating must be an integer between 1 and 5' });
    }

    db.addReview(name, score, comment);
    res.status(201).json({ status: 'success', message: 'Review added successfully' });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ status: 'error', error: 'Failed to add review' });
  }
});

// POST /api/contact
app.post('/api/contact', (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ status: 'error', error: 'Name, email, and message are required' });
    }

    db.addContactMessage(name, email, phone || null, message);
    res.status(201).json({ status: 'success', message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ status: 'error', error: 'Failed to send message' });
  }
});

// GET /api/orders/track/:orderNumber
app.get('/api/orders/track/:orderNumber', (req, res) => {
  try {
    const orderNumber = req.params.orderNumber.toUpperCase();
    const order = db.getOrderByNumber(orderNumber);
    
    if (!order) {
      return res.status(404).json({ status: 'error', error: 'Order not found' });
    }

    // Dynamic status simulation based on elapsed time to make the demo feel alive!
    // Since SQLITE dates are saved in UTC/GMT format, parse properly.
    const orderTime = new Date(order.date).getTime();
    const elapsedMinutes = (Date.now() - orderTime) / (1000 * 60);

    let currentStatus = 'Pending';
    if (elapsedMinutes >= 5) {
      currentStatus = 'Delivered';
    } else if (elapsedMinutes >= 3) {
      currentStatus = 'Dispatched';
    } else if (elapsedMinutes >= 1.5) {
      currentStatus = 'Weighed';
    }

    // Update database if status changed
    if (order.status !== currentStatus) {
      db.updateOrderStatus(order.id, currentStatus);
      order.status = currentStatus;
    }

    res.json({ status: 'success', data: order });
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({ status: 'error', error: 'Failed to retrieve order tracking info' });
  }
});

// POST /api/orders
app.post('/api/orders', (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, customer_address, payment_method, items } = req.body;

    // Validate request
    if (!customer_name || !customer_email || !customer_phone || !customer_address) {
      return res.status(400).json({ status: 'error', error: 'All customer contact and delivery details are required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ status: 'error', error: 'Order must contain at least one item' });
    }

    const payMethod = payment_method || 'COD';
    const payStatus = (payMethod === 'Card' || payMethod === 'UPI') ? 'Paid' : 'Pending COD';

    // Process and validate items + calculate total price server-side (prevent price tampering)
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ status: 'error', error: 'Invalid items list' });
      }

      const product = db.getProductById(item.product_id);
      if (!product) {
        return res.status(404).json({ status: 'error', error: `Product with ID ${item.product_id} not found` });
      }

      if (!product.in_stock) {
        return res.status(400).json({ status: 'error', error: `Product ${product.name} is currently out of stock` });
      }

      const price = product.price;
      const quantity = parseInt(item.quantity, 10);
      calculatedTotal += price * quantity;

      validatedItems.push({
        product_id: product.id,
        quantity,
        price
      });
    }

    // Insert order into SQLite inside transaction
    const orderDetails = db.createOrder(
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      calculatedTotal,
      payMethod,
      payStatus,
      validatedItems
    );

    res.status(201).json({
      status: 'success',
      message: 'Order placed successfully',
      data: orderDetails
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ status: 'error', error: 'Failed to process order' });
  }
});

// Serve frontend routing fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  Nirmal Masala Bhandar server running locally`);
  console.log(`  Access it here: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
