/* ============================================================
   AUTH.JS
   Handles JWT storage in localStorage and route guarding.
   Loaded on every page, right after api.js.
   ============================================================ */

const Auth = (() => {
  const ACCESS_KEY = 'pos_access_token';
  const REFRESH_KEY = 'pos_refresh_token';
  const USER_KEY = 'pos_user';

  function saveSession(access, refresh, user) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(USER_KEY, JSON.stringify(user || {}));
  }

  function getAccessToken() {
    return localStorage.getItem(ACCESS_KEY);
  }

  function getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY);
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY)) || null;
    } catch (e) {
      return null;
    }
  }

  function isAuthenticated() {
    return Boolean(getAccessToken());
  }

  function logout(redirect = true) {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    if (redirect) window.location.href = 'login.html';
  }

  /** Call at the top of owner-only pages (dashboard, menu, analytics). */
  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.href = 'login.html';
    }
  }

  /** Call at the top of login/register pages so a logged-in owner skips them. */
  function redirectIfAuthenticated() {
    if (isAuthenticated()) {
      window.location.href = 'dashboard.html';
    }
  }

  return {
    saveSession,
    getAccessToken,
    getRefreshToken,
    getUser,
    isAuthenticated,
    logout,
    requireAuth,
    redirectIfAuthenticated
  };
})();

/* ------------------------------------------------------------
   Shell
   Wires up the owner app-shell markup (sidebar + topbar) that
   dashboard.html, menu.html and analytics.html all share, so
   this logic is written once instead of duplicated per page.
   ------------------------------------------------------------ */
const Shell = (() => {
  function renderUser() {
    const user = Auth.getUser();
    if (!user) return;

    const nameEl = document.getElementById('topbar-user-name');
    const avatarEl = document.getElementById('topbar-avatar');

    if (nameEl) nameEl.textContent = user.name || user.username || 'Owner';
    if (avatarEl) avatarEl.textContent = (user.name || user.username || 'O').charAt(0).toUpperCase();
  }

  function renderDate() {
    const dateEl = document.getElementById('topbar-date');
    if (!dateEl) return;

    dateEl.textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function wireSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const openBtn = document.getElementById('sidebar-toggle');
    const closeBtn = document.getElementById('sidebar-close');

    function open() {
      sidebar.classList.add('open');
      overlay.classList.add('show');
    }
    function close() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    }

    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay) overlay.addEventListener('click', close);
  }

  function wireLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', () => {
      Auth.logout();
    });
  }

  function highlightActiveLink() {
    const current = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('.sidebar-link[data-page]').forEach((link) => {
      link.classList.toggle('active', link.dataset.page === current);
    });
  }

  /** Runs every shared behaviour. Call once per owner page after Auth.requireAuth(). */
  function init() {
    renderUser();
    renderDate();
    wireSidebarToggle();
    wireLogout();
    highlightActiveLink();
  }

  return { init, renderUser, renderDate };
})();
