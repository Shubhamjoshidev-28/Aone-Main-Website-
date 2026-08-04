/* ============================================================
   DASHBOARD.JS
   Owner Orders page: live orders, delivered orders, view/edit/
   delete, invoice generation (moves order to Delivered without
   a page refresh) and frontend-generated 58mm receipt printing.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  Shell.init();

  let orders = [];
  let activeTab = 'live';
  let pendingDeleteId = null;

  /* Menu cache, shared by the New Order picker, the Edit Order "Add Item"
     selector, and the item-name lookups used in View Order + the receipt. */
  let menuItems = [];

  /* Cart used while the New Order modal is open: { menuItemId: { item, qty } } */
  let newOrderCart = {};
  let newOrderType = 'Dine In';

  /* Cart used while the Edit Order modal is open, seeded from the order's
     existing order_items and mutated by qty +/-, delete, and Add Item. */
  let editOrderCart = {};
  let editOrderId = null;

  /* Scratch cart for the shared Menu Selector modal (Edit Order -> Add Item). */
  let selectorCart = {};

  const liveGrid = document.getElementById('live-orders-grid');
  const liveEmpty = document.getElementById('live-orders-empty');
  const liveCountEl = document.getElementById('live-count');

  const deliveredBody = document.getElementById('delivered-orders-body');
  const deliveredEmpty = document.getElementById('delivered-orders-empty');
  const deliveredCountEl = document.getElementById('delivered-count');

  const liveSection = document.getElementById('live-orders-section');
  const deliveredSection = document.getElementById('delivered-orders-section');

  /* ---------------- Helpers ---------------- */
  function isLive(order) {
    return order.Status !== 'Delivered';
  }

  function statusBadgeClass(status) {
    const map = {
      Preparing: 'badge-warning',
      Accepted: 'badge-info',
      'Ready To Collect': 'badge-info',
      Delivered: 'badge-success'
    };
    return map[status] || 'badge-muted';
  }

  function paymentBadgeClass(status) {
    return status === 'Paid' ? 'badge-success' : 'badge-warning';
  }

  function formatTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function formatMoney(value) {
    return `₹${Number(value || 0).toFixed(2)}`;
  }

  /* ---------------- Menu (shared cache) ---------------- */
  async function loadMenu() {
    try {
      const response = await API.getMenu();
      menuItems = response.menu_items || response.menu || [];
    } catch (err) {
      /* toast already shown */
    }
  }

  /** Both the New Order picker and the Menu Selector (Edit Order -> Add Item)
      call refresh() the moment their modal opens. loadMenu() is fired once
      at startup and not awaited there, so if a modal is opened before that
      first request resolves, menuItems would still be empty and the grid
      would render with nothing in it. Guard against that race by loading
      the menu on demand whenever it's still empty. */
  async function ensureMenuLoaded() {
    if (menuItems.length === 0) {
      await loadMenu();
    }
  }

  function getMenuItem(itemId) {
    return menuItems.find((m) => m.id === itemId);
  }

  /** Real item name for an order_item row, falling back gracefully if the
      menu item was since deleted (still shows something useful instead of
      the old "Item #<id>" placeholder). */
  function orderItemName(orderItem) {
    const menuItem = getMenuItem(orderItem.item);
    return menuItem ? menuItem.Item_Name : `Item #${orderItem.item}`;
  }

  /* ---------------- Load orders ---------------- */
  async function loadOrders() {
    try {
      const response = await API.getOrders();
      orders = response.order || [];
      render();
    } catch (err) {
      /* toast already shown */
    }
  }

  function render() {
    const live = orders.filter(isLive).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const delivered = orders.filter((o) => !isLive(o)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    liveCountEl.textContent = live.length;
    deliveredCountEl.textContent = delivered.length;

    renderLive(live);
    renderDelivered(delivered);
  }

  function renderLive(live) {
    liveGrid.innerHTML = '';
    liveEmpty.classList.toggle('hidden', live.length !== 0);

    live.forEach((order) => {
      const card = document.createElement('div');
      card.className = 'order-card card-hover';
      card.innerHTML = `
        <div class="order-card-header">
          <div>
            <div class="order-card-id">Order #${order.id}</div>
            <div class="order-card-time"><i class="fa-regular fa-clock"></i> ${formatTime(order.created_at)}</div>
          </div>
        </div>
        <div class="order-card-meta">
          <div class="order-meta-item">
            <div class="order-meta-label">Customer</div>
            <div>${order.Cust_Name || '-'}</div>
          </div>
          <div class="order-meta-item">
            <div class="order-meta-label">Table</div>
            <div>${order.Table_No || '-'}</div>
          </div>
          <div class="order-meta-item">
            <div class="order-meta-label">Car No.</div>
            <div>${order.Car_No || '-'}</div>
          </div>
          <div class="order-meta-item">
            <div class="order-meta-label">Source</div>
            <div>${order.Source || '-'}</div>
          </div>
        </div>
        <div class="order-card-badges">
          <span class="badge ${statusBadgeClass(order.Status)}">${order.Status}</span>
          <span class="badge ${paymentBadgeClass(order.Payment_Status)}">${order.Payment_Status || 'Pending'}</span>
        </div>
        <div class="order-card-footer">
          <span class="order-card-total">${formatMoney(order.Total)}</span>
          <div class="order-card-actions">
            <button class="btn btn-icon btn-sm view-order-btn" data-id="${order.id}" title="View"><i class="fa-solid fa-eye"></i></button>
            <button class="btn btn-icon btn-sm edit-order-btn" data-id="${order.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-icon btn-sm invoice-order-btn" data-id="${order.id}" title="Generate Invoice"><i class="fa-solid fa-receipt"></i></button>
            <button class="btn btn-icon btn-sm delete-order-btn" data-id="${order.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      `;
      liveGrid.appendChild(card);
    });
  }

  function renderDelivered(delivered) {
    deliveredBody.innerHTML = '';
    deliveredEmpty.classList.toggle('hidden', delivered.length !== 0);

    delivered.forEach((order) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>INV-${String(order.id).padStart(5, '0')}</td>
        <td>${order.Cust_Name || '-'}</td>
        <td>${formatTime(order.created_at)}</td>
        <td>${formatMoney(order.Total)}</td>
        <td><button class="btn btn-icon btn-sm print-order-btn" data-id="${order.id}" title="Print"><i class="fa-solid fa-print"></i></button></td>
      `;
      deliveredBody.appendChild(row);
    });
  }

  /* ---------------- Tabs ---------------- */
  document.querySelectorAll('.order-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.order-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      liveSection.classList.toggle('hidden', activeTab !== 'live');
      deliveredSection.classList.toggle('hidden', activeTab !== 'delivered');
    });
  });

  document.getElementById('refresh-orders-btn').addEventListener('click', loadOrders);

  /* ---------------- Modal helpers ----------------
     menuSelectorParentModalId lets openMenuSelector() (below) register a
     modal that should be hidden while the Menu Selector is open and
     automatically restored the moment the Menu Selector closes -- whether
     that's via "Add Selected Items" or Cancel/X. Centralizing the restore
     in closeModal() means both close paths behave identically without
     duplicating logic. */
  let menuSelectorParentModalId = null;

  function openModal(id) {
    document.getElementById(id).classList.add('show');
  }
  function closeModal(id) {
    document.getElementById(id).classList.remove('show');
    if (id === 'menu-selector-modal' && menuSelectorParentModalId) {
      const parentId = menuSelectorParentModalId;
      menuSelectorParentModalId = null;
      openModal(parentId);
    }
  }
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });

  /* ---------------- View order ---------------- */
  function viewOrder(orderId) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const items = order.order_items || [];
    const itemsRows = items.map((it) => `
      <tr>
        <td>${orderItemName(it)} <span class="text-muted">×${it.order_qty}</span></td>
        <td>${it.order_qty}</td>
        <td>${formatMoney(it.unit_price)}</td>
        <td>${formatMoney(it.unit_price * it.order_qty)}</td>
      </tr>
    `).join('');

    document.getElementById('view-order-body').innerHTML = `
      <div class="order-card-meta" style="margin-bottom:18px;">
        <div class="order-meta-item"><div class="order-meta-label">Customer</div><div>${order.Cust_Name || '-'}</div></div>
        <div class="order-meta-item"><div class="order-meta-label">Phone</div><div>${order.Phone || '-'}</div></div>
        <div class="order-meta-item"><div class="order-meta-label">Table</div><div>${order.Table_No || '-'}</div></div>
        <div class="order-meta-item"><div class="order-meta-label">Car No.</div><div>${order.Car_No || '-'}</div></div>
        <div class="order-meta-item"><div class="order-meta-label">Status</div><div><span class="badge ${statusBadgeClass(order.Status)}">${order.Status}</span></div></div>
        <div class="order-meta-item"><div class="order-meta-label">Payment</div><div><span class="badge ${paymentBadgeClass(order.Payment_Status)}">${order.Payment_Status || 'Pending'}</span></div></div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
          <tbody>${itemsRows || '<tr><td colspan="4">No items recorded.</td></tr>'}</tbody>
        </table>
      </div>
      <div class="cart-total-row cart-total-grand" style="margin-top:16px;">
        <span>Total</span><span>${formatMoney(order.Total)}</span>
      </div>
    `;
    openModal('view-order-modal');
  }

  /* ---------------- Edit order ---------------- */
  function editOrderModal(orderId) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    editOrderId = orderId;
    document.getElementById('edit-order-id').value = order.id;
    document.getElementById('edit-cust-name').value = order.Cust_Name || '';
    document.getElementById('edit-table-no').value = order.Table_No || '';
    document.getElementById('edit-car-no').value = order.Car_No || '';
    document.getElementById('edit-payment-type').value = order.Payment_Type || 'Offline';
    document.getElementById('edit-status').value = order.Status || 'Preparing';
    document.getElementById('edit-payment-status').value = order.Payment_Status || 'Pending';

    /* Seed the editable items cart from the order's current order_items.
       Each existing line keeps its own id/unit_price/qty so "Save Changes"
       can send back exactly what's on screen. */
    editOrderCart = {};
    (order.order_items || []).forEach((it, index) => {
      const menuItem = getMenuItem(it.item);
      const key = `existing-${it.id != null ? it.id : index}`;
      editOrderCart[key] = {
        itemId: it.item,
        name: menuItem ? menuItem.Item_Name : `Item #${it.item}`,
        unit_price: Number(it.unit_price),
        qty: it.order_qty
      };
    });
    renderEditOrderItems();

    openModal('edit-order-modal');
  }

  function getEditOrderTotal() {
    return Object.values(editOrderCart).reduce((sum, e) => sum + e.unit_price * e.qty, 0);
  }

  function renderEditOrderItems() {
    const listEl = document.getElementById('edit-order-items-list');
    const emptyEl = document.getElementById('edit-order-items-empty');
    const entries = Object.entries(editOrderCart);

    emptyEl.classList.toggle('hidden', entries.length !== 0);
    listEl.innerHTML = entries.map(([key, entry]) => `
      <div class="order-item-edit-row" data-key="${key}">
        <div class="order-item-edit-info">
          <div class="order-item-edit-name">${entry.name}</div>
          <div class="order-item-edit-price">${formatMoney(entry.unit_price)} x ${entry.qty} = ${formatMoney(entry.unit_price * entry.qty)}</div>
        </div>
        <div class="order-item-edit-actions">
          <div class="qty-stepper">
            <button type="button" class="edit-item-qty-minus" data-key="${key}"><i class="fa-solid fa-minus"></i></button>
            <span>${entry.qty}</span>
            <button type="button" class="edit-item-qty-plus" data-key="${key}"><i class="fa-solid fa-plus"></i></button>
          </div>
          <button type="button" class="btn btn-icon btn-sm edit-item-remove" data-key="${key}" title="Remove"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `).join('');

    const total = getEditOrderTotal();
    document.getElementById('edit-order-subtotal').textContent = formatMoney(total);
    document.getElementById('edit-order-grand-total').textContent = formatMoney(total);
  }

  document.getElementById('edit-order-items-list').addEventListener('click', (e) => {
    const plusBtn = e.target.closest('.edit-item-qty-plus');
    const minusBtn = e.target.closest('.edit-item-qty-minus');
    const removeBtn = e.target.closest('.edit-item-remove');

    if (plusBtn) {
      editOrderCart[plusBtn.dataset.key].qty += 1;
      renderEditOrderItems();
    }
    if (minusBtn) {
      const entry = editOrderCart[minusBtn.dataset.key];
      if (entry.qty <= 1) {
        delete editOrderCart[minusBtn.dataset.key];
      } else {
        entry.qty -= 1;
      }
      renderEditOrderItems();
    }
    if (removeBtn) {
      delete editOrderCart[removeBtn.dataset.key];
      renderEditOrderItems();
    }
  });

  /* "Add Item" reuses the same Menu Selector modal/component as Create Order.
     Passing 'edit-order-modal' as the parent makes the Menu Selector behave
     like a child dialog: Edit Order is hidden while it's open and reappears
     the instant the Menu Selector closes (Add Selected Items, Cancel, or X),
     so only one modal overlay is ever visible at a time. */
  document.getElementById('edit-add-item-btn').addEventListener('click', () => {
    openMenuSelector((selectedEntries) => {
      selectedEntries.forEach(({ item, qty }) => {
        /* If this menu item is already on the order, bump its quantity
           instead of adding a duplicate line. */
        const existingKey = Object.keys(editOrderCart).find((k) => editOrderCart[k].itemId === item.id);
        if (existingKey) {
          editOrderCart[existingKey].qty += qty;
        } else {
          editOrderCart[`new-${item.id}-${Date.now()}`] = {
            itemId: item.id,
            name: item.Item_Name,
            unit_price: Number(item.Item_Price),
            qty
          };
        }
      });
      renderEditOrderItems();
    }, 'edit-order-modal');
  });

  document.getElementById('edit-order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const orderId = document.getElementById('edit-order-id').value;

    const payload = {
      Cust_Name: document.getElementById('edit-cust-name').value.trim(),
      Table_No: document.getElementById('edit-table-no').value ? Number(document.getElementById('edit-table-no').value) : null,
      Car_No: document.getElementById('edit-car-no').value.trim(),
      Payment_Type: document.getElementById('edit-payment-type').value,
      Status: document.getElementById('edit-status').value,
      Payment_Status: document.getElementById('edit-payment-status').value,
      /* The update endpoint replaces every order item whenever `items` is
         present (see Order/services/order_service.py -> update_order), so
         we always send the full, current set of items from the modal. */
      items: Object.values(editOrderCart).map((entry) => ({
        item: entry.itemId,
        unit_price: entry.unit_price,
        order_qty: entry.qty
      }))
    };

    try {
      await API.editOrder(orderId, payload);
      Toast.success('Order updated successfully.');
      closeModal('edit-order-modal');
      await loadOrders();
    } catch (err) {
      /* toast already shown */
    }
  });

  /* ---------------- Shared menu picker ----------------
     Renders a searchable/filterable grid of available menu items with a
     qty stepper on each card, bound to whichever cart object is passed in.
     Used by both the New Order modal's inline menu and the Menu Selector
     modal opened from Edit Order -> Add Item, so the picking experience
     (and its markup/CSS) only needs to exist once. */
  function clearCart(cartObj) {
    Object.keys(cartObj).forEach((key) => delete cartObj[key]);
  }

  function createMenuPicker({ gridId, emptyId, searchId, categoryId, sizeFilterId, cart, onChange }) {
    const gridEl = document.getElementById(gridId);
    const emptyEl = document.getElementById(emptyId);
    const searchInput = document.getElementById(searchId);
    const categorySelect = document.getElementById(categoryId);
    const sizeFilterEl = sizeFilterId ? document.getElementById(sizeFilterId) : null;
    const sizeButtons = sizeFilterEl ? Array.from(sizeFilterEl.querySelectorAll('.size-filter-btn')) : [];

    let searchTerm = '';
    let categoryFilter = 'All';
    let sizeFilter = 'All';

    function buildCategoryOptions() {
      const categories = Array.from(new Set(menuItems.map((m) => m.Item_Category))).sort();
      categorySelect.innerHTML = '<option value="All">All Categories</option>';
      categories.forEach((cat) => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categorySelect.appendChild(opt);
      });
    }

    function getFiltered() {
      return menuItems.filter((item) => {
        if (!item.is_available) return false;
        const matchesCategory = categoryFilter === 'All' || item.Item_Category === categoryFilter;
        const matchesSearch = item.Item_Name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSize = sizeFilter === 'All' || item.Item_Size === sizeFilter;
        return matchesCategory && matchesSearch && matchesSize;
      });
    }

    function render() {
      const filtered = getFiltered();
      gridEl.innerHTML = '';
      emptyEl.classList.toggle('hidden', filtered.length !== 0);

      filtered.forEach((item) => {
        const qty = cart[item.id] ? cart[item.id].qty : 0;
        const card = document.createElement('div');
        card.className = 'order-menu-card';
        card.innerHTML = `
          <span class="order-menu-card-meta">${item.Item_Category} <span class="badge badge-size">${(item.Item_Size || '').toUpperCase()}</span></span>
          <div class="order-menu-card-name">${item.Item_Name}</div>
          <div class="order-menu-card-footer">
            <span class="order-menu-card-price">${formatMoney(item.Item_Price)}</span>
            <div class="qty-stepper">
              <button type="button" class="picker-qty-minus" data-id="${item.id}"><i class="fa-solid fa-minus"></i></button>
              <span>${qty}</span>
              <button type="button" class="picker-qty-plus" data-id="${item.id}"><i class="fa-solid fa-plus"></i></button>
            </div>
          </div>
        `;
        gridEl.appendChild(card);
      });
    }

    function changeQty(itemId, delta) {
      const item = menuItems.find((m) => m.id === itemId);
      if (!item) return;

      const current = cart[itemId] ? cart[itemId].qty : 0;
      const next = Math.max(0, current + delta);

      if (next === 0) delete cart[itemId];
      else cart[itemId] = { item, qty: next };

      render();
      if (onChange) onChange();
    }

    gridEl.addEventListener('click', (e) => {
      const plus = e.target.closest('.picker-qty-plus');
      const minus = e.target.closest('.picker-qty-minus');
      if (plus) changeQty(Number(plus.dataset.id), 1);
      if (minus) changeQty(Number(minus.dataset.id), -1);
    });

    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        searchTerm = searchInput.value.trim();
        render();
      }, 200);
    });

    categorySelect.addEventListener('change', () => {
      categoryFilter = categorySelect.value;
      render();
    });

    /* Segmented Half / Full size filter, only wired up when this picker
       instance was given a sizeFilterId (both New Order and the Menu
       Selector pass one; any future picker can opt out). */
    function setSizeFilter(value) {
      sizeFilter = value;
      sizeButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.size === value));
      render();
    }

    sizeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setSizeFilter(btn.dataset.size));
    });

    return {
      /** Rebuilds category options + resets filters, then renders. Call
          every time the modal that owns this picker is (re)opened. */
      refresh() {
        buildCategoryOptions();
        searchTerm = '';
        categoryFilter = 'All';
        sizeFilter = 'All';
        searchInput.value = '';
        categorySelect.value = 'All';
        sizeButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.size === 'All'));
        render();
      },
      render
    };
  }

  const newOrderMenuPicker = createMenuPicker({
    gridId: 'new-order-menu-grid',
    emptyId: 'new-order-menu-empty',
    searchId: 'new-order-menu-search',
    categoryId: 'new-order-menu-category',
    sizeFilterId: 'new-order-size-filter',
    cart: newOrderCart,
    onChange: updateNewOrderTotals
  });

  const selectorMenuPicker = createMenuPicker({
    gridId: 'selector-menu-grid',
    emptyId: 'selector-menu-empty',
    searchId: 'selector-menu-search',
    categoryId: 'selector-menu-category',
    sizeFilterId: 'selector-size-filter',
    cart: selectorCart
  });

  /* ---------------- New Order ---------------- */
  function updateNewOrderTotals() {
    const total = Object.values(newOrderCart).reduce((sum, e) => sum + Number(e.item.Item_Price) * e.qty, 0);
    document.getElementById('new-order-subtotal').textContent = formatMoney(total);
    document.getElementById('new-order-grand-total').textContent = formatMoney(total);
  }

  async function openNewOrderModal() {
    document.getElementById('new-order-form').reset();
    clearCart(newOrderCart);
    newOrderType = 'Dine In';
    document.querySelectorAll('.order-type-toggle .payment-option').forEach((b) => {
      b.classList.toggle('active', b.dataset.orderType === 'Dine In');
    });
    await ensureMenuLoaded();
    newOrderMenuPicker.refresh();
    updateNewOrderTotals();
    openModal('new-order-modal');
  }

  document.getElementById('new-order-btn').addEventListener('click', openNewOrderModal);

  document.querySelectorAll('.order-type-toggle .payment-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.order-type-toggle .payment-option').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      newOrderType = btn.dataset.orderType;
      /* NOTE: the Order model has no Order_Type field (see Order/models/order.py),
         so this selection currently only decides which of Table No. / Car No.
         make sense to fill in on this screen — it isn't persisted on its own.
         TODO: once the backend adds an Order_Type field, send it here. */
    });
  });

  document.getElementById('new-order-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const entries = Object.values(newOrderCart);
    if (entries.length === 0) {
      Toast.error('Add at least one menu item to the order.');
      return;
    }

    const custName = document.getElementById('new-cust-name').value.trim();
    if (!custName) {
      Toast.error('Please enter the customer name.');
      return;
    }

    const tableNo = document.getElementById('new-table-no').value;
    const carNo = document.getElementById('new-car-no').value.trim();
    const total = Object.values(newOrderCart).reduce((sum, e2) => sum + Number(e2.item.Item_Price) * e2.qty, 0);

    const payload = {
      Cust_Name: custName,
      Phone: document.getElementById('new-phone').value.trim() || null,
      Table_No: tableNo ? Number(tableNo) : null,
      Car_No: carNo || null,
      Source: 'Owner',
      Status: document.getElementById('new-order-status').value,
      Payment_Status: document.getElementById('new-payment-status').value,
      Payment_Type: document.getElementById('new-payment-type').value,
      Total: total.toFixed(2),
      items: entries.map(({ item, qty }) => ({
        item: item.id,
        unit_price: item.Item_Price,
        order_qty: qty
      }))
    };

    try {
      const response = await API.createOrder(payload);
      const orderId = response.order && response.order.id ? response.order.id : '';
      Toast.success(`Order #${orderId} created successfully.`);
      closeModal('new-order-modal');
      await loadOrders();
    } catch (err) {
      /* toast already shown */
    }
  });

  /* ---------------- Menu Selector modal (Edit Order -> Add Item) ---------------- */
  let menuSelectorConfirmCallback = null;

  async function openMenuSelector(onConfirm, parentModalId = null) {
    menuSelectorConfirmCallback = onConfirm;
    menuSelectorParentModalId = parentModalId;
    clearCart(selectorCart);
    await ensureMenuLoaded();
    if (parentModalId) closeModal(parentModalId);
    selectorMenuPicker.refresh();
    openModal('menu-selector-modal');
  }

  document.getElementById('selector-add-btn').addEventListener('click', () => {
    const entries = Object.values(selectorCart);
    if (entries.length === 0) {
      Toast.error('Select at least one item to add.');
      return;
    }
    if (menuSelectorConfirmCallback) menuSelectorConfirmCallback(entries);
    closeModal('menu-selector-modal');
  });

  /* ---------------- Delete order ---------------- */
  function confirmDelete(orderId) {
    pendingDeleteId = orderId;
    document.getElementById('delete-order-id').textContent = `#${orderId}`;
    openModal('delete-order-modal');
  }

  document.getElementById('confirm-delete-order-btn').addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    try {
      await API.deleteOrder(pendingDeleteId);
      Toast.success('Order deleted successfully.');
      closeModal('delete-order-modal');
      orders = orders.filter((o) => o.id !== pendingDeleteId);
      pendingDeleteId = null;
      render();
    } catch (err) {
      /* toast already shown */
    }
  });

  /* ---------------- Generate invoice (moves order to Delivered) ---------------- */
  async function generateInvoice(orderId) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    try {
      const response = await API.editOrder(orderId, { Status: 'Delivered', Bill_Printed: true });
      Toast.success('Invoice generated. Order moved to Delivered.');

      /* Update local state without a refresh */
      const updated = response.order;
      orders = orders.map((o) => (o.id === orderId ? updated : o));
      render();

      showReceipt(updated);
    } catch (err) {
      /* toast already shown */
    }
  }

  /* ---------------- Receipt (built entirely on the frontend) ---------------- */
  function buildReceiptHTML(order) {
    const items = order.order_items || [];
    const itemRows = items.map((it) => `
      <div class="receipt-row">
        <span>${it.order_qty} x ${orderItemName(it)}</span>
        <span>${formatMoney(it.unit_price * it.order_qty)}</span>
      </div>
    `).join('');

    return `
      <div class="receipt-center">
        <div class="receipt-title">AOne Chicken</div>
        <div>Rajpura</div>
        <div>+91XXXXXXXXXX</div>
      </div>
      <hr />
      <div class="receipt-row"><span>Invoice</span><span>INV-${String(order.id).padStart(5, '0')}</span></div>
      <div class="receipt-row"><span>Date</span><span>${formatTime(order.created_at)}</span></div>
      <div class="receipt-row"><span>Customer</span><span>${order.Cust_Name || '-'}</span></div>
      ${order.Table_No ? `<div class="receipt-row"><span>Table</span><span>${order.Table_No}</span></div>` : ''}
      ${order.Car_No ? `<div class="receipt-row"><span>Car No.</span><span>${order.Car_No}</span></div>` : ''}
      <hr />
      ${itemRows || '<div class="receipt-row"><span>No items recorded</span></div>'}
      <hr />
      <div class="receipt-row receipt-total-row"><span>Total</span><span>${formatMoney(order.Total)}</span></div>
      <div class="receipt-row"><span>Payment</span><span>${order.Payment_Type || '-'} (${order.Payment_Status || 'Pending'})</span></div>
      <hr />
      <div class="receipt-center">Thank you for ordering with us!</div>
    `;
  }

  function showReceipt(order) {
    document.getElementById('receipt-content').innerHTML = buildReceiptHTML(order);
    openModal('receipt-modal');
  }

  document.getElementById('print-receipt-btn').addEventListener('click', () => {
    window.print();
  });

  /* ---------------- Event delegation for order actions ---------------- */
  document.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('.view-order-btn');
    const editBtn = e.target.closest('.edit-order-btn');
    const invoiceBtn = e.target.closest('.invoice-order-btn');
    const deleteBtn = e.target.closest('.delete-order-btn');
    const printBtn = e.target.closest('.print-order-btn');

    if (viewBtn) viewOrder(Number(viewBtn.dataset.id));
    if (editBtn) editOrderModal(Number(editBtn.dataset.id));
    if (invoiceBtn) generateInvoice(Number(invoiceBtn.dataset.id));
    if (deleteBtn) confirmDelete(Number(deleteBtn.dataset.id));
    if (printBtn) {
      const order = orders.find((o) => o.id === Number(printBtn.dataset.id));
      if (order) showReceipt(order);
    }
  });

  /* Menu items are needed for item-name lookups (Order Details, receipts)
     and for the New Order / Add Item pickers, so load them alongside the
     order list itself. */
  loadMenu();
  loadOrders();
});