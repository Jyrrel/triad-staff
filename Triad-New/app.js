document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // SETTINGS
  // =========================
  const TAX_RATE = 0.10;
  const DISCOUNT_RATE = 0.10;

  // Mark best sellers by item ID (edit this list any time)
  const BEST_SELLER_IDS = new Set([1, 2, 3, 4, 8, 9, 13, 15, 17, 21]);

  // =========================
  // DOM HELPERS
  // =========================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const menuGrid = document.querySelector("[data-menu-grid]");
  const searchInput = document.querySelector("[data-search-input]");
  const cartEl = document.querySelector("[data-cart]");
  const subtotalEl = document.querySelector("[data-subtotal]");
  const taxEl = document.querySelector("[data-tax]");
  const discountEl = document.querySelector("[data-discount]");
  const totalEl = document.querySelector("[data-total]");

  const catButtons = $$(".cat");
  const payButtons = $$(".pay-btn");

  const personCountEl = document.querySelector("[data-person-count]");
  const tableTextEl = document.querySelector("[data-table-text]");
  const decPersonBtn = document.querySelector('[data-action="decrease-person"]');
  const incPersonBtn = document.querySelector('[data-action="increase-person"]');

  // =========================
  // 1) HERO SLIDER (every 5 seconds)
  // =========================
  (function heroSlider() {
    const slides = $$(".hero-slider .slide");
    if (!slides.length) return;

    let idx = slides.findIndex(s => s.classList.contains("active"));
    if (idx < 0) idx = 0;

    const show = (i) => {
      slides.forEach(s => s.classList.remove("active"));
      slides[i].classList.add("active");
    };

    show(idx);
    setInterval(() => {
      idx = (idx + 1) % slides.length;
      show(idx);
    }, 5000);
  })();

  // =========================
  // 2) BEST SELLER BADGE
  // =========================
  (function markBestSellers() {
    const cards = $$("[data-item]");
    cards.forEach(card => {
      const id = Number(card.dataset.id);
      if (BEST_SELLER_IDS.has(id)) card.classList.add("bestseller");
    });
  })();

  // =========================
  // 3) CATEGORY FILTER
  // =========================
  let activeCategory = "hot-coffee";

  function applyFilters() {
    const q = (searchInput?.value || "").trim().toLowerCase();
    const cards = $$("[data-item]");

    cards.forEach(card => {
      const name = (card.dataset.name || "").toLowerCase();
      const cat = card.dataset.category || "";

      const matchesCategory = activeCategory === "all"
        ? true
        : cat === activeCategory;

      const matchesSearch = q === "" ? true : name.includes(q);

      card.style.display = (matchesCategory && matchesSearch) ? "" : "none";
    });
  }

  catButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      catButtons.forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      activeCategory = btn.dataset.category;
      applyFilters();
    });
  });

  searchInput?.addEventListener("input", applyFilters);

  // run once
  applyFilters();

  // =========================
  // 4) CART SYSTEM (Add / Remove / Qty / Totals)
  // =========================
  const cart = new Map(); // id -> {id,name,price,img,qty}

  function money(n) {
    return `$${n.toFixed(2)}`;
  }

  function calcTotals() {
    let subtotal = 0;
    cart.forEach(item => subtotal += item.price * item.qty);

    const tax = subtotal * TAX_RATE;
    const discount = subtotal * DISCOUNT_RATE;
    const total = subtotal + tax - discount;

    if (subtotalEl) subtotalEl.textContent = money(subtotal);
    if (taxEl) taxEl.textContent = money(tax);
    if (discountEl) discountEl.textContent = `-${money(discount)}`;
    if (totalEl) totalEl.textContent = money(total);
  }

  function renderCart() {
    if (!cartEl) return;

    cartEl.innerHTML = "";

    if (cart.size === 0) {
      cartEl.innerHTML = `<div class="mini-link" style="text-align:center; padding:10px;">Cart is empty</div>`;
      calcTotals();
      return;
    }

    cart.forEach(item => {
      const row = document.createElement("div");
      row.className = "order-item";
      row.setAttribute("data-cart-item", "");
      row.setAttribute("data-id", item.id);

      row.innerHTML = `
        <img src="${item.img}" alt="${item.name}">
        <div class="order-info">
          <div class="order-name">${item.name}</div>
          <div class="order-price">${money(item.price)}</div>
        </div>
        <div class="order-actions">
          <button class="round" type="button" data-action="decrease-item" aria-label="Decrease">−</button>
          <span class="badge" data-qty>${item.qty}</span>
          <button class="round" type="button" data-action="increase-item" aria-label="Increase">+</button>
          <button class="mini-link" type="button" data-action="remove-item">Remove</button>
        </div>
      `;

      cartEl.appendChild(row);
    });

    calcTotals();
  }

  function addToCartFromCard(card) {
    const id = card.dataset.id;
    const name = card.dataset.name;
    const price = Number(card.dataset.price || 0);
    const img = $("img", card)?.getAttribute("src") || "";

    if (!id || !name || !price) return;

    const existing = cart.get(id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.set(id, { id, name, price, img, qty: 1 });
    }

    renderCart();
  }

  // Add button click (event delegation)
  menuGrid?.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-action="add-to-cart"], .pill');
    if (!btn) return;

    const card = e.target.closest("[data-item]");
    if (!card) return;

    addToCartFromCard(card);
  });

  // Cart actions: + / - / remove
  cartEl?.addEventListener("click", (e) => {
    const row = e.target.closest("[data-cart-item]");
    if (!row) return;

    const id = row.dataset.id;
    const item = cart.get(id);
    if (!item) return;

    const actionBtn = e.target.closest("button");
    if (!actionBtn) return;

    const action = actionBtn.dataset.action;

    if (action === "increase-item") {
      item.qty += 1;
    } else if (action === "decrease-item") {
      item.qty -= 1;
      if (item.qty <= 0) cart.delete(id);
    } else if (action === "remove-item") {
      cart.delete(id);
    }

    renderCart();
  });

  // first render
  renderCart();

  // =========================
  // 5) PAYMENT METHOD ACTIVE TOGGLE
  // =========================
  payButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      payButtons.forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-checked", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-checked", "true");
    });
  });

  // =========================
  // 6) PERSON COUNT +/- FUNCTION
  // =========================
  function setPersonCount(newCount) {
    const count = Math.max(1, newCount);
    if (personCountEl) personCountEl.textContent = String(count);
    if (tableTextEl) tableTextEl.value = `${count} Person Table`;
  }

  decPersonBtn?.addEventListener("click", () => {
    const current = Number(personCountEl?.textContent || 1);
    setPersonCount(current - 1);
  });

  incPersonBtn?.addEventListener("click", () => {
    const current = Number(personCountEl?.textContent || 1);
    setPersonCount(current + 1);
  });
});
