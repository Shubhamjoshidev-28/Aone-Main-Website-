/* ============================================================
   MENU.JS
   Owner menu management: list, search, filter, create, edit,
   delete menu items.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  Shell.init();

  let menuItems = [];
  let searchTerm = '';
  let categoryFilter = 'All';
  let pendingDeleteId = null;

  const tableBody = document.getElementById('menu-table-body');
  const tableEmpty = document.getElementById('menu-table-empty');
  const searchInput = document.getElementById('menu-search-input');
  const categorySelect = document.getElementById('menu-category-filter');

  const itemModal = document.getElementById('item-modal');
  const itemForm = document.getElementById('item-form');
  const itemModalTitle = document.getElementById('item-modal-title');

  /* ---------------- Load menu ---------------- */
  async function loadMenu() {
    try {
      const response = await API.getMenu();
      menuItems = response.menu || [];
      buildCategoryOptions();
      render();
    } catch (err) {
      /* toast already shown */
    }
  }

  function buildCategoryOptions() {
    const categories = Array.from(new Set(menuItems.map((i) => i.Item_Category))).sort();
    const current = categorySelect.value;

    categorySelect.innerHTML = '<option value="All">All Categories</option>';
    categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });
    categorySelect.value = current || 'All';
  }

  function getFiltered() {
    return menuItems.filter((item) => {
      const matchesSearch = item.Item_Name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || item.Item_Category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }

  function render() {
    const filtered = getFiltered();
    tableBody.innerHTML = '';
    tableEmpty.classList.toggle('hidden', filtered.length !== 0);

    filtered.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><div class="menu-item-thumb"><i class="fa-solid fa-utensils"></i></div></td>
        <td class="menu-item-name-cell">${item.Item_Name}</td>
        <td>${item.Item_Category}</td>
        <td>${item.Item_Size}</td>
        <td>₹${Number(item.Item_Price).toFixed(2)}</td>
        <td><span class="badge ${item.is_available ? 'badge-success' : 'badge-danger'}">${item.is_available ? 'Available' : 'Unavailable'}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-icon btn-sm edit-item-btn" data-id="${item.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-icon btn-sm delete-item-btn" data-id="${item.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  let searchDebounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      searchTerm = searchInput.value.trim();
      render();
    }, 200);
  });

  categorySelect.addEventListener('change', () => {
    categoryFilter = categorySelect.value;
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

  /* ---------------- Create / Edit item ---------------- */
  function openCreateModal() {
    itemModalTitle.textContent = 'Add Menu Item';
    itemForm.reset();
    document.getElementById('item-id').value = '';
    openModal('item-modal');
  }

  function openEditModal(itemId) {
    const item = menuItems.find((i) => i.id === itemId);
    if (!item) return;

    itemModalTitle.textContent = 'Edit Menu Item';
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-name').value = item.Item_Name;
    document.getElementById('item-category').value = item.Item_Category;
    document.getElementById('item-size').value = item.Item_Size;
    document.getElementById('item-price').value = item.Item_Price;
    document.getElementById('item-available').value = String(item.is_available);

    openModal('item-modal');
  }

  document.getElementById('add-item-btn').addEventListener('click', openCreateModal);

  itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const itemId = document.getElementById('item-id').value;
    const payload = {
      Item_Name: document.getElementById('item-name').value.trim(),
      Item_Category: document.getElementById('item-category').value,
      Item_Size: document.getElementById('item-size').value,
      Item_Price: document.getElementById('item-price').value,
      is_available: document.getElementById('item-available').value === 'true'
    };

    try {
      if (itemId) {
        await API.updateMenuItem(itemId, payload);
        Toast.success('Menu item updated successfully.');
      } else {
        await API.createMenuItem(payload);
        Toast.success('Menu item created successfully.');
      }
      closeModal('item-modal');
      await loadMenu();
    } catch (err) {
      /* toast already shown */
    }
  });

  /* ---------------- Delete item ---------------- */
  function confirmDelete(itemId) {
    const item = menuItems.find((i) => i.id === itemId);
    if (!item) return;

    pendingDeleteId = itemId;
    document.getElementById('delete-item-name').textContent = item.Item_Name;
    openModal('delete-item-modal');
  }

  document.getElementById('confirm-delete-item-btn').addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    try {
      await API.deleteMenuItem(pendingDeleteId);
      Toast.success('Menu item deleted successfully.');
      closeModal('delete-item-modal');
      menuItems = menuItems.filter((i) => i.id !== pendingDeleteId);
      pendingDeleteId = null;
      buildCategoryOptions();
      render();
    } catch (err) {
      /* toast already shown */
    }
  });

  /* ---------------- Event delegation ---------------- */
  tableBody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-item-btn');
    const deleteBtn = e.target.closest('.delete-item-btn');

    if (editBtn) openEditModal(Number(editBtn.dataset.id));
    if (deleteBtn) confirmDelete(Number(deleteBtn.dataset.id));
  });

  loadMenu();
});
