/* ============================================================
   STAFF.JS
   Owner Staff Management page: list, search, filter, paginate,
   create/view/edit/delete staff accounts.

   NOTE ON BACKEND LIMITATIONS (see Accounts/serializer/staff_serialzer.py):
   - `Role` is a read_only field on the backend StaffSerializer, so the
     Manager/Cashier/Kitchen/Waiter selection made here is not currently
     persisted server-side (every created account defaults to "Staff").
   - The Account model / StaffSerializer does not expose an `Email`
     field, so the Email input below is not currently persisted either.
   These values are still collected and sent (harmless extra keys are
   ignored by DRF) so the UI is ready the moment the backend adds
   support, per the "leave a TODO instead of inventing an endpoint" rule.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  Shell.init();

  const PAGE_SIZE = 8;

  let staff = [];
  let searchTerm = '';
  let roleFilter = 'All';
  let statusFilter = 'All';
  let currentPage = 1;
  let pendingDeleteId = null;
  let editingId = null;

  const tableBody = document.getElementById('staff-table-body');
  const tableEmpty = document.getElementById('staff-table-empty');
  const searchInput = document.getElementById('staff-search-input');
  const roleSelect = document.getElementById('staff-role-filter');
  const statusSelect = document.getElementById('staff-status-filter');

  const paginationInfo = document.getElementById('staff-pagination-info');
  const paginationControls = document.getElementById('staff-pagination-controls');

  const staffModal = document.getElementById('staff-modal');
  const staffForm = document.getElementById('staff-form');
  const staffModalTitle = document.getElementById('staff-modal-title');
  const createOnlyRow = document.getElementById('staff-create-only-row');
  const statusRow = document.getElementById('staff-status-row');

  /* ---------------- Helpers ---------------- */
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function initials(name) {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  }

  function statusBadge(isActive) {
    return isActive
      ? '<span class="badge badge-success">Active</span>'
      : '<span class="badge badge-danger">Inactive</span>';
  }

  /* ---------------- Load staff ---------------- */
  async function loadStaff() {
    try {
      const response = await API.getStaffList();
      staff = response.staff || [];
      currentPage = 1;
      render();
    } catch (err) {
      /* toast already shown */
    }
  }

  function getFiltered() {
    return staff.filter((s) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        (s.Name || '').toLowerCase().includes(term) ||
        (s.username || '').toLowerCase().includes(term) ||
        (s.Phone_No || '').toLowerCase().includes(term);

      const matchesRole = roleFilter === 'All' || s.Role === roleFilter;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && s.is_active) ||
        (statusFilter === 'Inactive' && !s.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  function render() {
    const filtered = getFiltered();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    tableBody.innerHTML = '';
    tableEmpty.classList.toggle('hidden', filtered.length !== 0);

    pageItems.forEach((s) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div class="staff-name-wrap">
            <div class="staff-avatar">${initials(s.Name)}</div>
            <span class="staff-name-cell">${s.Name || '-'}</span>
          </div>
        </td>
        <td>${s.username || '-'}</td>
        <td>${s.Phone_No || '-'}</td>
        <td><span class="badge badge-info">${s.Role || 'Staff'}</span></td>
        <td>${statusBadge(s.is_active)}</td>
        <td>${formatDate(s.created_at)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-icon btn-sm view-staff-btn" data-id="${s.id}" title="View"><i class="fa-solid fa-eye"></i></button>
            <button class="btn btn-icon btn-sm edit-staff-btn" data-id="${s.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-icon btn-sm delete-staff-btn" data-id="${s.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    });

    renderPagination(filtered.length, totalPages);
  }

  function renderPagination(totalItems, totalPages) {
    if (totalItems === 0) {
      paginationInfo.textContent = '';
      paginationControls.innerHTML = '';
      return;
    }

    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, totalItems);
    paginationInfo.textContent = `Showing ${start}-${end} of ${totalItems} staff members`;

    let html = `<button class="pagination-btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>`;
    for (let p = 1; p <= totalPages; p++) {
      html += `<button class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }
    html += `<button class="pagination-btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>`;

    paginationControls.innerHTML = html;
  }

  paginationControls.addEventListener('click', (e) => {
    const btn = e.target.closest('.pagination-btn');
    if (!btn || btn.disabled) return;

    const page = btn.dataset.page;
    if (page === 'prev') currentPage -= 1;
    else if (page === 'next') currentPage += 1;
    else currentPage = Number(page);

    render();
  });

  /* ---------------- Search / filters ---------------- */
  let searchDebounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      searchTerm = searchInput.value.trim();
      currentPage = 1;
      render();
    }, 200);
  });

  roleSelect.addEventListener('change', () => {
    roleFilter = roleSelect.value;
    currentPage = 1;
    render();
  });

  statusSelect.addEventListener('change', () => {
    statusFilter = statusSelect.value;
    currentPage = 1;
    render();
  });

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

  /* ---------------- View staff ---------------- */
  function viewStaff(staffId) {
    const s = staff.find((x) => x.id === staffId);
    if (!s) return;

    document.getElementById('view-staff-body').innerHTML = `
      <div class="order-card-meta">
        <div class="order-meta-item"><div class="order-meta-label">Full Name</div><div>${s.Name || '-'}</div></div>
        <div class="order-meta-item"><div class="order-meta-label">Username</div><div>${s.username || '-'}</div></div>
        <div class="order-meta-item"><div class="order-meta-label">Phone</div><div>${s.Phone_No || '-'}</div></div>
        <div class="order-meta-item"><div class="order-meta-label">Role</div><div><span class="badge badge-info">${s.Role || 'Staff'}</span></div></div>
        <div class="order-meta-item"><div class="order-meta-label">Status</div><div>${statusBadge(s.is_active)}</div></div>
        <div class="order-meta-item"><div class="order-meta-label">Date Joined</div><div>${formatDate(s.created_at)}</div></div>
      </div>
    `;
    openModal('view-staff-modal');
  }

  /* ---------------- Create / Edit staff ---------------- */
  function openCreateModal() {
    editingId = null;
    staffModalTitle.textContent = 'New Staff';
    staffForm.reset();
    document.getElementById('staff-id').value = '';
    createOnlyRow.classList.remove('hidden');
    statusRow.classList.add('hidden');
    document.getElementById('staff-username').required = true;
    document.getElementById('staff-password').required = true;
    openModal('staff-modal');
  }

  function openEditModal(staffId) {
    const s = staff.find((x) => x.id === staffId);
    if (!s) return;

    editingId = staffId;
    staffModalTitle.textContent = 'Edit Staff';
    document.getElementById('staff-id').value = s.id;
    document.getElementById('staff-name').value = s.Name || '';
    document.getElementById('staff-phone').value = s.Phone_No || '';
    document.getElementById('staff-email').value = s.email || '';
    document.getElementById('staff-role').value = s.Role || 'Manager';
    document.getElementById('staff-status').value = String(Boolean(s.is_active));

    /* Username + password are not editable here per spec. */
    createOnlyRow.classList.add('hidden');
    document.getElementById('staff-username').required = false;
    document.getElementById('staff-password').required = false;
    statusRow.classList.remove('hidden');

    openModal('staff-modal');
  }

  document.getElementById('add-staff-btn').addEventListener('click', openCreateModal);

  staffForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('staff-name').value.trim();
    const phone = document.getElementById('staff-phone').value.trim();
    const email = document.getElementById('staff-email').value.trim();
    const role = document.getElementById('staff-role').value;

    try {
      if (editingId) {
        const payload = {
          Name: name,
          Phone_No: phone,
          email, // TODO: not yet persisted server-side, see file header note.
          Role: role, // TODO: read-only on backend today, see file header note.
          is_active: document.getElementById('staff-status').value === 'true'
        };
        await API.updateStaff(editingId, payload);
        Toast.success('Staff updated successfully.');
      } else {
        const username = document.getElementById('staff-username').value.trim();
        const password = document.getElementById('staff-password').value;
        const payload = {
          username,
          password,
          Name: name,
          Phone_No: phone,
          email, // TODO: not yet persisted server-side, see file header note.
          Role: role // TODO: read-only on backend today, see file header note.
        };
        await API.createStaff(payload);
        Toast.success('Staff created successfully.');
      }
      closeModal('staff-modal');
      await loadStaff();
    } catch (err) {
      /* toast already shown */
    }
  });

  /* ---------------- Delete staff ---------------- */
  function confirmDelete(staffId) {
    const s = staff.find((x) => x.id === staffId);
    if (!s) return;

    pendingDeleteId = staffId;
    document.getElementById('delete-staff-name').textContent = s.Name || `#${staffId}`;
    openModal('delete-staff-modal');
  }

  document.getElementById('confirm-delete-staff-btn').addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    try {
      await API.deleteStaff(pendingDeleteId);
      Toast.success('Staff deleted successfully.');
      closeModal('delete-staff-modal');
      staff = staff.filter((s) => s.id !== pendingDeleteId);
      pendingDeleteId = null;
      render();
    } catch (err) {
      /* toast already shown */
    }
  });

  /* ---------------- Event delegation ---------------- */
  tableBody.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('.view-staff-btn');
    const editBtn = e.target.closest('.edit-staff-btn');
    const deleteBtn = e.target.closest('.delete-staff-btn');

    if (viewBtn) viewStaff(Number(viewBtn.dataset.id));
    if (editBtn) openEditModal(Number(editBtn.dataset.id));
    if (deleteBtn) confirmDelete(Number(deleteBtn.dataset.id));
  });

  loadStaff();
});
