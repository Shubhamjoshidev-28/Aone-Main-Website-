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

  /* ---------------- Modal helpers ---------------- */
  function openModal(id) {
    document.getElementById(id).classList.add('show');
  }
  function closeModal(id) {
    document.getElementById(id).classList.remove('show');
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
        <td>Item #${it.item}</td>
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

    document.getElementById('edit-order-id').value = order.id;
    document.getElementById('edit-cust-name').value = order.Cust_Name || '';
    document.getElementById('edit-table-no').value = order.Table_No || '';
    document.getElementById('edit-car-no').value = order.Car_No || '';
    document.getElementById('edit-payment-type').value = order.Payment_Type || 'Offline';
    document.getElementById('edit-status').value = order.Status || 'Preparing';
    document.getElementById('edit-payment-status').value = order.Payment_Status || 'Pending';

    openModal('edit-order-modal');
  }

  document.getElementById('edit-order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const orderId = document.getElementById('edit-order-id').value;

    const payload = {
      Cust_Name: document.getElementById('edit-cust-name').value.trim(),
      Table_No: document.getElementById('edit-table-no').value ? Number(document.getElementById('edit-table-no').value) : null,
      Car_No: document.getElementById('edit-car-no').value.trim(),
      Payment_Type: document.getElementById('edit-payment-type').value,
      Status: document.getElementById('edit-status').value,
      Payment_Status: document.getElementById('edit-payment-status').value
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
        <span>${it.order_qty} x Item #${it.item}</span>
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

  loadOrders();
});
