/* ============================================================
   ANALYTICS.JS
   Owner analytics page: summary cards, Chart.js charts built
   from live order data, and weekly/monthly report viewing.
   Reports are rendered server-side as full HTML pages, so we
   fetch them once, cache the HTML, and present them inside an
   iframe with working Print/Download actions.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  Shell.init();

  let cachedWeeklyHTML = null;
  let cachedMonthlyHTML = null;
  const notificationQueue = [];

  /* ---------------- Summary cards ---------------- */
  async function loadDashboard() {
    try {
      const [analyticsRes, ordersRes] = await Promise.all([
        API.getAnalytics(),
        API.getOrders()
      ]);

      const dashboard = analyticsRes.dashboard || {};
      document.getElementById('stat-revenue').textContent = `Rs.${Number(dashboard.today_revenue || 0).toFixed(2)}`;
      document.getElementById('stat-orders').textContent = dashboard.today_orders || 0;
      document.getElementById('stat-best-seller').textContent =
        dashboard.best_seller && dashboard.best_seller.item_name ? dashboard.best_seller.item_name : 'No sales yet';

      const orders = ordersRes.order || [];
      renderUnitsSoldToday(orders);
      renderCharts(orders);
    } catch (err) {
      /* toast already shown */
    }
  }

  function isToday(dateStr) {
    const d = new Date(dateStr);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }

  function renderUnitsSoldToday(orders) {
    let units = 0;
    orders.filter((o) => isToday(o.created_at)).forEach((o) => {
      (o.order_items || []).forEach((item) => {
        units += item.order_qty;
      });
    });
    document.getElementById('stat-units').textContent = units;
  }

  /* ---------------- Charts (last 7 days, built from live order data) ---------------- */
  function renderCharts(orders) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }

    const labels = days.map((d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }));
    const revenueByDay = days.map((d) =>
      orders
        .filter((o) => new Date(o.created_at).toDateString() === d.toDateString())
        .reduce((sum, o) => sum + Number(o.Total || 0), 0)
    );
    const ordersByDay = days.map((d) =>
      orders.filter((o) => new Date(o.created_at).toDateString() === d.toDateString()).length
    );

    new Chart(document.getElementById('revenue-chart'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue (Rs.)',
          data: revenueByDay,
          borderColor: '#C1121F',
          backgroundColor: 'rgba(193, 18, 31, 0.1)',
          tension: 0.35,
          fill: true,
          pointBackgroundColor: '#C1121F'
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    new Chart(document.getElementById('orders-chart'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Orders',
          data: ordersByDay,
          backgroundColor: ['#C1121F', '#D94452', '#E17984', '#1D6FBF', '#1E8E5A', '#C77700', '#9E0E19'],
          borderRadius: 8
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  /* ---------------- Weekly / Monthly reports ---------------- */
  async function checkReports() {
    try {
      cachedWeeklyHTML = await API.getWeeklyReport();
      document.getElementById('view-weekly-report-btn').disabled = false;
      notificationQueue.push({
        title: 'Weekly Report Ready',
        text: 'Your last 7 days sales report has been generated.',
        type: 'weekly'
      });
    } catch (err) {
      /* Weekly report not available yet - leave button disabled */
    }

    try {
      cachedMonthlyHTML = await API.getMonthlyReport();
      document.getElementById('view-monthly-report-btn').disabled = false;
      notificationQueue.push({
        title: 'Monthly Report Ready',
        text: 'Your monthly sales report has been generated.',
        type: 'monthly'
      });
    } catch (err) {
      /* Monthly report not available yet - leave button disabled */
    }

    showNextNotification();
  }

  function showNextNotification() {
    const dot = document.getElementById('notification-dot');
    if (notificationQueue.length === 0) return;

    dot.classList.add('show');

    const next = notificationQueue[0];
    document.getElementById('report-notification-title').textContent = next.title;
    document.getElementById('report-notification-text').textContent = next.text;
    document.getElementById('report-notification-modal').classList.add('show');
    document.getElementById('report-notification-modal').dataset.reportType = next.type;
  }

  document.getElementById('report-notification-dismiss').addEventListener('click', () => {
    notificationQueue.shift();
    document.getElementById('report-notification-modal').classList.remove('show');
    setTimeout(showNextNotification, 300);
  });

  document.getElementById('report-notification-view').addEventListener('click', () => {
    const type = document.getElementById('report-notification-modal').dataset.reportType;
    notificationQueue.shift();
    document.getElementById('report-notification-modal').classList.remove('show');
    openReportViewer(type);
  });

  document.getElementById('notification-bell').addEventListener('click', () => {
    document.getElementById('notification-dot').classList.remove('show');
    if (notificationQueue.length > 0) {
      document.getElementById('report-notification-modal').classList.add('show');
    } else {
      Toast.info('No new notifications.');
    }
  });

  /* ---------------- Report viewer (iframe + print + download) ---------------- */
  function openReportViewer(type) {
    const html = type === 'weekly' ? cachedWeeklyHTML : cachedMonthlyHTML;
    if (!html) {
      Toast.error('Report is not available yet.');
      return;
    }

    document.getElementById('report-viewer-title').textContent = type === 'weekly' ? 'Weekly Report' : 'Monthly Report';

    const frame = document.getElementById('report-frame');
    frame.srcdoc = html;
    frame.dataset.reportType = type;

    document.getElementById('report-viewer-modal').classList.add('show');
  }

  document.getElementById('view-weekly-report-btn').addEventListener('click', () => openReportViewer('weekly'));
  document.getElementById('view-monthly-report-btn').addEventListener('click', () => openReportViewer('monthly'));

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.closeModal).classList.remove('show');
    });
  });

  document.getElementById('print-report-btn').addEventListener('click', () => {
    const frame = document.getElementById('report-frame');
    frame.contentWindow.focus();
    frame.contentWindow.print();
  });

  document.getElementById('download-report-btn').addEventListener('click', () => {
    const frame = document.getElementById('report-frame');
    const type = frame.dataset.reportType;
    const html = type === 'weekly' ? cachedWeeklyHTML : cachedMonthlyHTML;
    if (!html) return;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  loadDashboard();
  checkReports();
});
