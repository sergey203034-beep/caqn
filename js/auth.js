/* ===================================================================
   «Лакомый кусочек» — авторизация клиентов
   -------------------------------------------------------------------
   Пароли никогда не хранятся и не передаются в открытом виде: перед
   сохранением каждый пароль хешируется (SHA-256 со случайной «солью»
   на каждого пользователя) через встроенный в браузер Web Crypto API
   — никаких внешних библиотек не требуется. В базе данных виден
   только нечитаемый хеш, а не сам пароль.

   Если в базе остался старый аккаунт с паролем в открытом виде (из
   версии сайта до этого обновления), при следующем успешном входе он
   автоматически «доводится» до хешированного вида — ничего вручную
   чинить не нужно.
   =================================================================== */

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes.buffer);
}

async function hashPassword(password, salt) {
  const encoded = new TextEncoder().encode(salt + ':' + password);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return bufferToHex(digest);
}

/* Проверяет пароль против записи пользователя. Понимает как новые
   (хешированные, с полем salt), так и старые (открытые, без salt)
   записи — во втором случае сравнивает напрямую. */
async function verifyPassword(user, password) {
  if (!user) return false;
  if (user.salt) {
    const hash = await hashPassword(password, user.salt);
    return hash === user.password;
  }
  return user.password === password;
}

/* Перезаписывает пароль пользователя хешированным вариантом (используется
   как при регистрации/смене пароля, так и для «тихой» миграции старых
   открытых паролей после успешного входа). */
async function setUserPassword(user, plainPassword) {
  const salt = generateSalt();
  user.salt = salt;
  user.password = await hashPassword(plainPassword, salt);
  return user;
}

function getSession() {
  const raw = localStorage.getItem(STORAGE_KEYS.session);
  return raw ? JSON.parse(raw) : null;
}

function setSession(userId) {
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ userId }));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
}

function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return getUsers().find(u => u.id === session.userId) || null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

/* Возвращает { ok: bool, error?: string, user? } */
async function registerUser({ name, email, password, confirmPassword }) {
  name = (name || '').trim();
  email = (email || '').trim().toLowerCase();

  if (!name) return { ok: false, error: 'Пожалуйста, укажите имя.' };
  if (!isValidEmail(email)) return { ok: false, error: 'Введите корректный e-mail.' };
  if (!isValidPassword(password)) return { ok: false, error: 'Пароль должен содержать не менее 6 символов.' };
  if (password !== confirmPassword) return { ok: false, error: 'Пароли не совпадают.' };

  const users = getUsers();
  if (users.some(u => u.email.toLowerCase() === email)) {
    return { ok: false, error: 'Этот e-mail уже зарегистрирован.' };
  }

  const user = {
    id: 'u' + Date.now(),
    name,
    email,
    role: 'client',
    addresses: []
  };
  await setUserPassword(user, password);
  users.push(user);
  await setUsers(users);
  setSession(user.id);
  return { ok: true, user };
}

async function loginUser({ email, password }) {
  email = (email || '').trim().toLowerCase();
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email);
  if (!user || !(await verifyPassword(user, password))) {
    return { ok: false, error: 'Неверный e-mail или пароль.' };
  }
  if (!user.salt) {
    /* Тихая миграция: старый открытый пароль заменяем хешем */
    await setUserPassword(user, password);
    await setUsers(users);
  }
  setSession(user.id);
  return { ok: true, user };
}

function logoutUser() {
  clearSession();
}

/* Проверяет, есть ли среди зарегистрированных пользователей сотрудник
   (менеджер/администратор) с такими логином (e-mail) и паролем */
async function findStaffUser(login, password) {
  const email = (login || '').trim().toLowerCase();
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email);
  if (!user || !(await verifyPassword(user, password))) return null;
  if (user.role !== 'admin' && user.role !== 'manager') return null;
  if (!user.salt) {
    await setUserPassword(user, password);
    await setUsers(users);
  }
  return user;
}

function updateUserProfile(userId, updates) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { ok: false, error: 'Пользователь не найден.' };
  users[idx] = { ...users[idx], ...updates };
  setUsers(users);
  return { ok: true, user: users[idx] };
}

function addUserAddress(userId, address) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { ok: false };
  address = (address || '').trim();
  if (!address) return { ok: false, error: 'Введите адрес.' };
  users[idx].addresses = users[idx].addresses || [];
  users[idx].addresses.push(address);
  setUsers(users);
  return { ok: true, user: users[idx] };
}

/* Имитация восстановления пароля: генерирует временный пароль
   и «отправляет» его (показывает пользователю в интерфейсе). Сам
   временный пароль в базе, как и обычный, хранится только в виде
   хеша — открытым текстом он лишь один раз показывается пользователю. */
async function requestPasswordReset(email) {
  email = (email || '').trim().toLowerCase();
  const users = getUsers();
  const idx = users.findIndex(u => u.email.toLowerCase() === email);
  if (idx === -1) {
    return { ok: false, error: 'Пользователь с таким e-mail не найден.' };
  }
  const tempPassword = Math.random().toString(36).slice(-8);
  await setUserPassword(users[idx], tempPassword);
  await setUsers(users);
  return { ok: true, tempPassword };
}
