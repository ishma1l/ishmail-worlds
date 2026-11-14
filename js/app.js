/* ISHMAIL WORLDS — main controller */
(function () {
  const CFG = window.WORLDS_CONFIG;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const stage = $('#stage');
  const WORLDS = ['city', 'drive', 'empire'];
  const VEIL = { city: '#02040a', drive: '#000', empire: '#1d1008', hub: '#000' };
  let current = 'intro', hubIndex = 0, busy = false;
  const featured = {};   // world -> { mode, cfg }

  /* ---------------- stage scaling (always 16:9, letterboxed) ---------------- */
  function fit() { const s = Math.min(innerWidth / 1920, innerHeight / 1080); stage.style.transform = `scale(${s})`; }
  addEventListener('resize', fit); fit();

  /* ---------------- clocks ---------------- */
  const pad = n => String(n).padStart(2, '0');
  function clocks() {
    const d = new Date(), h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
    const map = {
      hm: `${pad(h)}:${pad(m)}`, hms: `${pad(h)}:${pad(m)}:${pad(s)}`, s: pad(s),
      hm12: `${(h % 12) || 12}:${pad(m)} ${h < 12 ? 'am' : 'pm'}`,
      date: d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
      dateLong: d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      dateUpper: d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
      dayUpper: d.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase()
    };
    $$('[data-clock]').forEach(el => { const v = map[el.dataset.clock]; if (el.textContent !== v) el.textContent = v; });
    const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${map.hms}`;
    $$('.c-time').forEach(el => el.textContent = stamp);
    $('.hub-greet-small').textContent = h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }
  clocks(); setInterval(clocks, 1000);
  $('.hub-greet-name').textContent = CFG.name;

  /* ---------------- toast ---------------- */
  let toastT; function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms); }

  /* ---------------- media panels ---------------- */
  const isImg = s => /\.(jpe?g|png|webp|gif|avif)$/i.test(s);
  function makePanel(p, cls, world) {
    const el = document.createElement('div');
    el.className = `panel ${cls}`; el.tabIndex = 0; el.dataset.id = p.id; el.dataset.world = world; el.dataset.title = p.title;
    const hint = document.createElement('div'); hint.className = 'p-hint';
    let media;
    const useSrc = (src, isFallback) => {
      if (media) media.remove();
      if (isImg(src)) { media = new Image(); media.className = 'media'; media.src = src; }
      else {
        media = document.createElement('video'); Object.assign(media, { muted: true, loop: true, playsInline: true, preload: 'auto', autoplay: false });
        media.setAttribute('muted', ''); media.src = src;
        if (current === world) media.play().catch(() => {});
      }
      media.addEventListener('error', () => {
        if (!isFallback && p.fallback) { el.classList.add('placeholder'); hint.textContent = `Add your clip → ${p.src}`; useSrc(p.fallback, true); }
        else { el.classList.add('placeholder'); hint.textContent = `Missing file: ${src}`; }
      }, { once: true });
      el.prepend(media); el.dataset.src = src;
    };
    el.append(hint); useSrc(p.src, false);
    return el;
  }

  /* ---------------- featured reel: local file → embed → clear fallback ---------------- */
  function embedUrl(f) {
    if (f.platform === 'tiktok') {
      const id = (f.tiktokId || '').trim() || ((f.url.match(/\/video\/(\d+)/) || [])[1]);
      return id ? `https://www.tiktok.com/player/v1/${id}?autoplay=1&loop=1&music_info=0&description=0&rel=0&controls=1` : null;
    }
    if (f.platform === 'instagram') { const code = (f.url.match(/\/(?:reel|p)\/([^/?#]+)/) || [])[1]; return code ? `https://www.instagram.com/reel/${code}/embed/` : null; }
    return null;
  }
  const PLAT = { tiktok: 'TikTok', instagram: 'Instagram' };
  let IN_PREVIEW = false; try { IN_PREVIEW = window.self !== window.top; } catch (e) { IN_PREVIEW = true; }
  /* Builds the embed for a given box size. Instagram's embed page = 54px header + a 4:5 media box
     (video letterboxed inside) + footer, so with crop on we shift the iframe up to show only the video. */
  function makeEmbed(f, url, SW, SH) {
    const wrap = document.createElement('div'); wrap.className = 'embed-wrap';
    wrap.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:#000';
    const ifr = document.createElement('iframe');
    ifr.src = url; ifr.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture'; ifr.setAttribute('allowfullscreen', '');
    ifr.referrerPolicy = 'strict-origin-when-cross-origin'; ifr.setAttribute('scrolling', 'no');
    if (f.platform === 'instagram' && f.crop !== false && f.aspect) {
      // fit the video's own shape inside the box, then line the iframe up so only the video shows
      let vw = SW, vh = SW / f.aspect; if (vh > SH) { vh = SH; vw = SH * f.aspect; }
      const W = Math.round(vw), top = 54 + (1.25 * W - W / f.aspect) / 2;
      ifr.style.cssText = `position:absolute;border:0;width:${W}px;height:${Math.round(54 + 1.25 * W + 360)}px;left:${Math.round((SW - W) / 2)}px;top:${Math.round((SH - vh) / 2 - top)}px`;
    } else ifr.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0';
    wrap.append(ifr); return { wrap, ifr };
  }
  function buildFeatured(world) {
    const f = CFG[world].featured, host = $(`[data-featured="${world}"]`);
    host.classList.add('featured-host'); host.tabIndex = 0; host.dataset.world = world;
    const sideTitle = { city: 'Case File 001', drive: 'Reel 01', empire: '' }[world];
    host.innerHTML = `
      <div class="feat">
        <div class="feat-label">${f.label}</div>
        <div class="feat-screen"></div>
        <div class="feat-side">
          <div class="side-title">${sideTitle}</div>
          <div class="side-meta">Source <b>${PLAT[f.platform]}</b><br>Press <b>O</b> to open<br>Press <b>Enter</b> to enlarge</div>
          <img class="qr" src="${f.qr}" alt="QR code">
          <a class="feat-open" href="${f.url}" target="_blank" rel="noopener">&#8599; Open original</a>
          <div class="status">Loading…</div>
        </div>
      </div>`;
    const screen = $('.feat-screen', host), status = $('.status', host);
    const state = featured[world] = { mode: 'loading', cfg: f };
    const setStatus = s => status.textContent = s;

    function fallback(reason) {
      state.mode = 'fallback'; host.classList.add('is-fallback');
      const txt = {
        'needs-id': [`Open on ${PLAT[f.platform]}`, `TikTok won't embed a short link. Paste the clip's number into js/config.js (see README), or scan the code to watch on your phone.`],
        offline: ['You’re offline', `Save a copy as ${f.localFile} to play it here without internet, or scan to watch on your phone.`],
        blocked: [`${PLAT[f.platform]} blocked playback`, `The platform didn't load inside this page. Press O to open the original, or scan the code.`],
        none: ['Featured clip', 'Press O to open the original.'],
        preview: [`Watch on ${PLAT[f.platform]}`, `This online preview can't play ${PLAT[f.platform]} inside the page. It plays when you run the downloaded version in Chrome. Tap below or scan the code.`]
      }[reason];
      screen.innerHTML = `<div class="feat-fallback"><h3>${txt[0]}</h3><img src="${f.qr}" alt="QR code"><p>${txt[1]}</p>
        <a class="feat-open" href="${f.url}" target="_blank" rel="noopener">&#8599; Open original <kbd>O</kbd></a></div>`;
      setStatus(reason === 'preview' ? 'Preview mode — embeds play in the downloaded version' : reason === 'needs-id' ? 'Embed needs the video number' : reason === 'offline' ? 'Offline — not embedded' : 'Embed unavailable');
    }
    function tryEmbed() {
      const url = embedUrl(f);
      if (!url) return fallback(f.platform === 'tiktok' ? 'needs-id' : 'none');
      if (!navigator.onLine) return fallback('offline');
      if (IN_PREVIEW) return fallback('preview');
      const { wrap, ifr } = makeEmbed(f, url, screen.clientWidth || parseInt(getComputedStyle(screen).width), screen.clientHeight || parseInt(getComputedStyle(screen).height));
      let loaded = false;
      ifr.addEventListener('load', () => { loaded = true; state.mode = 'embed'; setStatus(f.platform === 'instagram' ? 'Click the video to play. Blank or blocked? Press O.' : 'Embedded from TikTok. Blank or blocked? Press O.'); });
      setTimeout(() => { if (!loaded) { ifr.remove(); fallback('blocked'); } }, 15000);
      screen.innerHTML = ''; screen.append(wrap); state.mode = 'embed-loading'; state.embed = url; state.rebuild = tryEmbed; setStatus(`Connecting to ${PLAT[f.platform]}…`);
    }
    // 1) a local copy always wins (works offline)
    if (f.localFile) {
      const v = document.createElement('video'); Object.assign(v, { muted: true, loop: true, playsInline: true, preload: 'auto' });
      v.addEventListener('loadeddata', () => { state.mode = 'local'; state.local = f.localFile; screen.innerHTML = ''; screen.append(v);
        if (current === world) v.play().catch(() => {}); setStatus('Playing from this computer (offline-ready). M = sound.'); }, { once: true });
      v.addEventListener('error', tryEmbed, { once: true });
      v.src = f.localFile;
    } else tryEmbed();
  }

  /* ---------------- build each world ---------------- */
  function buildCity() {
    const c = CFG.city, w = $('#world-city'); $('.w-bg', w).src = c.background;
    const deco = el => { el.insertAdjacentHTML('beforeend', `<i class="hud-c tl"></i><i class="hud-c tr"></i><i class="hud-c bl"></i><i class="hud-c br"></i>
      <span class="c-label">${el.dataset.title}</span><span class="c-time"></span>`); return el; };
    const P = Object.fromEntries(c.panels.map(p => [p.id, p]));
    const left = $('[data-slot="left"]', w), right = $('[data-slot="right"]', w);
    left.append(deco(makePanel(P.radar, 'cpanel h-l', 'city')), deco(makePanel(P.cam2, 'cpanel h-m', 'city')), deco(makePanel(P.edit1, 'cpanel h-m', 'city')));
    right.append(deco(makePanel(P.edit2, 'cpanel h-m', 'city')), deco(makePanel(P.edit3, 'cpanel h-m', 'city')));
    right.prepend(deco(makePanel(P.cam1, 'cpanel h-m', 'city')));
    // move quote between cam and edits
    right.insertBefore($('.city-quote', w), right.children[1]);
    $('.city-quote', w).classList.add('h-l');
    buildFeatured('city');
    const bits = ['NIGHT WATCH ACTIVE', 'ALL SECTORS QUIET', 'PRESS L FOR LIGHTNING', 'PRESS O TO OPEN THE FEATURED CLIP', ...c.quotes.map(q => q.text.toUpperCase()), 'PRESS ESC TO RETURN'];
    $('.ticker-track', w).innerHTML = bits.map(b => `<span>${b}</span>`).join('<b>◆</b>') + '<b>◆</b>';
    FX.rain($('.city-rain', w), 'cityRain', { count: 520, wind: 2.6, floor: 60 });
  }
  function buildDrive() {
    const c = CFG.drive, w = $('#world-drive'); $('.w-bg', w).src = c.background; $('.drive-tag', w).textContent = c.tagline;
    const bays = $('[data-slot="bays"]', w);
    c.panels.forEach((p, i) => {
      const bay = document.createElement('div'); bay.className = 'dbay';
      bay.append(makePanel(p, 'dpanel', 'drive'));
      bay.insertAdjacentHTML('beforeend', `<div class="dbay-cap"><span><span class="n">0${i + 1}</span><span class="t">${p.title}</span></span><span class="s">${p.spec || ''}</span></div>`);
      bays.append(bay);
    });
    buildFeatured('drive');
    $('.drive-feature .side-meta', w).innerHTML = `Source <b>Instagram</b><br>Showroom <b>01</b><br>Press <b>O</b> to open`;
    const leds = $('.rev-leds', w); for (let i = 0; i < 40; i++) { const e = document.createElement('i'); e.className = i < 24 ? 'g' : i < 34 ? 'a' : 'r'; leds.append(e); }
  }
  function buildEmpire() {
    const c = CFG.empire, w = $('#world-empire'); $('.w-bg', w).src = c.background;
    const P = Object.fromEntries(c.panels.map(p => [p.id, p]));
    const cap = (el, small) => { el.insertAdjacentHTML('beforeend', `<div class="e-cap"><small>${small}</small>${el.dataset.title}</div>`); return el; };
    $('[data-slot="coast"]', w).append(cap(makePanel(P.coast, 'epanel', 'empire'), 'Travel'));
    $('[data-slot="right"]', w).append(cap(makePanel(P.form, 'epanel', 'empire'), 'Architecture'), cap(makePanel(P.life1, 'epanel', 'empire'), 'Lifestyle'));
    $('[data-slot="watch"]', w).append(cap(makePanel(P.time, 'epanel', 'empire'), 'Horology'));
    buildFeatured('empire');
    FX.dust($('.empire-dust', w));
  }

  /* ---------------- quotes ---------------- */
  const qi = { city: 0, empire: 0 }; let qTimer = {};
  function cityQuote(next) {
    const qs = CFG.city.quotes, box = $('.city-quote'); if (next) qi.city = (qi.city + 1) % qs.length;
    const q = qs[qi.city], el = $('.cq-text', box);
    $('.cq-count', box).textContent = `${pad(qi.city + 1)} / ${pad(qs.length)}`; $('.cq-by', box).textContent = `— ${q.by}`;
    el.innerHTML = '<span class="cq-inner">' + q.text.split('').map(ch => `<span class="ch">${ch}</span>`).join('') + '<span class="cursor"></span></span>';
    const chars = $$('.ch', el); let i = 0; box.classList.add('speaking'); clearInterval(qTimer.cityType);
    qTimer.cityType = setInterval(() => { if (i >= chars.length) { clearInterval(qTimer.cityType); box.classList.remove('speaking'); return; }
      chars[i].classList.add('on'); if (chars[i].textContent.trim() && i % 2 === 0) Sound.typeBlip(); i++; }, 42);
    clearTimeout(qTimer.city); qTimer.city = setTimeout(() => current === 'city' && cityQuote(true), 9500);
  }
  function empireQuote(next) {
    const qs = CFG.empire.quotes, box = $('.empire-quote'); if (next) qi.empire = (qi.empire + 1) % qs.length;
    const q = qs[qi.empire], el = $('.eq-text', box);
    box.classList.remove('on'); $$('.w', el).forEach(w => w.classList.remove('on'));
    setTimeout(() => {
      el.innerHTML = q.text.split(' ').map(w => `<span class="w">${w}</span>`).join(' ');
      $('.eq-by span', box).textContent = q.by;
      $$('.w', el).forEach((w, i) => setTimeout(() => w.classList.add('on'), 120 + i * 170));
      box.classList.add('on'); Sound.chime();
    }, next ? 900 : 50);
    clearTimeout(qTimer.empire); qTimer.empire = setTimeout(() => current === 'empire' && empireQuote(true), 11000);
  }

  /* ---------------- world-specific actions ---------------- */
  let lightningT;
  function lightning() {
    const f = $('.city-flash');
    f.animate([{ opacity: 0 }, { opacity: .95, offset: .05 }, { opacity: .1, offset: .15 }, { opacity: .75, offset: .25 }, { opacity: 0 }], { duration: 900, easing: 'ease-out' });
    $('#world-city .w-bg').animate([{ filter: 'brightness(1.6) saturate(.5) contrast(1.2)' }, { filter: 'brightness(.55) saturate(.7) contrast(1.15)' }], { duration: 900 });
    setTimeout(Sound.thunder, 350 + Math.random() * 500);
  }
  function scheduleLightning() { clearTimeout(lightningT); lightningT = setTimeout(() => { if (current === 'city') { lightning(); } scheduleLightning(); }, 11000 + Math.random() * 14000); }

  let rpm = 950, revAnim = null;
  function setLeds(r) {
    const n = Math.round(r / 8000 * 40); $$('#world-drive .rev-leds i').forEach((e, i) => e.classList.toggle('on', i < n));
    $('.rev-num').textContent = String(Math.round(r / 10) * 10).padStart(4, '0');
  }
  function revTo(peak, upMs, downMs) {
    const t0 = performance.now(), from = rpm; cancelAnimationFrame(revAnim); $('#world-drive').classList.add('shake');
    const step = now => {
      const t = now - t0;
      if (t < upMs) rpm = from + (peak - from) * (1 - Math.pow(1 - t / upMs, 2.2));
      else if (t < upMs + downMs) { rpm = peak - (peak - 950) * Math.pow((t - upMs) / downMs, .7); $('#world-drive').classList.remove('shake'); }
      else { rpm = 950; setLeds(rpm); return; }
      setLeds(rpm); revAnim = requestAnimationFrame(step);
    }; revAnim = requestAnimationFrame(step);
  }
  setInterval(() => { if (current === 'drive' && rpm <= 1000) { setLeds(930 + Math.random() * 60); } }, 120);
  function rev() { Sound.rev(); revTo(7900, 1150, 1500); }

  /* ---------------- screens & transitions ---------------- */
  function playIn(el, on) { $$('video', el).forEach(v => { if (on) { v.play().catch(() => {}); } else v.pause(); }); }
  function show(id) { $$('.screen').forEach(s => s.classList.toggle('active', s.id === id)); }

  function veil(color, origin, cb) {
    const v = $('#veil'); v.style.background = color; v.style.transition = 'none';
    v.style.clipPath = `circle(0px at ${origin[0]}px ${origin[1]}px)`; v.style.opacity = 1;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      v.style.transition = 'clip-path .85s cubic-bezier(.7,0,.25,1)'; v.style.clipPath = `circle(2300px at ${origin[0]}px ${origin[1]}px)`;
      setTimeout(() => { cb(); v.style.transition = 'opacity .9s ease'; v.style.opacity = 0; }, 880);
    }));
  }
  function stagePoint(el) {
    if (!el) return [960, 540]; const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(), k = 1920 / s.width;
    return [(r.left + r.width / 2 - s.left) * k, (r.top + r.height / 2 - s.top) * k];
  }

  function goHub(fromIntro) {
    if (busy) return; busy = true; const prev = current;
    const done = () => {
      show('hub'); current = 'hub'; Sound.world(null); stopWorldFx(prev);
      const hub = $('#hub'); hub.classList.add('entering'); playIn(hub, true);
      $$('.portal').forEach((p, i) => p.style.transitionDelay = `${.15 + i * .14}s`);
      requestAnimationFrame(() => requestAnimationFrame(() => hub.classList.remove('entering')));
      setTimeout(() => { $$('.portal').forEach(p => p.style.transitionDelay = ''); busy = false; }, 1300);
      focusPortal(hubIndex); FX.start('portalRain');
      if (prev !== 'intro') WORLDS.forEach(w => playIn($(`#world-${w}`), false));
    };
    if (fromIntro) { $('#intro').classList.add('leaving'); Sound.whoosh(1.4); setTimeout(() => { FX.stop('intro'); done(); }, 900); }
    else veil(VEIL.hub, [960, 540], done);
  }

  function enterWorld(name, originEl) {
    if (busy || current === name) return; busy = true; const prev = current; Sound.init(); Sound.whoosh(1.1);
    veil(VEIL[name], stagePoint(originEl), () => {
      $$('.screen').forEach(s => s.classList.remove('arrive'));
      show(`world-${name}`); current = name; const w = $(`#world-${name}`); w.classList.add('arrive');
      playIn(w, true); playIn($('#hub'), false); FX.stop('portalRain'); stopWorldFx(prev);
      WORLDS.filter(x => x !== name).forEach(x => playIn($(`#world-${x}`), false));
      Sound.world(name);
      if (name === 'city') { FX.start('cityRain'); cityQuote(false); setTimeout(lightning, 1200); scheduleLightning(); }
      if (name === 'drive') { rpm = 950; revTo(8000, 600, 900); }
      if (name === 'empire') { FX.start('dust'); empireQuote(false); }
      focusables()[0] && setFocus(focusables()[0], true);
      setTimeout(() => { busy = false; }, 900);
    });
  }
  function stopWorldFx(w) { if (w === 'city') { FX.stop('cityRain'); clearTimeout(lightningT); } if (w === 'empire') FX.stop('dust'); }

  /* ---------------- focus & spatial navigation ---------------- */
  function focusPortal(i) { hubIndex = (i + 3) % 3; $$('.portal').forEach((p, k) => p.classList.toggle('focus', k === hubIndex)); }
  function focusables() { return current in CFG ? $$(`#world-${current} .featured-host, #world-${current} .panel`) : []; }
  let focused = null;
  function setFocus(el, silent) {
    $$('.focus').forEach(e => { if (!e.classList.contains('portal')) e.classList.remove('focus'); });
    focused = el; if (!el) return; el.classList.add('focus'); if (el.parentElement.classList.contains('dbay')) el.parentElement.classList.add('focus');
    if (!silent) Sound.tick();
  }
  function moveFocus(dx, dy) {
    const list = focusables(); if (!list.length) return; if (!focused || !list.includes(focused)) return setFocus(list[0]);
    const a = focused.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2; let best = null, bs = 1e9;
    for (const el of list) { if (el === focused) continue; const b = el.getBoundingClientRect(), bx = b.left + b.width / 2, by = b.top + b.height / 2;
      const ddx = bx - ax, ddy = by - ay; if ((dx && Math.sign(ddx) !== dx) || (dy && Math.sign(ddy) !== dy)) continue;
      const along = dx ? Math.abs(ddx) : Math.abs(ddy), across = dx ? Math.abs(ddy) : Math.abs(ddx), score = along + across * 2.2;
      if (score < bs) { bs = score; best = el; } }
    if (best) setFocus(best);
  }

  /* ---------------- lightbox ---------------- */
  function openLightbox(el) {
    const lb = $('#lightbox'), m = $('.lb-media', lb); m.innerHTML = ''; m.classList.remove('portrait'); m.style.width = m.style.height = '';
    if (el.classList.contains('featured-host')) {
      const st = featured[el.dataset.world]; $('.lb-title', lb).textContent = st.cfg.label;
      if (st.mode === 'local') { const v = document.createElement('video'); Object.assign(v, { src: st.local, loop: true, autoplay: true, controls: true, muted: Sound.muted }); m.append(v); }
      else if (st.embed) {
        const a = st.cfg.aspect || 16 / 9, H = 860, Wd = Math.min(1600, Math.round(H * a));
        m.style.width = Wd + 'px'; m.style.height = (Wd / a > H ? H : Math.round(Wd / a)) + 'px';
        m.append(makeEmbed(st.cfg, st.embed, Wd, parseInt(m.style.height)).wrap);
      }
      else { openOriginal(); return; }
    } else {
      $('.lb-title', lb).textContent = el.dataset.title; const src = el.dataset.src;
      if (isImg(src)) { const i = new Image(); i.src = src; i.style.cssText = 'width:100%;height:100%;object-fit:contain'; m.append(i); }
      else { const v = document.createElement('video'); Object.assign(v, { src, loop: true, autoplay: true, muted: Sound.muted, playsInline: true }); m.append(v); }
    }
    lb.classList.add('open'); Sound.whoosh(.7);
  }
  function closeOverlays() { const o = $$('.overlay.open'); o.forEach(x => x.classList.remove('open')); setTimeout(() => $('.lb-media').innerHTML = '', 450); return o.length > 0; }
  function openOriginal() { const st = featured[current]; if (!st) return; const a = $(`#world-${current} .feat-open`); if (a) a.click(); else window.open(st.cfg.url, '_blank', 'noopener'); toast(`Opening the original on ${PLAT[st.cfg.platform]}…`); }

  /* ---------------- input ---------------- */
  function togglePause() {
    const w = current in CFG ? $(`#world-${current}`) : $('#hub'); const vs = $$('video', w); const anyPlaying = vs.some(v => !v.paused);
    vs.forEach(v => anyPlaying ? v.pause() : v.play().catch(() => {})); toast(anyPlaying ? 'Paused' : 'Playing');
  }
  function fullscreen() { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {}); else document.exitFullscreen?.(); }

  addEventListener('keydown', e => {
    const k = e.key; Sound.init();
    if (k === 'f' || k === 'F') return fullscreen();
    if (k === 'm' || k === 'M') { const mu = Sound.toggleMute(); return toast(mu ? 'Sound off' : 'Sound on'); }
    if (k === '?' || k === '/') { $('#help').classList.toggle('open'); return; }
    if (current === 'intro') { if (['Enter', ' ', 'Escape'].includes(k) || k.length === 1) { e.preventDefault(); if (!introStarted) startIntroSound(); goHub(true); } return; }
    if (['1', '2', '3'].includes(k)) { closeOverlays(); const w = WORLDS[+k - 1]; return current === 'hub' ? enterWorld(w, $$('.portal')[+k - 1]) : enterWorld(w, null); }
    if (k === 'Escape' || k === 'Backspace' || k === 'BrowserBack' || k === 'h' || k === 'H') { e.preventDefault(); if (closeOverlays()) return; if (current !== 'hub') goHub(); return; }
    if ($('#lightbox.open')) return;
    if (current === 'hub') {
      if (k === 'ArrowLeft') { focusPortal(hubIndex - 1); Sound.tick(); }
      if (k === 'ArrowRight') { focusPortal(hubIndex + 1); Sound.tick(); }
      if (k === 'Enter' || k === ' ') { e.preventDefault(); enterWorld(WORLDS[hubIndex], $$('.portal')[hubIndex]); }
      return;
    }
    if (k === 'ArrowLeft') { e.preventDefault(); moveFocus(-1, 0); } if (k === 'ArrowRight') { e.preventDefault(); moveFocus(1, 0); }
    if (k === 'ArrowUp') { e.preventDefault(); moveFocus(0, -1); } if (k === 'ArrowDown') { e.preventDefault(); moveFocus(0, 1); }
    if (k === 'Enter' && focused) openLightbox(focused);
    if (k === ' ') { e.preventDefault(); togglePause(); }
    if (k === 'o' || k === 'O') openOriginal();
    if ((k === 'c' || k === 'C') && featured[current] && featured[current].cfg.platform === 'instagram' && featured[current].rebuild) {
      const st = featured[current]; st.cfg.crop = st.cfg.crop === false; st.rebuild(); toast(st.cfg.crop ? 'Showing just the video' : 'Showing the full Instagram post'); }
    if (k === 'q' || k === 'Q') { if (current === 'city') cityQuote(true); if (current === 'empire') empireQuote(true); }
    if ((k === 'l' || k === 'L') && current === 'city') lightning();
    if ((k === 'r' || k === 'R') && current === 'drive') rev();
  });

  document.addEventListener('click', e => {
    Sound.init();
    if (current === 'intro') { startIntroSound(); return goHub(true); }
    if (e.target.closest('a')) return;
    if (e.target.closest('#lightbox, #help')) { if (!e.target.closest('.lb-media, .help-card')) closeOverlays(); return; }
    const portal = e.target.closest('.portal'); if (portal) { const i = $$('.portal').indexOf(portal); focusPortal(i); return enterWorld(WORLDS[i], portal); }
    const p = e.target.closest('.panel, .featured-host'); if (p) { setFocus(p, true); openLightbox(p); }
  });
  $$('.portal').forEach((p, i) => p.addEventListener('mouseenter', () => { if (current === 'hub' && hubIndex !== i) { focusPortal(i); Sound.tick(); } }));

  // hide the cursor when idle (projector-friendly)
  let idleT; addEventListener('mousemove', () => { document.body.classList.remove('hide-cursor'); clearTimeout(idleT); idleT = setTimeout(() => document.body.classList.add('hide-cursor'), 2500); });

  /* ---------------- intro ---------------- */
  let introStarted = false;
  function startIntroSound() { if (introStarted) return; Sound.init(); if (Sound.running) { introStarted = true; Sound.boom(); } }
  function intro() {
    const t = $('#introTitle'), words = 'WELCOME BACK, ', name = CFG.name + '.';
    let i = 0; const span = (ch, cls = '') => `<span class="${cls}" style="animation-delay:${(.25 + (i++) * .07).toFixed(2)}s">${ch === ' ' ? '&nbsp;' : ch}</span>`;
    t.innerHTML = [...words].map(c => span(c)).join('') + [...name].map(c => span(c, 'name')).join('');
    FX.intro($('#introCanvas')); FX.start('intro'); $('#intro').classList.add('play');
    Sound.init(); setTimeout(startIntroSound, 200);
    setTimeout(() => { if (current === 'intro') goHub(true); }, 9000);
  }

  /* ---------------- boot ---------------- */
  buildCity(); buildDrive(); buildEmpire();
  FX.rain($('.portal-rain'), 'portalRain', { count: 140, wind: 1.6, floor: 20 });
  window.addEventListener('online', () => toast('Back online — reload (Ctrl+R) to load the embeds'));
  const jump = location.hash.slice(1);
  if (WORLDS.includes(jump)) { current = 'hub'; show('hub'); enterWorld(jump, null); }
  else if (jump === 'hub') { current = 'hubpending'; goHub(false); }
  else intro();
  window.__worlds = { featured, get current() { return current; } }; // for testing
})();
