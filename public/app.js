// Nirmal Masala Bhandar - Upgraded Frontend Logic

// Global State
let cart = JSON.parse(localStorage.getItem('nmb_cart')) || [];
let categories = [];
let products = [];
let reviews = [];
let currentCategory = 'all';
let selectedProduct = null;

// DOM Elements
const categoryChips = document.getElementById('category-chips');
const productsGrid = document.getElementById('products-grid');
const cartCount = document.getElementById('cart-count');
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const openCartBtn = document.getElementById('open-cart-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartSubtotal = document.getElementById('cart-subtotal');
const checkoutBtn = document.getElementById('checkout-btn');
const cartFooter = document.getElementById('cart-footer');

// Advanced Filters
const productSearch = document.getElementById('product-search');
const sortSelect = document.getElementById('sort-select');
const priceMin = document.getElementById('price-min');
const priceMax = document.getElementById('price-max');

// Detail Modal Sheet
const productDetailModal = document.getElementById('product-detail-modal');
const closeDetailBtn = document.getElementById('close-detail-btn');
const modalProductCategory = document.getElementById('modal-product-category');
const modalProductImageContainer = document.getElementById('modal-product-image-container');
const modalProductOrigin = document.getElementById('modal-product-origin');
const modalProductName = document.getElementById('modal-product-name');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductUnit = document.getElementById('modal-product-unit');
const modalProductDesc = document.getElementById('modal-product-desc');
const modalProductBenefits = document.getElementById('modal-product-benefits');
const modalProductStory = document.getElementById('modal-product-story');
const detailQtyInput = document.getElementById('detail-qty-input');
const detailQtyMinus = document.getElementById('detail-qty-minus');
const detailQtyPlus = document.getElementById('detail-qty-plus');
const modalAddToCartBtn = document.getElementById('modal-add-to-cart-btn');

// Checkout Modals
const checkoutModal = document.getElementById('checkout-modal');
const closeCheckoutBtn = document.getElementById('close-checkout-btn');
const checkoutForm = document.getElementById('checkout-form');
const checkoutItemsList = document.getElementById('checkout-items-list');
const checkoutTotalAmount = document.getElementById('checkout-total-amount');
const gpsAutofillBtn = document.getElementById('gps-autofill-btn');
const gpsStatusFeedback = document.getElementById('gps-status-feedback');
const custAddressText = document.getElementById('cust-address');

const successModal = document.getElementById('success-modal');
const closeSuccessBtn = document.getElementById('close-success-btn');
const successOrderNum = document.getElementById('success-order-num');
const successTotalAmt = document.getElementById('success-total-amt');

// Order Tracking Widget
const orderTrackingForm = document.getElementById('order-tracking-form');
const trackOrderNumberInput = document.getElementById('track-order-number');
const trackingResultsCard = document.getElementById('tracking-results-card');
const trackDispNumber = document.getElementById('track-disp-number');
const trackDispCustomer = document.getElementById('track-disp-customer');
const trackDispTotal = document.getElementById('track-disp-total');
const trackDispStatusBadge = document.getElementById('track-disp-status-badge');
const timelineLine = document.getElementById('timeline-line');
const stepPending = document.getElementById('step-pending');
const stepWeighed = document.getElementById('step-weighed');
const stepDispatched = document.getElementById('step-dispatched');
const stepDelivered = document.getElementById('step-delivered');

// Review Form & Picker
const reviewForm = document.getElementById('add-review-form');
const starPicker = document.getElementById('star-picker');
const reviewRatingInput = document.getElementById('review-rating');
const reviewsList = document.getElementById('reviews-list');

// Contact Form
const contactForm = document.getElementById('contact-form');

// Emojis for Art Category Fallbacks
const categoryEmojis = {
  'whole-spices': '🌾',
  'ground-masala': '🌶️',
  'signature-chai': '☕',
  'dry-fruits': '🌰',
  'pickles-ghee': '🏺'
};

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  fetchCategories();
  fetchProducts();
  fetchReviews();
  updateCartBadge();
  setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
  // Cart Drawer open/close
  openCartBtn.addEventListener('click', openCart);
  closeCartBtn.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  // Close drawer links inside empty state
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-drawer-action')) {
      closeCart();
    }
  });

  // Advanced Filter keyup/change triggers
  productSearch.addEventListener('input', debounce(fetchProducts, 400));
  sortSelect.addEventListener('change', fetchProducts);
  priceMin.addEventListener('input', debounce(fetchProducts, 400));
  priceMax.addEventListener('input', debounce(fetchProducts, 400));

  // Product detail modal closures
  closeDetailBtn.addEventListener('click', closeProductDetail);
  detailQtyMinus.addEventListener('click', () => adjustDetailQty(-1));
  detailQtyPlus.addEventListener('click', () => adjustDetailQty(1));
  modalAddToCartBtn.addEventListener('click', handleModalAddToCart);

  // Checkout modal triggers
  checkoutBtn.addEventListener('click', openCheckout);
  closeCheckoutBtn.addEventListener('click', closeCheckout);
  checkoutForm.addEventListener('submit', handleCheckoutSubmit);

  // GPS Autofill geolocation trigger
  gpsAutofillBtn.addEventListener('click', handleGPSAutofill);

  // Live Order Tracking Search
  orderTrackingForm.addEventListener('submit', handleOrderTrackingSearch);

  // Success Modal close
  closeSuccessBtn.addEventListener('click', () => {
    successModal.classList.remove('active');
  });

  // Star Rating Picker
  if (starPicker) {
    const starItems = starPicker.querySelectorAll('.star-picker-item');
    starItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const value = e.target.getAttribute('data-value');
        reviewRatingInput.value = value;
        
        starItems.forEach(star => {
          const starVal = star.getAttribute('data-value');
          if (parseInt(starVal) <= parseInt(value)) {
            star.classList.add('active');
          } else {
            star.classList.remove('active');
          }
        });
      });
    });
  }

  // Review Submit
  reviewForm.addEventListener('submit', handleReviewSubmit);

  // Contact Submit
  contactForm.addEventListener('submit', handleContactSubmit);

  // UPGRADE: Payment Method Tab Switching
  const paymentTabs = document.querySelectorAll('.payment-tab');
  const paymentPanels = document.querySelectorAll('.payment-details-panel');
  const selectedPaymentMethodInput = document.getElementById('selected-payment-method');
  const placeOrderBtn = document.getElementById('place-order-btn');

  paymentTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      paymentTabs.forEach(t => t.classList.remove('active'));
      paymentPanels.forEach(p => p.classList.remove('active'));

      e.currentTarget.classList.add('active');
      const method = e.currentTarget.getAttribute('data-method');
      selectedPaymentMethodInput.value = method;
      document.getElementById(`panel-${method}`).classList.add('active');

      // Update place order button text to reflect payment choice
      if (method === 'COD') {
        placeOrderBtn.textContent = 'Confirm Order (Cash on Delivery)';
      } else if (method === 'UPI') {
        placeOrderBtn.textContent = 'Pay via UPI & Confirm Order';
      } else {
        placeOrderBtn.textContent = 'Pay with Card & Confirm Order';
      }
    });
  });

  // UPGRADE: Card number and expiry input formatting
  const cardNumInput = document.getElementById('card-num-input');
  const cardLogoBadge = document.getElementById('card-logo-badge');
  if (cardNumInput) {
    cardNumInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      let formatted = '';
      for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
          formatted += ' ';
        }
        formatted += value[i];
      }
      e.target.value = formatted;

      if (value.startsWith('4')) {
        cardLogoBadge.textContent = 'Visa';
      } else if (value.startsWith('5')) {
        cardLogoBadge.textContent = 'Mastercard';
      } else if (value.startsWith('6')) {
        cardLogoBadge.textContent = 'RuPay';
      } else {
        cardLogoBadge.textContent = '💳';
      }
    });
  }

  const cardExpiryInput = document.getElementById('card-expiry-input');
  if (cardExpiryInput) {
    cardExpiryInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      if (value.length > 2) {
        e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
      } else {
        e.target.value = value;
      }
    });
  }

  // UPGRADE: QR Code Simulator
  const showQrBtn = document.getElementById('show-qr-btn');
  const qrSimulator = document.getElementById('qr-simulator');
  const qrLoader = document.getElementById('qr-loader');
  const qrGraphicWrapper = document.getElementById('qr-graphic-wrapper');
  const qrPriceTotal = document.getElementById('qr-price-total');

  if (showQrBtn) {
    showQrBtn.addEventListener('click', () => {
      qrSimulator.classList.remove('hidden');
      qrLoader.classList.remove('hidden');
      qrGraphicWrapper.classList.add('hidden');

      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      qrPriceTotal.textContent = `₹${subtotal.toFixed(2)}`;

      setTimeout(() => {
        qrLoader.classList.add('hidden');
        qrGraphicWrapper.classList.remove('hidden');
      }, 1200);
    });
  }
}

// Debounce helper to prevent flooding API requests
function debounce(func, delay) {
  let debounceTimer;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  };
}

// ----------------------------------------------------
// API FETCH OPERATIONS
// ----------------------------------------------------

// Fetch Categories
async function fetchCategories() {
  try {
    const res = await fetch('/api/categories');
    const result = await res.json();
    if (result.status === 'success') {
      categories = result.data;
      renderCategoryChips();
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// Fetch Products (supports filters and sorts)
async function fetchProducts() {
  try {
    const search = productSearch.value.trim();
    const sort = sortSelect.value;
    const min = priceMin.value;
    const max = priceMax.value;
    
    let url = `/api/products?category_id=${currentCategory}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (sort) url += `&sort=${sort}`;
    if (min) url += `&min_price=${min}`;
    if (max) url += `&max_price=${max}`;

    const res = await fetch(url);
    const result = await res.json();
    if (result.status === 'success') {
      products = result.data;
      renderProducts();
    }
  } catch (error) {
    console.error('Error loading products:', error);
    productsGrid.innerHTML = `<div class="loading-spinner">Failed to connect to the bazaar database. Please reload.</div>`;
  }
}

// Fetch Reviews
async function fetchReviews() {
  try {
    const res = await fetch('/api/reviews');
    const result = await res.json();
    if (result.status === 'success') {
      reviews = result.data;
      renderReviews();
    }
  } catch (error) {
    console.error('Error loading reviews:', error);
  }
}

// ----------------------------------------------------
// UI RENDERING
// ----------------------------------------------------

// Render Category Chips
function renderCategoryChips() {
  let html = `<button class="filter-chip ${currentCategory === 'all' ? 'active' : ''}" data-id="all">All Selections</button>`;
  
  categories.forEach(cat => {
    html += `
      <button class="filter-chip ${currentCategory == cat.id ? 'active' : ''}" data-id="${cat.id}">
        ${cat.name}
      </button>
    `;
  });

  categoryChips.innerHTML = html;

  // Add click events to chips
  const chips = categoryChips.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      chips.forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.getAttribute('data-id');
      fetchProducts();
    });
  });
}

// Render Products Grid
function renderProducts() {
  if (products.length === 0) {
    productsGrid.innerHTML = `<div class="loading-spinner">No products match your search or price criteria.</div>`;
    return;
  }

  let html = '';
  products.forEach(p => {
    const cat = categories.find(c => c.id === p.category_id);
    const catName = cat ? cat.name : 'Spice Selection';
    
    // We display the premium category image if product image is a placeholer
    const imagePath = p.image || '/images/whole_spices.png';

    html += `
      <div class="product-card" data-id="${p.id}">
        <span class="product-origin-badge">📍 ${p.origin || 'Jodhpur'}</span>
        <div class="product-image-container" onclick="openProductDetail(${p.id})">
          <img src="${imagePath}" alt="${p.name}" onerror="this.src='/images/whole_spices.png'">
        </div>
        <div class="product-details">
          <h3 class="product-name" onclick="openProductDetail(${p.id})">${p.name}</h3>
          <p class="product-desc">${p.description}</p>
          <div class="product-footer">
            <div class="price-tag">
              <span class="price-amt">₹${p.price.toFixed(2)}</span>
              <span class="price-unit">per ${p.unit}</span>
            </div>
            
            <div class="add-actions-group">
              <div class="qty-control">
                <button class="qty-btn" onclick="adjustCardQty(${p.id}, -1)">-</button>
                <input type="number" id="qty-input-${p.id}" value="1" min="1" max="100" onchange="validateQtyField(this)">
                <button class="qty-btn" onclick="adjustCardQty(${p.id}, 1)">+</button>
              </div>
              <button class="add-to-bag-btn" onclick="handleCardAddToCart(${p.id})" aria-label="Add ${p.name} to cart">
                ➕
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  productsGrid.innerHTML = html;
}

// Render Reviews List
function renderReviews() {
  if (reviews.length === 0) {
    reviewsList.innerHTML = `<p class="text-center" style="color: var(--text-muted)">Be the first to review our spices!</p>`;
    return;
  }

  let html = '';
  reviews.slice(0, 5).forEach(rev => {
    const stars = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
    const dateFormatted = new Date(rev.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    html += `
      <div class="review-card">
        <div class="review-card-header">
          <span class="review-author">${rev.name}</span>
          <span class="review-stars">${stars}</span>
        </div>
        <p class="review-comment">"${rev.comment}"</p>
        <div class="review-date">${dateFormatted}</div>
      </div>
    `;
  });

  reviewsList.innerHTML = html;
}

// ----------------------------------------------------
// PRODUCT DETAIL LIGHTBOX MODAL
// ----------------------------------------------------

window.openProductDetail = function(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  selectedProduct = product;
  const cat = categories.find(c => c.id === product.category_id);

  // Populate Modal Fields
  modalProductCategory.textContent = cat ? cat.name : 'Heritage Selection';
  modalProductOrigin.textContent = `Sourced from ${product.origin || 'Jodhpur, Rajasthan'}`;
  modalProductName.textContent = product.name;
  modalProductPrice.textContent = `₹${product.price.toFixed(2)}`;
  modalProductUnit.textContent = `per ${product.unit}`;
  modalProductDesc.textContent = product.description;
  modalProductBenefits.textContent = `💡 ${product.health_benefits || 'Sustains energy, boosts immunity, and improves digestion.'}`;
  modalProductStory.textContent = product.heritage_story || 'Sourced using vintage Jodhpuri recipes passed down through three generations.';
  
  // Reset Detail Qty
  detailQtyInput.value = 1;

  // Set Image
  modalProductImageContainer.innerHTML = `
    <img src="${product.image || '/images/whole_spices.png'}" alt="${product.name}" onerror="this.src='/images/whole_spices.png'">
  `;

  // Open detail overlay
  productDetailModal.classList.add('active');
};

function closeProductDetail() {
  productDetailModal.classList.remove('active');
  selectedProduct = null;
}

function adjustDetailQty(delta) {
  let val = parseInt(detailQtyInput.value, 10);
  if (isNaN(val)) val = 1;
  val += delta;
  if (val < 1) val = 1;
  if (val > 100) val = 100;
  detailQtyInput.value = val;
}

function handleModalAddToCart() {
  if (!selectedProduct) return;
  const qty = parseInt(detailQtyInput.value, 10) || 1;
  addToCart(selectedProduct.id, qty);
  closeProductDetail();
}

// ----------------------------------------------------
// PRODUCT CARD QTY ACTIONS
// ----------------------------------------------------

window.adjustCardQty = function(productId, delta) {
  const input = document.getElementById(`qty-input-${productId}`);
  if (!input) return;
  let val = parseInt(input.value, 10);
  if (isNaN(val)) val = 1;
  val += delta;
  if (val < 1) val = 1;
  if (val > 100) val = 100;
  input.value = val;
};

window.validateQtyField = function(input) {
  let val = parseInt(input.value, 10);
  if (isNaN(val) || val < 1) val = 1;
  if (val > 100) val = 100;
  input.value = val;
};

window.handleCardAddToCart = function(productId) {
  const input = document.getElementById(`qty-input-${productId}`);
  const qty = input ? parseInt(input.value, 10) || 1 : 1;
  addToCart(productId, qty);
  // Reset card quantity spinner back to 1
  if (input) input.value = 1;
};

// ----------------------------------------------------
// CART & DRAWER ACTIONS
// ----------------------------------------------------

function openCart() {
  renderCartDrawer();
  cartDrawer.classList.add('active');
  cartOverlay.classList.add('active');
}

function closeCart() {
  cartDrawer.classList.remove('active');
  cartOverlay.classList.remove('active');
}

// Add item to cart with specific quantity (e.g. 15)
window.addToCart = function(productId, quantity = 1) {
  const product = products.find(p => p.id === productId);
  
  // If product not found in current listing, check globally or just construct
  if (!product) return;

  const existingItem = cart.find(item => item.product_id === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    // Determine category slug for emoji lookup
    const cat = categories.find(c => c.id === product.category_id);
    const catSlug = cat ? cat.slug : 'whole-spices';

    cart.push({
      product_id: product.id,
      name: product.name,
      unit: product.unit,
      price: product.price,
      quantity: quantity,
      slug: product.slug
    });
  }

  saveCart();
  updateCartBadge();
  openCart();
};

// Change item quantity in cart drawer
window.updateCartQty = function(productId, delta) {
  const item = cart.find(item => item.product_id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(item => item.product_id !== productId);
  }

  saveCart();
  updateCartBadge();
  renderCartDrawer();
};

// Remove item from cart drawer
window.removeCartItem = function(productId) {
  cart = cart.filter(item => item.product_id !== productId);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
};

function saveCart() {
  localStorage.setItem('nmb_cart', JSON.stringify(cart));
}

function updateCartBadge() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
}

// Render Cart Drawer Content
function renderCartDrawer() {
  const giftBox = document.getElementById('gift-progress-box');
  const giftStatus = document.getElementById('gift-progress-status');
  const giftFill = document.getElementById('gift-progress-fill');

  if (cart.length === 0) {
    if (giftBox) giftBox.style.display = 'none';
    cartItemsContainer.innerHTML = `
      <div class="empty-cart-message">
        <span>⚖️</span>
        <p>Your scale is empty. Add fresh spices from the bazaar grid!</p>
        <button class="btn btn-secondary close-drawer-action">Explore Bazaar</button>
      </div>
    `;
    cartFooter.style.display = 'none';
    return;
  }

  cartFooter.style.display = 'block';
  let html = '';
  let subtotal = 0;

  // Fallback emojis inside cart
  const productEmojis = {
    'cumin-seeds': '🌾', 'green-cardamom': '🟢', 'black-pepper': '⚫', 'cloves': '🟤',
    'jodhpuri-mathania-lal-mirch': '🌶️', 'shahi-garam-masala': '🍲', 'royal-haldi': '🟡',
    'special-chai-masala': '☕', 'marwar-royal-blend': '🍵', 'kesar-elaichi-chai': '🥛',
    'premium-mamra-almonds': '🌰', 'salted-roasted-cashews': '🥜', 'heritage-ker-sangri-pickle': '🏺',
    'pure-desi-cow-ghee': '🥛'
  };

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    const emoji = productEmojis[item.slug] || '🌶️';

    html += `
      <div class="cart-item">
        <span style="font-size: 1.6rem;">${emoji}</span>
        <div class="cart-item-info">
          <h4 class="cart-item-name">${item.name}</h4>
          <span class="cart-item-unit">per ${item.unit}</span>
          <div class="cart-item-price">₹${itemTotal.toFixed(2)} (${item.quantity} × ₹${item.price.toFixed(2)})</div>
        </div>
        
        <div class="cart-item-controls">
          <div class="qty-control">
            <button class="qty-btn" onclick="updateCartQty(${item.product_id}, -1)">-</button>
            <span class="qty-val" style="width: 25px; text-align: center; font-family: var(--font-mono); font-size: 0.85rem;">${item.quantity}</span>
            <button class="qty-btn" onclick="updateCartQty(${item.product_id}, 1)">+</button>
          </div>
          <button class="remove-item-btn" onclick="removeCartItem(${item.product_id})">remove</button>
        </div>
      </div>
    `;
  });

  cartItemsContainer.innerHTML = html;
  cartSubtotal.textContent = `₹${subtotal.toFixed(2)}`;

  if (giftBox && giftStatus && giftFill) {
    giftBox.style.display = 'block';
    const target = 500;
    if (subtotal >= target) {
      giftStatus.innerHTML = '🎉 <strong>Unlocked!</strong> Free Hand-carved Brass Spoon added!';
      giftFill.style.width = '100%';
    } else {
      const remaining = target - subtotal;
      giftStatus.innerHTML = `Add <strong>₹${remaining.toFixed(2)}</strong> more for a free Brass Spoon!`;
      const percentage = (subtotal / target) * 100;
      giftFill.style.width = `${percentage}%`;
    }
  }
}

// ----------------------------------------------------
// GPS LOCATION AUTOFILL
// ----------------------------------------------------

async function handleGPSAutofill() {
  gpsStatusFeedback.innerHTML = '';
  gpsStatusFeedback.className = 'gps-status-msg';

  if (!navigator.geolocation) {
    showGPSFeedback('Browser does not support GPS Geolocation.', 'gps-error');
    return;
  }

  // Set loading state on button
  gpsAutofillBtn.disabled = true;
  gpsAutofillBtn.textContent = '📍 Locating...';
  gpsAutofillBtn.classList.add('loading');

  const options = {
    enableHighAccuracy: true,
    timeout: 8000,
    maximumAge: 0
  };

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      
      showGPSFeedback('Coordinates acquired. Reverse-geocoding address...', 'gps-success');

      try {
        // Query OpenStreetMap Nominatim Free reverse-geocoder API
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`);
        const data = await response.json();
        
        if (data && data.display_name) {
          custAddressText.value = data.display_name;
          showGPSFeedback('Address auto-filled successfully!', 'gps-success');
        } else {
          // Fallback to coordinates
          custAddressText.value = `GPS Coordinates: Latitude ${lat.toFixed(5)}, Longitude ${lon.toFixed(5)}`;
          showGPSFeedback('GPS coordinates loaded. Please adjust to add street name/house number.', 'gps-success');
        }
      } catch (err) {
        console.error('Nominatim reverse lookup failed:', err);
        custAddressText.value = `Latitude: ${lat.toFixed(5)}, Longitude: ${lon.toFixed(5)}`;
        showGPSFeedback('GPS coordinates loaded. (Could not fetch postal address - offline).', 'gps-success');
      } finally {
        resetGPSBtn();
      }
    },
    (error) => {
      console.error('Geolocation failed:', error);
      let errMsg = 'Could not acquire location. Please type manually.';
      if (error.code === error.PERMISSION_DENIED) {
        errMsg = 'Location permission denied. Please enable location or type manually.';
      }
      showGPSFeedback(errMsg, 'gps-error');
      resetGPSBtn();
    },
    options
  );
}

function showGPSFeedback(msg, className) {
  gpsStatusFeedback.textContent = msg;
  gpsStatusFeedback.className = `gps-status-msg ${className}`;
}

function resetGPSBtn() {
  gpsAutofillBtn.disabled = false;
  gpsAutofillBtn.textContent = '📍 Get Current Location';
  gpsAutofillBtn.classList.remove('loading');
}

// ----------------------------------------------------
// CHECKOUT & ORDERS
// ----------------------------------------------------

function openCheckout() {
  if (cart.length === 0) return;
  closeCart();

  let html = '';
  let subtotal = 0;
  
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    html += `
      <li>
        <span>${item.name} (${item.quantity} × ${item.unit})</span>
        <span>₹${itemTotal.toFixed(2)}</span>
      </li>
    `;
  });

  checkoutItemsList.innerHTML = html;
  checkoutTotalAmount.textContent = `₹${subtotal.toFixed(2)}`;
  
  // Clear locator messages and payment states
  gpsStatusFeedback.innerHTML = '';
  document.getElementById('selected-payment-method').value = 'COD';
  
  // Reset payment tabs active states
  const paymentTabs = document.querySelectorAll('.payment-tab');
  const paymentPanels = document.querySelectorAll('.payment-details-panel');
  paymentTabs.forEach(t => t.classList.remove('active'));
  paymentPanels.forEach(p => p.classList.remove('active'));
  
  // Set COD as default active
  document.querySelector('.payment-tab[data-method="COD"]').classList.add('active');
  document.getElementById('panel-COD').classList.add('active');
  document.getElementById('place-order-btn').textContent = 'Confirm Order (Cash on Delivery)';

  // UPGRADE: Reset packaging selection
  document.getElementById('selected-packaging').value = 'jute';
  const packCards = document.querySelectorAll('.packaging-option-card');
  packCards.forEach(c => c.classList.remove('active'));
  document.querySelector('.packaging-option-card[data-pack="jute"]').classList.add('active');

  // Bind packaging selection click actions
  packCards.forEach(card => {
    card.onclick = (evt) => {
      packCards.forEach(c => c.classList.remove('active'));
      const activeCard = evt.currentTarget;
      activeCard.classList.add('active');
      const selection = activeCard.getAttribute('data-pack');
      document.getElementById('selected-packaging').value = selection;
      
      // Update grand totals
      let currentSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      let packCost = selection === 'brass' ? 149 : 0;
      let grandTotal = currentSubtotal + packCost;
      checkoutTotalAmount.textContent = `₹${grandTotal.toFixed(2)}`;
      
      const qrPriceTotal = document.getElementById('qr-price-total');
      if (qrPriceTotal) qrPriceTotal.textContent = `₹${grandTotal.toFixed(2)}`;
    };
  });
  
  // Hide QR scanner simulator
  const qrSimulator = document.getElementById('qr-simulator');
  if (qrSimulator) qrSimulator.classList.add('hidden');
  
  // Reset card values if any
  const cardNumInput = document.getElementById('card-num-input');
  if (cardNumInput) {
    cardNumInput.value = '';
    document.getElementById('card-logo-badge').textContent = '💳';
    document.getElementById('card-name-input').value = '';
    document.getElementById('card-expiry-input').value = '';
    document.getElementById('card-cvv-input').value = '';
  }

  checkoutModal.classList.add('active');
}

function closeCheckout() {
  checkoutModal.classList.remove('active');
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('place-order-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Processing Payment & Packing...';

  const method = document.getElementById('selected-payment-method').value;
  const packaging = document.getElementById('selected-packaging').value;

  const orderData = {
    customer_name: document.getElementById('cust-name').value,
    customer_email: document.getElementById('cust-email').value,
    customer_phone: document.getElementById('cust-phone').value,
    customer_address: custAddressText.value,
    payment_method: method,
    packaging_option: packaging,
    items: cart.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity
    }))
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    const result = await res.json();
    if (result.status === 'success') {
      const order = result.data;
      cart = [];
      saveCart();
      updateCartBadge();

      closeCheckout();
      checkoutForm.reset();

      // Show Success Modal
      successOrderNum.textContent = order.orderNumber;
      successTotalAmt.textContent = `₹${order.totalAmount.toFixed(2)}`;
      successModal.classList.add('active');

      // Autofill the tracking form automatically so they can check dispatch immediately!
      trackOrderNumberInput.value = order.orderNumber;
    } else {
      alert(`Bazaar Dispatch Error: ${result.error || 'Failed to process order'}`);
    }
  } catch (error) {
    console.error('Order request failed:', error);
    alert('Failed to connect to the bazaar dispatch. Please check your network.');
  } finally {
    submitBtn.disabled = false;
    // Restore button text
    if (method === 'COD') {
      submitBtn.textContent = 'Confirm Order (Cash on Delivery)';
    } else if (method === 'UPI') {
      submitBtn.textContent = 'Pay via UPI & Confirm Order';
    } else {
      submitBtn.textContent = 'Pay with Card & Confirm Order';
    }
  }
}

// ----------------------------------------------------
// ORDER DISPATCH PROGRESS TRACKER
// ----------------------------------------------------

async function handleOrderTrackingSearch(e) {
  e.preventDefault();
  
  const orderNumber = trackOrderNumberInput.value.trim().toUpperCase();
  if (!orderNumber) return;

  try {
    const res = await fetch(`/api/orders/track/${orderNumber}`);
    const result = await res.json();

    if (result.status === 'success') {
      const order = result.data;
      
      // Populate details card
      trackDispNumber.textContent = order.order_number;
      trackDispCustomer.textContent = order.customer_name;
      trackDispTotal.textContent = `₹${order.total_amount.toFixed(2)}`;
      trackDispStatusBadge.textContent = order.status;

      // Update Timeline Stepper Classes
      resetTimelineSteps();
      
      let widthPercentage = '0%';

      if (order.status === 'Pending') {
        stepPending.classList.add('active');
        widthPercentage = '0%';
      } else if (order.status === 'Weighed') {
        stepPending.classList.add('completed');
        stepWeighed.classList.add('active');
        widthPercentage = '33%';
      } else if (order.status === 'Dispatched') {
        stepPending.classList.add('completed');
        stepWeighed.classList.add('completed');
        stepDispatched.classList.add('active');
        widthPercentage = '66%';
      } else if (order.status === 'Delivered') {
        stepPending.classList.add('completed');
        stepWeighed.classList.add('completed');
        stepDispatched.classList.add('completed');
        stepDelivered.classList.add('completed');
        widthPercentage = '100%';
      }

      timelineLine.style.width = widthPercentage;
      
      // Reveal timeline results
      trackingResultsCard.classList.remove('hidden');
      
      // Scroll smoothly to timeline card
      trackingResultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } else {
      alert(`Tracking System: ${result.error || 'Failed to locate order number'}`);
      trackingResultsCard.classList.add('hidden');
    }
  } catch (error) {
    console.error('Tracking fetch failed:', error);
    alert('Failed to connect to the tracking server. Please check your connection.');
  }
}

function resetTimelineSteps() {
  const steps = [stepPending, stepWeighed, stepDispatched, stepDelivered];
  steps.forEach(step => {
    step.className = 'timeline-step';
  });
}

// ----------------------------------------------------
// OTHER FORM SUBMISSIONS
// ----------------------------------------------------

async function handleReviewSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById('review-name').value;
  const rating = document.getElementById('review-rating').value;
  const comment = document.getElementById('review-comment').value;

  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, rating, comment })
    });

    const result = await res.json();
    if (result.status === 'success') {
      fetchReviews();
      reviewForm.reset();
      
      // Reset Star Picker
      const starItems = starPicker.querySelectorAll('.star-picker-item');
      starItems.forEach(star => star.classList.add('active'));
      reviewRatingInput.value = 5;
    } else {
      alert(`Could not save review: ${result.error}`);
    }
  } catch (error) {
    console.error('Review submit failed:', error);
  }
}

async function handleContactSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('contact-name').value;
  const email = document.getElementById('contact-email').value;
  const phone = document.getElementById('contact-phone').value;
  const message = document.getElementById('contact-message').value;
  
  const submitBtn = document.getElementById('contact-submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending Message...';

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, phone, message })
    });

    const result = await res.json();
    if (result.status === 'success') {
      alert('Your message has been delivered to Nirmal Masala Bhandar! We will respond within 24 hours.');
      contactForm.reset();
    } else {
      alert(`Could not deliver message: ${result.error}`);
    }
  } catch (error) {
    console.error('Contact submit failed:', error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';
  }
}

// ----------------------------------------------------
// INTERACTIVE RECIPE & SPICE PAIRING TOOL
// ----------------------------------------------------
const recipesData = {
  'mathania-mirch': {
    title: 'Authentic Rajasthani Laal Maas',
    tag: '🌶️ Hot & Smoky',
    prep: '20 mins',
    cook: '45 mins',
    serves: 4,
    secret: 'Soak the Mathania chilis in warm water for 15 minutes before grinding into a paste to unlock the royal crimson color without burning heat.',
    pairings: ['Mutton / Lamb', 'Desi Ghee', 'Bajra Roti', 'Shahi Garam Masala'],
    spices: [5, 14, 6] // Product IDs: Mathania Chili (5), Desi Ghee (14), Garam Masala (6)
  },
  'kesar-elaichi': {
    title: 'Kotwali Bazaar Kesar Kheer',
    tag: '🥛 Sweet & Royal',
    prep: '15 mins',
    cook: '30 mins',
    serves: 6,
    secret: 'Toast the saffron strands lightly on a warm spoon lid before adding to boiling milk to release the bright gold color and intense Marwari flavor.',
    pairings: ['Basmati Rice', 'Green Cardamom', 'Desi Ghee', 'Almonds & Cashews'],
    spices: [10, 2, 14, 11, 12]
  },
  'shahi-garam-masala': {
    title: 'Royal Jodhpuri Govind Gatta Curry',
    tag: '🍲 Aromatic & Savory',
    prep: '25 mins',
    cook: '35 mins',
    serves: 4,
    secret: 'Add the Shahi Garam Masala in the last 3 minutes of boiling the yogurt gravy so the volatile spice oils do not evaporate, preserving the rich fragrance.',
    pairings: ['Besan (Gram Flour)', 'Yogurt Gravy', 'Pure Ghee', 'Cumin Seeds'],
    spices: [6, 14, 1]
  },
  'green-cardamom': {
    title: 'Munnar Elaichi Chai Scones',
    tag: '🟢 Fragrant & Sweet',
    prep: '15 mins',
    cook: '20 mins',
    serves: 8,
    secret: 'Crush the cardamom pods immediately before baking; exposing cardamom seeds to air too early dilutes their sweet camphor oils.',
    pairings: ['Wheat Flour', 'Assam Tea', 'Cow Ghee', 'Sugar'],
    spices: [2, 9, 14]
  },
  'cow-ghee': {
    title: 'Heritage Marwari Churma Ladoo',
    tag: '🏺 Rich & Decadent',
    prep: '20 mins',
    cook: '15 mins',
    serves: 10,
    secret: 'Churn the wheat flour crumbs inside warm A2 ghee while it is slightly hot. This allows the granules to absorb the ghee completely for a melt-in-your-mouth bite.',
    pairings: ['Wheat Flour', 'Jaggery / Sugar', 'Cardamom Seeds', 'Cashews'],
    spices: [14, 2, 12]
  }
};

function updateRecipeDisplay(spiceKey) {
  const recipe = recipesData[spiceKey];
  if (!recipe) return;

  const displayCard = document.getElementById('recipe-card-display');
  if (!displayCard) return;

  displayCard.querySelector('.recipe-tag-badge').textContent = recipe.tag;
  displayCard.querySelector('.recipe-title').textContent = recipe.title;
  displayCard.querySelector('.meta-flex').innerHTML = `
    <span>⏱️ Prep: ${recipe.prep}</span>
    <span>🔥 Cook: ${recipe.cook}</span>
    <span>👨‍👩‍👧‍👦 Serves: ${recipe.serves}</span>
  `;
  displayCard.querySelector('.recipe-secret-text').textContent = recipe.secret;

  const badgesList = document.getElementById('recipe-pairing-badges');
  let badgesHtml = '';
  recipe.pairings.forEach(p => {
    badgesHtml += `<span class="pairing-badge">${p}</span>`;
  });
  badgesList.innerHTML = badgesHtml;

  const ingredientsList = displayCard.querySelector('.recipe-ingredients-list');
  let ingredientsHtml = '';
  
  recipe.spices.forEach(pid => {
    // Attempt to lookup in seeded products list
    const prod = products.find(p => p.id === pid);
    if (prod) {
      ingredientsHtml += `<li>Add <strong>${prod.name}</strong> (${prod.unit})</li>`;
    }
  });

  if (spiceKey === 'mathania-mirch') {
    ingredientsHtml += `<li>500g Lamb or Goat shoulder pieces</li>`;
    ingredientsHtml += `<li>Sliced onions & ginger paste</li>`;
  } else if (spiceKey === 'kesar-elaichi') {
    ingredientsHtml += `<li>1 Liter Full Cream Milk</li>`;
    ingredientsHtml += `<li>1/2 Cup Basmati Rice</li>`;
  } else {
    ingredientsHtml += `<li>Fresh water & salt as required</li>`;
  }
  ingredientsList.innerHTML = ingredientsHtml;

  const addSpicesBtn = document.getElementById('add-recipe-spices-btn');
  addSpicesBtn.onclick = () => {
    recipe.spices.forEach(pid => {
      addToCart(pid, 1);
    });
    addSpicesBtn.textContent = '✅ Spices Added to Cart!';
    setTimeout(() => {
      addSpicesBtn.textContent = '🛒 Add Required Spices to Bag';
    }, 2000);
  };
}

// Self-initialize Recipe Pairing Widget
document.addEventListener('DOMContentLoaded', () => {
  const recipeSelect = document.getElementById('recipe-spice-select');
  if (recipeSelect) {
    recipeSelect.addEventListener('change', (e) => {
      updateRecipeDisplay(e.target.value);
    });
  }
  
  // Call initially to render Mathania Chili recipe
  setTimeout(() => {
    updateRecipeDisplay('mathania-mirch');
  }, 1000);
});
