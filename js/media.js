/* Media: source fallback chains, featured reels, and a playback budget for TV hardware. */
window.Media = (function () {
  const C = window.IW;
  const FEAT = {};

  /* ---------- 1) your file → 2) online footage → 3) built-in loop ---------- */
  function chain(world, spec) {
    const list = [`assets/videos/${world}/${spec.slot}.mp4`];
    if (spec.stock) list.push(C.stockBase + spec.stock);
    if (spec.fallback) list.push(`assets/fallback/${spec.fallback}`);
    return list;
  }
  const KIND = ['yours', 'online', 'built-in'];
  function load(video, list, i = 0) {
    if (i >= list.length) { video.dataset.kind = 'missing'; video.dispatchEvent(new Event('exhausted')); return; }
    video.dataset.kind = KIND[Math.min(i, 2)];
    video.onerror = () => load(video, list, i + 1);
    video.muted = true; video.setAttribute('muted', ''); video.playsInline = true; video.preload = 'auto';
    video.src = list[i];
  }
  function findSpec(world, slot) {
    const w = C.worlds[world];
    if (slot === 'background') return w.background;
    return (w.screens || []).concat(w.destinations || []).find(s => s.slot === slot);
  }
  function bindSlot(el) {
    const [world, slot] = el.dataset.slot.split('/'); const spec = findSpec(world, slot);
    const v = el.tagName === 'VIDEO' ? el : el.querySelector('video');
    if (spec && v) { load(v, chain(world, spec)); el.dataset.label = spec.label || spec.name || ''; }
    return spec;
  }

  /* ---------- featured reels ---------- */
  function tiktokUrl(id) { return `https://www.tiktok.com/player/v1/${id}?autoplay=1&loop=1&music_info=0&description=0&rel=0&controls=1&progress_bar=1&play_button=1&volume_control=1&fullscreen_button=0&timestamp=0&native_context_menu=0&closed_caption=0`; }
  function igUrl(link) { const m = link.match(/\/(?:reel|p)\/([^/?#]+)/); return m ? `https://www.instagram.com/reel/${m[1]}/embed/` : null; }
  /* Instagram's embed = 54px header + 4:5 media box (video centred) + footer. We frame just the video. */
  function embed(f, SW, SH) {
    const wrap = document.createElement('div'); wrap.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:#000';
    const ifr = document.createElement('iframe'); ifr.tabIndex = -1; ifr.setAttribute('scrolling', 'no');
    ifr.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture'; ifr.referrerPolicy = 'strict-origin-when-cross-origin';
    if (f.platform === 'TikTok') { ifr.src = tiktokUrl(f.tiktokId); ifr.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0'; }
    else {
      ifr.src = igUrl(f.original);
      let vw = SW, vh = SW / f.aspect; if (vh > SH) { vh = SH; vw = SH * f.aspect; }
      const W = Math.round(vw), top = 54 + (1.25 * W - W / f.aspect) / 2;
      ifr.style.cssText = `position:absolute;border:0;width:${W}px;height:${Math.round(54 + 1.25 * W + 360)}px;left:${Math.round((SW - W) / 2)}px;top:${Math.round((SH - vh) / 2 - top)}px`;
    }
    wrap.append(ifr); return { wrap, ifr };
  }
  function featured(world, host) {
    const f = C.worlds[world].featured, box = host.querySelector('.feat-media');
    const st = FEAT[world] = { cfg: f, mode: 'loading' };
    host.querySelector('.hero-cap').textContent = f.caption || '';
    const orig = document.querySelector(`[data-world-original="${world}"]`);
    orig.textContent = `Open on ${f.platform}`;
    const showOriginal = on => orig.classList.toggle('show', on);
    const v = document.createElement('video');
    Object.assign(v, { muted: true, loop: true, playsInline: true, preload: 'auto' }); v.setAttribute('muted', '');
    v.addEventListener('loadeddata', () => { st.mode = 'local'; st.video = v; showOriginal(false); document.dispatchEvent(new CustomEvent('feat-ready', { detail: world })); }, { once: true });
    v.addEventListener('error', () => {
      v.remove();
      if (f.platform !== 'TikTok' || !f.tiktokId || !navigator.onLine) { standin(); return; }
      const { wrap, ifr } = embed(f, host.clientWidth || parseInt(getComputedStyle(host).width), host.clientHeight || parseInt(getComputedStyle(host).height));
      box.append(wrap); st.mode = 'embed'; st.iframe = ifr; showOriginal(true);
    }, { once: true });
    v.src = `assets/videos/${world}/${f.slot}.mp4`; box.append(v);
    function card() { st.mode = 'card'; box.innerHTML = `<div class="feat-card"><b>${f.caption || 'Featured'}</b><span>On ${f.platform}</span></div>`; showOriginal(true); }
    /* Instagram (or offline): play a matching clip here, with a clean button to open the reel */
    function standin() {
      if (!f.standin) return card();
      const s = document.createElement('video'); load(s, [f.standin.stock && C.stockBase + f.standin.stock, f.standin.fallback && `assets/fallback/${f.standin.fallback}`].filter(Boolean));
      s.loop = true; s.dataset.label = f.standin.label; box.append(s);
      st.mode = 'standin'; st.video = s; host.querySelector('.hero-cap').textContent = f.standin.label; showOriginal(true);
      s.addEventListener('exhausted', card, { once: true });
    }
  }
  /* TikTok's embed player accepts play/pause commands from the page */
  function tiktok(world, type) {
    const st = FEAT[world]; if (!st || !st.iframe || st.cfg.platform !== 'TikTok') return false;
    try { st.iframe.contentWindow.postMessage({ type, 'x-tiktok-player': true }, '*'); return true; } catch (e) { return false; }
  }

  /* ---------- playback budget: the projector can only decode so many at once ---------- */
  let budget = 8;
  function setBudget(n) { budget = n; }
  function schedule(worldEl, focusEl) {
    const all = [...worldEl.querySelectorAll('video')];
    const featV = worldEl.querySelector('.featured video');
    const focV = focusEl ? focusEl.querySelector && focusEl.querySelector('video') : null;
    const bg = worldEl.querySelector('.bg');
    const order = [featV, focV, bg, ...all].filter((v, i, a) => v && a.indexOf(v) === i);
    order.forEach((v, i) => {
      if (i < budget) { if (v.paused) v.play().catch(() => {}); }
      else if (!v.paused) v.pause();
    });
  }
  function pauseAll(el) { el.querySelectorAll('video').forEach(v => v.pause()); }

  return { chain, load, bindSlot, findSpec, featured, FEAT, tiktok, schedule, pauseAll, setBudget };
})();
