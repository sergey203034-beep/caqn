/* ===================================================================
   «Лакомый кусочек» — каталог
   =================================================================== */

let currentFilter = 'all';

function renderCakeCard(cake) {
  const disabled = !cake.available;
  return `
  <article class="cake-card" data-id="${cake.id}">
    <div class="cake-media">
      ${cakeGalleryHTML(cake)}
      <span class="cake-tag">${CATEGORY_LABELS[cake.category]}</span>
      ${disabled ? '<div class="cake-unavailable">Нет в наличии</div>' : ''}
    </div>
    <div class="cake-body">
      <h3>${cake.name}</h3>
      <div class="cake-meta">
        <span>${cake.weight} кг</span>
        <span>·</span>
        <span>${cake.tiers > 1 ? cake.tiers + ' яруса' : '1 ярус'}</span>
      </div>
      <p class="cake-desc">${cake.description}</p>
      <div class="cake-foot">
        <span class="cake-price">${formatPrice(cake.price)}</span>
        <button class="btn btn-primary btn-sm add-to-cart-btn" data-id="${cake.id}" ${disabled ? 'disabled' : ''}>
          В корзину
        </button>
      </div>
    </div>
  </article>`;
}

function renderCatalog() {
  const grid = document.getElementById('cakeGrid');
  if (!grid) return;
  const cakes = getCakes();
  const filtered = currentFilter === 'all' ? cakes : cakes.filter(c => c.category === currentFilter);

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">В этой категории пока нет тортов.</div>`;
    return;
  }
  grid.innerHTML = filtered.map(renderCakeCard).join('');

  grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      addToCart(btn.dataset.id, 1);
      updateCartUI();
      showToast('Торт добавлен в корзину');
    });
  });

  initCakeGalleries(grid);
}

function initCakeGalleries(container) {
  container.querySelectorAll('.cake-gallery').forEach(gallery => {
    const slides = gallery.querySelectorAll('.cake-gallery-slide');
    const dots = gallery.querySelectorAll('.cake-gallery-dot');
    const prev = gallery.querySelector('.cake-gallery-arrow.prev');
    const next = gallery.querySelector('.cake-gallery-arrow.next');
    let current = 0;

    const show = (idx) => {
      current = (idx + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === current));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
    };

    if (prev) prev.addEventListener('click', (e) => { e.stopPropagation(); show(current - 1); });
    if (next) next.addEventListener('click', (e) => { e.stopPropagation(); show(current + 1); });
    dots.forEach(dot => dot.addEventListener('click', (e) => {
      e.stopPropagation();
      show(parseInt(dot.dataset.index, 10));
    }));
  });
}

function initFilters() {
  const filters = document.getElementById('filters');
  if (!filters) return;
  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;
    filters.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('is-active'));
    btn.classList.add('is-active');
    currentFilter = btn.dataset.filter;
    renderCatalog();
  });
}
