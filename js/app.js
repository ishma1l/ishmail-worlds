/* ISHMAIL WORLDS — controller */
(function () {
  const C = window.IW, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const stage = $('#stage'), app = $('#app');
  const ORDER = ['gotham', 'porsche', 'lifestyle'];
  const TITLES = { gotham: 'GOTHAM', porsche: 'PORSCHE', lifestyle: 'Business <em>&amp;</em> Lifestyle' };
  const VEIL = { gotham: 'linear-gradient(90deg,transparent,rgba(111,178,255,.5),#02040a 45%,#02040a 55%,rgba(111,178,255,.5),transparent)',
                 porsche: 'linear-gradient(90deg,transparent,rgba(255,255,255,.55),#050505 45%,#050505 55%,rgba(213,0,28,.6),transparent)',
                 lifestyle: 'linear-gradient(90deg,transparent,rgba(233,200,134,.55),#140c07 45%,#140c07 55%,rgba(233,200,134,.55),transparent)' };
  const state = { screen: 'intro', world: null, focus: {}, busy: false, firstInput: false };

  /* ---------------- fit the 1920×1080 stage to any screen ---------------- */
  function fit() { const s = Math.min(innerWidth / 1920, innerHeight / 1080); stage.style.transform = `scale(${s})`; }
  addEventListener('resize', fit); fit();

  /* ---------------- TV hardware: lighter mode ---------------- */
  const q = new URLSearchParams(location.search);
  const tvLike = /Android|SMART-TV|SmartTV|GoogleTV|AFT|BRAVIA|CrKey|Tizen|Web0S|NetCast|Nebula/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent);
  const lite = q.has('lite') || (!q.has('full') && (tvLike || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 2));
  if (lite) document.body.classList.add('lite');
  Media.setBudget(lite ? 4 : 9);
  if (Sound.muted) document.body.classList.add('muted');

  /* ---------------- clocks (real time, real places) ---------------- */
  const pad = n => String(n).padStart(2, '0');
  function tickClocks() {
    const d = new Date();
    $$('[data-clock="hm"]').forEach(e => e.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}`);
    $$('[data-clock="date"]').forEach(e => e.textContent = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }));
    $$('.l-row').forEach(r => { try { r.querySelector('.t').textContent = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: r.dataset.tz }); } catch (e) {} });
  }

  /* ---------------- build media ---------------- */
  $$('[data-slot]').forEach(el => {
    const spec = Media.bindSlot(el);
    const lab = el.querySelector('.mon-label, .p-cap, .l-cap'); if (lab && spec) lab.textContent = spec.label;
  });
  ORDER.forEach(w => Media.featured(w, $(`[data-featured="${w}"]`)));

  // destinations: list rows + crossfading window
  const L = C.worlds.lifestyle, list = $('.l-list');
  L.destinations.forEach((d, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button class="l-row" data-focus="dest" data-i="${i}" data-tz="${d.tz}"><span class="n">${d.name}</span><span class="t"></span></button>`;
    list.append(li);
  });
  let destI = -1, destT;
  function setDest(i) {
    if (i === destI) return; destI = i; const d = L.destinations[i], win = $('.l-window');
    const target = win.classList.contains('flip') ? $('video.a', win) : $('video.b', win);
    Media.load(target, Media.chain('lifestyle', d));
    target.dataset.label = d.name;
    target.oncanplay = () => { target.oncanplay = null; target.play().catch(() => {}); win.classList.toggle('flip'); $('.l-window-name').textContent = d.name;
      setTimeout(() => { const other = win.classList.contains('flip') ? $('video.a', win) : $('video.b', win); other.pause(); }, 1500); };
    $$('.l-row').forEach(r => r.classList.toggle('active', +r.dataset.i === i));
  }
  function cycleDest() { clearTimeout(destT); destT = setTimeout(() => { if (state.world === 'lifestyle' && !(focused() && focused().classList.contains('l-row'))) setDest((destI + 1) % L.destinations.length); cycleDest(); }, 14000); }
  setDest(0); cycleDest();
  tickClocks(); setInterval(tickClocks, 1000);

  // quotes over the city strip
  let qi = 0; const quoteEl = $('.l-quote'); quoteEl.textContent = L.quotes[0];
  setInterval(() => { if (state.world !== 'lifestyle') return; quoteEl.classList.add('out');
    setTimeout(() => { qi = (qi + 1) % L.quotes.length; quoteEl.textContent = L.quotes[qi]; quoteEl.classList.remove('out'); Sound.chime(); }, 1300); }, 13000);

  // effects
  FX.dust($('#dust'), 'introDust', { count: 170 });
  FX.rain($('.g-rain'), 'rain');
  FX.dust($('.l-dust'), 'gold', { count: 70, lite: 25, color: '255,214,150' });
  FX.map($('.g-map'));
  FX.bats($('.g-bats'));

  /* ---------------- Porsche: the hero film's progress, as a racing line ---------------- */
  const trackPath = $('.p-track-done'), car = $('.p-car'), plen = trackPath.getTotalLength();
  trackPath.style.strokeDasharray = plen; trackPath.style.strokeDashoffset = plen;
  const fmt = s => isFinite(s) ? `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}` : '0:00';
  function trackTick() {
    const st = Media.FEAT.porsche;
    if (st && (st.mode === 'local' || st.mode === 'standin') && st.video) {
      const v = st.video, p = v.duration ? v.currentTime / v.duration : 0;
      trackPath.style.strokeDashoffset = plen * (1 - p); const pt = trackPath.getPointAtLength(plen * p); car.setAttribute('cx', pt.x); car.setAttribute('cy', pt.y);
      $('.p-time').textContent = `${fmt(v.currentTime)} / ${fmt(v.duration)}`; $('.p-track').classList.remove('hidden');
    } else $('.p-track').classList.add('hidden');
  }
  setInterval(trackTick, 250);

  /* ---------------- focus model ----------------
     LEFT / RIGHT  → switch worlds
     UP / DOWN     → move through this world's items, in a fixed order
     OK            → act on the focused item                               */
  const FOCUS_ORDER = {
    gotham: ['.g-hero', '#w-gotham .open-original', '[data-slot="gotham/feed-1"]', '[data-slot="gotham/feed-2"]', '[data-slot="gotham/feed-3"]', '[data-slot="gotham/feed-4"]'],
    porsche: ['.p-hero', '#w-porsche .open-original', '[data-slot="porsche/display-1"]', '[data-slot="porsche/display-2"]', '[data-slot="porsche/display-3"]', '[data-slot="porsche/display-4"]'],
    lifestyle: ['.l-hero', '#w-lifestyle .open-original', '.l-strip', '[data-slot="lifestyle/collection-1"]', '[data-slot="lifestyle/collection-2"]', '[data-slot="lifestyle/collection-3"]', '[data-slot="lifestyle/collection-4"]', '.l-row']
  };
  function items(w = state.world) {
    const out = [$('.tb-sound')];
    FOCUS_ORDER[w].forEach(sel => $$(sel).forEach(el => { if (el.classList.contains('open-original') && !el.classList.contains('show')) return; out.push(el); }));
    return out;
  }
  const focused = () => state.focusEl;
  function setFocus(el, silent) {
    if (state.focusEl === el) return;
    if (state.focusEl) state.focusEl.classList.remove('is-focus');
    state.focusEl = el; if (!el) return;
    el.classList.add('is-focus'); try { el.focus({ preventScroll: true }); } catch (e) {}
    state.focus[state.world] = el;
    if (!silent) Sound.tick();
    if (el.classList.contains('l-row')) setDest(+el.dataset.i);
    hint(); Media.schedule($(`#w-${state.world}`), el);
  }
  function move(d) {
    const list = items(); let i = list.indexOf(state.focusEl);
    if (i < 0) { setFocus(list[1] || list[0]); return; }
    const n = Math.max(0, Math.min(list.length - 1, i + d));
    if (n !== i) setFocus(list[n]); else bump();
  }
  function bump() { const el = state.focusEl; if (!el) return; el.animate([{ translate: '0 0' }, { translate: '0 -6px' }, { translate: '0 0' }], { duration: 220 }); }
  document.addEventListener('focusin', e => { // keep in sync if the browser moves focus itself
    const t = e.target.closest('[data-focus]'); if (t && state.screen === 'world' && t !== state.focusEl && items().includes(t)) setFocus(t, true);
  });

  /* ---------------- hint (what OK will do) ---------------- */
  let hintT;
  function okLabel(el) {
    if (!el) return '';
    if (el.classList.contains('tb-sound')) return Sound.muted ? 'Sound on' : 'Sound off';
    if (el.classList.contains('open-original')) return el.textContent;
    if (el.classList.contains('featured')) { const st = Media.FEAT[state.world];
      if (st.mode === 'local') return st.cfg.playWithSound ? 'Full screen' : 'Watch with sound'; if (st.mode === 'standin') return 'Full screen'; if (st.cfg.platform === 'TikTok' && st.mode === 'embed') return 'Pause / play'; return `Open on ${st.cfg.platform}`; }
    if (el.classList.contains('l-row')) return el.classList.contains('active') ? 'Full screen' : 'Show';
    return 'Full screen';
  }
  function hint() {
    const h = $('#hint');
    const i = ORDER.indexOf(state.world), nm = w => TITLES[w].replace(/<[^>]+>/g, '').replace('&amp;', '&');
    h.innerHTML = `<span><b>◀</b>${nm(ORDER[(i + 2) % 3])}</span><span><b>▶</b>${nm(ORDER[(i + 1) % 3])}</span><span><b>▲ ▼</b>Select</span><span><b>OK</b>${okLabel(state.focusEl)}</span>`;
    h.classList.remove('idle'); clearTimeout(hintT); hintT = setTimeout(() => h.classList.add('idle'), 5000);
    app.classList.add('show-edges'); clearTimeout(hint.e); hint.e = setTimeout(() => app.classList.remove('show-edges'), 3500);
  }

  /* ---------------- world switching ---------------- */
  function setChrome(w) {
    app.dataset.world = w; $('.tb-title').innerHTML = TITLES[w];
    $$('.tb-dots button').forEach(b => b.classList.toggle('on', b.dataset.go === w));
    const i = ORDER.indexOf(w);
    $('.edge.prev span').innerHTML = TITLES[ORDER[(i + 2) % 3]].replace(/<[^>]+>/g, '');
    $('.edge.next span').innerHTML = TITLES[ORDER[(i + 1) % 3]].replace(/<[^>]+>/g, '');
  }
  function enterWorld(w, dir) {
    const prev = state.world; if (prev === w) return;
    const inEl = $(`#w-${w}`), outEl = prev && $(`#w-${prev}`);
    setChrome(w); state.world = w;
    if (outEl) {
      outEl.classList.remove('current'); outEl.classList.add(dir > 0 ? 'to-left' : 'to-right');
      setTimeout(() => { outEl.classList.remove('to-left', 'to-right'); if (state.world !== prev) Media.pauseAll(outEl); }, 1200);
      const v = $('#veil'); v.style.background = VEIL[w];
      v.animate([{ opacity: 0, transform: `translateX(${dir > 0 ? 60 : -60}%)` }, { opacity: 1, transform: 'translateX(0)', offset: .5 }, { opacity: 0, transform: `translateX(${dir > 0 ? -60 : 60}%)` }],
        { duration: 1100, easing: 'cubic-bezier(.6,0,.3,1)' });
    }
    inEl.classList.remove('current', 'to-left', 'to-right'); inEl.classList.add(dir > 0 ? 'from-right' : dir < 0 ? 'from-left' : 'x');
    void inEl.offsetWidth; inEl.classList.remove('from-right', 'from-left', 'x'); inEl.classList.add('current');
    Sound.world(w); if (prev) Sound.whoosh(1);
    if (state.focusEl) state.focusEl.classList.remove('is-focus'); state.focusEl = null;
    setFocus(state.focus[w] && items(w).includes(state.focus[w]) ? state.focus[w] : items(w)[1], true);
    Media.schedule(inEl, state.focusEl);
    if (w === 'gotham') { FX.start('rain'); scheduleLightning(); } else FX.stop('rain');
    heroAudio();
    if (w === 'lifestyle') FX.start('gold'); else FX.stop('gold');
  }
  function step(dir) { if (state.busy) return; const i = ORDER.indexOf(state.world); enterWorld(ORDER[(i + dir + 3) % 3], dir); state.busy = true; setTimeout(() => state.busy = false, 650); }

  /* Gotham weather */
  let lt;
  function lightning() {
    $('.g-flash').animate([{ opacity: 0 }, { opacity: .9, offset: .06 }, { opacity: .1, offset: .16 }, { opacity: .65, offset: .26 }, { opacity: 0 }], { duration: 1000, easing: 'ease-out' });
  }
  function scheduleLightning() { clearTimeout(lt); lt = setTimeout(() => { if (state.world === 'gotham' && state.screen === 'world' && !theatre.open) lightning(); scheduleLightning(); }, 9000 + Math.random() * 15000); }

  /* Featured clips that play with their own sound (Gotham) — only while you're in that world */
  function heroAudio() {
    ORDER.forEach(w => {
      const st = Media.FEAT[w]; if (!st || !st.cfg.playWithSound) return;
      if (st.mode === 'embed') { const want = state.world === w && state.screen === 'world' && !Sound.muted && !theatre.open;
        Media.tiktok(w, 'play'); Media.tiktok(w, want ? 'unMute' : 'mute'); return; }
      if (st.mode !== 'local') return;
      const v = st.video, want = state.world === w && state.screen === 'world' && !Sound.muted && !theatre.open;
      if (want) {
        v.muted = false; if (v.paused && !v.dataset.user) v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
        // browsers may refuse sound before the first button press: if it stopped, keep it playing silently until then
        setTimeout(() => { if (v.paused && !v.dataset.user) { v.muted = true; v.play().catch(() => {}); } }, 400);
      }
      else v.muted = true;
    });
  }
  document.addEventListener('feat-ready', heroAudio);

  /* ---------------- full-screen player ---------------- */
  const th = $('#theatre'), thBtns = $$('.th-btn', th);
  const theatre = { open: false, v: null, idx: 1, t: 0, featuredWorld: null };
  function openTheatre(src, title, featuredWorld, startAt) {
    if (!src) return;
    const v = document.createElement('video'); Object.assign(v, { src, loop: true, playsInline: true, autoplay: true }); v.muted = Sound.muted;
    $('.th-media', th).innerHTML = ''; $('.th-media', th).append(v);
    v.addEventListener('loadedmetadata', () => { if (startAt) v.currentTime = startAt; }, { once: true });
    v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
    v.ontimeupdate = () => { $('.th-progress i', th).style.width = `${(v.currentTime / v.duration) * 100 || 0}%`; $('.th-time', th).textContent = `${fmt(v.currentTime)} / ${fmt(v.duration)}`; };
    v.onplay = v.onpause = () => $('.th-play', th).textContent = v.paused ? 'Play' : 'Pause';
    $('.th-title', th).textContent = title || '';
    theatre.featuredWorld = featuredWorld; $('[data-act="original"]', th).classList.toggle('hidden', !featuredWorld);
    $('[data-act="sound"]', th).textContent = Sound.muted ? 'Sound off' : 'Sound on';
    Object.assign(theatre, { open: true, v, idx: 1 }); th.classList.add('open'); thFocus(1); thWake();
    Media.pauseAll($(`#w-${state.world}`)); Sound.duck(true); heroAudio();
  }
  function closeTheatre() {
    if (!theatre.open) return; theatre.open = false; th.classList.remove('open');
    if (theatre.v) { theatre.v.pause(); setTimeout(() => $('.th-media', th).innerHTML = '', 500); }
    Sound.duck(false); Media.schedule($(`#w-${state.world}`), state.focusEl); hint(); heroAudio();
  }
  function visibleBtns() { return thBtns.filter(b => !b.classList.contains('hidden')); }
  function thFocus(i) { const b = visibleBtns(); theatre.idx = Math.max(0, Math.min(b.length - 1, i)); b.forEach((x, k) => x.classList.toggle('is-focus', k === theatre.idx)); }
  function thWake() { th.classList.remove('idle'); clearTimeout(theatre.t); theatre.t = setTimeout(() => th.classList.add('idle'), 4000); }
  function thAct(act) {
    const v = theatre.v; if (!v) return;
    if (act === 'play') v.paused ? v.play().catch(() => {}) : v.pause();
    if (act === 'back10') v.currentTime = Math.max(0, v.currentTime - 10);
    if (act === 'fwd10') v.currentTime = Math.min((v.duration || 0) - .5, v.currentTime + 10);
    if (act === 'sound') { toggleSound(); v.muted = Sound.muted; $('[data-act="sound"]', th).textContent = Sound.muted ? 'Sound off' : 'Sound on'; }
    if (act === 'original') openOriginal(theatre.featuredWorld);
    if (act === 'close') closeTheatre();
  }

  /* ---------------- actions ---------------- */
  function toggleSound() { Sound.init(); const m = Sound.toggleMute(); document.body.classList.toggle('muted', m); toast(m ? 'Sound off' : 'Sound on'); hint(); heroAudio(); }
  function openOriginal(w) {
    const st = Media.FEAT[w]; if (!st) return; toast(`Opening on ${st.cfg.platform}…`);
    const a = document.createElement('a'); a.href = st.cfg.original; a.target = '_blank'; a.rel = 'noopener'; document.body.append(a); a.click(); a.remove();
  }
  function videoOf(el) { if (el.classList.contains('l-row')) { const win = $('.l-window'); return win.classList.contains('flip') ? $('video.b', win) : $('video.a', win); } return el.querySelector('video'); }
  function activate(el) {
    if (!el) return;
    if (el.classList.contains('tb-sound')) return toggleSound();
    if (el.classList.contains('open-original')) return openOriginal(el.dataset.worldOriginal);
    if (el.classList.contains('featured')) {
      const w = state.world, st = Media.FEAT[w];
      if (st.mode === 'local') return openTheatre(st.video.currentSrc, st.cfg.caption, w, st.video.currentTime);
      if (st.mode === 'standin') return openTheatre(st.video.currentSrc, st.video.dataset.label, w, st.video.currentTime);
      if (st.mode === 'embed' && st.cfg.platform === 'TikTok') { st.paused = !st.paused; Media.tiktok(w, st.paused ? 'pause' : 'play'); return toast(st.paused ? 'Paused' : 'Playing'); }
      return openOriginal(w);
    }
    if (el.classList.contains('l-row') && !el.classList.contains('active')) return setDest(+el.dataset.i);
    const v = videoOf(el); if (v && v.currentSrc) openTheatre(v.currentSrc, v.dataset.label || el.dataset.label, null, v.currentTime);
  }
  function playPause() {
    if (theatre.open) return thAct('play');
    const el = state.focusEl; if (!el) return;
    if (el.classList.contains('featured')) {
      const st = Media.FEAT[state.world];
      if ((st.mode === 'local' || st.mode === 'standin') && st.video) { const v = st.video; v.paused ? (v.play(), delete v.dataset.user) : (v.pause(), v.dataset.user = 'paused'); return toast(v.paused ? 'Paused' : 'Playing'); }
      if (st.mode === 'embed') return activate(el);
    }
    const v = videoOf(el); if (v) { v.paused ? v.play().catch(() => {}) : v.pause(); toast(v.paused ? 'Paused' : 'Playing'); }
  }

  /* ---------------- BACK: close things first, never exit by accident ---------------- */
  let backArmed = 0;
  function back() {
    if (theatre.open) return closeTheatre();
    if (state.screen === 'intro') return;
    const list = items();
    if (state.focusEl && state.focusEl !== list[1]) { setFocus(list[1]); return; }
    if (performance.now() - backArmed < 2600) { toast('Leaving Ishmail Worlds'); return setTimeout(() => Remote.leave(), 400); }
    backArmed = performance.now(); toast('Press BACK again to leave');
  }

  /* ---------------- input ---------------- */
  function firstInput() {
    if (state.firstInput) return; state.firstInput = true; Sound.init();
    const el = document.documentElement, fs = el.requestFullscreen || el.webkitRequestFullscreen;
    if (fs && !document.fullscreenElement) { try { const p = fs.call(el, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
    if (state.screen === 'intro' && !intro.boomed) { intro.boomed = true; Sound.boom(); }
    if (state.screen === 'world') Sound.world(state.world);
    heroAudio();
  }
  Remote.on((a) => {
    firstInput();
    if (theatre.open) {
      const wasIdle = th.classList.contains('idle'); thWake();
      if (a === 'back') return closeTheatre();
      if (a === 'playpause') return thAct('play');
      if (wasIdle) return;               // first press just brings the controls back
      const b = visibleBtns();
      if (a === 'left') return thFocus(theatre.idx - 1);
      if (a === 'right') return thFocus(theatre.idx + 1);
      if (a === 'ok') return thAct(b[theatre.idx].dataset.act);
      return;
    }
    if (state.screen === 'intro') {
      if (!intro.doors) return intro.showDoors();
      if (a === 'left') return intro.select(intro.sel - 1);
      if (a === 'right') return intro.select(intro.sel + 1);
      if (a === 'ok') return intro.enter();
      return;
    }
    if (a === 'left') return step(-1);
    if (a === 'right') return step(1);
    if (a === 'up') return move(-1);
    if (a === 'down') return move(1);
    if (a === 'ok') return activate(state.focusEl);
    if (a === 'back') return back();
    if (a === 'playpause') return playPause();
  });
  // pointer / touch remotes
  document.addEventListener('click', e => {
    firstInput();
    const t = e.target;
    if (theatre.open) { const b = t.closest('.th-btn'); if (b) { thFocus(visibleBtns().indexOf(b)); thAct(b.dataset.act); } else thWake(); return; }
    const door = t.closest('.door'); if (door && state.screen === 'intro') { if (!intro.doors) intro.showDoors(); intro.select([...$$('.door')].indexOf(door)); return intro.enter(); }
    const edge = t.closest('.edge'); if (edge) return step(+edge.dataset.dir);
    const dot = t.closest('[data-go]'); if (dot) { const i = ORDER.indexOf(dot.dataset.go), c = ORDER.indexOf(state.world); return enterWorld(dot.dataset.go, i > c ? 1 : -1); }
    const f = t.closest('[data-focus]'); if (f && state.screen === 'world') { setFocus(f, true); activate(f); }
  });
  // embeds can grab focus when clicked; hand it back so the remote keeps working
  addEventListener('blur', () => setTimeout(() => { if (document.activeElement && document.activeElement.tagName === 'IFRAME') { document.activeElement.blur(); state.focusEl && state.focusEl.focus({ preventScroll: true }); } }, 1500));
  document.addEventListener('visibilitychange', () => { if (document.hidden) $$('video').forEach(v => v.pause()); else if (state.screen === 'world') Media.schedule($(`#w-${state.world}`), state.focusEl); });

  /* ---------------- toast ---------------- */
  let toastT; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }

  /* ---------------- WELCOME sequence ---------------- */
  const intro = {
    sel: Math.max(0, ORDER.indexOf(C.autoEnterWorld)), doors: false, timer: 0, boomed: false,
    start() {
      const s1 = 'WELCOME BACK,', s2 = C.name + '.';
      $('.it-1').innerHTML = [...s1].map((c, i) => `<span style="animation-delay:${(.3 + i * .05).toFixed(2)}s">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
      $('.it-2').innerHTML = [...s2].map((c, i) => `<span style="animation-delay:${(1.1 + i * .08).toFixed(2)}s">${c}</span>`).join('');
      $('#intro').classList.add('play'); FX.start('introDust');
      $$('#intro video').forEach(v => v.play().catch(() => {}));
      this.t1 = setTimeout(() => this.showDoors(), 4300);
    },
    showDoors() {
      if (this.doors) return; this.doors = true; clearTimeout(this.t1);
      $('#intro').classList.add('doors-up'); this.doorsAt = performance.now(); this.select(this.sel, true);
    },
    select(i, silent) {
      this.sel = (i + 3) % 3; $$('.door').forEach((d, k) => d.classList.toggle('sel', k === this.sel));
      if (!silent) Sound.tick();
      // the timer restarts whenever you choose
      clearTimeout(this.timer); const bar = $$('.door-timer i')[this.sel], ms = Math.max(3000, (C.autoEnterAfter - 4.3) * 1000);
      $$('.door-timer i').forEach(b => { b.style.transition = 'none'; b.style.width = '0'; });
      void bar.offsetWidth; bar.style.transition = `width ${ms}ms linear`; bar.style.width = '100%';
      this.timer = setTimeout(() => this.enter(), ms);
    },
    enter() {
      if (state.screen !== 'intro' || this.entering) return;
      const wait = 1500 - (performance.now() - (this.doorsAt || 0)); if (wait > 0) { clearTimeout(this.timer); this.timer = setTimeout(() => this.enter(), wait); return; } // let the doors settle first
      this.entering = true; clearTimeout(this.timer); clearTimeout(this.t1);
      const door = $$('.door')[this.sel], w = ORDER[this.sel];
      const r = door.getBoundingClientRect(), s = stage.getBoundingClientRect(), k = 1920 / s.width;
      const x = (r.left - s.left) * k, y = (r.top - s.top) * k, dw = r.width * k, dh = r.height * k;
      const sc = Math.max(1920 / dw, 1080 / dh) * 1.02;
      $('#intro').classList.add('entering'); door.classList.add('zoom');
      door.style.transform = `translate(${960 - (x + dw / 2)}px, ${540 - (y + dh / 2)}px) scale(${sc})`;
      Sound.whoosh(1.4);
      setTimeout(() => {
        state.screen = 'world'; app.classList.add('on'); enterWorld(w, 0);
        $('#intro').classList.remove('active'); hint();
        setTimeout(() => { FX.stop('introDust'); Media.pauseAll($('#intro')); }, 1200);
      }, 1150);
    }
  };

  Remote.arm();
  intro.start();
  window.__iw = { state, theatre, intro, items, enterWorld, FEAT: Media.FEAT, lite };
})();
