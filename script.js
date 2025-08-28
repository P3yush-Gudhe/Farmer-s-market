// ===================== CART SYSTEM =====================
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product) {
  const existing = cart.find(item => item.name === product.name);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push(product);
  }
  saveCart();
  alert(`${product.name} added to cart!`);
}

// Attach add-to-cart event to all product buttons
function initAddToCart() {
  document.querySelectorAll(".product-card button").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".product-card");
      const name = card.querySelector("h3").innerText;
      const priceText = card.querySelector(".price")?.innerText || card.querySelector("p").innerText;
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ""));
      const sellerText = card.querySelector("p:nth-of-type(1)")?.innerText || "Local Farmer";
      const seller = sellerText.replace("Seller: ", "");

      addToCart({ name, price, seller, quantity: 1 });
    });
  });
}

// ===================== CART PAGE =====================
function renderCart() {
  const tableBody = document.querySelector(".cart-table tbody");
  const totalBox = document.querySelector(".checkout-box p strong");
  if (!tableBody || !totalBox) return;

  tableBody.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    const row = document.createElement("tr");
    const rowTotal = (item.price * item.quantity).toFixed(2);
    total += parseFloat(rowTotal);

    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.seller}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td><input type="number" value="${item.quantity}" min="1" data-index="${index}"></td>
      <td>$${rowTotal}</td>
      <td><button class="btn-remove" data-index="${index}">Remove</button></td>
    `;
    tableBody.appendChild(row);
  });

  totalBox.innerText = `Total: $${total.toFixed(2)}`;

  // Quantity change
  document.querySelectorAll(".cart-table input").forEach(input => {
    input.addEventListener("change", e => {
      const idx = e.target.dataset.index;
      cart[idx].quantity = parseInt(e.target.value);
      saveCart();
      renderCart();
    });
  });

  // Remove item
  document.querySelectorAll(".btn-remove").forEach(btn => {
    btn.addEventListener("click", e => {
      const idx = e.target.dataset.index;
      cart.splice(idx, 1);
      saveCart();
      renderCart();
    });
  });
}

// ===================== ACCOUNT PAGE =====================
function initAccount() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  if (loginForm) {
    loginForm.addEventListener("submit", e => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      const user = JSON.parse(localStorage.getItem("user"));

      if (user && user.email === email && user.password === password) {
        alert(`Welcome back, ${user.name}!`);
      } else {
        alert("Invalid credentials.");
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", e => {
      e.preventDefault();
      const user = {
        name: document.getElementById("register-name").value,
        email: document.getElementById("register-email").value,
        password: document.getElementById("register-password").value,
        role: document.getElementById("register-role").value,
      };
      localStorage.setItem("user", JSON.stringify(user));
      alert("Registration successful! You can now login.");
      showAccountForm("login");
    });
  }
}

// ===================== SELL PAGE =====================
function initSell() {
  const sellForm = document.querySelector(".sell-form");
  if (sellForm) {
    sellForm.addEventListener("submit", e => {
      e.preventDefault();
      const name = document.getElementById("product-name").value;
      const price = document.getElementById("price").value;
      alert(`✅ ${name} listed for $${price} successfully!`);
      sellForm.reset();
    });
  }
}

// ===================== BUY PAGE (Search + Filter + Sort) =====================
function initBuy() {
  const searchInput = document.querySelector(".search-filter input");
  const categorySelect = document.querySelector(".search-filter select:nth-of-type(1)");
  const sortSelect = document.querySelector(".search-filter select:nth-of-type(2)");
  const productCards = document.querySelectorAll(".product-card");

  if (!searchInput || !categorySelect || !sortSelect) return;

  function filterProducts() {
    const search = searchInput.value.toLowerCase();
    const category = categorySelect.value;
    let products = Array.from(productCards);

    products.forEach(card => {
      const name = card.querySelector("h3").innerText.toLowerCase();
      const cat = card.querySelector("p:nth-of-type(1)")?.innerText.toLowerCase() || "";
      let visible = true;

      if (search && !name.includes(search)) visible = false;
      if (category && !cat.includes(category)) visible = false;

      card.style.display = visible ? "block" : "none";
    });

    if (sortSelect.value) {
      let sorted = products.sort((a, b) => {
        const priceA = parseFloat(a.querySelector(".price").innerText.replace(/[^0-9.]/g, ""));
        const priceB = parseFloat(b.querySelector(".price").innerText.replace(/[^0-9.]/g, ""));
        return sortSelect.value === "price-low" ? priceA - priceB : priceB - priceA;
      });

      const grid = document.querySelector(".product-grid");
      grid.innerHTML = "";
      sorted.forEach(card => grid.appendChild(card));
    }
  }

  searchInput.addEventListener("input", filterProducts);
  categorySelect.addEventListener("change", filterProducts);
  sortSelect.addEventListener("change", filterProducts);
}

// ===================== CART BADGE =====================
function updateCartBadge() {
  let badge = document.getElementById("cart-badge");
  if (!badge) {
    const navCart = document.querySelector('.nav-links li a[href="cart.html"]');
    if (navCart) {
      badge = document.createElement("span");
      badge.id = "cart-badge";
      badge.style.background = "red";
      badge.style.color = "#fff";
      badge.style.padding = "2px 6px";
      badge.style.borderRadius = "50%";
      badge.style.fontSize = "0.8rem";
      badge.style.marginLeft = "6px";
      navCart.appendChild(badge);
    }
  }
  if (badge) badge.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
}

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  initAddToCart();
  renderCart();
  initAccount();
  initSell();
  initBuy();
  updateCartBadge();
});
