/* ============================================================
   API.JS
   Single source of truth for every backend call.
   No other file in this project should call fetch() directly.
   Depends on: nothing (loaded first). Auth.js reads/writes the
   tokens that this file attaches to requests.
   ============================================================ */

/* Change this once to point the whole app at a different backend. */
const BASE_URL = window.POS_BASE_URL || 'https://140.238.243.196';

/* ------------------------------------------------------------
   Toast notifications
   ------------------------------------------------------------ */
const Toast = (() => {
  function ensureContainer() {
    let el = document.getElementById('toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast-container';
      document.body.appendChild(el);
    }
    return el;
  }

  function show(message, type = 'info', duration = 4000) {
    const container = ensureContainer();
    const icons = {
      success: 'fa-circle-check',
      error: 'fa-circle-exclamation',
      info: 'fa-circle-info'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fa-solid ${icons[type] || icons.info}"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  return {
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error'),
    info: (msg) => show(msg, 'info')
  };
})();

/* ------------------------------------------------------------
   Global loading spinner + button-disable helper
   ------------------------------------------------------------ */
const Loader = (() => {
  let activeRequests = 0;

  function ensureEl() {
    let el = document.getElementById('global-loader');
    if (!el) {
      el = document.createElement('div');
      el.id = 'global-loader';
      el.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(el);
    }
    return el;
  }

  function show() {
    activeRequests++;
    ensureEl().classList.add('show');
    document.querySelectorAll('[data-loading-disable]').forEach((btn) => {
      btn.disabled = true;
    });
  }

  function hide() {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) {
      const el = document.getElementById('global-loader');
      if (el) el.classList.remove('show');
      document.querySelectorAll('[data-loading-disable]').forEach((btn) => {
        btn.disabled = false;
      });
    }
  }

  return { show, hide };
})();

/* ------------------------------------------------------------
   Core request wrapper
   ------------------------------------------------------------ */
const API = (() => {
  /** Flattens DRF-style error payloads into a single readable string. */
  function extractErrorMessage(data) {
    if (!data) return 'Something went wrong. Please try again.';
    if (typeof data === 'string') return data;
    if (data.detail) return data.detail;
    if (data.message) return data.message;

    const parts = [];
    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (Array.isArray(value)) {
        parts.push(`${key}: ${value.join(' ')}`);
      } else if (typeof value === 'string') {
        parts.push(`${key}: ${value}`);
      }
    });
    return parts.length ? parts.join(' | ') : 'Something went wrong. Please try again.';
  }

  /**
   * @param {string} endpoint - path starting with '/'
   * @param {object} options
   *   method: HTTP method
   *   body: JS object to send as JSON
   *   auth: whether to attach the JWT access token (default true)
   *   silent: suppress the global loader (default false)
   *   rawResponse: return the Response object as-is (used for HTML report endpoints)
   */
  async function request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      auth = true,
      silent = false,
      rawResponse = false
    } = options;

    if (!silent) Loader.show();

    const headers = { Accept: 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';

    if (auth) {
      const token = Auth.getAccessToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      if (res.status === 401) {
        Auth.logout(false);
        Toast.error('Your session has expired. Please log in again.');
        window.location.href = 'login.html';
        throw new Error('Unauthorized');
      }

      if (rawResponse) {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res;
      }

      let data = null;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = null;
      }

      if (!res.ok) {
        const message = extractErrorMessage(data);
        Toast.error(message);
        throw new Error(message);
      }

      return data;
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        Toast.error('Cannot reach the server. Check your connection and try again.');
      }
      throw err;
    } finally {
      if (!silent) Loader.hide();
    }
  }

  return {
    /* ---------------- Auth ---------------- */
    login: (username, password) =>
      request('/accounts/login/', { method: 'POST', body: { username, password }, auth: false }),

    register: (payload) =>
      request('/accounts/register/', { method: 'POST', body: payload, auth: false }),

    /* ---------------- Staff (Owner only) ---------------- */
    createStaff: (payload) =>
      request('/accounts/create_staff/', { method: 'POST', body: payload }),

    updateStaff: (userId, payload) =>
      request(`/accounts/update_staff/${userId}/`, { method: 'PATCH', body: payload }),

    getStaffDetail: (userId) =>
      request(`/accounts/staff_detail/${userId}/`),

    getStaffList: () =>
      request('/accounts/staff_list/'),

    deleteStaff: (userId) =>
      request(`/accounts/delete_staff/${userId}/`, { method: 'DELETE' }),

    /* ---------------- Orders ---------------- */
    createOrder: (payload) =>
      request('/order/create_order/', { method: 'POST', body: payload, auth: false }),

    editOrder: (orderId, payload, options = {}) =>
      request(`/order/edit_order/${orderId}/`, {
          method: 'PATCH',
          body: payload,
          silent: options.silent || false
      }),

    deleteOrder: (orderId) =>
      request(`/order/delete_order/${orderId}/`, { method: 'DELETE' }),

    getOrders: () =>
      request('/order/get_order/'),

    getOrderDetails: (orderId) =>
      request(`/order/order_details/${orderId}/`),

    /* Backend is the single source of truth for the invoice: it builds the
       invoice data, renders invoice.html, applies the invoice CSS and
       converts it to a PDF. This endpoint now returns application/pdf
       (it used to return text/html), so we read the response as a Blob
       instead of text. The frontend never parses, rebuilds or styles this
       PDF - it only requests it, displays/prints it, and discards it. */
    fetchInvoicePDF: (orderId) =>
      request(`/order/print_invoice/${orderId}/`, { rawResponse: true }).then((res) => res.blob()),

    /* ---------------- Menu ---------------- */
    getMenu: () =>
      request('/menu/get_menu/', { auth: false }),

    createMenuItem: (payload) =>
      request('/menu/create_item/', { method: 'POST', body: payload }),

    updateMenuItem: (itemId, payload) =>
      request(`/menu/edit_item/${itemId}/`, { method: 'PATCH', body: payload }),

    deleteMenuItem: (itemId) =>
      request(`/menu/delete_item/${itemId}/`, { method: 'DELETE' }),

    /* ---------------- Analytics ---------------- */
    getAnalytics: () =>
      request('/analytics/daily_analytics/'),

    /* Weekly / monthly reports are rendered server-side as full HTML
       pages (charts + tables already built by Django). We fetch them as
       HTML and present them inside the app (iframe) so print/download
       still works without duplicating backend chart logic. */
    getWeeklyReport: () =>
      request('/analytics/weekly_report/', { rawResponse: true }).then((res) => res.text()),

    getMonthlyReport: () =>
      request('/analytics/monthly_report/', { rawResponse: true }).then((res) => res.text())
  };
})();