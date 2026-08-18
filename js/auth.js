/* ===================================================================
   «Лакомый кусочек» — авторизация клиентов
   =================================================================== */

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
function registerUser({ name, email, password, confirmPassword }) {
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
    password,
    role: 'client',
    addresses: []
  };
  users.push(user);
  setUsers(users);
  setSession(user.id);
  return { ok: true, user };
}

function loginUser({ email, password }) {
  email = (email || '').trim().toLowerCase();
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email);
  if (!user || user.password !== password) {
    return { ok: false, error: 'Неверный e-mail или пароль.' };
  }
  setSession(user.id);
  return { ok: true, user };
}

function logoutUser() {
  clearSession();
}

/* Проверяет, есть ли среди зарегистрированных пользователей сотрудник
   (менеджер/администратор) с такими логином (e-mail) и паролем */
function findStaffUser(login, password) {
  const email = (login || '').trim().toLowerCase();
  const user = getUsers().find(u => u.email.toLowerCase() === email);
  if (!user || user.password !== password) return null;
  if (user.role !== 'admin' && user.role !== 'manager') return null;
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
   и «отправляет» его (показывает пользователю в интерфейсе) */
function requestPasswordReset(email) {
  email = (email || '').trim().toLowerCase();
  const users = getUsers();
  const idx = users.findIndex(u => u.email.toLowerCase() === email);
  if (idx === -1) {
    return { ok: false, error: 'Пользователь с таким e-mail не найден.' };
  }
  const tempPassword = Math.random().toString(36).slice(-8);
  users[idx].password = tempPassword;
  setUsers(users);
  return { ok: true, tempPassword };
}
