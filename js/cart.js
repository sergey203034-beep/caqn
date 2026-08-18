/* ===================================================================
   «Лакомый кусочек» — корзина
   =================================================================== */

function getCart() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || '[]');
}

function setCart(cart) {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
}

function addToCart(cakeId, qty = 1) {
  const cart = getCart();
  const existing = cart.find(i => i.cakeId === cakeId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ cakeId, qty });
  }
  setCart(cart);
  return cart;
}

function updateCartQty(cakeId, qty) {
  let cart = getCart();
  if (qty <= 0) {
    cart = cart.filter(i => i.cakeId !== cakeId);
  } else {
    const item = cart.find(i => i.cakeId === cakeId);
    if (item) item.qty = qty;
  }
  setCart(cart);
  return cart;
}

function removeFromCart(cakeId) {
  const cart = getCart().filter(i => i.cakeId !== cakeId);
  setCart(cart);
  return cart;
}

function clearCart() {
  setCart([]);
}

function getCartDetails() {
  const cakes = getCakes();
  const cart = getCart();
  const items = cart.map(i => {
    const cake = cakes.find(c => c.id === i.cakeId);
    return cake ? { ...i, cake } : null;
  }).filter(Boolean);
  const total = items.reduce((sum, i) => sum + i.cake.price * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);
  return { items, total, count };
}
