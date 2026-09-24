const body = document.body;
const productSlug = body.dataset.productSlug;
const productName = body.dataset.productName;

const state = { model: 'PS5 Disc', coverage: null, price: 0, qty: 1 };

const priceDisplay = document.getElementById('priceDisplay');
const stickyPrice = document.getElementById('stickyPrice');
const mainImage = document.getElementById('mainImage');
const coverageSelected = document.getElementById('coverageSelected');
const modelSelected = document.getElementById('modelSelected');

const activeCoverage = document.querySelector('#coveragePills .coverage-card.active') || document.querySelector('#coveragePills .coverage-card');
if (activeCoverage) {
  state.coverage = activeCoverage.dataset.coverage;
  state.price = parseFloat(activeCoverage.dataset.price);
}

function formatPrice(p){ return window.OwnItCart.pkr(p); }
function refreshPrice(){
  const total = state.price * state.qty;
  priceDisplay.textContent = window.OwnItCart.pkr(state.price);
  stickyPrice.textContent = formatPrice(total);
}

document.querySelectorAll('#modelPills .pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#modelPills .pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.model = btn.dataset.model;
    modelSelected.textContent = state.model;
  });
});

document.querySelectorAll('#coveragePills .coverage-card').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#coveragePills .coverage-card').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.coverage = btn.dataset.coverage;
    state.price = parseFloat(btn.dataset.price);
    coverageSelected.textContent = state.coverage;
    mainImage.src = btn.dataset.img;
    document.querySelectorAll('.gallery-thumb').forEach(t => {
      t.classList.toggle('active', t.dataset.img === btn.dataset.img);
      t.setAttribute('aria-selected', t.dataset.img === btn.dataset.img ? 'true' : 'false');
    });
    refreshPrice();
  });
});

document.querySelectorAll('.gallery-thumb').forEach(thumb => {
  thumb.addEventListener('click', () => {
    mainImage.src = thumb.dataset.img;
    document.querySelectorAll('.gallery-thumb').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
    thumb.classList.add('active');
    thumb.setAttribute('aria-selected','true');
  });
});

const qtyValue = document.getElementById('qtyValue');
document.getElementById('qtyMinus').addEventListener('click', () => {
  state.qty = Math.max(1, state.qty - 1);
  qtyValue.textContent = state.qty;
  refreshPrice();
});
document.getElementById('qtyPlus').addEventListener('click', () => {
  state.qty = Math.min(9, state.qty + 1);
  qtyValue.textContent = state.qty;
  refreshPrice();
});

function addMainToCart(){
  window.OwnItCart.addToCart({
    id: productSlug,
    name: productName,
    variant: state.model + ' · ' + state.coverage,
    price: state.price,
    image: mainImage.src,
    qty: state.qty
  });
}
document.getElementById('addToCartBtn').addEventListener('click', addMainToCart);
document.getElementById('stickyAddBtn').addEventListener('click', addMainToCart);

const bundleBtn = document.getElementById('bundleAddBtn');
if (bundleBtn) {
  bundleBtn.addEventListener('click', () => {
    window.OwnItCart.addToCart({
      id: productSlug + '-controller',
      name: productName + ' Controller Skin',
      variant: 'Controller Only',
      price: 500,
      image: bundleBtn.dataset.img || mainImage.src,
      qty: 1
    });
  });
}

const stickyBar = document.getElementById('stickyBar');
const addBtnRef = document.getElementById('addToCartBtn');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => stickyBar.classList.toggle('show', !entry.isIntersecting));
}, { threshold: 0 });
observer.observe(addBtnRef);

refreshPrice();
