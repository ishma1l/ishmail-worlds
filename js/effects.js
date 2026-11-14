/* Canvas effects: intro starfield, rain, gold dust. Each only animates while its screen is visible. */
window.FX = (function () {
  const loops = {};
  function loop(name, fn) {
    loops[name] = { fn, on: false, raf: 0 };
  }
  function start(name) {
    const l = loops[name]; if (!l || l.on) return; l.on = true; let last = performance.now();
    const step = (now) => { if (!l.on) return; const dt = Math.min(50, now - last); last = now; l.fn(dt, now); l.raf = requestAnimationFrame(step); };
    l.raf = requestAnimationFrame(step);
  }
  function stop(name) { const l = loops[name]; if (l) { l.on = false; cancelAnimationFrame(l.raf); } }

  /* ---- Intro: particles that drift toward the centre, then burst ---- */
  function intro(canvas) {
    const c = canvas.getContext('2d'), W = canvas.width, H = canvas.height, P = [];
    for (let i = 0; i < 420; i++) P.push({ x: Math.random() * W, y: Math.random() * H, z: Math.random(), a: Math.random() * 6.28 });
    let t0 = performance.now();
    loop('intro', (dt, now) => {
      const t = (now - t0) / 1000; c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(0, 0, W, H);
      const pull = Math.min(1, t / 3), burst = t > 3.2 ? Math.min(1, (t - 3.2) / 1.5) : 0;
      for (const p of P) {
        const dx = W / 2 - p.x, dy = 560 - p.y;
        p.x += dx * .006 * pull * (1 - burst) - dx * .02 * burst + Math.cos(p.a + t) * .3;
        p.y += dy * .006 * pull * (1 - burst) - dy * .02 * burst + Math.sin(p.a + t) * .3;
        if (p.x < -50 || p.x > W + 50 || p.y < -50 || p.y > H + 50) { p.x = Math.random() * W; p.y = Math.random() * H; }
        const s = .6 + p.z * 1.8; c.fillStyle = `rgba(${180 + p.z * 75},${200 + p.z * 55},255,${.25 + p.z * .6})`;
        c.fillRect(p.x, p.y, s, s);
      }
    });
    return { restart() { t0 = performance.now(); } };
  }

  /* ---- Rain (full-screen or portal-sized), with splashes ---- */
  function rain(canvas, name, opts = {}) {
    const c = canvas.getContext('2d'), W = canvas.width, H = canvas.height, N = opts.count || 420, drops = [], splashes = [];
    const wind = opts.wind || 2.2;
    for (let i = 0; i < N; i++) drops.push(newDrop(true));
    function newDrop(any) { const z = Math.random(); return { x: Math.random() * (W + 200) - 100, y: any ? Math.random() * H : -40 - Math.random() * 200, z, v: 14 + z * 22, l: 10 + z * 26 }; }
    loop(name, (dt) => {
      c.clearRect(0, 0, W, H); const k = dt / 16.7;
      c.lineCap = 'round';
      for (const d of drops) {
        d.y += d.v * k; d.x += wind * k * (.5 + d.z);
        c.strokeStyle = `rgba(190,215,255,${.12 + d.z * .38})`; c.lineWidth = .6 + d.z * 1.3;
        c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x - wind * 1.6 * (d.l / 20), d.y - d.l); c.stroke();
        if (d.y > H - (opts.floor || 30) * (1 - d.z)) { if (d.z > .55 && splashes.length < 80) splashes.push({ x: d.x, y: d.y, r: 1, a: .5 }); Object.assign(d, newDrop(false)); }
      }
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i]; s.r += 1.2 * k; s.a -= .035 * k;
        if (s.a <= 0) { splashes.splice(i, 1); continue; }
        c.strokeStyle = `rgba(200,225,255,${s.a})`; c.lineWidth = 1; c.beginPath(); c.ellipse(s.x, s.y, s.r * 2, s.r * .5, 0, 0, 6.28); c.stroke();
      }
    });
  }

  /* ---- Empire: slow gold dust with bokeh ---- */
  function dust(canvas) {
    const c = canvas.getContext('2d'), W = canvas.width, H = canvas.height, P = [];
    for (let i = 0; i < 90; i++) P.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() < .12 ? 6 + Math.random() * 14 : .8 + Math.random() * 2.2, s: .1 + Math.random() * .35, p: Math.random() * 6.28 });
    loop('dust', (dt, now) => {
      c.clearRect(0, 0, W, H); const t = now / 1000, k = dt / 16.7;
      for (const p of P) {
        p.y -= p.s * k; p.x += Math.sin(t * .3 + p.p) * .25 * k; if (p.y < -30) { p.y = H + 30; p.x = Math.random() * W; }
        const tw = .45 + .55 * Math.sin(t * 1.3 + p.p * 3);
        const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.4);
        g.addColorStop(0, `rgba(255,220,160,${(p.r > 5 ? .12 : .7) * tw})`); g.addColorStop(1, 'rgba(255,200,120,0)');
        c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.r * 2.4, 0, 6.28); c.fill();
      }
    });
  }

  return { start, stop, intro, rain, dust };
})();
