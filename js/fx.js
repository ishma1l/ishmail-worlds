/* Visual effects. Each loop only runs while its screen is visible. */
window.FX = (function () {
  const loops = {};
  const LITE = () => document.body.classList.contains('lite');
  function loop(name, fn) { loops[name] = { fn, on: false, raf: 0 }; }
  function start(name) {
    const l = loops[name]; if (!l || l.on) return; l.on = true; let last = performance.now();
    const step = now => { if (!l.on) return; const dt = Math.min(50, now - last); last = now; l.fn(dt, now); l.raf = requestAnimationFrame(step); };
    l.raf = requestAnimationFrame(step);
  }
  function stop(name) { const l = loops[name]; if (l) { l.on = false; cancelAnimationFrame(l.raf); } }

  /* dust drifting through the welcome light shafts */
  function dust(canvas, name, opts = {}) {
    const c = canvas.getContext('2d'), W = canvas.width, H = canvas.height, P = [];
    const n = LITE() ? (opts.lite || 40) : (opts.count || 160);
    const col = opts.color || '255,240,215';
    for (let i = 0; i < n; i++) P.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() < .1 ? 3 + Math.random() * 7 : .6 + Math.random() * 1.8,
      vx: (Math.random() - .5) * .25, vy: -.08 - Math.random() * .3, p: Math.random() * 6.28 });
    loop(name, (dt, now) => {
      const k = dt / 16.7, t = now / 1000; c.clearRect(0, 0, W, H);
      for (const q of P) {
        q.x += (q.vx + Math.sin(t * .4 + q.p) * .15) * k; q.y += q.vy * k;
        if (q.y < -20) { q.y = H + 20; q.x = Math.random() * W; }
        const tw = .45 + .55 * Math.sin(t * 1.2 + q.p * 3), a = (q.r > 3 ? .1 : .6) * tw;
        c.fillStyle = `rgba(${col},${a})`; c.beginPath(); c.arc(q.x, q.y, q.r, 0, 6.283); c.fill();
      }
    });
  }

  /* rain with splashes along the console edge */
  function rain(canvas, name) {
    const c = canvas.getContext('2d'), W = canvas.width, H = canvas.height, N = LITE() ? 120 : 380, D = [];
    const nd = any => { const z = Math.random(); return { x: Math.random() * (W + 300) - 150, y: any ? Math.random() * H : -50 - Math.random() * 300, z, v: 16 + z * 24, l: 12 + z * 30 }; };
    for (let i = 0; i < N; i++) D.push(nd(true));
    loop(name, dt => {
      const k = dt / 16.7; c.clearRect(0, 0, W, H); c.lineCap = 'round';
      for (const d of D) {
        d.y += d.v * k; d.x += 2.4 * k * (.5 + d.z);
        c.strokeStyle = `rgba(195,220,255,${.10 + d.z * .32})`; c.lineWidth = .6 + d.z * 1.2;
        c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x - 3.5 * (d.l / 20), d.y - d.l); c.stroke();
        if (d.y > H) Object.assign(d, nd(false));
      }
    });
  }

  /* bats crossing the cave mouth now and then */
  const BAT = '<svg viewBox="0 0 60 26"><path d="M30 8c-2-4-4-4-5-2-3-4-11-6-25-2 6 1 10 4 12 9 2-3 6-4 9-1 2-2 5-1 6 2 1-1 2-1 3 0 1-3 4-4 6-2 3-3 7-2 9 1 2-5 6-8 12-9-14-4-22-2-25 2-1-2-3-2-5 2z"/></svg>';
  let batT;
  function bats(host) {
    clearTimeout(batT);
    const fly = () => {
      if (!host.isConnected || !host.closest('.world.current')) { batT = setTimeout(fly, 4000); return; }
      const n = 3 + Math.floor(Math.random() * 5), y0 = 140 + Math.random() * 240, dir = Math.random() < .5 ? 1 : -1;
      for (let i = 0; i < n; i++) {
        const b = document.createElement('div'); b.className = 'bat'; b.innerHTML = BAT;
        const s = .5 + Math.random() * .8; b.style.cssText = `top:${y0 + Math.random() * 80}px;left:${dir > 0 ? -60 : 1980}px;transform:scale(${s})`;
        host.append(b);
        const dur = 4200 + Math.random() * 2400, dy = (Math.random() - .5) * 260;
        b.animate([{ transform: `translate(0,0) scale(${s})` }, { transform: `translate(${dir * 1050}px,${dy * .5 - 60}px) scale(${s})` }, { transform: `translate(${dir * 2100}px,${dy}px) scale(${s * .8})` }],
          { duration: dur, delay: i * (120 + Math.random() * 260), easing: 'ease-in-out', fill: 'both' }).onfinish = () => b.remove();
      }
      batT = setTimeout(fly, 14000 + Math.random() * 16000);
    };
    batT = setTimeout(fly, 2500);
  }

  /* a living street map on the command table (drawn, not data) */
  function map(svg) {
    const r = (a, b) => a + Math.random() * (b - a); let s = '';
    s += '<defs><linearGradient id="riv" x1="0" x2="1"><stop offset="0" stop-color="#0a2a55"/><stop offset="1" stop-color="#103a70"/></linearGradient></defs>';
    s += '<path d="M-20 380 C 180 300 260 420 420 360 S 700 250 820 300 1000 260 1040 240 L1040 300 C 960 330 850 330 760 360 S 500 460 380 430 120 380 -20 450Z" fill="url(#riv)" opacity=".9"/>';
    for (let i = 0; i < 26; i++) { const x = r(0, 1000); s += `<line x1="${x}" y1="0" x2="${x + r(-60, 60)}" y2="560" stroke="#3d7fd6" stroke-opacity="${r(.15, .45)}" stroke-width="${r(.6, 2.2)}"/>`; }
    for (let i = 0; i < 20; i++) { const y = r(0, 560); s += `<line x1="0" y1="${y}" x2="1000" y2="${y + r(-40, 40)}" stroke="#3d7fd6" stroke-opacity="${r(.15, .45)}" stroke-width="${r(.6, 2.2)}"/>`; }
    for (let i = 0; i < 60; i++) s += `<rect x="${r(0, 980)}" y="${r(0, 540)}" width="${r(8, 40)}" height="${r(8, 34)}" fill="#5aa2ff" fill-opacity="${r(.04, .16)}"/>`;
    s += '<path id="route" d="M80 120 L300 160 L360 330 L620 300 L700 140 L900 180" fill="none" stroke="#9fd0ff" stroke-width="3" stroke-dasharray="10 10" opacity=".8"><animate attributeName="stroke-dashoffset" from="200" to="0" dur="6s" repeatCount="indefinite"/></path>';
    for (const [x, y] of [[300, 160], [620, 300], [900, 180]]) s += `<circle cx="${x}" cy="${y}" r="7" fill="#cfe6ff"><animate attributeName="r" values="6;18;6" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;.1;1" dur="2.4s" repeatCount="indefinite"/></circle>`;
    svg.innerHTML = s;
  }

  return { start, stop, dust, rain, bats, map };
})();
