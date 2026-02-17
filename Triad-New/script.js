document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     HERO SLIDER (5 seconds)
  ========================== */
  let currentSlide = 0;
  const slides = document.querySelectorAll(".hero-slider .slide");

  function showSlide(index) {
    slides.forEach(s => s.classList.remove("active"));
    slides[index].classList.add("active");
  }

  if (slides.length) {
    setInterval(() => {
      currentSlide = (currentSlide + 1) % slides.length;
      showSlide(currentSlide);
    }, 5000);
  }

  /* =========================
     CATEGORY FILTER
  ========================== */
  const catButtons = document.querySelectorAll(".cat");
  const cards = document.querySelectorAll("[data-menu-grid] .card");

  function filterByCategory(category) {
    cards.forEach(card => {
      const cardCat = card.getAttribute("data-category") || "hot-coffee";
      card.style.display = (category === "all" || cardCat === category) ? "" : "none";
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

      const category = btn.getAttribute("data-category");
      filterByCategory(category);
    });
  });

  /* =========================
     SEARCH FILTER
  ========================== */
  const searchInput = document.querySelector("[data-search-input]");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();

      cards.forEach(card => {
        const name = (card.getAttribute("data-name") || "").toLowerCase();
        const desc = (card.querySelector("p")?.textContent || "").toLowerCase();
        const match = name.includes(q) || desc.includes(q);
        card.style.display = match ? "" : "none";
      });
    });
  }

  /* =========================
     CART + TOTALS
  ========================== */
  const cartEl = document.querySelector("[data-cart]");
  const subEl = document.querySelector("[data-subtotal]");
  const taxEl = document.querySelector("[data-tax]");
  const discEl = document.querySelector("[data-discount]");
  const totalEl = document.querySelector("[data-total]");

  const TAX_RATE = 0.10;
  const DISC_RATE = 0.10;

  // Build initial cart from HTML (items already shown on the right)
  const cart = new Map();
  document.querySelectorAll("[data-cart-item]").forEach(item => {
    const id = item.getAttribute("data-id");
    const name = item.querySelector(".order-name")?.textContent.trim() || "Item";
    const price = parseFloat((item.querySelector(".order-price")?.textContent || "$0").replace("$", "")) || 0;
    const qty = parseInt(item.querySelector("[data-qty]")?.textContent || "1", 10) || 1;
    cart.set(id, { id, name, price, qty, img: item.querySelector("img")?.src || "" });
  });

  function money(n) {
    return `$${n.toFixed(2)}`;
  }

  function renderCart() {
    if (!cartEl) return;

    cartEl.innerHTML = "";
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

    updateTotals();
  }

  function updateTotals() {
    let subtotal = 0;
    cart.forEach(item => subtotal += item.price * item.qty);

    const tax = subtotal * TAX_RATE;
    const discount = subtotal * DISC_RATE;
    const total = subtotal + tax - discount;

    if (subEl) subEl.textContent = money(subtotal);
    if (taxEl) taxEl.textContent = money(tax);
    if (discEl) discEl.textContent = `-${money(discount)}`;
    if (totalEl) totalEl.textContent = money(total);
  }

  // Add-to-cart buttons (menu cards)
  document.querySelectorAll('[data-action="add-to-cart"]').forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      if (!card) return;

      const id = card.getAttribute("data-id") || `item-${Date.now()}`;
      const name = card.getAttribute("data-name") || card.querySelector("h4")?.textContent.trim() || "Item";
      const price = parseFloat(card.getAttribute("data-price")) || parseFloat((card.querySelector("[data-price-text]")?.textContent || "$0").replace("$","")) || 0;
      const img = card.querySelector("img")?.src || "";

      if (cart.has(id)) cart.get(id).qty += 1;
      else cart.set(id, { id, name, price, qty: 1, img });

      renderCart();
    });
  });

  // Cart buttons (increase/decrease/remove)
  if (cartEl) {
    cartEl.addEventListener("click", (e) => {
      const action = e.target.getAttribute("data-action");
      const row = e.target.closest("[data-cart-item]");
      if (!action || !row) return;

      const id = row.getAttribute("data-id");
      if (!cart.has(id)) return;

      if (action === "increase-item") {
        cart.get(id).qty += 1;
      } else if (action === "decrease-item") {
        cart.get(id).qty -= 1;
        if (cart.get(id).qty <= 0) cart.delete(id);
      } else if (action === "remove-item") {
        cart.delete(id);
      }

      renderCart();
    });
  }

  /* =========================
     PERSON COUNT +/-
  ========================== */
  const personCountEl = document.querySelector("[data-person-count]");
  const tableTextEl = document.querySelector("[data-table-text]");
  const decPersonBtn = document.querySelector('[data-action="decrease-person"]');
  const incPersonBtn = document.querySelector('[data-action="increase-person"]');

  function setPersonCount(n) {
    const safe = Math.max(1, n);
    if (personCountEl) personCountEl.textContent = safe;
    if (tableTextEl) tableTextEl.value = `${safe} Person Table`;
  }

  if (decPersonBtn) {
    decPersonBtn.addEventListener("click", () => {
      const current = parseInt(personCountEl?.textContent || "1", 10) || 1;
      setPersonCount(current - 1);
    });
  }

  if (incPersonBtn) {
    incPersonBtn.addEventListener("click", () => {
      const current = parseInt(personCountEl?.textContent || "1", 10) || 1;
      setPersonCount(current + 1);
    });
  }

  /* =========================
     PAYMENT ACTIVE TOGGLE
  ========================== */
  document.querySelectorAll(".pay-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".pay-btn").forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-checked", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-checked", "true");
    });
  });

  // Initial totals render
  renderCart();
});
