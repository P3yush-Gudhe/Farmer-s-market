// ============================================
// FARMERS MARKET - COMPLETE CLIENT-SIDE APP
// ============================================

class FarmersMarketApp {
  constructor() {
    // IMPORTANT: Backend API URL
    this.API_BASE = 'http://localhost:3000/api';
    this.cart = this.getCart();
    this.user = this.getUser();
    this.init();
  }

  init() {
    this.setupNavigation();
    this.updateCartBadge();
    this.setupEventListeners();
    
    // Load products if on homepage
    if (document.getElementById('featuredProducts')) {
      this.loadFeaturedProducts();
    }
    
    // Load all products if on buy page
    if (document.getElementById('allProducts')) {
      this.loadAllProducts();
    }
  }

  // ============================================
  // NAVIGATION
  // ============================================

  setupNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navbar = document.getElementById('navbar');

    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
      });

      document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
          navMenu.classList.remove('active');
        }
      });
    }

    if (navbar) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      });
    }
  }

  setupEventListeners() {
    // Newsletter form
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    newsletterForms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.subscribeNewsletter(form);
      });
    });

    // Add to cart buttons
    this.attachAddToCartListeners();
  }

  attachAddToCartListeners() {
    // NOTE: This logic should ideally be re-run after products are loaded dynamically.
    // If using dynamic product loading, you must ensure listeners are attached to new buttons.
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
      // Remove previous listeners to prevent duplicates if load functions call this multiple times
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
    });

    document.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const productData = btn.dataset.product;
        
        if (productData) {
          try {
            const product = JSON.parse(productData);
            this.addToCart(product);
          } catch (error) {
            console.error('Error parsing product data:', error);
          }
        }
      });
    });
  }

  // ============================================
  // CART MANAGEMENT
  // ============================================

  getCart() {
    return JSON.parse(localStorage.getItem('farmersMarketCart')) || [];
  }

  saveCart() {
    localStorage.setItem('farmersMarketCart', JSON.stringify(this.cart));
    this.updateCartBadge();
    this.dispatchCartUpdate();
  }

  addToCart(product) {
    const productId = product.id || product._id;
    // CRITICAL: Ensure we use String comparison for demo IDs like 'demo-1'
    const existingItem = this.cart.find(item => String(item.id) === String(productId) || String(item._id) === String(productId));
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push({
        id: productId,
        _id: productId,
        name: product.name,
        price: product.price,
        seller: product.seller?.name || product.seller || 'Local Farmer',
        image: product.image,
        quantity: 1,
        unit: product.unit || 'kg'
      });
    }
    
    this.saveCart();
    this.showNotification(`${product.name} added to cart!`, 'success');
  }

  removeFromCart(productId) {
    // FIX: Coerce productId to string for robust comparison against string IDs (like 'demo-1')
    const idString = String(productId);
    this.cart = this.cart.filter(item => String(item.id) !== idString && String(item._id) !== idString);
    this.saveCart();
    this.showNotification('Item removed from cart', 'info');
  }

  updateQuantity(productId, quantity) {
    // FIX: Coerce productId to string for robust lookup
    const idString = String(productId);
    const item = this.cart.find(item => String(item.id) === idString || String(item._id) === idString);
    if (item) {
      item.quantity = Math.max(1, parseInt(quantity));
      this.saveCart();
    }
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
  }

  getCartTotal() {
    return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getCartItemCount() {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = this.getCartItemCount();
    badges.forEach(badge => {
      badge.textContent = count;
    });
  }

  dispatchCartUpdate() {
    window.dispatchEvent(new CustomEvent('cartUpdated', { 
      detail: { cart: this.cart } 
    }));
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  getUser() {
    return JSON.parse(localStorage.getItem('farmersMarketUser')) || null;
  }

  saveUser(userData) {
    localStorage.setItem('farmersMarketUser', JSON.stringify(userData));
    this.user = userData;
  }

  logout() {
    localStorage.removeItem('farmersMarketUser');
    this.user = null;
    window.location.href = 'index.html';
  }

  isLoggedIn() {
    return this.user !== null && this.user.token;
  }

  // ============================================
  // PRODUCTS - BACKEND INTEGRATION
  // ============================================

  async loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;

    try {
      container.innerHTML = this.getLoadingHTML();

      const response = await fetch(`${this.API_BASE}/products/featured`);
      const data = await response.json();

      if (data.success && data.products.length > 0) {
        container.innerHTML = data.products.map(product => this.createProductCard(product)).join('');
      } else {
        // Fallback to demo products if no products in database
        container.innerHTML = this.getDemoProducts().slice(0, 4)
          .map(product => this.createProductCard(product)).join('');
      }
      
      this.attachAddToCartListeners();
    } catch (error) {
      console.error('Error loading products:', error);
      // Show demo products on error
      container.innerHTML = this.getDemoProducts().slice(0, 4)
        .map(product => this.createProductCard(product)).join('');
      this.attachAddToCartListeners();
    }
  }

  async loadAllProducts() {
    const container = document.getElementById('allProducts');
    if (!container) return;
    
    // Add loading state before fetch
    container.innerHTML = this.getLoadingHTML();

    try {
      const response = await fetch(`${this.API_BASE}/products`);
      const data = await response.json();

      if (data.success && data.products.length > 0) {
        container.innerHTML = data.products.map(product => this.createProductCard(product)).join('');
      } else {
        // Fallback to demo products
        container.innerHTML = this.getDemoProducts()
          .map(product => this.createProductCard(product)).join('');
      }
      
      this.attachAddToCartListeners();
    } catch (error) {
      console.error('Error loading products:', error);
      container.innerHTML = this.getDemoProducts()
        .map(product => this.createProductCard(product)).join('');
      this.attachAddToCartListeners();
    }
  }

  createProductCard(product) {
    const imageUrl = product.image?.startsWith('http') 
      ? product.image 
      : `http://localhost:3000${product.image}`;
    
    // Use _id if available, fallback to id for the primary ID
    const productId = product._id || product.id;

    return `
      <div class="product-card" data-product-id="${productId}">
        <div class="product-image">
          <img src="${imageUrl}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
          ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
        </div>
        <div class="product-info">
          <h3 class="product-title">${product.name}</h3>
          <p class="product-seller">By ${product.seller?.name || product.seller || 'Local Farmer'}</p>
          <div class="product-footer">
            <span class="product-price">₹${product.price.toFixed(2)}</span>
            <button class="btn-add-cart" data-product='${JSON.stringify({
              id: productId,
              _id: productId,
              name: product.name,
              price: product.price,
              seller: product.seller?.name || product.seller,
              image: imageUrl,
              unit: product.unit
            })}'>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;
  }

  getDemoProducts() {
    return [
      {
        id: 'demo-1',
        _id: 'demo-1',
        name: 'Fresh Tomatoes',
        price: 60,
        seller: 'Farmer Ramesh',
        category: 'vegetables',
        image: 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=400',
        badge: 'Fresh',
        unit: 'kg'
      },
      {
        id: 'demo-2',
        _id: 'demo-2',
        name: 'Organic Apples',
        price: 150,
        seller: 'Sunrise Orchards',
        category: 'fruits',
        image: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=400',
        badge: 'Organic',
        unit: 'kg'
      },
      {
        id: 'demo-3',
        _id: 'demo-3',
        name: 'Farm Fresh Milk',
        price: 50,
        seller: 'Green Dairy Farm',
        category: 'dairy',
        image: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=400',
        badge: 'Fresh',
        unit: 'L'
      },
      {
        id: 'demo-4',
        _id: 'demo-4',
        name: 'Organic Rice',
        price: 80,
        seller: 'Golden Harvest',
        category: 'grains',
        // FIX: Replaced unreliable Pexels link (3928854) with a more stable, public Unsplash link
        image: 'https://images.unsplash.com/photo-1594038148386-077551062c3e?q=80&w=400',
        badge: 'Organic',
        unit: 'kg'
      }
    ];
  }

  // ============================================
  // API METHODS
  // ============================================

  async login(email, password) {
    try {
      const response = await fetch(`${this.API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.success) {
        this.saveUser({ ...data.user, token: data.token });
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please check if backend is running.' };
    }
  }

  async register(userData) {
    try {
      const response = await fetch(`${this.API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await response.json();
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'Registration failed. Please check if backend is running.' };
    }
  }

  async createProduct(formData) {
    try {
      const response = await fetch(`${this.API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.user?.token}`
        },
        body: formData
      });
      return await response.json();
    } catch (error) {
      console.error('Create product error:', error);
      return { success: false, message: 'Failed to create product' };
    }
  }

  async createOrder(orderData) {
    try {
      const response = await fetch(`${this.API_BASE}/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.user?.token}`
        },
        body: JSON.stringify(orderData)
      });
      return await response.json();
    } catch (error) {
      console.error('Create order error:', error);
      return { success: false, message: 'Order creation failed' };
    }
  }

  // ============================================
  // UTILITIES
  // ============================================

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${type === 'success' ? '#2d6a4f' : type === 'error' ? '#e76f51' : '#6c757d'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  getLoadingHTML() {
    return `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
        <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="margin-top: 1rem; color: #6c757d;">Loading products...</p>
      </div>
    `;
  }

  async subscribeNewsletter(form) {
    const email = form.querySelector('input[type="email"]').value;
    
    try {
      const response = await fetch(`${this.API_BASE}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.showNotification('Successfully subscribed to newsletter!', 'success');
        form.reset();
      } else {
        this.showNotification(data.message, 'error');
      }
    } catch (error) {
      console.error('Newsletter error:', error);
      this.showNotification('Subscription failed', 'error');
    }
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
let app;
function initializeApp() {
    app = new FarmersMarketApp();
    window.FarmersMarket = app;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
// Export for use in other scripts
// NOTE: This should now be handled by initializeApp, keeping this line 
// for compatibility if the script runs late.
window.FarmersMarket = app;
