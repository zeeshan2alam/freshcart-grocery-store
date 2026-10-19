(() => {
  const $ = id => document.getElementById(id);
  const KEYS = { products: 'fc_products', session: 'fc_session', theme: 'fc_theme', users: 'fc_users', orders: 'fc_orders', cart: 'fc_cart_' };
  const CATS = ['Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Grains & Pulses', 'Snacks', 'Beverages', 'Household'];
  const CAT_EMOJI = { Fruits: '🍎', Vegetables: '🥕', Dairy: '🥛', Bakery: '🍞', 'Grains & Pulses': '🌾', Snacks: '🍪', Beverages: '🧃', Household: '🧼' };
  const ADMIN = { email: 'admin@freshcart.com', password: 'admin123', name: 'Admin' };
  const DEMO_USER = { email: 'user@freshcart.com', password: 'user123', name: 'Demo User' };
  const LOW = 5, FREE_ABOVE = 500, DELIVERY = 40;

  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  const seed = [
    ['Apple (Kashmiri)', 'Fruits', 'kg', 180, 40, '🍎'], ['Banana', 'Fruits', 'dozen', 60, 25, '🍌'],
    ['Tomato', 'Vegetables', 'kg', 30, 3, '🍅'], ['Potato', 'Vegetables', 'kg', 25, 80, '🥔'],
    ['Amul Milk', 'Dairy', 'litre', 56, 30, '🥛'], ['Paneer', 'Dairy', 'packet', 95, 0, '🧀'],
    ['Brown Bread', 'Bakery', 'packet', 45, 12, '🍞'], ['Basmati Rice', 'Grains & Pulses', 'kg', 120, 60, '🍚'],
    ['Orange Juice', 'Beverages', 'litre', 110, 18, '🧃'], ['Chocolate Cookies', 'Snacks', 'packet', 40, 4, '🍪']
  ].map((p, i) => ({ id: 's' + i, name: p[0], cat: p[1], unit: p[2], price: p[3], qty: p[4], emoji: p[5], ts: i }));

  let products = load(KEYS.products, null) || seed;
  let users = load(KEYS.users, null) || [DEMO_USER];
  let orders = load(KEYS.orders, []);
  let session = load(KEYS.session, null);
  let cart = [];
  let view = 'catalog', activeCat = 'All', pendingDelete = null, toastTimer, authMode = 'login';

  const persistProducts = () => save(KEYS.products, products);
  const persistCart = () => save(KEYS.cart + session.email, cart);
  const isAdmin = () => session && session.role === 'admin';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inr = n => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const emojiOf = p => p.emoji || CAT_EMOJI[p.cat] || '🛒';
  const open = id => $(id).classList.remove('hidden');
  const close = id => $(id).classList.add('hidden');

  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ---------- theme ---------- */
  function setTheme(t) {
    document.documentElement.dataset.theme = t; save(KEYS.theme, t);
    $('themeBtn').firstElementChild.textContent = t === 'dark' ? 'light_mode' : 'dark_mode';
  }
  setTheme(load(KEYS.theme, matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  $('themeBtn').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');

  /* ---------- auth ---------- */
  function setAuthMode(m) {
    authMode = m;
    document.querySelectorAll('#authTabs .tab').forEach(t => t.classList.toggle('active', t.dataset.mode === m));
    document.querySelectorAll('.signup-only').forEach(e => e.classList.toggle('hidden', m !== 'signup'));
    document.querySelectorAll('.login-only').forEach(e => e.classList.toggle('hidden', m !== 'login'));
    $('authTitle').textContent = m === 'login' ? 'Welcome back 👋' : 'Naya account banayein ✨';
    $('authSubmit').innerHTML = m === 'login' ? '<span class="ms">login</span>Login' : '<span class="ms">person_add</span>Sign up';
    $('fullName').required = m === 'signup';
    $('loginError').textContent = '';
  }
  $('authTabs').onclick = e => { const t = e.target.closest('.tab'); if (t) setAuthMode(t.dataset.mode); };

  $('loginForm').onsubmit = e => {
    e.preventDefault();
    const email = $('email').value.trim().toLowerCase(), pw = $('password').value, err = $('loginError');
    if (authMode === 'signup') {
      if (email === ADMIN.email || users.some(u => u.email === email)) { err.textContent = 'Ye email pehle se registered hai.'; return; }
      const u = { name: $('fullName').value.trim(), email, password: pw };
      users.push(u); save(KEYS.users, users);
      startSession({ email, name: u.name, role: 'customer' }); toast('Account ban gaya 🎉');
      return;
    }
    if (email === ADMIN.email && pw === ADMIN.password) return startSession({ email, name: ADMIN.name, role: 'admin' });
    const u = users.find(u => u.email === email && u.password === pw);
    if (u) return startSession({ email, name: u.name, role: 'customer' });
    err.textContent = 'Email ya password galat hai.';
  };
  document.querySelectorAll('[data-demo]').forEach(b => b.onclick = () => {
    const d = b.dataset.demo === 'admin' ? ADMIN : DEMO_USER;
    $('email').value = d.email; $('password').value = d.password;
  });
  $('togglePw').onclick = () => {
    const p = $('password'), show = p.type === 'password';
    p.type = show ? 'text' : 'password';
    $('togglePw').firstElementChild.textContent = show ? 'visibility_off' : 'visibility';
  };
  function startSession(s) { session = s; save(KEYS.session, s); $('loginForm').reset(); go('catalog'); showView(); }
  $('logoutBtn').onclick = () => {
    try { localStorage.removeItem(KEYS.session); } catch {}
    session = null; close('cartOverlay'); setAuthMode('login'); showView();
  };

  function showView() {
    renderTicker();
    $('loginView').classList.toggle('hidden', !!session);
    $('appView').classList.toggle('hidden', !session);
    if (!session) { document.body.removeAttribute('data-role'); return; }
    document.body.dataset.role = session.role;
    cart = isAdmin() ? [] : load(KEYS.cart + session.email, []);
    $('userName').textContent = session.name.split(' ')[0];
    $('avatar').textContent = session.name[0].toUpperCase();
    $('roleTag').textContent = session.role;
    $('heroName').textContent = session.name.split(' ')[0];
    $('navCatalogLabel').textContent = isAdmin() ? 'Products' : 'Shop';
    go(view);
  }

  /* ---------- navigation ---------- */
  function go(v) {
    if (v === 'checkout' && (isAdmin() || !cart.length)) v = 'catalog';
    if ((v === 'analytics' || v === 'offers') && !isAdmin()) v = 'catalog';
    view = v;
    ['catalog', 'checkout', 'success', 'orders', 'analytics', 'offers'].forEach(n => {
      const el = $(n + 'View'), show = n === v;
      el.classList.toggle('hidden', !show);
      if (show) { el.classList.remove('view-in'); void el.offsetWidth; el.classList.add('view-in'); }
    });
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === v));
    if (v === 'analytics') renderAnalytics();
    if (v === 'offers') renderOffers();
    if (v === 'checkout') renderCheckout();
    if (v === 'orders') renderOrders();
    if (v === 'catalog') render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-view]');
    if (b) { close('cartOverlay'); go(b.dataset.view); }
  });

  /* ---------- catalog ---------- */
  function renderChips() {
    $('chips').innerHTML = ['All', ...CATS].map(c =>
      `<button class="chip ${c === activeCat ? 'active' : ''}" data-cat="${esc(c)}">${c === 'All' ? '🛍️' : CAT_EMOJI[c]} ${c}</button>`).join('');
  }
  $('chips').onclick = e => { const b = e.target.closest('.chip'); if (b) { activeCat = b.dataset.cat; render(); } };

  const inCart = id => cart.find(c => c.id === id)?.qty || 0;

  function render() {
    renderChips();
    const q = $('search').value.trim().toLowerCase(), sort = $('sort').value;
    const list = products.filter(p => (activeCat === 'All' || p.cat === activeCat) && p.name.toLowerCase().includes(q));
    list.sort({
      new: (a, b) => b.ts - a.ts, name: (a, b) => a.name.localeCompare(b.name),
      priceAsc: (a, b) => a.price - b.price, priceDesc: (a, b) => b.price - a.price, qty: (a, b) => a.qty - b.qty
    }[sort]);

    $('statCount').textContent = products.length;
    $('statQty').textContent = products.reduce((s, p) => s + p.qty, 0).toLocaleString('en-IN');
    $('statValue').textContent = inr(products.reduce((s, p) => s + p.qty * p.price, 0));
    $('statLow').textContent = products.filter(p => p.qty <= LOW).length;
    $('catSub').textContent = `${products.length} products · ${products.filter(p => p.qty <= LOW).length} ko restock chahiye`;

    $('empty').classList.toggle('hidden', list.length > 0);
    $('grid').innerHTML = list.map((p, i) => {
      const st = p.qty === 0 ? ['Out of stock', 'out'] : p.qty <= LOW ? [isAdmin() ? 'Low stock' : `Only ${p.qty} left`, 'low'] : ['In stock', ''];
      const n = inCart(p.id);
      const action = isAdmin()
        ? `<div class="p-actions">
            <button class="btn tonal sm" data-edit="${p.id}"><span class="ms">edit</span>Edit</button>
            <button class="btn danger-soft sm" data-del="${p.id}"><span class="ms">delete</span>Delete</button></div>`
        : `<div class="add-row">${n
            ? `<div class="stepper"><button data-dec="${p.id}" aria-label="Kam karein"><span class="ms">remove</span></button><span>${n}</span><button data-inc="${p.id}" ${n >= p.qty ? 'disabled' : ''} aria-label="Badhayein"><span class="ms">add</span></button></div>`
            : `<button class="btn primary" data-add="${p.id}" ${p.qty === 0 ? 'disabled' : ''}><span class="ms">add_shopping_cart</span>${p.qty === 0 ? 'Unavailable' : 'Add to cart'}</button>`}</div>`;
      return `<article class="card product" style="animation-delay:${Math.min(i, 12) * 40}ms">
        <div class="p-top"><div class="p-emoji">${esc(emojiOf(p))}</div><span class="badge ${st[1]}">${st[0]}</span></div>
        <div><h3>${esc(p.name)}</h3><div class="cat">${esc(p.cat)}</div></div>
        <div class="p-mid">
          <div class="price">${inr(p.price)}<small> / ${esc(p.unit)}</small></div>
          ${isAdmin() ? `<div class="qty">Qty<b>${p.qty}</b></div>` : ''}
        </div>${action}</article>`;
    }).join('');
  }
  $('search').oninput = render; $('sort').onchange = render;

  /* ---------- cart ---------- */
  function setQty(id, qty) {
    const p = products.find(x => x.id === id); if (!p) return;
    qty = Math.min(qty, p.qty);
    cart = cart.filter(c => c.id !== id);
    if (qty > 0) cart.push({ id, qty });
    persistCart(); renderCart(); if (view === 'catalog') render(); if (view === 'checkout') renderCheckout();
  }
  const cartLines = () => cart.map(c => ({ p: products.find(p => p.id === c.id), qty: c.qty })).filter(l => l.p);
  const subtotal = () => cartLines().reduce((s, l) => s + l.p.price * l.qty, 0);
  const deliveryFee = sub => (sub === 0 || sub >= FREE_ABOVE ? 0 : DELIVERY);

  function renderCart() {
    const lines = cartLines(), count = lines.reduce((s, l) => s + l.qty, 0);
    const badge = $('cartBadge');
    badge.textContent = count; badge.classList.toggle('hidden', !count);
    badge.classList.remove('bump'); void badge.offsetWidth; if (count) badge.classList.add('bump');
    $('cartSub').textContent = inr(subtotal());
    $('goCheckout').disabled = !count;
    $('cartItems').innerHTML = lines.length ? lines.map(({ p, qty }) => `
      <div class="cart-item">
        <div class="ci-emoji">${esc(emojiOf(p))}</div>
        <div class="ci-info"><b>${esc(p.name)}</b><small>${inr(p.price)} / ${esc(p.unit)}</small></div>
        <div class="ci-right">
          <span class="line">${inr(p.price * qty)}</span>
          <div class="stepper">
            <button data-dec="${p.id}"><span class="ms">remove</span></button><span>${qty}</span>
            <button data-inc="${p.id}" ${qty >= p.qty ? 'disabled' : ''}><span class="ms">add</span></button>
          </div>
        </div>
      </div>`).join('')
      : `<div class="cart-empty"><div class="big-emoji">🧺</div><h3>Cart khaali hai</h3><p>Kuch taaza saaman add karein!</p></div>`;
  }
  $('cartBtn').onclick = () => { renderCart(); open('cartOverlay'); };
  $('closeCart').onclick = () => close('cartOverlay');
  $('cartOverlay').onclick = e => { if (e.target === $('cartOverlay')) close('cartOverlay'); };
  $('goCheckout').onclick = () => { close('cartOverlay'); go('checkout'); };

  function cartClick(e) {
    const a = e.target.closest('[data-add],[data-inc],[data-dec]'); if (!a) return;
    const id = a.dataset.add || a.dataset.inc || a.dataset.dec;
    if (a.dataset.add) { flyToCart(a, id); setQty(id, 1); toast('Cart mein add ho gaya 🛒'); }
    else setQty(id, inCart(id) + (a.dataset.inc ? 1 : -1));
  }
  $('cartItems').addEventListener('click', cartClick);

  /* ---------- admin product CRUD ---------- */
  $('pcat').innerHTML = CATS.map(c => `<option>${c}</option>`).join('');
  function openForm(p) {
    $('modalTitle').textContent = p ? 'Edit Product' : 'Add Product';
    $('pid').value = p ? p.id : ''; $('pname').value = p ? p.name : '';
    $('pcat').value = p ? p.cat : CATS[0]; $('punit').value = p ? p.unit : 'kg';
    $('pprice').value = p ? p.price : ''; $('pqty').value = p ? p.qty : '';
    $('pemoji').value = p ? p.emoji || '' : '';
    open('modal'); setTimeout(() => $('pname').focus(), 50);
  }
  $('addBtn').onclick = () => openForm();
  ['closeModal', 'cancelBtn'].forEach(id => $(id).onclick = () => close('modal'));
  $('modal').onclick = e => { if (e.target === $('modal')) close('modal'); };
  $('confirm').onclick = e => { if (e.target === $('confirm')) close('confirm'); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') ['modal', 'confirm', 'cartOverlay'].forEach(close); });

  $('productForm').onsubmit = e => {
    e.preventDefault();
    const id = $('pid').value;
    const data = {
      name: $('pname').value.trim(), cat: $('pcat').value, unit: $('punit').value,
      price: parseFloat($('pprice').value) || 0, qty: parseInt($('pqty').value, 10) || 0, emoji: $('pemoji').value.trim()
    };
    if (!data.name) return;
    if (id) { Object.assign(products.find(p => p.id === id), data); toast('Product update ho gaya ✅'); }
    else { products.push({ ...data, id: 'p' + Date.now(), ts: Date.now() }); toast('Product add ho gaya 🎉'); }
    persistProducts(); close('modal'); render();
  };

  $('grid').onclick = e => {
    cartClick(e);
    const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
    if (ed) openForm(products.find(p => p.id === ed.dataset.edit));
    if (dl) {
      pendingDelete = dl.dataset.del;
      $('confirmText').textContent = `"${products.find(p => p.id === pendingDelete).name}" hamesha ke liye hata diya jayega.`;
      open('confirm');
    }
  };
  $('confirmNo').onclick = () => close('confirm');
  $('confirmYes').onclick = () => {
    products = products.filter(p => p.id !== pendingDelete);
    persistProducts(); close('confirm'); render(); toast('Product delete ho gaya 🗑️');
  };

  /* ---------- checkout ---------- */
  function renderCheckout() {
    const lines = cartLines(), { sub, disc, del, total } = totals();
    $('discRow').classList.toggle('hidden', !disc);
    $('sumDisc').textContent = '− ' + inr(disc);
    $('summaryItems').innerHTML = lines.map(({ p, qty }) =>
      `<div class="sum-item"><div>${esc(emojiOf(p))} ${esc(p.name)}<small>${qty} × ${inr(p.price)}</small></div><b>${inr(p.price * qty)}</b></div>`).join('');
    $('sumSub').textContent = inr(sub);
    $('sumDel').innerHTML = del ? inr(del) : '<span class="free">FREE</span>';
    $('sumTotal').textContent = inr(total);
    $('payBtn').innerHTML = $('payMethods').querySelector('input:checked').value === 'cod'
      ? `<span class="ms">local_shipping</span>Order place karein · ${inr(total)}` : `<span class="ms">lock</span>Pay ${inr(total)}`;
    if (!$('cName').value) $('cName').value = session.name;
  }
  $('payMethods').onchange = () => {
    const m = $('payMethods').querySelector('input:checked').value;
    ['upi', 'card', 'cod'].forEach(k => $('panel-' + k).classList.toggle('hidden', k !== m));
    renderCheckout();
  };
  $('cardNo').oninput = e => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  $('cardExp').oninput = e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    e.target.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v;
  };
  ['cPhone', 'cPin', 'cardCvv'].forEach(id => $(id).oninput = e => e.target.value = e.target.value.replace(/\D/g, ''));

  function validateCheckout() {
    const v = id => $(id).value.trim();
    if (v('cName').length < 2) return 'Naam likhein.';
    if (!/^[6-9]\d{9}$/.test(v('cPhone'))) return 'Sahi 10-digit phone number daalein.';
    if (v('cAddr').length < 5) return 'Poora address likhein.';
    if (!v('cCity')) return 'City likhein.';
    if (!/^\d{6}$/.test(v('cPin'))) return 'Sahi 6-digit pincode daalein.';
    const m = $('payMethods').querySelector('input:checked').value;
    if (m === 'upi' && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(v('upiId'))) return 'Sahi UPI ID daalein (jaise name@bank).';
    if (m === 'card') {
      if (v('cardNo').replace(/\s/g, '').length !== 16) return 'Card number 16 digit ka hona chahiye.';
      const mm = +v('cardExp').slice(0, 2);
      if (!/^\d{2}\/\d{2}$/.test(v('cardExp')) || mm < 1 || mm > 12) return 'Expiry MM/YY format mein daalein.';
      if (v('cardCvv').length !== 3) return 'CVV 3 digit ka hona chahiye.';
      if (!v('cardName')) return 'Card par likha naam daalein.';
    }
    return '';
  }

  $('checkoutForm').onsubmit = e => {
    e.preventDefault();
    const err = validateCheckout();
    $('checkoutError').textContent = err;
    if (err) return;
    const short = cartLines().find(l => l.qty > l.p.qty);
    if (short) { $('checkoutError').textContent = `"${short.p.name}" ka itna stock nahi bacha.`; return; }
    open('processing');
    setTimeout(placeOrder, 1800);
  };

  function placeOrder() {
    const lines = cartLines(), { sub, disc, del, total } = totals(), method = $('payMethods').querySelector('input:checked').value;
    const order = {
      id: 'FC' + Date.now().toString().slice(-8), email: session.email, name: $('cName').value.trim(),
      address: `${$('cAddr').value.trim()}, ${$('cCity').value.trim()} - ${$('cPin').value.trim()}`, phone: $('cPhone').value.trim(),
      items: lines.map(l => ({ name: l.p.name, unit: l.p.unit, price: l.p.price, qty: l.qty, emoji: emojiOf(l.p) })),
      sub, disc, coupon: coupon ? coupon.code : '', del, total, method, status: method === 'cod' ? 'Placed · Pay on delivery' : 'Paid', ts: Date.now()
    };
    lines.forEach(l => l.p.qty -= l.qty);
    persistProducts();
    orders.unshift(order); save(KEYS.orders, orders);
    cart = []; persistCart(); renderCart();
    coupon = null; $('couponInput').value = ''; $('couponMsg').textContent = '';
    $('checkoutForm').reset(); $('payMethods').onchange();
    close('processing'); confetti();
    $('successText').innerHTML = `Order <b>#${order.id}</b> · ${inr(order.total)} · ${method === 'cod' ? 'Cash on Delivery' : 'Payment successful'}.<br>Hum jald hi aapke ghar deliver karenge. 🚚`;
    go('success');
  }

  /* ---------- orders ---------- */
  const METHOD = { upi: 'UPI', card: 'Card', cod: 'Cash on Delivery' };
  function renderOrders() {
    $('ordersTitle').textContent = isAdmin() ? 'All Orders' : 'My Orders';
    $('ordersSub').textContent = isAdmin() ? 'Sabhi customers ke orders' : 'Aapke saare orders yahan milenge';
    const list = isAdmin() ? orders : orders.filter(o => o.email === session.email);
    $('ordersList').innerHTML = list.length ? list.map(o => `
      <article class="card order">
        <div class="order-head">
          <div><b>#${esc(o.id)}</b><br><small>${new Date(o.ts).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}${isAdmin() ? ' · ' + esc(o.email) : ''}</small></div>
          <span class="status">${esc(o.status)}</span>
        </div>
        <div class="order-items">${o.items.map(i => `${esc(i.emoji)} ${esc(i.name)} × ${i.qty} — ${inr(i.price * i.qty)}`).join('<br>')}</div>
        <div class="order-foot"><span>📍 ${esc(o.address)}</span><span>${METHOD[o.method]}${o.disc ? ` · 🏷️ ${esc(o.coupon)} (−${inr(o.disc)})` : ''} · Total <b>${inr(o.total)}</b></span></div>
      </article>`).join('')
      : `<div class="empty"><div class="big-emoji">📦</div><h3>Abhi koi order nahi</h3><p class="muted">Shop karke pehla order place karein.</p></div>`;
  }

  /* ================= coupon & totals ================= */
  let coupon = null;
  function totals() {
    const sub = subtotal();
    const disc = coupon ? Math.round(sub * coupon.percent / 100) : 0;
    const del = deliveryFee(sub);
    return { sub, disc, del, total: sub - disc + del };
  }
  function applyCoupon(raw) {
    const code = (raw || '').trim().toUpperCase(), msg = $('couponMsg');
    if (!code) { coupon = null; msg.textContent = ''; msg.className = 'coupon-msg'; return renderCheckout(); }
    const o = offers.find(o => o.active && o.code === code && o.percent > 0);
    if (!o) { coupon = null; msg.textContent = 'Ye coupon valid nahi hai.'; msg.className = 'coupon-msg bad'; return renderCheckout(); }
    coupon = { code, percent: o.percent };
    msg.textContent = `🎉 "${code}" laga — ${o.percent}% off!`; msg.className = 'coupon-msg ok';
    renderCheckout(); if (view === 'checkout') confetti(24);
  }
  $('applyCoupon').onclick = () => applyCoupon($('couponInput').value);
  $('couponInput').oninput = e => e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

  /* ================= offers & marquee ================= */
  let offers = load('fc_offers', null) || [{ id: 'o1', text: 'MEGA FRESH SALE — Extra 10% OFF on everything', emoji: '🎉', percent: 10, code: 'FRESH10', theme: 'red', active: true }];
  const saveOffers = () => save('fc_offers', offers);
  const pill = o => `<span class="tk th-${esc(o.theme)}"><em class="sale-badge">SALE</em><span class="tk-emoji">${esc(o.emoji || '🔥')}</span>${esc(o.text)}${o.code ? ` <button type="button" class="tk-code" data-code="${esc(o.code)}" title="Code copy karein">${esc(o.code)}</button>` : ''}</span>`;

  function renderTicker() {
    const act = offers.filter(o => o.active), t = $('ticker');
    t.classList.toggle('hidden', !act.length || !session);
    if (!act.length) return;
    const one = act.map(o => pill(o) + '<i class="tk-sep">✦</i>').join('');
    const half = one.repeat(4);
    const chars = act.reduce((s, o) => s + o.text.length + (o.code ? o.code.length : 0) + 12, 0);
    $('tickerTrack').innerHTML = half + half;
    $('tickerTrack').style.animationDuration = Math.max(24, chars * 0.55) + 's';
  }
  $('ticker').onclick = e => {
    const b = e.target.closest('[data-code]'); if (!b) return;
    const c = b.dataset.code;
    try { navigator.clipboard.writeText(c); } catch {}
    $('couponInput').value = c; toast(`Code ${c} copy ho gaya 📋`);
  };

  function renderOffers() {
    $('offersList').innerHTML = offers.length ? offers.map(o => `
      <article class="card offer-card ${o.active ? '' : 'off'}">
        <div class="offer-pill">${pill(o)}</div>
        <div class="offer-meta"><span>${o.percent ? `🏷️ ${o.percent}% discount` : '📣 Sirf banner'}</span>${o.code ? `<span>Code: <b>${esc(o.code)}</b></span>` : ''}</div>
        <div class="offer-actions">
          <label class="switch" title="Live / Pause"><input type="checkbox" data-toggle="${o.id}" ${o.active ? 'checked' : ''}><i></i><span>${o.active ? 'Live' : 'Paused'}</span></label>
          <button class="btn danger-soft sm" data-delo="${o.id}"><span class="ms">delete</span>Delete</button>
        </div>
      </article>`).join('')
      : `<div class="empty"><div class="big-emoji">📣</div><h3>Abhi koi offer nahi</h3><p class="muted">Left wala form bharke pehla offer launch karein.</p></div>`;
    updatePreview();
  }
  function updatePreview() {
    const text = $('oText').value.trim() || 'Aapka offer yahan dikhega';
    $('oPreview').innerHTML = pill({ text, emoji: $('oEmoji').value.trim(), code: $('oCode').value.trim().toUpperCase(), theme: document.querySelector('input[name=oTheme]:checked').value });
  }
  ['oText', 'oEmoji', 'oCode', 'oPercent'].forEach(id => $(id).addEventListener('input', updatePreview));
  $('oColors').addEventListener('change', updatePreview);
  $('offerForm').onsubmit = e => {
    e.preventDefault();
    const code = $('oCode').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const percent = Math.max(0, Math.min(90, parseInt($('oPercent').value, 10) || 0));
    if (code && !percent) return toast('Coupon code ke saath discount % bhi daalein');
    if (code && offers.some(o => o.code === code)) return toast('Ye coupon code pehle se hai');
    offers.unshift({ id: 'o' + Date.now(), text: $('oText').value.trim(), emoji: $('oEmoji').value.trim(), percent, code,
      theme: document.querySelector('input[name=oTheme]:checked').value, active: true });
    saveOffers(); $('offerForm').reset(); renderOffers(); renderTicker(); toast('Offer live ho gaya 🚀'); confetti(40);
  };
  $('offersList').addEventListener('change', e => {
    const t = e.target.closest('[data-toggle]'); if (!t) return;
    offers.find(o => o.id === t.dataset.toggle).active = t.checked;
    saveOffers(); renderOffers(); renderTicker();
  });
  $('offersList').addEventListener('click', e => {
    const d = e.target.closest('[data-delo]'); if (!d) return;
    offers = offers.filter(o => o.id !== d.dataset.delo);
    saveOffers(); renderOffers(); renderTicker(); toast('Offer hata diya 🗑️');
  });

  /* ================= analytics ================= */
  const DAY = 864e5;
  const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const sumBy = (l, f) => l.reduce((s, x) => s + f(x), 0);
  const compact = n => { if (n < 1000) return String(Math.round(n)); const k = n / 1000; return (Number.isInteger(k) ? k : +k.toFixed(1)) + 'K'; };
  const niceMax = v => { if (v <= 0) return 4; const p = 10 ** Math.floor(Math.log10(v)), n = v / p; return p * ([1, 2, 4, 6, 8, 10].find(m => n <= m)); };
  const tip = h => `data-tip="${esc(h)}"`;
  let range = 7;
  const tableOpen = new Set();

  function vcard(id, icon, title, sub, body, table) {
    const open = tableOpen.has(id);
    const tbl = `<div class="tbl-wrap"><table class="vt"><thead><tr>${table.head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${table.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    $(id).innerHTML = `<div class="viz-head"><span class="ms vi">${icon}</span><div><h3>${title}</h3><small>${sub}</small></div>
      <button class="icon-btn" data-tbl="${id}" aria-pressed="${open}" aria-label="${open ? 'Chart dekhein' : 'Table dekhein'}" title="${open ? 'Chart dekhein' : 'Table dekhein'}"><span class="ms">${open ? 'bar_chart' : 'table_chart'}</span></button></div>${open ? tbl : body}`;
  }
  const empty = msg => `<div class="viz-empty">${msg}</div>`;
  function hbars(rows, max) {
    return rows.map(r => `<div class="hrow" ${tip(r.tip)}><span class="hl" title="${esc(r.label)}">${r.label}</span><div class="ht"><div class="hb" style="width:calc((100% - 56px) * ${max ? r.value / max : 0})"></div><span class="hv">${r.text}</span></div></div>`).join('');
  }

  /* donut: segments [{n, c, tip}], centre shows total + label. 2px-ish surface gap between arcs. */
  function donut(segs, total, label) {
    const R = 48, C = 2 * Math.PI * R, live = segs.filter(s => s.n > 0), gap = live.length > 1 ? 3 : 0;
    let at = 0;
    const arcs = live.map(s => {
      const len = s.n / total * C, d = Math.max(1, len - gap);
      const el = `<circle cx="60" cy="60" r="${R}" fill="none" stroke="${s.c}" stroke-width="16" stroke-dasharray="${d} ${C - d}" stroke-dashoffset="${-at}" ${tip(s.tip)}/>`;
      at += len; return el;
    }).join('');
    return `<div class="donut"><svg viewBox="0 0 120 120" role="img" aria-label="${total} ${label}"><circle cx="60" cy="60" r="${R}" fill="none" stroke="var(--v-grid)" stroke-width="16"/><g transform="rotate(-90 60 60)">${arcs}</g></svg><div class="donut-c"><b>${total}</b><small>${label}</small></div></div>`;
  }

  function renderAnalytics() {
    $('sampleNote').classList.toggle('hidden', !orders.some(o => o.sample));
    document.querySelectorAll('#rangeSeg button').forEach(b => b.classList.toggle('active', +b.dataset.range === range));
    const today = startOfDay(Date.now()), from = today - (range - 1) * DAY, prevFrom = from - range * DAY;
    const cur = orders.filter(o => o.ts >= from), prev = orders.filter(o => o.ts >= prevFrom && o.ts < from);
    const rev = sumBy(cur, o => o.total), prevRev = sumBy(prev, o => o.total);
    const units = sumBy(cur, o => sumBy(o.items, i => i.qty)), prevUnits = sumBy(prev, o => sumBy(o.items, i => i.qty));
    const aov = cur.length ? rev / cur.length : 0, prevAov = prev.length ? prevRev / prev.length : 0;
    const delta = (c, p) => {
      if (!p) return '<span class="delta"><small>pichle period ka data nahi</small></span>';
      const pc = Math.round((c - p) / p * 100), up = pc >= 0;
      return `<span class="delta ${up ? '' : 'down'}"><span class="ms">${up ? 'trending_up' : 'trending_down'}</span>${up ? '+' : ''}${pc}% <small>vs pichle ${range} din</small></span>`;
    };
    const live = '<span class="delta"><small>abhi ki position</small></span>';

    const kpis = [
      ['Revenue', 'payments', 'inr', rev, delta(rev, prevRev), '#43a047,#81c784'],
      ['Orders', 'receipt_long', 'int', cur.length, delta(cur.length, prev.length), '#1e88e5,#64b5f6'],
      ['Avg. order value', 'shopping_bag', 'inr', aov, delta(aov, prevAov), '#8e24aa,#ba68c8'],
      ['Units sold', 'shopping_cart_checkout', 'int', units, delta(units, prevUnits), '#fb8c00,#ffb74d'],
      ['Units in stock', 'inventory_2', 'int', sumBy(products, p => p.qty), live, '#00897b,#4db6ac'],
      ['Stock value', 'warehouse', 'inr', sumBy(products, p => p.qty * p.price), live, '#5e35b1,#9575cd']
    ];
    $('kpis').innerHTML = kpis.map(k => `<div class="card kpi"><div class="kpi-top"><span class="kpi-ico" style="background:linear-gradient(135deg,${k[5]})"><span class="ms">${k[1]}</span></span>${k[0]}</div><b data-count="${k[3]}" data-fmt="${k[2]}">0</b>${k[4]}</div>`).join('');
    animateCounts($('kpis'));

    /* revenue by day */
    const bk = Array.from({ length: range }, (_, i) => ({ t: from + i * DAY, rev: 0, n: 0 }));
    cur.forEach(o => { const i = Math.round((startOfDay(o.ts) - from) / DAY); if (bk[i]) { bk[i].rev += o.total; bk[i].n++; } });
    const max = niceMax(Math.max(...bk.map(b => b.rev)));
    const fmtDay = (t, o) => new Date(t).toLocaleDateString('en-IN', o);
    const gl = [0, 1, 2, 3, 4].map(i => `<div class="gl ${i ? '' : 'base'}" style="bottom:${i * 25}%"><span>${compact(max * i / 4)}</span></div>`).join('');
    const peak = bk.reduce((m, b, i) => (b.rev > bk[m].rev ? i : m), 0);
    const dayTip = b => `<b>${fmtDay(b.t, { weekday: 'short', day: 'numeric', month: 'short' })}</b><br>${inr(b.rev)} · ${b.n} order${b.n === 1 ? '' : 's'}`;
    const cols = bk.map((b, i) => `<div class="col" ${tip(dayTip(b))}><div class="bar" style="height:${b.rev / max * 100}%;animation-delay:${i * 25}ms"></div>${i === peak && b.rev ? `<span class="peak" style="bottom:calc(${b.rev / max * 100}% + 6px)">${compact(b.rev)}</span>` : ''}</div>`).join('');
    const xl = bk.map((b, i) => `<span>${range === 7 ? fmtDay(b.t, { weekday: 'short' }) : (i % 5 === 4 || i === 0 ? fmtDay(b.t, { day: 'numeric', month: 'short' }) : '')}</span>`).join('');
    vcard('cRevenue', 'bar_chart', 'Revenue by day (₹)', `Pichle ${range} din · total ${inr(rev)} · ${cur.length} orders`,
      cur.length ? `<div class="plot">${gl}<div class="cols" style="--n:${range}">${cols}</div></div><div class="xl" style="--n:${range}">${xl}</div>` : empty('Is period mein koi order nahi aaya.'),
      { head: ['Date', 'Orders', 'Revenue'], rows: bk.map(b => [fmtDay(b.t, { day: 'numeric', month: 'short' }), b.n, inr(b.rev)]) });

    /* orders per day (line + area) */
    const oMax = Math.max(4, Math.ceil(Math.max(...bk.map(b => b.n)) / 4) * 4);
    const pts = bk.map((b, i) => [(i + .5) / range * 100, 100 - b.n / oMax * 100]);
    const ln = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
    const oGl = [0, 1, 2, 3, 4].map(i => `<div class="gl ${i ? '' : 'base'}" style="bottom:${i * 25}%"><span>${oMax * i / 4}</span></div>`).join('');
    const oCols = bk.map((b, i) => `<div class="col" ${tip(dayTip(b))}><i class="dot ${i === bk.length - 1 ? 'end' : ''}" style="bottom:${b.n / oMax * 100}%"></i></div>`).join('');
    const avgDay = cur.length / range;
    vcard('cOrders', 'show_chart', 'Orders per day', `Pichle ${range} din · roz ke ${avgDay.toFixed(1)} orders (average)`,
      cur.length ? `<div class="plot">${oGl}<svg class="lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="ar" d="${ln} L${pts[pts.length - 1][0].toFixed(2)} 100 L${pts[0][0].toFixed(2)} 100 Z"/><path class="ln" d="${ln}"/></svg><div class="cols" style="--n:${range}">${oCols}</div></div><div class="xl" style="--n:${range}">${xl}</div>` : empty('Is period mein koi order nahi aaya.'),
      { head: ['Date', 'Orders'], rows: bk.map(b => [fmtDay(b.t, { day: 'numeric', month: 'short' }), b.n]) });

    /* stock health */
    const inS = products.filter(p => p.qty > LOW).length, low = products.filter(p => p.qty > 0 && p.qty <= LOW).length, out = products.filter(p => p.qty === 0).length;
    const st = [['In stock', inS, 'var(--good)', 'check_circle', 'st-good'], ['Low stock', low, 'var(--warn)', 'warning', 'st-warn'], ['Out of stock', out, 'var(--crit)', 'error', 'st-crit']];
    const pct = n => products.length ? Math.round(n / products.length * 100) : 0;
    vcard('cStock', 'health_and_safety', 'Stock health', `${products.length} products ka haal`,
      products.length ? `${donut(st.map(s => ({ n: s[1], c: s[2], tip: `<b>${s[0]}</b><br>${s[1]} products (${pct(s[1])}%)` })), products.length, 'products')}
      <div class="legend">${st.map(s => `<div class="lg"><span class="ms ${s[4]}">${s[3]}</span><span>${s[0]}</span><span><b>${s[1]}</b> <em>${pct(s[1])}%</em></span></div>`).join('')}</div>` : empty('Koi product nahi.'),
      { head: ['Status', 'Products'], rows: st.map(s => [s[0], s[1]]) });

    /* payment split */
    const pm = ['upi', 'card', 'cod'].map((k, i) => { const l = cur.filter(o => o.method === k); return { k, name: METHOD[k], n: l.length, rev: sumBy(l, o => o.total), c: `var(--c${i + 1})` }; });
    const pPct = n => cur.length ? Math.round(n / cur.length * 100) : 0;
    vcard('cPay', 'account_balance_wallet', 'Payment methods', `Orders ka split · ${cur.length} orders`,
      cur.length ? `${donut(pm.map(p => ({ n: p.n, c: p.c, tip: `<b>${p.name}</b><br>${p.n} orders · ${inr(p.rev)}` })), cur.length, 'orders')}
      <div class="legend">${pm.map(p => `<div class="lg"><span class="sw" style="background:${p.c}"></span><span>${p.name}</span><span><b>${p.n}</b> <em>${pPct(p.n)}% · ${inr(p.rev)}</em></span></div>`).join('')}</div>` : empty('Is period mein koi order nahi.'),
      { head: ['Method', 'Orders', 'Revenue'], rows: pm.map(p => [p.name, p.n, inr(p.rev)]) });

    /* inventory by category */
    const cats = CATS.map(c => { const l = products.filter(p => p.cat === c); return { c, n: l.length, u: sumBy(l, p => p.qty), v: sumBy(l, p => p.qty * p.price) }; }).filter(x => x.n).sort((a, b) => b.u - a.u);
    const cMax = Math.max(1, ...cats.map(c => c.u));
    vcard('cInventory', 'inventory', 'Inventory by category', 'Har category mein kitna samaan hai (units)',
      cats.length ? hbars(cats.map(c => ({ label: `${CAT_EMOJI[c.c]} ${esc(c.c)}`, value: c.u, text: c.u.toLocaleString('en-IN'), tip: `<b>${esc(c.c)}</b><br>${c.u} units · ${c.n} products<br>Value ${inr(c.v)}` })), cMax) : empty('Koi product nahi.'),
      { head: ['Category', 'Products', 'Units', 'Value'], rows: cats.map(c => [esc(c.c), c.n, c.u, inr(c.v)]) });

    /* top sellers */
    const agg = {};
    cur.forEach(o => o.items.forEach(i => { const a = agg[i.name] ||= { name: i.name, emoji: i.emoji, u: 0, r: 0 }; a.u += i.qty; a.r += i.qty * i.price; }));
    const top = Object.values(agg).sort((a, b) => b.u - a.u).slice(0, 6);
    vcard('cTop', 'trophy', 'Top selling products', `Pichle ${range} din mein sabse zyada bike (units)`,
      top.length ? hbars(top.map(t => ({ label: `${esc(t.emoji)} ${esc(t.name)}`, value: t.u, text: t.u, tip: `<b>${esc(t.name)}</b><br>${t.u} units · ${inr(t.r)}` })), top[0].u) : empty('Is period mein koi sale nahi hui.'),
      { head: ['Product', 'Units', 'Revenue'], rows: top.map(t => [esc(t.name), t.u, inr(t.r)]) });

    /* restock list */
    const needs = products.filter(p => p.qty <= LOW).sort((a, b) => a.qty - b.qty);
    vcard('cLow', 'notification_important', 'Restock ki zaroorat', `${needs.length} product${needs.length === 1 ? '' : 's'} ka stock ${LOW} ya usse kam`,
      needs.length ? `<div class="low-list">${needs.map(p => `
        <div class="low-item"><div class="ci-emoji">${esc(emojiOf(p))}</div>
          <div><b>${esc(p.name)}</b>
            <div class="meter"><i style="width:${p.qty / LOW * 100}%;background:var(--warn)"></i></div>
            <div class="low-state ${p.qty ? 'st-warn' : 'st-crit'}"><span class="ms">${p.qty ? 'warning' : 'error'}</span>${p.qty ? p.qty + ' left' : 'Out of stock'}</div></div>
          <button class="btn tonal sm" data-restock="${p.id}"><span class="ms">add_box</span>Restock</button></div>`).join('')}</div>`
        : `<div class="viz-empty"><span class="ms st-good" style="font-size:40px">check_circle</span><br>Sab products ka stock theek hai 🎉</div>`,
      { head: ['Product', 'Category', 'Qty'], rows: needs.map(p => [esc(p.name), esc(p.cat), p.qty]) });
  }

  $('analyticsView').addEventListener('click', e => {
    const r = e.target.closest('[data-range]'), t = e.target.closest('[data-tbl]'), rs = e.target.closest('[data-restock]');
    if (r) { range = +r.dataset.range; renderAnalytics(); }
    if (t) { tableOpen.has(t.dataset.tbl) ? tableOpen.delete(t.dataset.tbl) : tableOpen.add(t.dataset.tbl); renderAnalytics(); }
    if (rs) { go('catalog'); openForm(products.find(p => p.id === rs.dataset.restock)); }
  });
  $('clearSample').onclick = () => { orders = orders.filter(o => !o.sample); save(KEYS.orders, orders); renderAnalytics(); toast('Sample data hata diya 🧹'); };

  /* sample orders so the charts aren't empty on first run */
  function seedSampleOrders() {
    if (load('fc_sample_done', false) || orders.length) return;
    let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const today = startOfDay(Date.now()), out = [];
    for (let d = 29; d >= 0; d--) {
      const n = 1 + Math.floor(rnd() * 3) + (d < 7 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const picks = [...seed].sort(() => rnd() - .5).filter(p => p.qty > 0).slice(0, 1 + Math.floor(rnd() * 4));
        const items = picks.map(p => ({ name: p.name, unit: p.unit, price: p.price, qty: 1 + Math.floor(rnd() * 4), emoji: p.emoji }));
        const sub = sumBy(items, i => i.price * i.qty), del = sub >= FREE_ABOVE ? 0 : DELIVERY, r = rnd();
        const method = r < .5 ? 'upi' : r < .8 ? 'card' : 'cod';
        out.push({ id: 'FC' + (20000000 + out.length), email: 'sample@freshcart.com', name: 'Sample Customer', phone: '9000000000', address: 'Sample address, Mumbai - 400001',
          items, sub, disc: 0, coupon: '', del, total: sub + del, method, status: method === 'cod' ? 'Placed · Pay on delivery' : 'Paid',
          ts: Math.min(today - d * DAY + 8 * 36e5 + Math.floor(rnd() * 11 * 36e5), Date.now() - 6e4), sample: true });
      }
    }
    orders = out.sort((a, b) => b.ts - a.ts); save(KEYS.orders, orders); save('fc_sample_done', true);
  }

  /* ---- tooltip ---- */
  const tipEl = $('vizTip');
  const moveTip = e => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (!t) return tipEl.classList.remove('show');
    tipEl.innerHTML = t.dataset.tip; tipEl.classList.add('show');
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    tipEl.style.left = Math.max(8, Math.min(e.clientX + 14, innerWidth - w - 8)) + 'px';
    tipEl.style.top = Math.max(8, Math.min(e.clientY + 16, innerHeight - h - 8)) + 'px';
  };
  ['pointermove', 'pointerdown', 'pointerover'].forEach(ev => document.addEventListener(ev, moveTip));

  /* ================= animations & delight ================= */
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateCounts(root) {
    root.querySelectorAll('[data-count]').forEach(el => {
      const to = +el.dataset.count, f = el.dataset.fmt === 'inr' ? inr : v => Math.round(v).toLocaleString('en-IN');
      if (calm()) return el.textContent = f(to);
      const t0 = performance.now(), dur = 800;
      const step = now => {
        const k = Math.min(1, (now - t0) / dur);
        el.textContent = f(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  function confetti(n = 90) {
    if (calm()) return;
    const colors = ['#43a047', '#ff9800', '#e53935', '#1e88e5', '#8e24aa', '#fdd835'];
    const box = document.createElement('div'); box.className = 'confetti';
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i');
      c.style.cssText = `left:${Math.random() * 100}%;background:${colors[i % colors.length]};--dx:${(Math.random() - .5) * 220}px;--r:${Math.random() * 720}deg;animation-delay:${Math.random() * .4}s;animation-duration:${1.8 + Math.random() * 1.4}s;width:${6 + Math.random() * 6}px;height:${8 + Math.random() * 8}px`;
      box.appendChild(c);
    }
    document.body.appendChild(box); setTimeout(() => box.remove(), 3800);
  }

  function flyToCart(btn, id) {
    if (calm()) return;
    const p = products.find(x => x.id === id), cb = $('cartBtn');
    if (!p || !cb.offsetParent) return;
    const a = btn.getBoundingClientRect(), b = cb.getBoundingClientRect();
    const el = document.createElement('div'); el.className = 'fly'; el.textContent = emojiOf(p);
    el.style.left = a.left + a.width / 2 - 18 + 'px'; el.style.top = a.top + a.height / 2 - 18 + 'px';
    document.body.appendChild(el);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    el.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * .45}px,${dy * .45 - 90}px) scale(1.6) rotate(-12deg)`, opacity: 1, offset: .45 },
      { transform: `translate(${dx}px,${dy}px) scale(.3) rotate(20deg)`, opacity: .3 }
    ], { duration: 800, easing: 'cubic-bezier(.4,0,.6,1)' }).onfinish = () => el.remove();
  }

  /* ripple on buttons */
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('.btn'); if (!b || calm()) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), sp = document.createElement('span');
    sp.className = 'ripple'; sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    b.appendChild(sp); setTimeout(() => sp.remove(), 600);
  });

  /* 3D tilt on product cards (mouse only) */
  $('grid').addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || calm()) return;
    const c = e.target.closest('.product'); if (!c) return;
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    c.style.transform = `perspective(700px) rotateX(${-y * 7}deg) rotateY(${x * 9}deg) translateY(-6px)`;
  });
  $('grid').addEventListener('pointerout', e => { const c = e.target.closest('.product'); if (c && !c.contains(e.relatedTarget)) c.style.transform = ''; });

  $('year').textContent = new Date().getFullYear();
  seedSampleOrders();
  setAuthMode('login');
  showView();
})();
