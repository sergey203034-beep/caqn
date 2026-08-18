/* ===================================================================
   «Лакомый кусочек» — админ-панель
   =================================================================== */

let orderStatusFilter = 'all';
let statPeriod = '7';
let activeSupportChatId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await initData();
  initAdminLogin();
  checkAdminSession();
  initAdminNav();
  initAdminLogout();
  initCakeForm();
  initCakeMediaInput();
  initCakeSearch();
  initClientSearch();
  initOrderStatusFilters();
  initStatPeriod();
  initSupportPanel();
  initSettingsPanel();
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEYS.supportChats && isAdminLoggedIn()) {
      renderSupportConvList();
      if (activeSupportChatId) renderSupportConvThread(activeSupportChatId);
    }
  });

  onDataChange((table) => {
    if (!isAdminLoggedIn()) return;
    if (table === 'cakes') { renderCakesTable(); renderDashboard(); }
    if (table === 'orders') { renderOrdersTable(); renderDashboard(); }
    if (table === 'users') { renderClientsTable(); renderDashboard(); }
    if (table === 'support_chats') {
      renderSupportConvList();
      if (activeSupportChatId) renderSupportConvThread(activeSupportChatId);
    }
  });
});

/* ---------------------- Toast (shared pattern) ---------------------- */
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

/* ---------------------- Admin auth ---------------------- */
function isAdminLoggedIn() {
  return !!localStorage.getItem(STORAGE_KEYS.adminSession);
}

function getAdminIdentity() {
  const raw = localStorage.getItem(STORAGE_KEYS.adminSession);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return { name: 'Администратор' }; }
}

function checkAdminSession() {
  if (isAdminLoggedIn()) {
    showAdminShell();
  } else {
    document.getElementById('adminLoginScreen').classList.remove('hidden');
    document.getElementById('adminShell').classList.add('hidden');
  }
}

function showAdminShell() {
  document.getElementById('adminLoginScreen').classList.add('hidden');
  document.getElementById('adminShell').classList.remove('hidden');
  renderDashboard();
  renderCakesTable();
  renderClientsTable();
  renderOrdersTable();
  renderSupportConvList();
}

function initAdminLogin() {
  const form = document.getElementById('adminLoginForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const login = document.getElementById('adminLogin').value.trim();
    const password = document.getElementById('adminPassword').value;
    const alertEl = 'adminLoginAlert';
    document.getElementById(alertEl).classList.remove('is-visible');

    if (login === ADMIN_CREDENTIALS.login && password === ADMIN_CREDENTIALS.password) {
      localStorage.setItem(STORAGE_KEYS.adminSession, JSON.stringify({ name: 'Администратор', role: 'admin' }));
      form.reset();
      showAdminShell();
      return;
    }

    const staff = findStaffUser(login, password);
    if (staff) {
      localStorage.setItem(STORAGE_KEYS.adminSession, JSON.stringify({ name: staff.name, role: staff.role, userId: staff.id }));
      form.reset();
      showAdminShell();
      return;
    }

    const el = document.getElementById(alertEl);
    el.textContent = 'Неверный логин или пароль.';
    el.classList.add('is-visible');
  });
}

function initAdminLogout() {
  document.getElementById('adminLogoutBtn').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEYS.adminSession);
    checkAdminSession();
  });
}

/* ---------------------- Sidebar navigation ---------------------- */
function initAdminNav() {
  const items = document.querySelectorAll('.admin-nav-item[data-panel]');
  items.forEach(item => {
    item.addEventListener('click', () => {
      items.forEach(i => i.classList.remove('is-active'));
      item.classList.add('is-active');
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('is-active'));
      document.getElementById('panel-' + item.dataset.panel).classList.add('is-active');
      document.getElementById('adminSidebar').classList.remove('is-open');
      document.getElementById('adminOverlay').classList.remove('is-open');
      if (item.dataset.panel === 'dashboard') renderDashboard();
      if (item.dataset.panel === 'catalog') renderCakesTable();
      if (item.dataset.panel === 'clients') renderClientsTable();
      if (item.dataset.panel === 'orders') renderOrdersTable();
      if (item.dataset.panel === 'support') renderSupportConvList();
      if (item.dataset.panel === 'settings') fillSettingsForm();
    });
  });

  const toggleBtn = document.getElementById('adminSidebarToggle');
  const sidebar = document.getElementById('adminSidebar');
  const overlay = document.getElementById('adminOverlay');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.add('is-open');
      overlay.classList.add('is-open');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('is-open');
      overlay.classList.remove('is-open');
    });
  }
}

/* ---------------------- Dashboard ---------------------- */
function initStatPeriod() {
  const wrap = document.getElementById('statGrid').closest('#panel-dashboard').querySelector('.stat-period');
  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;
    wrap.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('is-active'));
    btn.classList.add('is-active');
    statPeriod = btn.dataset.period;
    renderDashboard();
  });
}

function filterOrdersByPeriod(orders) {
  if (statPeriod === 'all') return orders;
  const days = parseInt(statPeriod, 10);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return orders.filter(o => new Date(o.date) >= cutoff);
}

function renderDashboard() {
  const orders = getOrders();
  const users = getUsers();
  const cakes = getCakes();
  const periodOrders = filterOrdersByPeriod(orders);
  const revenue = periodOrders.reduce((sum, o) => sum + o.total, 0);
  const avgCheck = periodOrders.length ? Math.round(revenue / periodOrders.length) : 0;

  document.getElementById('statGrid').innerHTML = `
    <div class="stat-card"><div class="label">Заказов за период</div><div class="value">${periodOrders.length}</div></div>
    <div class="stat-card"><div class="label">Выручка за период</div><div class="value">${formatPrice(revenue)}</div></div>
    <div class="stat-card"><div class="label">Средний чек</div><div class="value">${formatPrice(avgCheck)}</div></div>
    <div class="stat-card"><div class="label">Клиентов всего</div><div class="value">${users.length}</div></div>
  `;

  const recent = [...orders].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  document.getElementById('recentOrdersBody').innerHTML = recent.map(o => `
    <tr>
      <td>№${o.id}</td>
      <td>${o.name}</td>
      <td>${o.date}</td>
      <td>${formatPrice(o.total)}</td>
      <td><span class="status-pill status-${o.status}">${STATUS_LABELS_ADMIN[o.status]}</span></td>
    </tr>
  `).join('') || `<tr><td colspan="5">Заказов пока нет</td></tr>`;
}

const STATUS_LABELS_ADMIN = { new: 'Новый', in_progress: 'В работе', ready: 'Готов', delivered: 'Доставлен' };

/* ---------------------- Catalog management ---------------------- */
let cakeSearchTerm = '';
let currentCakeMedia = [];

/* ---------------------- Фото и видео торта ---------------------- */
function renderCakeMediaPreview() {
  const wrap = document.getElementById('cakeMediaPreview');
  if (!wrap) return;
  if (currentCakeMedia.length === 0) {
    wrap.innerHTML = '<span class="cake-media-empty">Файлы пока не добавлены</span>';
    return;
  }
  wrap.innerHTML = currentCakeMedia.map((m, i) => `
    <div class="cake-media-thumb" data-index="${i}">
      ${m.type === 'video'
        ? `<video src="${m.url}" muted></video>`
        : `<img src="${m.url}" alt="">`}
      <button type="button" class="cake-media-remove" data-remove="${i}" aria-label="Удалить">✕</button>
    </div>
  `).join('');

  wrap.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCakeMedia.splice(parseInt(btn.dataset.remove, 10), 1);
      renderCakeMediaPreview();
    });
  });
}

function initCakeMediaInput() {
  const input = document.getElementById('cakeMediaInput');
  const addBtn = document.getElementById('cakeMediaAddBtn');
  if (!input || !addBtn) return;

  addBtn.addEventListener('click', () => input.click());

  input.addEventListener('change', () => {
    const files = Array.from(input.files || []);
    let pending = files.length;
    if (!pending) return;
    files.forEach(file => {
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      const reader = new FileReader();
      reader.onload = () => {
        currentCakeMedia.push({ type, url: reader.result, name: file.name });
        pending -= 1;
        if (pending === 0) renderCakeMediaPreview();
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  });
}

function initCakeSearch() {
  document.getElementById('cakeSearch').addEventListener('input', (e) => {
    cakeSearchTerm = e.target.value.trim().toLowerCase();
    renderCakesTable();
  });
  document.getElementById('addCakeBtn').addEventListener('click', () => openCakeModal(null));
}

function renderCakesTable() {
  const body = document.getElementById('cakesTableBody');
  if (!body) return;
  let cakes = getCakes();
  if (cakeSearchTerm) {
    cakes = cakes.filter(c => c.name.toLowerCase().includes(cakeSearchTerm));
  }
  if (cakes.length === 0) {
    body.innerHTML = `<tr><td colspan="7">Ничего не найдено</td></tr>`;
    return;
  }
  body.innerHTML = cakes.map(c => `
    <tr>
      <td class="thumb-cell">${cakeThumbHTML(c)}</td>
      <td>${c.name}</td>
      <td>${CATEGORY_LABELS[c.category]}</td>
      <td>${c.weight} кг</td>
      <td>${formatPrice(c.price)}</td>
      <td><span class="availability-pill ${c.available ? 'avail-yes' : 'avail-no'}">${c.available ? 'В наличии' : 'Нет'}</span></td>
      <td class="table-actions">
        <button class="link-btn" data-edit="${c.id}">Изменить</button>
        <button class="link-btn danger" data-delete="${c.id}">Удалить</button>
      </td>
    </tr>
  `).join('');

  body.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openCakeModal(btn.dataset.edit));
  });
  body.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Удалить этот торт из каталога?')) return;
      const cakes = getCakes().filter(c => c.id !== btn.dataset.delete);
      setCakes(cakes);
      renderCakesTable();
      showToast('Торт удалён из каталога');
    });
  });
}

function openCakeModal(cakeId) {
  const isEdit = !!cakeId;
  document.getElementById('cakeModalTitle').textContent = isEdit ? 'Редактирование торта' : 'Новый торт';
  document.getElementById('cakeFormAlert').classList.remove('is-visible');
  const form = document.getElementById('cakeForm');
  form.reset();
  document.getElementById('cakeId').value = '';
  currentCakeMedia = [];

  if (isEdit) {
    const cake = getCakes().find(c => c.id === cakeId);
    if (cake) {
      document.getElementById('cakeId').value = cake.id;
      document.getElementById('cakeName').value = cake.name;
      document.getElementById('cakeCategory').value = cake.category;
      document.getElementById('cakeWeight').value = cake.weight;
      document.getElementById('cakeTiers').value = cake.tiers;
      document.getElementById('cakePrice').value = cake.price;
      document.getElementById('cakeAvailable').value = String(cake.available);
      document.getElementById('cakeDescription').value = cake.description;
      currentCakeMedia = Array.isArray(cake.media) ? [...cake.media] : [];
    }
  } else {
    document.getElementById('cakeTiers').value = 1;
    document.getElementById('cakeAvailable').value = 'true';
  }

  renderCakeMediaPreview();
  document.getElementById('cakeModalOverlay').classList.add('is-open');
  document.getElementById('cakeModal').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeCakeModal() {
  document.getElementById('cakeModalOverlay').classList.remove('is-open');
  document.getElementById('cakeModal').classList.remove('is-open');
  document.body.style.overflow = '';
}

function initCakeForm() {
  document.getElementById('cakeModalClose').addEventListener('click', closeCakeModal);
  document.getElementById('cakeFormCancel').addEventListener('click', closeCakeModal);
  document.getElementById('cakeModalOverlay').addEventListener('click', closeCakeModal);

  document.getElementById('cakeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('cakeId').value;
    const name = document.getElementById('cakeName').value.trim();
    const category = document.getElementById('cakeCategory').value;
    const weight = parseFloat(document.getElementById('cakeWeight').value);
    const tiers = parseInt(document.getElementById('cakeTiers').value, 10) || 1;
    const price = parseInt(document.getElementById('cakePrice').value, 10);
    const available = document.getElementById('cakeAvailable').value === 'true';
    const description = document.getElementById('cakeDescription').value.trim();

    if (!name || !weight || !price || !description) {
      const alertEl = document.getElementById('cakeFormAlert');
      alertEl.textContent = 'Пожалуйста, заполните все обязательные поля.';
      alertEl.classList.add('is-visible');
      return;
    }

    const cakes = getCakes();
    if (id) {
      const idx = cakes.findIndex(c => c.id === id);
      if (idx !== -1) {
        cakes[idx] = { ...cakes[idx], name, category, weight, tiers, price, available, description, media: [...currentCakeMedia] };
      }
    } else {
      cakes.push({ id: 'c' + Date.now(), name, category, weight, tiers, price, available, description, media: [...currentCakeMedia] });
    }
    setCakes(cakes);
    closeCakeModal();
    renderCakesTable();
    showToast(id ? 'Изменения сохранены' : 'Торт добавлен в каталог');
  });
}

/* ---------------------- Clients ---------------------- */
let clientSearchTerm = '';

function initClientSearch() {
  document.getElementById('clientSearch').addEventListener('input', (e) => {
    clientSearchTerm = e.target.value.trim().toLowerCase();
    renderClientsTable();
  });
}

function renderClientsTable() {
  const body = document.getElementById('clientsTableBody');
  if (!body) return;
  let users = getUsers();
  if (clientSearchTerm) {
    users = users.filter(u => u.name.toLowerCase().includes(clientSearchTerm) || u.email.toLowerCase().includes(clientSearchTerm));
  }
  const orders = getOrders();

  if (users.length === 0) {
    body.innerHTML = `<tr><td colspan="5">Ничего не найдено</td></tr>`;
    return;
  }

  body.innerHTML = users.map(u => {
    const userOrders = orders.filter(o => o.userId === u.id);
    const spent = userOrders.reduce((sum, o) => sum + o.total, 0);
    const role = u.role || 'client';
    return `
    <tr>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td class="wrap">${(u.addresses && u.addresses.length) ? u.addresses.join('; ') : '—'}</td>
      <td>${userOrders.length}</td>
      <td>${formatPrice(spent)}</td>
      <td>
        <select class="role-select" data-user="${u.id}">
          <option value="client" ${role === 'client' ? 'selected' : ''}>Клиент</option>
          <option value="manager" ${role === 'manager' ? 'selected' : ''}>Менеджер</option>
          <option value="admin" ${role === 'admin' ? 'selected' : ''}>Администратор</option>
        </select>
      </td>
    </tr>`;
  }).join('');

  body.querySelectorAll('.role-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const users = getUsers();
      const idx = users.findIndex(u => u.id === sel.dataset.user);
      if (idx !== -1) {
        users[idx].role = sel.value;
        setUsers(users);
        showToast(`Роль пользователя «${users[idx].name}» изменена на «${ROLE_LABELS[sel.value]}»`);
      }
    });
  });
}

/* ---------------------- Orders ---------------------- */
function initOrderStatusFilters() {
  const wrap = document.getElementById('orderStatusFilters');
  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;
    wrap.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('is-active'));
    btn.classList.add('is-active');
    orderStatusFilter = btn.dataset.status;
    renderOrdersTable();
  });
}

function renderOrdersTable() {
  const body = document.getElementById('ordersTableBody');
  if (!body) return;
  const cakes = getCakes();
  let orders = [...getOrders()].sort((a, b) => b.date.localeCompare(a.date));
  if (orderStatusFilter !== 'all') {
    orders = orders.filter(o => o.status === orderStatusFilter);
  }

  if (orders.length === 0) {
    body.innerHTML = `<tr><td colspan="7">Заказов нет</td></tr>`;
    return;
  }

  body.innerHTML = orders.map(o => {
    const itemsText = o.items.map(i => {
      const cake = cakes.find(c => c.id === i.cakeId);
      return cake ? `${cake.name} × ${i.qty}` : '';
    }).filter(Boolean).join(', ');
    return `
    <tr>
      <td>№${o.id}</td>
      <td>${o.name}<br><span style="font-size:11.5px;color:#8A7362">${o.phone}</span></td>
      <td class="wrap">${itemsText}</td>
      <td>${formatPrice(o.total)}</td>
      <td>${o.date}</td>
      <td>${o.deliveryDate}</td>
      <td>
        <select class="status-select" data-order="${o.id}">
          <option value="new" ${o.status === 'new' ? 'selected' : ''}>Новый</option>
          <option value="in_progress" ${o.status === 'in_progress' ? 'selected' : ''}>В работе</option>
          <option value="ready" ${o.status === 'ready' ? 'selected' : ''}>Готов</option>
          <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Доставлен</option>
        </select>
      </td>
    </tr>`;
  }).join('');

  body.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const orders = getOrders();
      const idx = orders.findIndex(o => o.id === sel.dataset.order);
      if (idx !== -1) {
        orders[idx].status = sel.value;
        setOrders(orders);
        showToast(`Статус заказа №${sel.dataset.order} обновлён`);
        renderDashboard();
      }
    });
  });
}

/* ---------------------- Support (чат с клиентами) ---------------------- */
function fmtChatTime(ts) {
  return new Date(ts).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function initSupportPanel() {
  const form = document.getElementById('supportConvForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('supportConvInput');
    const text = input.value.trim();
    if (!text || !activeSupportChatId) return;
    addSupportMessage(activeSupportChatId, 'admin', text);
    input.value = '';
    renderSupportConvThread(activeSupportChatId);
    renderSupportConvList();
  });
}

function renderSupportNavBadge() {
  const badge = document.getElementById('supportNavBadge');
  if (!badge) return;
  const chats = getSupportChats();
  const unread = Object.values(chats).filter(c => c.unreadForAdmin).length;
  if (unread > 0) {
    badge.textContent = unread;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function renderSupportConvList() {
  const list = document.getElementById('supportConvList');
  if (!list) return;
  const chats = Object.values(getSupportChats()).sort((a, b) => b.updatedAt - a.updatedAt);
  renderSupportNavBadge();

  if (chats.length === 0) {
    list.innerHTML = `<div class="support-conv-empty-list">Пока нет обращений от клиентов.</div>`;
    return;
  }

  list.innerHTML = chats.map(c => {
    const last = c.messages[c.messages.length - 1];
    const preview = last ? (last.from === 'admin' ? 'Вы: ' : '') + last.text : '';
    return `
    <button class="support-conv-item ${c.id === activeSupportChatId ? 'is-active' : ''}" data-chat="${c.id}">
      <div class="support-conv-item-top">
        <span class="support-conv-item-name">${c.name || 'Гость'}</span>
        ${c.unreadForAdmin ? '<span class="support-conv-item-dot"></span>' : ''}
      </div>
      <div class="support-conv-item-preview">${preview}</div>
    </button>`;
  }).join('');

  list.querySelectorAll('[data-chat]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeSupportChatId = btn.dataset.chat;
      markSupportChatRead(activeSupportChatId, 'admin');
      renderSupportConvList();
      renderSupportConvThread(activeSupportChatId);
    });
  });
}

function renderSupportConvThread(chatId) {
  const chat = getSupportChat(chatId);
  document.getElementById('supportConvEmpty').classList.toggle('hidden', !!chat);
  document.getElementById('supportConvActive').classList.toggle('hidden', !chat);
  if (!chat) return;

  document.getElementById('supportConvName').textContent = chat.name || 'Гость';
  document.getElementById('supportConvId').textContent = '#' + chat.id.slice(-6);

  const box = document.getElementById('supportConvMessages');
  box.innerHTML = chat.messages.map(m => `
    <div class="support-conv-msg support-conv-msg-${m.from}">
      ${m.text}
      <small>${m.from === 'admin' ? 'Вы' : m.from === 'bot' ? 'Бот' : 'Клиент'} · ${fmtChatTime(m.time)}</small>
    </div>
  `).join('');
  box.scrollTop = box.scrollHeight;
}

/* ---------------------- Settings (контакты и соц. сети) ---------------------- */
function fillSettingsForm() {
  const s = getSettings();
  document.getElementById('contactPhoneInput').value = s.contact.phone || '';
  document.getElementById('contactEmailInput').value = s.contact.email || '';
  document.getElementById('contactAddressInput').value = s.contact.address || '';
  document.getElementById('contactHoursInput').value = s.contact.hours || '';
  document.getElementById('socialInstagramInput').value = s.social.instagram || '';
  document.getElementById('socialTelegramInput').value = s.social.telegram || '';
  document.getElementById('socialVkInput').value = s.social.vk || '';
  document.getElementById('socialWhatsappInput').value = s.social.whatsapp || '';
}

function initSettingsPanel() {
  const contactForm = document.getElementById('contactSettingsForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const settings = getSettings();
      settings.contact = {
        phone: document.getElementById('contactPhoneInput').value.trim(),
        email: document.getElementById('contactEmailInput').value.trim(),
        address: document.getElementById('contactAddressInput').value.trim(),
        hours: document.getElementById('contactHoursInput').value.trim()
      };
      setSettings(settings);
      showToast('Контактная информация сохранена');
    });
  }

  const form = document.getElementById('socialSettingsForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const settings = getSettings();
    settings.social = {
      instagram: document.getElementById('socialInstagramInput').value.trim(),
      telegram: document.getElementById('socialTelegramInput').value.trim(),
      vk: document.getElementById('socialVkInput').value.trim(),
      whatsapp: document.getElementById('socialWhatsappInput').value.trim()
    };
    setSettings(settings);
    showToast('Ссылки на соцсети сохранены');
  });
}
