(() => {
  if (window.__igBulkUnliker) return;
  window.__igBulkUnliker = true;

  const LIKES_PATH = '/your_activity/interactions/likes';
  const LIKES_URL = 'https://www.instagram.com/your_activity/interactions/likes/';

  // Label tombol (Inggris + Indonesia). Tambahkan di sini jika bahasa IG Anda berbeda.
  const T = {
    select: ['select', 'pilih'],
    unlike: ['unlike', 'batal suka', 'batalkan suka', 'hapus suka', 'batalkan menyukai', 'delete', 'hapus', 'remove'],
    cancel: ['cancel', 'batal', 'batalkan']
  };
  const CLICKABLE = 'button,[role="button"],[tabindex="0"]';
  const BLOCKED = /try again later|coba lagi nanti|action blocked|tindakan diblokir|temporarily blocked|diblokir sementara/i;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => Math.floor(a + Math.random() * (b - a));
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();

  let running = false;
  let removedTotal = 0;
  let usedTrusted = false;
  const best = { btn: 0, tile: 0 };   // strategi klik yang terakhir berhasil
  let tileOK = false;                  // klik tile sudah terverifikasi
  const logLines = [];

  /* ================= UI (Shadow DOM) ================= */
  const host = document.createElement('div');
  host.id = 'ig-bulk-unliker-host';
  host.style.cssText = 'all:initial;position:fixed;right:20px;bottom:20px;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
  <style>
    *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
    .card{width:310px;background:#14161c;color:#e8eaf0;border:1px solid #262a35;border-radius:18px;
      box-shadow:0 18px 50px rgba(0,0,0,.55);overflow:hidden}
    .head{display:flex;align-items:center;gap:10px;padding:14px 16px;
      background:linear-gradient(135deg,#f58529 0%,#dd2a7b 50%,#8134af 100%)}
    .logo{width:30px;height:30px;border-radius:9px;background:rgba(255,255,255,.2);display:grid;place-items:center;font-size:16px}
    .title{flex:1;font-weight:700;font-size:14px;color:#fff;line-height:1.2}
    .title small{display:block;font-weight:500;font-size:11px;opacity:.85}
    .iconbtn{all:unset;cursor:pointer;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;color:#fff;font-size:16px}
    .iconbtn:hover{background:rgba(255,255,255,.2)}
    .body{padding:16px}
    .status{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#aab0c0;margin-bottom:14px}
    .dot{width:9px;height:9px;border-radius:50%;background:#5b6172}
    .dot.on{background:#34d399;box-shadow:0 0 10px #34d399;animation:p 1.2s infinite}
    .dot.err{background:#f87171;box-shadow:0 0 10px #f87171}
    @keyframes p{50%{opacity:.4}}
    .stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
    .stat{background:#1c1f28;border:1px solid #262a35;border-radius:12px;padding:10px 12px}
    .stat b{display:block;font-size:22px;color:#fff}
    .stat span{font-size:11px;color:#8b92a5}
    .bar{height:6px;background:#1c1f28;border-radius:6px;overflow:hidden;margin-bottom:14px}
    .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#f58529,#dd2a7b,#8134af);transition:width .4s}
    .row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
    label{font-size:11px;color:#8b92a5;display:block;margin-bottom:5px}
    input{width:100%;background:#1c1f28;border:1px solid #2c3140;color:#fff;border-radius:10px;padding:8px 10px;font-size:13px;outline:none}
    input:focus{border-color:#dd2a7b}
    .btns{display:flex;gap:10px}
    button.b{all:unset;box-sizing:border-box;flex:1;text-align:center;cursor:pointer;padding:10px 12px;border-radius:11px;font-size:13px;font-weight:600}
    .go{background:linear-gradient(135deg,#dd2a7b,#8134af);color:#fff}
    .go:hover{filter:brightness(1.1)}
    .stop{background:#2a1f25;color:#f87171;border:1px solid #4a2630}
    .ghost{background:#1c1f28;color:#aab0c0;border:1px solid #2c3140;font-weight:500;font-size:12px}
    button.b[disabled]{opacity:.4;cursor:not-allowed}
    .log{margin-top:14px;max-height:110px;overflow:auto;font-size:11.5px;color:#8b92a5;background:#0f1116;border-radius:10px;padding:8px 10px;line-height:1.5}
    .log div{margin-bottom:2px}
    .foot{display:flex;gap:8px;margin-top:10px}
    .hint{font-size:12.5px;color:#aab0c0;line-height:1.5;margin-bottom:14px}
    .mini{display:none;all:unset;cursor:pointer;padding:10px 16px;border-radius:999px;color:#fff;font:600 13px -apple-system,sans-serif;
      background:linear-gradient(135deg,#f58529,#dd2a7b,#8134af);box-shadow:0 8px 24px rgba(0,0,0,.4)}
    .collapsed .card{display:none}
    .collapsed .mini{display:block}
    .hidden{display:none!important}
  </style>
  <div id="wrap">
    <button class="mini" id="mini">❤ Unliker</button>
    <div class="card">
      <div class="head">
        <div class="logo">💔</div>
        <div class="title">IG Bulk Unliker<small>Batal suka massal · v1.3</small></div>
        <button class="iconbtn" id="min" title="Kecilkan">–</button>
      </div>
      <div class="body">
        <div id="offpage" class="hidden">
          <div class="hint">Extension ini bekerja di halaman <b>Aktivitas Anda → Suka</b>. Klik tombol di bawah untuk membukanya.</div>
          <div class="btns"><button class="b go" id="open">Buka halaman Suka</button></div>
        </div>
        <div id="onpage">
          <div class="status"><span class="dot" id="dot"></span><span id="status">Siap</span></div>
          <div class="stats">
            <div class="stat"><b id="sTotal">0</b><span>Berhasil di-unlike</span></div>
            <div class="stat"><b id="sBatch">0</b><span>Batch ini</span></div>
          </div>
          <div class="bar"><i id="bar"></i></div>
          <div class="row">
            <div><label>Ukuran batch (maks 300)</label><input id="batch" type="number" value="25" min="1" max="300"></div>
            <div><label>Target total (0 = semua)</label><input id="total" type="number" value="0" min="0"></div>
          </div>
          <div class="btns">
            <button class="b go" id="start">▶ Mulai</button>
            <button class="b stop" id="stop" disabled>■ Stop</button>
          </div>
          <div class="foot">
            <button class="b ghost" id="diag">🔍 Diagnosa</button>
            <button class="b ghost" id="copy">📋 Salin log</button>
          </div>
          <div class="log" id="log"></div>
        </div>
      </div>
    </div>
  </div>`;
  document.documentElement.appendChild(host);

  const $ = (id) => root.getElementById(id);
  const onLikesPage = () => location.pathname.startsWith(LIKES_PATH);

  function log(m) {
    logLines.push(`[${new Date().toLocaleTimeString()}] ${m}`);
    const d = document.createElement('div');
    d.textContent = m;
    $('log').prepend(d);
    console.log('[IG Unliker]', m);
  }
  function setStatus(text, mode) {
    $('status').textContent = text;
    $('dot').className = 'dot' + (mode ? ' ' + mode : '');
  }
  function setStats(batch) {
    $('sTotal').textContent = removedTotal;
    $('sBatch').textContent = batch;
    const target = +$('total').value || 0;
    $('bar').style.width = target ? Math.min(100, (removedTotal / target) * 100) + '%' : (running ? '100%' : '0');
  }

  $('min').onclick = () => $('wrap').classList.add('collapsed');
  $('mini').onclick = () => $('wrap').classList.remove('collapsed');
  $('open').onclick = () => (location.href = LIKES_URL);

  setInterval(() => {
    if (!document.documentElement.contains(host)) document.documentElement.appendChild(host);
    const on = onLikesPage();
    $('onpage').classList.toggle('hidden', !on);
    $('offpage').classList.toggle('hidden', on);
  }, 700);

  /* ================= DOM helpers ================= */
  function isVisible(el) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const s = getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
  }

  function matches(labels, text) {
    return labels.some((l) => text === l || text.startsWith(l + ' ') || text.startsWith(l + '(') || text.startsWith(l + ':'));
  }

  // Cari tombol berdasarkan teks. Jika tidak punya role/tabindex, pakai elemen teksnya sendiri
  // (event klik akan bubble ke handler React di induknya).
  function findButton(labels, scope = document) {
    let fallback = null;
    const nodes = scope.querySelectorAll('button,[role="button"],[tabindex="0"],a,div,span');
    for (const n of nodes) {
      const txt = clean(n.innerText || n.textContent || n.getAttribute('aria-label'));
      if (!txt || txt.length > 30 || !matches(labels, txt) || !isVisible(n)) continue;
      if (n.matches(CLICKABLE)) return n;
      const c = n.closest(CLICKABLE);
      if (c && isVisible(c)) return c;
      if (!fallback && n.children.length === 0) fallback = n;
    }
    return fallback;
  }

  function findExact(labels, scope = document) {
    for (const n of scope.querySelectorAll(CLICKABLE)) {
      if (labels.includes(clean(n.innerText || n.textContent)) && isVisible(n)) return n;
    }
    return null;
  }

  function dialogConfirm() {
    const dlgs = [...document.querySelectorAll('[role="dialog"],[aria-modal="true"]')].filter(isVisible);
    for (const d of dlgs) {
      const b = findButton(T.unlike, d);
      if (b) return b;
    }
    return null;
  }

  function selectIndicators() {
    const main = document.querySelector('main') || document.body;
    const boxes = [...main.querySelectorAll('[role="checkbox"],input[type="checkbox"]')].filter(isVisible);
    return boxes.length > 0 || !!findExact(T.cancel) || !!findButton(T.unlike);
  }

  async function waitFor(fn, timeout = 8000) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      if (!running) return null;
      const r = fn();
      if (r) return r;
      await sleep(200);
    }
    return null;
  }

  /* ================= Strategi klik ================= */
  const pt = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  };

  function fire(target, p) {
    const base = {
      bubbles: true, cancelable: true, composed: true, view: window,
      clientX: p.x, clientY: p.y, screenX: p.x, screenY: p.y,
      button: 0, pointerId: 1, pointerType: 'mouse', isPrimary: true, width: 1, height: 1
    };
    const seq = ['pointerover', 'mouseover', 'pointermove', 'mousemove', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
    for (const t of seq) {
      const isPtr = t.startsWith('pointer') && window.PointerEvent;
      const Ev = isPtr ? PointerEvent : MouseEvent;
      target.dispatchEvent(new Ev(t, Object.assign({}, base, { buttons: t === 'pointerdown' || t === 'mousedown' ? 1 : 0 })));
    }
  }

  async function trusted(el) {
    el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    await sleep(60);
    const p = pt(el);
    if (!usedTrusted) {
      usedTrusted = true;
      log('Memakai klik terpercaya (debugger). Brave akan menampilkan bar "sedang di-debug" — itu normal.');
    }
    try {
      const r = await chrome.runtime.sendMessage({ type: 'trustedClick', x: p.x, y: p.y });
      if (!r || !r.ok) log('Klik terpercaya gagal: ' + (r && r.error));
    } catch (e) {
      log('Klik terpercaya error: ' + e.message + ' (reload halaman Instagram setelah reload extension)');
    }
  }

  const STRATS = [
    ['klik sintetis', async (el) => {
      el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      const p = pt(el);
      const top = document.elementFromPoint(p.x, p.y);
      fire(top && el.contains(top) ? top : el, p);
    }],
    ['el.click()', async (el) => el.click()],
    ['event ke elemen', async (el) => fire(el, pt(el))],
    ['keyboard Enter', async (el) => {
      el.focus?.();
      for (const t of ['keydown', 'keypress', 'keyup'])
        el.dispatchEvent(new KeyboardEvent(t, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
    }],
    ['klik terpercaya', trusted]
  ];

  // Tekan elemen dengan beberapa strategi sampai verify() terpenuhi
  async function press(el, kind, verify, label) {
    el.scrollIntoView?.({ block: 'center', inline: 'center' });
    await sleep(150);
    const order = [best[kind], ...STRATS.map((_, i) => i).filter((i) => i !== best[kind])];
    for (const i of order) {
      if (!running) return false;
      await STRATS[i][1](el);
      if (await waitFor(verify, 1300)) {
        best[kind] = i;
        log(`${label}: berhasil (${STRATS[i][0]})`);
        return true;
      }
    }
    log(`${label}: semua cara klik gagal.`);
    return false;
  }

  /* ================= Pilih postingan ================= */
  function getTiles() {
    const main = document.querySelector('main') || document.body;
    const boxes = [...main.querySelectorAll('[role="checkbox"],input[type="checkbox"]')].filter(isVisible);
    if (boxes.length) return boxes.filter((b) => b.getAttribute('aria-checked') !== 'true' && !b.checked);
    const out = [], seen = new Set();
    main.querySelectorAll('img,video').forEach((m) => {
      const r = m.getBoundingClientRect();
      if (r.width < 80 || r.height < 80) return;
      const t = m.closest('[role="button"],a,[tabindex="0"]') || m.parentElement;
      if (t && !seen.has(t)) { seen.add(t); out.push(t); }
    });
    return out;
  }

  const snap = (t) =>
    t.outerHTML.length + '|' + t.getAttribute('aria-checked') + '|' +
    (t.parentElement ? t.parentElement.outerHTML.length : 0);

  function scroller(el) {
    let p = el && el.parentElement;
    while (p && p !== document.body) {
      const s = getComputedStyle(p);
      if (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 10) return p;
      p = p.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  }

  document.addEventListener('click', (e) => {
    if (!running) return;
    const a = e.target.closest && e.target.closest('a[href*="/p/"],a[href*="/reel/"]');
    if (a) e.preventDefault();
  }, true);

  async function selectBatch(n) {
    const done = new WeakSet();
    let clicked = 0, stagnant = 0;
    while (running && clicked < n && stagnant < 5) {
      const fresh = getTiles().filter((t) => !done.has(t));
      if (!fresh.length) {
        const sc = scroller(document.querySelector('main img'));
        sc.scrollBy({ top: Math.max(400, sc.clientHeight * 0.9) });
        stagnant++;
        await sleep(900);
        continue;
      }
      stagnant = 0;
      for (const t of fresh) {
        if (!running || clicked >= n) break;
        if (!tileOK) {
          const before = snap(t);
          const ok = await press(t, 'tile', () => !t.isConnected || snap(t) !== before, 'Pilih postingan');
          if (!ok) return -1;
          tileOK = true;
        } else {
          await STRATS[best.tile][1](t);
        }
        done.add(t);
        clicked++;
        setStats(clicked);
        await sleep(rand(20, 50));
      }
    }
    return clicked;
  }

  /* ================= Diagnosa ================= */
  function snippet(el) { return el ? el.outerHTML.replace(/\s+/g, ' ').slice(0, 220) : 'tidak ada'; }

  function diagnose() {
    log('--- DIAGNOSA ---');
    log('URL: ' + location.pathname);
    log('Checkbox terlihat: ' + [...document.querySelectorAll('[role="checkbox"],input[type="checkbox"]')].filter(isVisible).length);
    log('Tile terdeteksi: ' + getTiles().length);
    log('Select: ' + snippet(findButton(T.select)));
    log('Unlike/Delete: ' + snippet(findButton(T.unlike)));
    log('Dialog konfirmasi: ' + snippet(dialogConfirm()));
    const texts = new Set();
    document.querySelectorAll(CLICKABLE).forEach((b) => {
      const t = clean(b.innerText);
      if (t && t.length < 25 && isVisible(b)) texts.add(t);
    });
    log('Teks tombol terlihat: ' + [...texts].slice(0, 25).join(' | '));
  }
  $('diag').onclick = diagnose;
  $('copy').onclick = async () => {
    try { await navigator.clipboard.writeText(logLines.join('\n')); log('Log disalin ke clipboard.'); }
    catch { log('Gagal menyalin; buka console (F12) untuk melihat log.'); }
  };

  /* ================= Alur ================= */
  async function enterSelectMode() {
    if (selectIndicators()) return true;
    const btn = await waitFor(() => findButton(T.select), 5000);
    if (!btn) { log('Tombol Select/Pilih tidak ditemukan.'); return false; }
    return press(btn, 'btn', () => selectIndicators() || !findButton(T.select), 'Masuk mode Pilih');
  }

  async function detachDebugger() {
    if (!usedTrusted) return;
    try { await chrome.runtime.sendMessage({ type: 'detach' }); } catch (e) {}
  }

  async function run() {
    running = true;
    $('start').disabled = true;
    $('stop').disabled = false;

    const batch = Math.min(300, Math.max(1, +$('batch').value || 25));
    const total = Math.max(0, +$('total').value || 0);

    while (running && (total === 0 || removedTotal < total)) {
      const want = total ? Math.min(batch, total - removedTotal) : batch;

      // 1) Otomatis masuk mode Pilih
      setStatus('Masuk ke mode Pilih…', 'on');
      if (!(await enterSelectMode())) {
        if (running) { setStatus('Gagal masuk mode Pilih', 'err'); diagnose(); }
        break;
      }
      await sleep(400);

      // 2) Pilih postingan
      setStatus(`Memilih ${want} postingan…`, 'on');
      const n = await selectBatch(want);
      if (!running) break;
      if (n <= 0) {
        log(n === 0 ? 'Tidak ada postingan lagi.' : 'Klik pada postingan tidak berpengaruh.');
        if (n < 0) setStatus('Gagal memilih postingan', 'err');
        diagnose();
        break;
      }

      // 3) Tombol Batal suka / Delete
      setStatus('Menekan Batal suka…', 'on');
      const unBtn = await waitFor(() => findButton(T.unlike), 6000);
      if (!unBtn) { log('Tombol Batal suka tidak muncul.'); setStatus('Tombol Batal suka tidak ada', 'err'); diagnose(); break; }
      const ok1 = await press(unBtn, 'btn', () => !!dialogConfirm() || !findButton(T.unlike), 'Batal suka');
      if (!ok1) { setStatus('Gagal menekan Batal suka', 'err'); diagnose(); break; }

      // 4) Konfirmasi dialog (jika ada)
      const conf = await waitFor(dialogConfirm, 3000);
      if (conf) {
        const ok2 = await press(conf, 'btn', () => !dialogConfirm(), 'Konfirmasi');
        if (!ok2) { setStatus('Gagal konfirmasi', 'err'); diagnose(); break; }
      }

      await sleep(2500);
      if (BLOCKED.test(document.body.innerText.slice(0, 20000))) {
        setStatus('Instagram membatasi aksi. Berhenti.', 'err');
        log('Terdeteksi pembatasan dari Instagram. Tunggu beberapa jam lalu coba lagi.');
        break;
      }

      removedTotal += n;
      setStats(0);
      log(`Batch selesai: ${n} postingan. Total ${removedTotal}.`);

      // 5) Jeda acak antar batch
      const pause = rand(5000, 10000);
      setStatus(`Jeda ${Math.round(pause / 1000)} detik…`, 'on');
      await sleep(pause);
    }

    const stopped = !running;
    running = false;
    $('start').disabled = false;
    $('stop').disabled = true;
    if ($('dot').className.indexOf('err') === -1) setStatus(stopped ? 'Dihentikan' : 'Selesai', '');
    setStats(0);
    detachDebugger();
  }

  $('start').onclick = run;
  $('stop').onclick = () => { running = false; setStatus('Menghentikan…', ''); log('Dihentikan oleh pengguna.'); };

  log('Siap. Buka halaman Suka lalu klik Mulai.');
})();
