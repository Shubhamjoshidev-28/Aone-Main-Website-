/* ============================================================
   INDEX.JS
   Customer ordering interface: menu browsing, cart, and
   placing an order against the backend (no login required).
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  let menuItems = [];
  let cart = {}; // { menuItemId: { item, qty } }
  let activeCategory = 'All';
  let searchTerm = '';
  let activeSize = 'Full';
  let selectedPayment = 'Offline';

  const menuGrid = document.getElementById('menu-grid');
  const menuEmpty = document.getElementById('menu-empty');
  const categoryTabs = document.getElementById('category-tabs');
  const searchInput = document.getElementById('search-input');
  const sizeFilter = document.getElementById('new-order-size-filter');

  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartToggleBtn = document.getElementById('cart-toggle-btn');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const cartItemsEl = document.getElementById('cart-items');
  const cartEmptyEl = document.getElementById('cart-empty');
  const cartSummaryEl = document.getElementById('cart-summary');
  const cartCountEl = document.getElementById('cart-count');
  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const cartGrandTotalEl = document.getElementById('cart-grand-total');
  const floatingCartBtn = document.getElementById('floating-cart-btn');
  const floatingCartTotal = document.getElementById('floating-cart-total');

  const orderForm = document.getElementById('order-form');
  const successModal = document.getElementById('success-modal');
  const successOrderId = document.getElementById('success-order-id');
  const successCloseBtn = document.getElementById('success-close-btn');

  /* ---------------- Load menu ---------------- */
  async function loadMenu() {
    try {
      const response = await API.getMenu();
      menuItems = (response.menu || []).filter((item) => item.is_available);
      buildCategoryTabs();
      renderMenu();
    } catch (err) {
      /* error toast already shown */
    }
  }

  function buildCategoryTabs() {
    const categories = Array.from(new Set(menuItems.map((item) => item.Item_Category))).sort();

    categoryTabs.innerHTML = '<button class="category-chip active" data-category="All">All</button>';

    categories.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = 'category-chip';
      btn.dataset.category = cat;
      btn.textContent = cat;
      categoryTabs.appendChild(btn);
    });

    categoryTabs.addEventListener('click', (e) => {
      const chip = e.target.closest('.category-chip');
      if (!chip) return;

      categoryTabs.querySelectorAll('.category-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.dataset.category;
      renderMenu();
    });
  }

  function normalizeSize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function getFilteredMenu() {
    return menuItems.filter((item) => {
      const matchesCategory = activeCategory === 'All' || item.Item_Category === activeCategory;
      const matchesSize = normalizeSize(item.Item_Size) === normalizeSize(activeSize);
      const matchesSearch = String(item.Item_Name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSize && matchesSearch;
    });
  }

  function renderMenu() {
    const filtered = getFilteredMenu();
    menuGrid.innerHTML = '';

    menuEmpty.classList.toggle('hidden', filtered.length !== 0);

    filtered.forEach((item) => {
      const qty = cart[item.id] ? cart[item.id].qty : 0;

      const card = document.createElement('div');
      card.className = 'menu-card card-hover';
      const sizeLabel = String(item.Item_Size || '').trim().toUpperCase();
      card.innerHTML = `
        <div class="menu-card-body">
          <div class="menu-card-meta">
            <span class="menu-card-category">${item.Item_Category}</span>
            <span class="menu-size-tag">${sizeLabel}</span>
          </div>
          <h3 class="menu-card-name">${item.Item_Name}</h3>
          <span class="menu-card-price">Rs.${Number(item.Item_Price).toFixed(2)}</span>
        </div>
        <div class="menu-card-footer">
          <div class="qty-stepper">
            <button type="button" class="qty-minus" data-id="${item.id}"><i class="fa-solid fa-minus"></i></button>
            <span data-qty-for="${item.id}">${qty}</span>
            <button type="button" class="qty-plus" data-id="${item.id}"><i class="fa-solid fa-plus"></i></button>
          </div>
          <button type="button" class="btn btn-primary btn-sm add-btn" data-id="${item.id}">
            <i class="fa-solid fa-cart-plus"></i> Add
          </button>
        </div>
      `;
      menuGrid.appendChild(card);
    });
  }

  menuGrid.addEventListener('click', (e) => {
    const plusBtn = e.target.closest('.qty-plus');
    const minusBtn = e.target.closest('.qty-minus');
    const addBtn = e.target.closest('.add-btn');

    if (plusBtn) changeQty(Number(plusBtn.dataset.id), 1);
    if (minusBtn) changeQty(Number(minusBtn.dataset.id), -1);
    if (addBtn) addToCart(Number(addBtn.dataset.id));
  });

  function changeQty(itemId, delta) {
    const item = menuItems.find((m) => m.id === itemId);
    if (!item) return;

    const currentQty = cart[itemId] ? cart[itemId].qty : 0;
    const newQty = Math.max(0, currentQty + delta);

    const qtyLabel = document.querySelector(`[data-qty-for="${itemId}"]`);
    if (qtyLabel) qtyLabel.textContent = newQty;

    if (newQty === 0) {
      delete cart[itemId];
    } else {
      cart[itemId] = { item, qty: newQty };
      renderCart();
      return;
    }
    renderCart();
  }

  function addToCart(itemId) {
    const item = menuItems.find((m) => m.id === itemId);
    if (!item) return;

    const currentQty = cart[itemId] ? cart[itemId].qty : 1;
    cart[itemId] = { item, qty: cart[itemId] ? cart[itemId].qty + 1 : 1 };

    const qtyLabel = document.querySelector(`[data-qty-for="${itemId}"]`);
    if (qtyLabel) qtyLabel.textContent = cart[itemId].qty;

    Toast.success(`${item.Item_Name} added to cart`);
    renderCart();
    openCart();
  }

  /* ---------------- Cart rendering ---------------- */
  function getCartTotal() {
    return Object.values(cart).reduce((sum, entry) => sum + Number(entry.item.Item_Price) * entry.qty, 0);
  }

  function getCartCount() {
    return Object.values(cart).reduce((sum, entry) => sum + entry.qty, 0);
  }

  function renderCart() {
    const entries = Object.values(cart);
    const count = getCartCount();
    const total = getCartTotal();

    cartCountEl.textContent = count;
    cartEmptyEl.classList.toggle('hidden', entries.length !== 0);
    cartSummaryEl.classList.toggle('hidden', entries.length === 0);

    cartItemsEl.querySelectorAll('.cart-item').forEach((el) => el.remove());

    entries.forEach(({ item, qty }) => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="cart-item-icon"><i class="fa-solid fa-utensils"></i></div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.Item_Name} (${item.Item_Size})</div>
          <div class="cart-item-price">Rs.${Number(item.Item_Price).toFixed(2)} x ${qty} = Rs.${(Number(item.Item_Price) * qty).toFixed(2)}</div>
        </div>
        <div class="qty-stepper">
          <button type="button" class="qty-minus" data-id="${item.id}"><i class="fa-solid fa-minus"></i></button>
          <span data-qty-for="${item.id}">${qty}</span>
          <button type="button" class="qty-plus" data-id="${item.id}"><i class="fa-solid fa-plus"></i></button>
        </div>
      `;
      cartItemsEl.appendChild(row);
    });

    cartSubtotalEl.textContent = `Rs.${total.toFixed(2)}`;
    cartGrandTotalEl.textContent = `Rs.${total.toFixed(2)}`;

    floatingCartTotal.textContent = `Rs.${total.toFixed(2)}`;
    floatingCartBtn.classList.toggle('visible', count > 0);

    renderMenu();
  }

  cartItemsEl.addEventListener('click', (e) => {
    const plusBtn = e.target.closest('.qty-plus');
    const minusBtn = e.target.closest('.qty-minus');
    if (plusBtn) changeQty(Number(plusBtn.dataset.id), 1);
    if (minusBtn) changeQty(Number(minusBtn.dataset.id), -1);
  });

  /* ---------------- Cart drawer open/close ---------------- */
  function openCart() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('show');
  }

  function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('show');
  }

  cartToggleBtn.addEventListener('click', openCart);
  floatingCartBtn.addEventListener('click', openCart);
  closeCartBtn.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  /* ---------------- Search ---------------- */
  let searchDebounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      searchTerm = searchInput.value.trim();
      renderMenu();
    }, 200);
  });

  /* ---------------- Size filter ---------------- */
  if (sizeFilter) {
    sizeFilter.addEventListener('click', (e) => {
      const button = e.target.closest('.size-filter-btn');
      if (!button) return;

      sizeFilter.querySelectorAll('.size-filter-btn').forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      activeSize = button.dataset.size;
      renderMenu();
    });
  }

  /* ---------------- Payment toggle ---------------- */
  document.querySelectorAll('.payment-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.payment-option').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPayment = btn.dataset.payment;
    });
  });

  /* ---------------- Place order ---------------- */
  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const entries = Object.values(cart);
    if (entries.length === 0) {
      Toast.error('Your cart is empty.');
      return;
    }

    const custName = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('phone-no').value.trim();
    const tableNo = document.getElementById('table-no').value.trim();
    const carNo = document.getElementById('car-no').value.trim();

    if (!custName || !phone) {
      Toast.error('Please enter your name and phone number.');
      return;
    }

    const payload = {
      Cust_Name: custName,
      Table_No: tableNo ? Number(tableNo) : null,
      Car_No: carNo || null,
      Phone: phone,
      Source: 'Customer',
      Status: 'Preparing',
      Payment_Status: 'Pending',
      Payment_Type: selectedPayment,
      Total: getCartTotal().toFixed(2),
      items: entries.map(({ item, qty }) => ({
        item: item.id,
        unit_price: item.Item_Price,
        order_qty: qty
      }))
    };

    try {
      const response = await API.createOrder(payload);
      const orderId = response.order && response.order.id ? response.order.id : '';

      successOrderId.textContent = `#${orderId}`;
      successModal.classList.add('show');
      closeCart();

      cart = {};
      orderForm.reset();
      document.querySelectorAll('.payment-option').forEach((b) => b.classList.remove('active'));
      document.querySelector('.payment-option[data-payment="Offline"]').classList.add('active');
      selectedPayment = 'Offline';
      renderCart();
    } catch (err) {
      /* error toast already shown */
    }
  });

  successCloseBtn.addEventListener('click', () => {
    successModal.classList.remove('show');
  });

  loadMenu();
});