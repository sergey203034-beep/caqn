/* ===================================================================
   «Лакомый кусочек» — основной скрипт страницы
   =================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  await initData();
  renderCatalog();
  initFilters();
  renderAboutVisual();
  renderContactInfo();
  renderSocialLinks();
  renderReviews();
  initMobileMenu();
  initModals();
  initCartDrawer();
  initLoginForm();
  initRegisterForm();
  initForgotForm();
  initCheckoutForm();
  initContactForm();
  initAccountTabs();
  updateCartUI();
  updateAuthUI();

  onDataChange((table) => {
    if (table === 'cakes') {
      renderCatalog();
    }
    if (table === 'settings') {
      renderContactInfo();
      renderSocialLinks();
    }
    if (table === 'orders' || table === 'users') {
      updateAuthUI();
      const user = getCurrentUser();
      if (user && document.getElementById('accountModal').classList.contains('is-open')) {
        if (table === 'orders') renderAccountOrders(user);
        if (table === 'users') renderAccountAddresses(user);
      }
    }
  });
});

/* ---------------------- Toast ---------------------- */
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

/* ---------------------- Hero / About illustrations ---------------------- */
function renderAboutVisual() {
  const el = document.getElementById('aboutSVG');
  if (!el) return; // блок теперь использует реальное фото, SVG-заглушка не нужна
  el.innerHTML = cakeIllustrationSVG({ name: 'История кондитерской', category: 'custom', tiers: 2 });
}

/* ---------------------- Контактная информация (из настроек админки) ---------------------- */
function renderContactInfo() {
  const c = getSettings().contact;
  const phoneDigits = (c.phone || '').replace(/[^\d+]/g, '');

  const phoneEl = document.getElementById('contactPhone');
  if (phoneEl) { phoneEl.textContent = c.phone; phoneEl.href = 'tel:' + phoneDigits; }

  const emailEl = document.getElementById('contactEmail');
  if (emailEl) { emailEl.textContent = c.email; emailEl.href = 'mailto:' + c.email; }

  const addressEl = document.getElementById('contactAddress');
  if (addressEl) addressEl.textContent = c.address;

  const hoursEl = document.getElementById('contactHours');
  if (hoursEl) hoursEl.textContent = c.hours;

  const mapEl = document.getElementById('contactMapLabel');
  if (mapEl) mapEl.textContent = 'Карта — ' + c.address;

  const footerPhone = document.getElementById('footerPhone');
  if (footerPhone) footerPhone.textContent = c.phone;

  const footerEmail = document.getElementById('footerEmail');
  if (footerEmail) footerEmail.textContent = c.email;

  const footerAddress = document.getElementById('footerAddress');
  if (footerAddress) footerAddress.textContent = c.address;
}

/* ---------------------- Ссылки на соцсети (из настроек админки) ---------------------- */
function renderSocialLinks() {
  const s = getSettings().social;
  const map = { socialInstagram: s.instagram, socialTelegram: s.telegram, socialVk: s.vk, socialWhatsapp: s.whatsapp };
  let anyVisible = false;
  Object.entries(map).forEach(([id, url]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (url) {
      el.href = url;
      el.classList.remove('hidden');
      anyVisible = true;
    } else {
      el.classList.add('hidden');
    }
  });
  const hint = document.getElementById('socialEmptyHint');
  if (hint) hint.classList.toggle('hidden', anyVisible);
}

/* ---------------------- Reviews ---------------------- */
function renderReviews() {
  const track = document.getElementById('reviewsTrack');
  if (!track) return;
  const reviews = getReviews();
  track.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      <p>${r.text}</p>
      <div class="review-name">${r.name}</div>
    </div>
  `).join('');
}

/* ---------------------- Mobile menu ---------------------- */
function initMobileMenu() {
  const btn = document.getElementById('hamburgerBtn');
  const nav = document.getElementById('mobileNav');
  if (!btn || !nav) return;
  const toggle = () => {
    const open = nav.classList.toggle('is-open');
    btn.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  btn.addEventListener('click', toggle);
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  }));
}

/* ---------------------- Modal system ---------------------- */
const MODAL_IDS = ['loginModal', 'registerModal', 'forgotModal', 'accountModal', 'checkoutModal', 'roleModal'];

function openModal(id) {
  closeAllModals();
  document.getElementById('overlay').classList.add('is-open');
  document.getElementById(id).classList.add('is-open');
  document.body.style.overflow = 'hidden';
}
function closeAllModals() {
  MODAL_IDS.forEach(id => document.getElementById(id).classList.remove('is-open'));
  const drawer = document.getElementById('cartDrawer');
  if (drawer) drawer.classList.remove('is-open');
  document.getElementById('overlay').classList.remove('is-open');
  document.body.style.overflow = '';
}

function initModals() {
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });
  document.getElementById('overlay').addEventListener('click', closeAllModals);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllModals(); });

  const openLogin = () => {
    if (getCurrentUser()) { openAccountModal(); } else { openModal('loginModal'); }
  };
  document.getElementById('loginBtn').addEventListener('click', openLogin);
  document.getElementById('loginBtnMobile').addEventListener('click', openLogin);
  document.getElementById('footerLogin').addEventListener('click', (e) => { e.preventDefault(); openLogin(); });

  const openOrder = () => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('orderBtn').addEventListener('click', openOrder);
  document.getElementById('orderBtnMobile').addEventListener('click', openOrder);

  document.getElementById('roleBtn').addEventListener('click', openRoleModal);
  document.getElementById('roleBtnMobile').addEventListener('click', openRoleModal);

  document.getElementById('showRegister').addEventListener('click', () => openModal('registerModal'));
  document.getElementById('showLoginFromRegister').addEventListener('click', () => openModal('loginModal'));
  document.getElementById('showForgot').addEventListener('click', () => openModal('forgotModal'));
  document.getElementById('showLoginFromForgot').addEventListener('click', () => openModal('loginModal'));

  document.getElementById('logoutBtn').addEventListener('click', () => {
    logoutUser();
    closeAllModals();
    updateAuthUI();
    showToast('Вы вышли из аккаунта');
  });
}

/* ---------------------- Auth UI state ---------------------- */
function updateAuthUI() {
  const user = getCurrentUser();
  const label = user ? user.name.split(' ')[0] : 'Войти';
  document.getElementById('loginBtn').textContent = label;
  document.getElementById('loginBtnMobile').textContent = user ? `Кабинет · ${label}` : 'Войти';
  updateRoleButton(user);
}

/* ---------------------- Role button (staff panel access) ---------------------- */
const ROLE_BTN_LABELS = { admin: 'Панель администратора', manager: 'Панель менеджера' };

function updateRoleButton(user) {
  const isStaff = user && (user.role === 'admin' || user.role === 'manager');
  const label = isStaff ? ROLE_BTN_LABELS[user.role] : '';
  [document.getElementById('roleBtn'), document.getElementById('roleBtnMobile')].forEach(btn => {
    if (!btn) return;
    btn.classList.toggle('hidden', !isStaff);
    btn.textContent = label;
  });
}

function openRoleModal() {
  const user = getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return;

  if (user.role === 'manager') {
    const toggle = document.getElementById('supportChatToggle');
    if (toggle) toggle.click();
    return;
  }

  const orders = getOrders();
  const newOrders = orders.filter(o => o.status === 'new');

  document.getElementById('roleModalTitle').textContent = ROLE_BTN_LABELS[user.role];
  document.getElementById('roleModalSub').textContent = 'У вас права администратора — доступна полная панель управления.';
  document.getElementById('roleModalBody').innerHTML = `
    <div class="order-mini"><strong>Всего заказов:</strong> ${orders.length}</div>
    <div class="order-mini"><strong>Новых заказов:</strong> ${newOrders.length}</div>
    <div class="order-mini"><strong>Пользователей:</strong> ${getUsers().length}</div>
    <a href="admin.html" class="btn btn-primary btn-block" style="margin-top:16px">Открыть панель администратора</a>
  `;
  openModal('roleModal');
}

/* ---------------------- Validation helper ---------------------- */
function setFieldError(fieldEl, hasError) {
  fieldEl.classList.toggle('has-error', hasError);
}
function showAlert(id, message, type = 'error') {
  const el = document.getElementById(id);
  el.textContent = message;
  el.className = 'form-alert is-visible' + (type === 'success' ? ' success' : '');
}
function hideAlert(id) {
  document.getElementById(id).classList.remove('is-visible');
}

/* ---------------------- Login ---------------------- */
function initLoginForm() {
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideAlert('loginAlert');
    const emailField = document.getElementById('loginEmail').closest('.field');
    const passField = document.getElementById('loginPassword').closest('.field');
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    setFieldError(emailField, !isValidEmail(email));
    setFieldError(passField, !password);
    if (!isValidEmail(email) || !password) return;

    const result = loginUser({ email, password });
    if (!result.ok) {
      showAlert('loginAlert', result.error);
      return;
    }
    form.reset();
    closeAllModals();
    updateAuthUI();
    showToast(`Добро пожаловать, ${result.user.name.split(' ')[0]}!`);
  });
}

/* ---------------------- Register ---------------------- */
function initRegisterForm() {
  const form = document.getElementById('registerForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideAlert('registerAlert');
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;

    const nameField = document.getElementById('regName').closest('.field');
    const emailField = document.getElementById('regEmail').closest('.field');
    const passField = document.getElementById('regPassword').closest('.field');
    const pass2Field = document.getElementById('regPassword2').closest('.field');

    setFieldError(nameField, !name.trim());
    setFieldError(emailField, !isValidEmail(email));
    setFieldError(passField, !isValidPassword(password));
    setFieldError(pass2Field, password !== password2);

    if (!name.trim() || !isValidEmail(email) || !isValidPassword(password) || password !== password2) return;

    const result = registerUser({ name, email, password, confirmPassword: password2 });
    if (!result.ok) {
      showAlert('registerAlert', result.error);
      return;
    }
    form.reset();
    closeAllModals();
    updateAuthUI();
    showToast(`Аккаунт создан. Добро пожаловать, ${result.user.name.split(' ')[0]}!`);
  });
}

/* ---------------------- Forgot password ---------------------- */
function initForgotForm() {
  const form = document.getElementById('forgotForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideAlert('forgotAlert');
    const email = document.getElementById('forgotEmail').value;
    const field = document.getElementById('forgotEmail').closest('.field');
    setFieldError(field, !isValidEmail(email));
    if (!isValidEmail(email)) return;

    const result = requestPasswordReset(email);
    if (!result.ok) {
      showAlert('forgotAlert', result.error);
      return;
    }
    showAlert('forgotAlert', `Временный пароль отправлен на e-mail (демо): ${result.tempPassword}`, 'success');
  });
}

/* ---------------------- Account modal ---------------------- */
function openAccountModal() {
  const user = getCurrentUser();
  if (!user) { openModal('loginModal'); return; }
  document.getElementById('accountGreeting').textContent = `Здравствуйте, ${user.name.split(' ')[0]}`;
  renderAccountOrders(user);
  renderAccountAddresses(user);
  renderAccountProfile(user);
  openModal('accountModal');
}

function initAccountTabs() {
  document.querySelectorAll('.account-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.account-tab').forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      ['orders', 'addresses', 'profile'].forEach(name => {
        document.getElementById('tab' + name[0].toUpperCase() + name.slice(1))
          .classList.toggle('hidden', name !== tab.dataset.tab);
      });
    });
  });
}

const STATUS_LABELS = { new: 'Новый', in_progress: 'В работе', ready: 'Готов', delivered: 'Доставлен' };

function renderAccountOrders(user) {
  const container = document.getElementById('tabOrders');
  const cakes = getCakes();
  const orders = getOrders().filter(o => o.userId === user.id).sort((a, b) => b.date.localeCompare(a.date));
  if (orders.length === 0) {
    container.innerHTML = '<div class="empty-state">У вас пока нет заказов.</div>';
    return;
  }
  container.innerHTML = orders.map(o => {
    const itemsText = o.items.map(i => {
      const cake = cakes.find(c => c.id === i.cakeId);
      return cake ? `${cake.name} × ${i.qty}` : '';
    }).filter(Boolean).join(', ');
    return `
    <div class="order-mini">
      <div class="order-mini-head">
        <span>Заказ №${o.id}</span>
        <span class="status-pill status-${o.status}">${STATUS_LABELS[o.status]}</span>
      </div>
      <p style="margin:8px 0 4px;font-size:13.5px">${itemsText}</p>
      <p style="margin:0;font-size:12.5px;color:#8A7362">Доставка: ${o.deliveryDate} · ${formatPrice(o.total)}</p>
    </div>`;
  }).join('');
}

function renderAccountAddresses(user) {
  const container = document.getElementById('tabAddresses');
  const addresses = user.addresses || [];
  container.innerHTML = `
    <div id="addressList">
      ${addresses.length ? addresses.map(a => `<div class="order-mini">${a}</div>`).join('') : '<div class="empty-state">Сохранённых адресов пока нет.</div>'}
    </div>
    <form id="addAddressForm" style="margin-top:14px">
      <div class="field">
        <label for="newAddress">Добавить новый адрес</label>
        <input type="text" id="newAddress" placeholder="Город, улица, дом, квартира">
      </div>
      <button type="submit" class="btn btn-outline btn-block">Сохранить адрес</button>
    </form>
  `;
  document.getElementById('addAddressForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('newAddress');
    const result = addUserAddress(user.id, input.value);
    if (result.ok) {
      renderAccountAddresses(result.user);
      showToast('Адрес сохранён');
    }
  });
}

function renderAccountProfile(user) {
  const container = document.getElementById('tabProfile');
  container.innerHTML = `
    <div class="form-alert" id="profileAlert"></div>
    <form id="profileForm">
      <div class="field">
        <label for="profileName">Имя</label>
        <input type="text" id="profileName" value="${user.name}">
      </div>
      <div class="field">
        <label for="profileEmail">E-mail</label>
        <input type="email" id="profileEmail" value="${user.email}">
      </div>
      <button type="submit" class="btn btn-primary btn-block">Сохранить изменения</button>
    </form>
  `;
  document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    if (!name || !isValidEmail(email)) {
      showAlert('profileAlert', 'Проверьте корректность введённых данных.');
      return;
    }
    updateUserProfile(user.id, { name, email });
    showAlert('profileAlert', 'Профиль обновлён.', 'success');
    updateAuthUI();
    document.getElementById('accountGreeting').textContent = `Здравствуйте, ${name.split(' ')[0]}`;
  });
}

/* ---------------------- Cart drawer ---------------------- */
function initCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('overlay');
  document.getElementById('cartBtn').addEventListener('click', () => {
    closeAllModals();
    renderCartDrawer();
    overlay.classList.add('is-open');
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  });
  document.getElementById('cartCloseBtn').addEventListener('click', closeAllModals);
  document.getElementById('checkoutBtn').addEventListener('click', () => {
    const { items } = getCartDetails();
    if (items.length === 0) { showToast('Корзина пуста'); return; }
    openCheckoutModal();
  });
}

function updateCartUI() {
  const { count } = getCartDetails();
  const badge = document.getElementById('cartCount');
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);
}

function renderCartDrawer() {
  const { items, total } = getCartDetails();
  const body = document.getElementById('cartBody');
  document.getElementById('cartTotal').textContent = formatPrice(total);

  if (items.length === 0) {
    body.innerHTML = '<div class="empty-state">Корзина пока пуста.<br>Выберите торт в каталоге 🍰</div>';
    return;
  }

  body.innerHTML = items.map(i => `
    <div class="cart-line" data-id="${i.cakeId}">
      <div class="cart-line-thumb">${cakeIllustrationSVG(i.cake)}</div>
      <div class="cart-line-info">
        <h4>${i.cake.name}</h4>
        <div class="price">${formatPrice(i.cake.price)}</div>
        <div class="qty-control">
          <button class="qty-minus" aria-label="Уменьшить">−</button>
          <span>${i.qty}</span>
          <button class="qty-plus" aria-label="Увеличить">+</button>
        </div>
        <button class="cart-line-remove">Удалить</button>
      </div>
    </div>
  `).join('');

  body.querySelectorAll('.cart-line').forEach(line => {
    const id = line.dataset.id;
    line.querySelector('.qty-plus').addEventListener('click', () => {
      const item = getCart().find(i => i.cakeId === id);
      updateCartQty(id, (item ? item.qty : 0) + 1);
      renderCartDrawer(); updateCartUI();
    });
    line.querySelector('.qty-minus').addEventListener('click', () => {
      const item = getCart().find(i => i.cakeId === id);
      updateCartQty(id, (item ? item.qty : 0) - 1);
      renderCartDrawer(); updateCartUI();
    });
    line.querySelector('.cart-line-remove').addEventListener('click', () => {
      removeFromCart(id);
      renderCartDrawer(); updateCartUI();
    });
  });
}

/* ---------------------- Checkout ---------------------- */
function openCheckoutModal() {
  const { items, total } = getCartDetails();
  const summary = document.getElementById('checkoutSummary');
  summary.innerHTML = `
    <div class="order-mini">
      ${items.map(i => `<div style="display:flex;justify-content:space-between;font-size:13.5px;padding:4px 0">
        <span>${i.cake.name} × ${i.qty}</span><span>${formatPrice(i.cake.price * i.qty)}</span>
      </div>`).join('')}
      <div style="display:flex;justify-content:space-between;font-weight:800;margin-top:8px;border-top:1px solid var(--line);padding-top:8px">
        <span>Итого</span><span>${formatPrice(total)}</span>
      </div>
    </div>
  `;

  const user = getCurrentUser();
  if (user) {
    document.getElementById('ordName').value = user.name;
    document.getElementById('ordAddress').value = (user.addresses && user.addresses[0]) || '';
  } else {
    document.getElementById('ordName').value = '';
    document.getElementById('ordAddress').value = '';
  }
  const dateInput = document.getElementById('ordDate');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  dateInput.min = tomorrow.toISOString().slice(0, 10);
  dateInput.value = tomorrow.toISOString().slice(0, 10);

  hideAlert('checkoutAlert');
  openModal('checkoutModal');
}

function initCheckoutForm() {
  const form = document.getElementById('checkoutForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { items, total } = getCartDetails();
    if (items.length === 0) { showToast('Корзина пуста'); closeAllModals(); return; }

    const name = document.getElementById('ordName').value.trim();
    const phone = document.getElementById('ordPhone').value.trim();
    const address = document.getElementById('ordAddress').value.trim();
    const date = document.getElementById('ordDate').value;
    const comment = document.getElementById('ordComment').value.trim();

    let valid = true;
    [['ordName', name], ['ordPhone', phone], ['ordAddress', address], ['ordDate', date]].forEach(([id, val]) => {
      const field = document.getElementById(id).closest('.field');
      const bad = !val;
      setFieldError(field, bad);
      if (bad) valid = false;
    });
    if (!valid) return;

    const user = getCurrentUser();
    const order = {
      id: 'o' + Date.now(),
      userId: user ? user.id : null,
      items: items.map(i => ({ cakeId: i.cakeId, qty: i.qty })),
      total,
      status: 'new',
      date: new Date().toISOString().slice(0, 10),
      deliveryDate: date,
      name, phone, address, comment
    };
    const orders = getOrders();
    orders.push(order);
    setOrders(orders);
    clearCart();
    form.reset();
    closeAllModals();
    updateCartUI();
    showToast(`Заказ №${order.id} оформлен! Мы свяжемся с вами.`);
  });
}

/* ---------------------- Contact form ---------------------- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('cName').value.trim();
    const contact = document.getElementById('cContact').value.trim();
    const message = document.getElementById('cMessage').value.trim();

    let valid = true;
    [['cName', name], ['cContact', contact], ['cMessage', message]].forEach(([id, val]) => {
      const field = document.getElementById(id).closest('.field');
      const bad = !val;
      setFieldError(field, bad);
      if (bad) valid = false;
    });
    if (!valid) return;

    showAlert('contactAlert', 'Спасибо! Мы ответим вам в ближайшее время.', 'success');
    form.reset();
  });
}
