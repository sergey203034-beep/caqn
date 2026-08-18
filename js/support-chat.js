// ===================== SUPPORT CHAT WIDGET =====================
(function () {
  const root = document.getElementById('supportChat');
  const toggle = document.getElementById('supportChatToggle');
  const closeBtn = document.getElementById('supportChatClose');
  const newChatBtn = document.getElementById('supportChatNewBtn');
  const panel = document.getElementById('supportChatPanel');
  const body = document.getElementById('supportChatBody');
  const form = document.getElementById('supportChatForm');
  const input = document.getElementById('supportChatInput');
  const badge = document.getElementById('supportChatBadge');
  const quickWrap = document.getElementById('supportChatQuick');

  if (!root) return;

  const visitorId = getVisitorId();
  let currentChatId = getCurrentChatId();
  let opened = false;
  let renderedCount = 0;

  const REPLIES = [
    {
      match: /заказ|оформ/i,
      text: 'Оформить заказ просто: выберите торт в каталоге, добавьте в корзину и нажмите «Оформить заказ». Укажите дату и адрес доставки — мы свяжемся для подтверждения.'
    },
    {
      match: /доставк/i,
      text: 'Доставляем ежедневно с 9:00 до 21:00. Стоимость от 350 ₽, а при заказе от 5 000 ₽ — бесплатно.'
    },
    {
      match: /дизайн|свой эскиз|индивидуальн/i,
      text: 'Конечно! Пришлите эскиз или описание идеи — обсудим начинку, вес и оформление торта индивидуально.'
    },
    {
      match: /цен|стоимост|сколько стоит/i,
      text: 'Стоимость зависит от размера, начинки и оформления — посмотрите каталог или напишите пожелания, и мы посчитаем точную цену.'
    },
    {
      match: /привет|здравств/i,
      text: 'Здравствуйте! 👋 Чем можем помочь с выбором или заказом торта?'
    },
    {
      match: /спасибо/i,
      text: 'Пожалуйста! Если появятся ещё вопросы — мы на связи 🍰'
    }
  ];

  function fmtTime(ts) {
    const d = ts ? new Date(ts) : new Date();
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function renderMessage(m) {
    const msg = document.createElement('div');
    const from = m.from === 'user' ? 'user' : 'bot'; // и бот, и оператор визуально — «слева»
    msg.className = 'support-msg ' + (from === 'user' ? 'support-msg-user' : 'support-msg-bot');
    const p = document.createElement('div');
    p.textContent = m.text;
    const time = document.createElement('span');
    time.className = 'support-msg-time';
    time.textContent = (m.from === 'admin' ? 'Оператор · ' : '') + fmtTime(m.time);
    msg.appendChild(p);
    msg.appendChild(time);
    body.appendChild(msg);
  }

  /* Дорисовывает только новые сообщения текущей переписки (не дублируя) */
  function syncFromStore(scrollAfter) {
    const chat = getSupportChat(currentChatId);
    const messages = chat ? chat.messages : [];
    for (let i = renderedCount; i < messages.length; i++) {
      renderMessage(messages[i]);
    }
    const hadNew = messages.length > renderedCount;
    renderedCount = messages.length;
    if (hadNew && scrollAfter !== false) scrollToBottom();
    return hadNew;
  }

  function showTyping() {
    const t = document.createElement('div');
    t.className = 'support-typing';
    t.id = 'supportTyping';
    t.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(t);
    scrollToBottom();
  }

  function hideTyping() {
    const t = document.getElementById('supportTyping');
    if (t) t.remove();
  }

  function currentVisitorName() {
    const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    return user ? user.name : 'Гость с сайта';
  }

  function sendBotReply(userText) {
    showTyping();
    const found = REPLIES.find(r => r.match.test(userText));
    const text = found
      ? found.text
      : 'Спасибо за сообщение! Наш специалист скоро подключится и ответит подробнее. А пока можете посмотреть каталог или раздел «Доставка».';
    const delay = 700 + Math.random() * 700;
    setTimeout(() => {
      hideTyping();
      addSupportMessage(currentChatId, 'bot', text, { name: currentVisitorName(), visitorId });
      syncFromStore();
    }, delay);
  }

  function greetIfEmpty() {
    const existing = getSupportChat(currentChatId);
    if (!existing || existing.messages.length === 0) {
      showTyping();
      setTimeout(() => {
        hideTyping();
        addSupportMessage(currentChatId, 'bot', 'Здравствуйте! Это поддержка кондитерской «Лакомый кусочек» 🍰 Чем можем помочь?', { name: currentVisitorName(), visitorId });
        syncFromStore();
      }, 600);
    }
  }

  function openChat() {
    opened = true;
    root.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    badge.classList.add('hidden');
    markSupportChatRead(currentChatId, 'user');
    greetIfEmpty();
    setTimeout(() => input.focus(), 250);
  }

  function closeChat() {
    opened = false;
    root.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  /* Начинает новую отдельную переписку — старая остаётся в истории
     у оператора, но в этом окне показывается уже пустой новый чат. */
  function startNewChat() {
    currentChatId = startNewChatId();
    renderedCount = 0;
    body.innerHTML = '';
    greetIfEmpty();
    input.focus();
  }

  toggle.addEventListener('click', () => {
    if (opened) closeChat(); else openChat();
  });
  closeBtn.addEventListener('click', closeChat);
  if (newChatBtn) newChatBtn.addEventListener('click', startNewChat);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addSupportMessage(currentChatId, 'user', text, { name: currentVisitorName(), visitorId });
    syncFromStore();
    input.value = '';
    sendBotReply(text);
  });

  quickWrap.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-quick]');
    if (!btn) return;
    const text = btn.getAttribute('data-quick');
    addSupportMessage(currentChatId, 'user', text, { name: currentVisitorName(), visitorId });
    syncFromStore();
    sendBotReply(text);
  });

  // Показываем прошлую переписку (если пользователь уже писал раньше)
  syncFromStore(false);

  // Реагируем на ответы оператора в реальном времени — на этом же
  // устройстве (пока данные ещё грузятся из бэкенда) и с других
  // устройств/вкладок через общий опрос сервера (см. onDataChange в data.js).
  function handleUpdate() {
    const hadNew = syncFromStore(opened);
    if (hadNew && !opened) badge.classList.remove('hidden');
    if (hadNew && opened) markSupportChatRead(currentChatId, 'user');
  }
  if (typeof onDataChange === 'function') {
    onDataChange((table) => { if (table === 'support_chats') handleUpdate(); });
  }
  // Доп. подстраховка для локального демо-режима без бэкенда: синхронизация
  // между вкладками одного браузера через встроенное событие storage.
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEYS.supportChats) return;
    handleUpdate();
  });

  // показать бейдж "1" через пару секунд после загрузки, если чат ещё не открыт
  setTimeout(() => {
    if (!opened) badge.classList.remove('hidden');
  }, 4000);
})();
