/* ===================================================================
   «Лакомый кусочек» — тестовые данные
   Категории: wedding (свадебные), kids (детские), custom (на заказ), daily (ежедневные)
   =================================================================== */

const STORAGE_KEYS = {
  cakes: 'lk_cakes',
  users: 'lk_users',
  orders: 'lk_orders',
  session: 'lk_session',
  cart: 'lk_cart',
  reviews: 'lk_reviews',
  adminSession: 'lk_admin_session',
  settings: 'lk_settings',
  supportChats: 'lk_support_chats',
  visitorId: 'lk_visitor_id',
  currentChatId: 'lk_current_chat_id'
};

/* ---------------------- Блокировка прокрутки фона (модалки/шторки) ----------------------
   На iOS Safari простого "overflow: hidden" на <body> недостаточно — фон всё равно
   можно "прокрутить" пальцем под открытым модальным окном (упругая прокрутка/bounce),
   из-за чего вся страница визуально "прыгает", фиксированные кнопки (например, кнопка
   поддержки) съезжают с места, а после закрытия окна тап по кнопкам попадает мимо,
   потому что страница физически сместилась. Фикс: на время блокировки "замораживаем"
   body через position:fixed с сохранением текущей прокрутки, а при разблокировке
   возвращаем прокрутку на место. */
let _scrollLockY = 0;
let _scrollLockCount = 0;
function lockBodyScroll() {
  if (_scrollLockCount === 0) {
    _scrollLockY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = -_scrollLockY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }
  _scrollLockCount++;
}
function unlockBodyScroll() {
  if (_scrollLockCount === 0) return;
  _scrollLockCount--;
  if (_scrollLockCount === 0) {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, _scrollLockY);
  }
}
/* Полный сброс — используем на всякий случай при закрытии "всех" модалок разом,
   чтобы счётчик не мог "залипнуть" из-за пропущенного вызова unlock. */
function forceUnlockBodyScroll() {
  _scrollLockCount = 0;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  document.body.style.overflow = '';
  window.scrollTo(0, _scrollLockY);
}

/* Палитра для карточных SVG-иллюстраций тортов по категориям */
const CAKE_PALETTES = {
  wedding: { base: '#F6F0E3', icing: '#FFFFFF', accent: '#B98C8F', crumb: '#EAD9BE' },
  kids:    { base: '#F6F0E3', icing: '#F0DABF', accent: '#A9814A', crumb: '#F3E3C7' },
  custom:  { base: '#F6F0E3', icing: '#E3C79E', accent: '#7C2A34', crumb: '#DCC49E' },
  daily:   { base: '#F6F0E3', icing: '#EFE1C6', accent: '#A9814A', crumb: '#E9D6B4' }
};

const CATEGORY_LABELS = {
  wedding: 'Свадебные',
  kids: 'Детские',
  custom: 'На заказ',
  daily: 'Ежедневные'
};

const DEFAULT_CAKES = [
  { id: 'c1', name: 'Нежность', category: 'wedding', weight: 3, price: 8900, tiers: 3, available: true,
    description: 'Трёхъярусный торт с кремовыми розами и деликатной ванильной прослойкой.' },
  { id: 'c2', name: 'Зимний сад', category: 'wedding', weight: 4, price: 12500, tiers: 3, available: true,
    description: 'Белая глазурь, сахарные веточки эвкалипта и ягоды — для зимней свадьбы.' },
  { id: 'c3', name: 'Единорог', category: 'kids', weight: 2, price: 4200, tiers: 1, available: true,
    description: 'Радужный бисквит внутри, рог из вафли и облако сахарной ваты сверху.' },
  { id: 'c4', name: 'Космический полёт', category: 'kids', weight: 2, price: 4500, tiers: 1, available: true,
    description: 'Тёмный шоколадный бисквит, съедобные звёзды и ракета из мастики.' },
  { id: 'c5', name: 'Динозаврик', category: 'kids', weight: 1.5, price: 3600, tiers: 1, available: true,
    description: 'Зелёная глазурь, фигурка динозавра и шоколадные «камни».' },
  { id: 'c6', name: 'Карамельный портрет', category: 'custom', weight: 2.5, price: 6800, tiers: 1, available: true,
    description: 'Индивидуальный дизайн под ваш эскиз, солёная карамель и орехи.' },
  { id: 'c7', name: 'Именной', category: 'custom', weight: 2, price: 5200, tiers: 1, available: true,
    description: 'Торт с надписью и цветами из крема — расскажите нам идею, мы воплотим.' },
  { id: 'c8', name: 'Медовик классический', category: 'daily', weight: 1.2, price: 2100, tiers: 1, available: true,
    description: 'Тонкие медовые коржи и сметанный крем — по бабушкиному рецепту.' },
  { id: 'c9', name: 'Наполеон', category: 'daily', weight: 1, price: 1900, tiers: 1, available: true,
    description: 'Слоёное тесто и заварной крем, готовим каждое утро.' },
  { id: 'c10', name: 'Морковный с сыром', category: 'daily', weight: 1.1, price: 2300, tiers: 1, available: true,
    description: 'Пряная морковная основа и крем-чиз с ноткой апельсина.' },
  { id: 'c11', name: 'Летний бисквит', category: 'wedding', weight: 3.5, price: 9800, tiers: 2, available: false,
    description: 'Лёгкий бисквит, свежие ягоды и акварельная роспись глазурью.' },
  { id: 'c12', name: 'Шоколадная фантазия', category: 'custom', weight: 2.2, price: 5900, tiers: 1, available: true,
    description: 'Три вида шоколада, хрустящее пралине и зеркальная глазурь.' }
];

const ROLE_LABELS = { client: 'Клиент', manager: 'Менеджер', admin: 'Администратор' };

const DEFAULT_USERS = [
  { id: 'u1', name: 'Мария Соколова', email: 'maria@example.com', password: '123456',
    role: 'client', addresses: ['г. Москва, ул. Пекарная, д. 5, кв. 12'] },
  { id: 'u2', name: 'Иван Петров', email: 'ivan@example.com', password: '123456',
    role: 'client', addresses: ['г. Москва, Кремовый пер., д. 8'] }
];

const DEFAULT_ORDERS = [
  { id: 'o1001', userId: 'u1', items: [{ cakeId: 'c1', qty: 1 }], total: 8900,
    status: 'delivered', date: '2026-07-02', deliveryDate: '2026-07-10',
    name: 'Мария Соколова', phone: '+7 900 111-22-33', address: 'г. Москва, ул. Пекарная, д. 5, кв. 12', comment: 'Позвонить за час' },
  { id: 'o1002', userId: 'u1', items: [{ cakeId: 'c9', qty: 2 }], total: 3800,
    status: 'ready', date: '2026-08-01', deliveryDate: '2026-08-18',
    name: 'Мария Соколова', phone: '+7 900 111-22-33', address: 'г. Москва, ул. Пекарная, д. 5, кв. 12', comment: '' },
  { id: 'o1003', userId: 'u2', items: [{ cakeId: 'c3', qty: 1 }, { cakeId: 'c8', qty: 1 }], total: 6300,
    status: 'in_progress', date: '2026-08-10', deliveryDate: '2026-08-20',
    name: 'Иван Петров', phone: '+7 900 222-33-44', address: 'г. Москва, Кремовый пер., д. 8', comment: 'Свеча с цифрой 5' },
  { id: 'o1004', userId: null, items: [{ cakeId: 'c6', qty: 1 }], total: 6800,
    status: 'new', date: '2026-08-15', deliveryDate: '2026-08-25',
    name: 'Ольга Кузнецова', phone: '+7 900 333-44-55', address: 'г. Москва, Сдобная ул., д. 2', comment: 'Без орехов' }
];

const DEFAULT_REVIEWS = [
  { id: 'r1', name: 'Анастасия', text: 'Заказывала свадебный торт — это было потрясающе красиво и очень вкусно. Гости до сих пор вспоминают!', rating: 5 },
  { id: 'r2', name: 'Дмитрий', text: 'Сделали сыну торт с динозаврами — восторгу не было предела. Спасибо за внимание к деталям.', rating: 5 },
  { id: 'r3', name: 'Елена', text: 'Очень вкусный медовик, доставили точно ко времени. Буду заказывать ещё.', rating: 4 },
  { id: 'r4', name: 'Сергей', text: 'Заказывал именной торт на юбилей — сделали ровно так, как просили. Спасибо большое!', rating: 5 }
];

const ADMIN_CREDENTIALS = { login: 'admin', password: 'admin2026' };

const DEFAULT_SETTINGS = {
  social: {
    instagram: '',
    telegram: '',
    vk: '',
    whatsapp: ''
  },
  contact: {
    phone: '+7 (495) 123-45-67',
    email: 'hello@lakomy-kusochek.ru',
    address: 'г. Москва, ул. Пекарная, д. 5, вход со двора',
    hours: 'Ежедневно, 9:00–21:00'
  }
};

/* ===================================================================
   Общая база данных — Supabase (бесплатная база данных с мгновенным
   realtime). Если адрес в js/backend-config.js ещё не заполнен
   реальным значением, приложение работает в локальном демо-режиме
   на DEFAULT_*-данных ниже (как раньше) — ничего не ломается.
   =================================================================== */
const API_URL = (
  typeof SUPABASE_URL === 'string' && SUPABASE_URL.startsWith('http') &&
  typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY.length > 10
) ? SUPABASE_URL.replace(/\/$/, '') : null;

/* Клиент Supabase (создаётся только если настройки заполнены) */
const supabaseClient = API_URL
  ? window.supabase.createClient(API_URL, SUPABASE_ANON_KEY)
  : null;

if (!API_URL) {
  console.warn('[Лакомый кусочек] Общий бэкенд не настроен — данные видны только в этом браузере. Смотрите js/backend-config.js.');
}

async function apiGet(table) {
  const { data, error } = await supabaseClient.from(table).select('*');
  if (error) throw new Error('Ошибка Supabase (' + table + '): ' + error.message);
  return data;
}

async function apiUpsert(table, rows) {
  if (!rows || !rows.length) return;
  const { error } = await supabaseClient.from(table).upsert(rows);
  if (error) throw new Error('Ошибка Supabase (' + table + '): ' + error.message);
}

async function apiDelete(table, ids) {
  if (!ids || !ids.length) return;
  const { error } = await supabaseClient.from(table).delete().in('id', ids);
  if (error) throw new Error('Ошибка Supabase (' + table + '): ' + error.message);
}

let cakesCache = [];
let ordersCache = [];
let usersCache = [];
let settingsCache = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

/* Подписчики на изменения данных (main.js / admin.js регистрируют свои перерисовки) */
const dataChangeListeners = [];
function onDataChange(fn) { dataChangeListeners.push(fn); }
function notifyDataChange(table) {
  dataChangeListeners.forEach(fn => { try { fn(table); } catch (err) { console.error(err); } });
}

async function reloadCakes() {
  try { cakesCache = await apiGet('cakes') || []; }
  catch (error) { console.error('reloadCakes', error); }
}
async function reloadOrders() {
  try { ordersCache = await apiGet('orders') || []; }
  catch (error) { console.error('reloadOrders', error); }
}
async function reloadUsers() {
  try { usersCache = await apiGet('users') || []; }
  catch (error) { console.error('reloadUsers', error); }
}
async function reloadSettings() {
  try {
    const data = await apiGet('settings');
    const row = Array.isArray(data) ? data[0] : data;
    if (row) settingsCache = { social: row.social || {}, contact: row.contact || {} };
  } catch (error) { console.error('reloadSettings', error); }
}

/* Загружает все данные при старте страницы. При первом запуске (пустая
   база) заполняет её тестовыми данными из DEFAULT_* — так же, как раньше
   работал localStorage-демо-режим, только теперь это видно всем. */
async function initData() {
  if (!API_URL) {
    cakesCache = JSON.parse(localStorage.getItem(STORAGE_KEYS.cakes) || 'null') || JSON.parse(JSON.stringify(DEFAULT_CAKES));
    ordersCache = JSON.parse(localStorage.getItem(STORAGE_KEYS.orders) || 'null') || JSON.parse(JSON.stringify(DEFAULT_ORDERS));
    usersCache = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || 'null') || JSON.parse(JSON.stringify(DEFAULT_USERS));
    settingsCache = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || 'null') || JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    chatsCache = JSON.parse(localStorage.getItem(STORAGE_KEYS.supportChats) || '{}');
    localStorage.setItem(STORAGE_KEYS.cakes, JSON.stringify(cakesCache));
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(ordersCache));
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(usersCache));
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settingsCache));
    seedLocalOnly();
    return;
  }

  try {
    await Promise.all([reloadCakes(), reloadOrders(), reloadUsers(), reloadSettings(), reloadSupportChats()]);

    if (cakesCache.length === 0) {
      await apiUpsert('cakes', DEFAULT_CAKES);
      await apiUpsert('users', DEFAULT_USERS);
      await apiUpsert('orders', DEFAULT_ORDERS);
      await apiUpsert('settings', [{ id: 1, ...DEFAULT_SETTINGS }]);
      await Promise.all([reloadCakes(), reloadOrders(), reloadUsers(), reloadSettings()]);
    }

    /* Мгновенные обновления через Supabase Realtime: как только кто-то
       (клиент оформляет заказ, админ меняет каталог и т.д.) меняет
       данные, сервер сам присылает уведомление всем открытым вкладкам
       — без опроса по таймеру, без задержек. */
    const realtimeTables = ['cakes', 'orders', 'users', 'settings', 'support_chats'];
    let channel = supabaseClient.channel('public:all-changes');
    realtimeTables.forEach((table) => {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, async () => {
        if (table === 'cakes') await reloadCakes();
        if (table === 'orders') await reloadOrders();
        if (table === 'users') await reloadUsers();
        if (table === 'settings') await reloadSettings();
        if (table === 'support_chats') await reloadSupportChats();
        notifyDataChange(table);
      });
    });
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') console.log('[Лакомый кусочек] Realtime подключён — обновления мгновенные.');
    });
  } catch (err) {
    console.error('[Лакомый кусочек] Не удалось подключиться к бэкенду, работаю в локальном демо-режиме.', err);
    if (cakesCache.length === 0) cakesCache = JSON.parse(JSON.stringify(DEFAULT_CAKES));
    if (ordersCache.length === 0) ordersCache = JSON.parse(JSON.stringify(DEFAULT_ORDERS));
    if (usersCache.length === 0) usersCache = JSON.parse(JSON.stringify(DEFAULT_USERS));
  }

  seedLocalOnly();
}

/* Данные, которые остаются только в этом браузере (корзина, чат поддержки, отзывы) */
function seedLocalOnly() {
  if (!localStorage.getItem(STORAGE_KEYS.reviews)) {
    localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(DEFAULT_REVIEWS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.cart)) {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify([]));
  }
}

function getCakes() { return cakesCache; }
async function setCakes(newCakes) {
  const removedIds = cakesCache.map(c => c.id).filter(id => !newCakes.some(c => c.id === id));
  cakesCache = newCakes;
  notifyDataChange('cakes');
  if (!API_URL) { localStorage.setItem(STORAGE_KEYS.cakes, JSON.stringify(cakesCache)); return; }
  try {
    await apiDelete('cakes', removedIds);
    await apiUpsert('cakes', newCakes);
  } catch (err) { console.error('setCakes', err); }
}

function getUsers() { return usersCache; }
async function setUsers(newUsers) {
  const removedIds = usersCache.map(u => u.id).filter(id => !newUsers.some(u => u.id === id));
  usersCache = newUsers;
  notifyDataChange('users');
  if (!API_URL) { localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(usersCache)); return; }
  try {
    await apiDelete('users', removedIds);
    await apiUpsert('users', newUsers);
  } catch (err) { console.error('setUsers', err); }
}

function getOrders() { return ordersCache; }
async function setOrders(newOrders) {
  const removedIds = ordersCache.map(o => o.id).filter(id => !newOrders.some(o => o.id === id));
  ordersCache = newOrders;
  notifyDataChange('orders');
  if (!API_URL) { localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(ordersCache)); return; }
  try {
    await apiDelete('orders', removedIds);
    await apiUpsert('orders', newOrders);
  } catch (err) { console.error('setOrders', err); }
}

function getReviews() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.reviews) || '[]'); }
function setReviews(reviews) { localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews)); }
function addReview(review) {
  const reviews = getReviews();
  reviews.unshift({
    id: 'r' + Date.now(),
    name: review.name,
    text: review.text,
    rating: review.rating
  });
  setReviews(reviews);
  return reviews;
}

function getSettings() {
  return {
    social: { ...DEFAULT_SETTINGS.social, ...(settingsCache.social || {}) },
    contact: { ...DEFAULT_SETTINGS.contact, ...(settingsCache.contact || {}) }
  };
}
async function setSettings(settings) {
  settingsCache = settings;
  notifyDataChange('settings');
  if (!API_URL) { localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settingsCache)); return; }
  try {
    await apiUpsert('settings', [{ id: 1, social: settings.social, contact: settings.contact }]);
  } catch (err) { console.error('setSettings', err); }
}

/* ---------------------- Поддержка (чат) ----------------------
   У каждого посетителя (visitorId, привязан к браузеру) может быть
   несколько отдельных переписок (chatId) — новая начинается кнопкой
   «Новый чат». Все переписки общие для всех устройств через бэкенд
   (или только в этом браузере — в демо-режиме без бэкенда). */
function getVisitorId() {
  let id = localStorage.getItem(STORAGE_KEYS.visitorId);
  if (!id) {
    id = 'v' + Date.now() + Math.random().toString(36).slice(-4);
    localStorage.setItem(STORAGE_KEYS.visitorId, id);
  }
  return id;
}

/* Текущая переписка этого браузера. «Новый чат» создаёт новый id
   и делает его текущим — старая переписка остаётся в истории. */
function getCurrentChatId() {
  let id = localStorage.getItem(STORAGE_KEYS.currentChatId);
  if (!id) { id = startNewChatId(); }
  return id;
}
function startNewChatId() {
  const id = 'sc' + Date.now() + Math.random().toString(36).slice(-4);
  localStorage.setItem(STORAGE_KEYS.currentChatId, id);
  return id;
}

let chatsCache = {};
function getSupportChats() { return chatsCache; }
function getSupportChat(chatId) { return chatsCache[chatId] || null; }

async function reloadSupportChats() {
  try {
    const rows = await apiGet('support_chats');
    const map = {};
    (rows || []).forEach(r => { map[r.id] = r; });
    chatsCache = map;
  } catch (error) { console.error('reloadSupportChats', error); }
}

function saveSupportChat(chat) {
  chatsCache[chat.id] = chat;
  if (!API_URL) { localStorage.setItem(STORAGE_KEYS.supportChats, JSON.stringify(chatsCache)); return; }
  apiUpsert('support_chats', [chat]).catch(err => console.error('saveSupportChat', err));
}

/* Добавляет сообщение в переписку и возвращает обновлённый чат.
   from: 'user' | 'bot' | 'admin' */
function addSupportMessage(chatId, from, text, extra) {
  const chat = chatsCache[chatId] || {
    id: chatId,
    visitorId: (extra && extra.visitorId) || chatId,
    name: (extra && extra.name) || 'Гость',
    messages: [],
    unreadForAdmin: false,
    unreadForUser: false,
    updatedAt: Date.now()
  };
  chat.messages = [...chat.messages, { from, text, time: Date.now() }];
  chat.updatedAt = Date.now();
  if (from === 'user') chat.unreadForAdmin = true;
  if (from === 'admin') chat.unreadForUser = true;
  saveSupportChat(chat);
  notifyDataChange('support_chats');
  return chat;
}

function markSupportChatRead(chatId, who) {
  const chat = chatsCache[chatId];
  if (!chat) return;
  if (who === 'admin') chat.unreadForAdmin = false;
  if (who === 'user') chat.unreadForUser = false;
  saveSupportChat(chat);
  notifyDataChange('support_chats');
}

function formatPrice(value) {
  return value.toLocaleString('ru-RU') + ' ₽';
}

/* Маленькое превью для таблиц: первое прикреплённое фото/видео, либо SVG-заглушка */
function cakeThumbHTML(cake) {
  const media = Array.isArray(cake.media) ? cake.media : [];
  if (media.length === 0) return cakeIllustrationSVG(cake);
  const m = media[0];
  return m.type === 'video'
    ? `<video src="${m.url}" muted></video>`
    : `<img src="${m.url}" alt="${cake.name}">`;
}

/* Карусель фото/видео торта для карточки в каталоге. Если медиа нет — SVG-заглушка. */
function cakeGalleryHTML(cake) {
  const media = Array.isArray(cake.media) ? cake.media : [];
  if (media.length === 0) return cakeIllustrationSVG(cake);

  const slides = media.map((m, i) => `
    <div class="cake-gallery-slide ${i === 0 ? 'is-active' : ''}" data-index="${i}">
      ${m.type === 'video'
        ? `<video src="${m.url}" muted loop playsinline controls></video>`
        : `<img src="${m.url}" alt="${cake.name}">`}
    </div>
  `).join('');

  const controls = media.length > 1 ? `
    <button type="button" class="cake-gallery-arrow prev" aria-label="Предыдущее фото">‹</button>
    <button type="button" class="cake-gallery-arrow next" aria-label="Следующее фото">›</button>
    <div class="cake-gallery-dots">
      ${media.map((_, i) => `<span class="cake-gallery-dot ${i === 0 ? 'is-active' : ''}" data-index="${i}"></span>`).join('')}
    </div>
  ` : '';

  return `<div class="cake-gallery">${slides}${controls}</div>`;
}

/* Простая инлайн SVG-иллюстрация торта — рисуется по палитре категории,
   чтобы не зависеть от внешних изображений */
function cakeIllustrationSVG(cake) {
  const p = CAKE_PALETTES[cake.category] || CAKE_PALETTES.daily;
  const tiers = Math.min(cake.tiers || 1, 3);
  let layers = '';
  const layerHeights = tiers === 3 ? [34, 26, 18] : tiers === 2 ? [40, 28] : [46];
  const widths = tiers === 3 ? [150, 110, 74] : tiers === 2 ? [150, 104] : [140];
  let y = 168;
  for (let i = 0; i < tiers; i++) {
    const w = widths[i];
    const h = layerHeights[i];
    const x = (240 - w) / 2;
    y -= h;
    layers += `
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${p.crumb}" stroke="${p.accent}" stroke-width="1.5"/>
      <rect x="${x}" y="${y}" width="${w}" height="${Math.max(h*0.42,10)}" rx="10" fill="${p.icing}" opacity="0.95"/>
    `;
  }
  return `
  <svg viewBox="0 0 240 190" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${cake.name}">
    <rect x="0" y="0" width="240" height="190" fill="${p.base}"/>
    <ellipse cx="120" cy="172" rx="86" ry="10" fill="${p.accent}" opacity="0.18"/>
    ${layers}
    <circle cx="120" cy="${y-6}" r="3.2" fill="${p.accent}"/>
    <path d="M120 ${y-6} q3 -14 -2 -20" stroke="${p.accent}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M64 176 q10 -8 20 0 q10 -8 20 0" stroke="${p.accent}" stroke-width="2" fill="none" opacity="0.5" stroke-linecap="round"/>
    <path d="M136 176 q10 -8 20 0 q10 -8 20 0" stroke="${p.accent}" stroke-width="2" fill="none" opacity="0.5" stroke-linecap="round"/>
  </svg>`;
}
