/* All sound is synthesised live with the Web Audio API — no audio files needed. */
window.Sound = (function () {
  let ctx = null, master = null, muted = false;
  const beds = {};          // ambience per world
  let engine = null;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8;
      const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
      return true;
    } catch (e) { return false; }
  }
  const ready = () => ctx && ctx.state === 'running';

  function noiseBuffer(sec = 2) {
    const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function noise(loop = true) { const s = ctx.createBufferSource(); s.buffer = noiseBuffer(3); s.loop = loop; return s; }
  function env(g, t, a, peak, d, end = 0.0001) {
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(end, t + a + d);
  }

  /* ---------- UI ---------- */
  function tick() {
    if (!ready()) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(1400, t); o.frequency.exponentialRampToValueAtTime(900, t + .05);
    env(g, t, .004, .05, .07); o.connect(g).connect(master); o.start(t); o.stop(t + .1);
  }
  function whoosh(dur = 1.2) {
    if (!ready()) return; const t = ctx.currentTime, n = noise(false), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(200, t); f.frequency.exponentialRampToValueAtTime(3200, t + dur * .6);
    f.frequency.exponentialRampToValueAtTime(400, t + dur); env(g, t, dur * .55, .5, dur * .45);
    n.connect(f).connect(g).connect(master); n.start(t); n.stop(t + dur + .1);
  }
  function boom() {
    if (!ready()) return; const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(32, t + 3);
    env(g, t, .05, .9, 3.5); o.connect(g).connect(master); o.start(t); o.stop(t + 4);
    // shimmering chord
    [523.25, 659.25, 783.99, 1046.5].forEach((fq, i) => {
      const s = ctx.createOscillator(), sg = ctx.createGain(); s.type = 'triangle'; s.frequency.value = fq; s.detune.value = (i - 1.5) * 6;
      env(sg, t + .3 + i * .12, 1.2, .045, 4.5); s.connect(sg).connect(master); s.start(t); s.stop(t + 7);
    });
  }

  /* ---------- Dark City: rain bed + thunder ---------- */
  function cityBed(on) {
    if (!ctx) return;
    if (on && false) {   // no rain / hum bed — Gotham's sound is the featured clip itself
      const n = noise(), lp = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
      lp.type = 'lowpass'; lp.frequency.value = 5200; hp.type = 'highpass'; hp.frequency.value = 500;
      g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(.16, ctx.currentTime + 2);
      n.connect(hp).connect(lp).connect(g).connect(master); n.start();
      const hum = ctx.createOscillator(), hg = ctx.createGain(); hum.type = 'sawtooth'; hum.frequency.value = 41;
      const hl = ctx.createBiquadFilter(); hl.type = 'lowpass'; hl.frequency.value = 120; hg.gain.value = .05;
      hum.connect(hl).connect(hg).connect(master); hum.start();
      beds.city = { stop() { g.gain.setTargetAtTime(.0001, ctx.currentTime, .4); hg.gain.setTargetAtTime(.0001, ctx.currentTime, .4); setTimeout(() => { n.stop(); hum.stop(); }, 1500); } };
    } else if (!on && beds.city) { beds.city.stop(); delete beds.city; }
  }
  function thunder() {
    if (!ready()) return; const t = ctx.currentTime, n = noise(false), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass'; f.frequency.setValueAtTime(1800, t); f.frequency.exponentialRampToValueAtTime(90, t + 3.5);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.9, t + .05); g.gain.exponentialRampToValueAtTime(.35, t + .5);
    g.gain.exponentialRampToValueAtTime(.6, t + .9); g.gain.exponentialRampToValueAtTime(.0001, t + 4.5);
    n.connect(f).connect(g).connect(master); n.start(t); n.stop(t + 5);
  }
  function typeBlip() {
    if (!ready()) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square'; o.frequency.value = 1800 + Math.random() * 600; env(g, t, .002, .012, .03);
    o.connect(g).connect(master); o.start(t); o.stop(t + .05);
  }

  /* ---------- Drive: six-cylinder engine model ---------- */
  function makeEngine() {
    const out = ctx.createGain(); out.gain.value = 0.0001;
    const shaper = ctx.createWaveShaper(), curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 3.2); }
    shaper.curve = curve;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 4;
    const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 160; body.gain.value = 8;
    const oscs = [[1, 'sawtooth', .5], [.5, 'square', .35], [2, 'sawtooth', .18], [1.5, 'triangle', .2]].map(([m, type, lvl]) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; g.gain.value = lvl; o.connect(g).connect(shaper); o.start(); return { o, m };
    });
    const rumble = noise(), rf = ctx.createBiquadFilter(), rg = ctx.createGain(); rf.type = 'bandpass'; rf.frequency.value = 90; rg.gain.value = .25;
    rumble.connect(rf).connect(rg).connect(shaper); rumble.start();
    shaper.connect(body).connect(lp).connect(out).connect(master);
    let rpm = 0;
    function set(r, when = ctx.currentTime, glide = .08) {
      rpm = r; const fire = r / 60 * 3; // six cylinders, four-stroke = 3 pulses per rev
      oscs.forEach(({ o, m }) => o.frequency.setTargetAtTime(Math.max(8, fire * m), when, glide));
      lp.frequency.setTargetAtTime(300 + r * .55, when, glide); rf.frequency.setTargetAtTime(60 + r / 40, when, glide);
    }
    return { out, set, get rpm() { return rpm; }, stop() { out.gain.setTargetAtTime(.0001, ctx.currentTime, .3); setTimeout(() => { oscs.forEach(x => x.o.stop()); rumble.stop(); }, 1500); } };
  }
  function driveBed(on) {
    if (!ctx) return;
    if (on && false) {   // no engine sound effect
      engine = makeEngine(); const t = ctx.currentTime;
      // starter + catch + settle to idle
      engine.set(250, t, .01); engine.set(2600, t + .5, .12); engine.set(950, t + 1.4, .35);
      engine.out.gain.setValueAtTime(.0001, t); engine.out.gain.exponentialRampToValueAtTime(.32, t + .6); engine.out.gain.exponentialRampToValueAtTime(.12, t + 2.2);
      engine.set(6800, t + 2.4, .25); engine.set(950, t + 3.3, .4); engine.out.gain.setTargetAtTime(.3, t + 2.4, .1); engine.out.gain.setTargetAtTime(.02, t + 3.6, 1.2);
    } else if (!on && engine) { engine.stop(); engine = null; }
  }
  function rev() {
    if (!ready() || !engine) return 0; const t = ctx.currentTime;
    engine.out.gain.setTargetAtTime(.4, t, .05);
    engine.set(7800, t, .32); engine.set(950, t + 1.25, .45);
    engine.out.gain.setTargetAtTime(.14, t + 1.3, .5);
    // overrun crackle
    for (let i = 0; i < 7; i++) {
      const tt = t + 1.35 + Math.random() * .9, n = noise(false), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'highpass'; f.frequency.value = 900; env(g, tt, .002, .35 * Math.random() + .1, .05);
      n.connect(f).connect(g).connect(master); n.start(tt); n.stop(tt + .08);
    }
    return 1;
  }

  /* ---------- Empire: warm pad + chime ---------- */
  function empireBed(on) {
    if (!ctx) return;
    if (on && !beds.empire) {
      const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; g.gain.value = .0001;
      g.gain.exponentialRampToValueAtTime(.12, ctx.currentTime + 4);
      const notes = [130.81, 196.0, 246.94, 329.63, 392.0]; // Cmaj9 spread
      const os = notes.map((f, i) => { const o = ctx.createOscillator(); o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = (i - 2) * 4; o.connect(lp); o.start(); return o; });
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .07; lg.gain.value = 500; lfo.connect(lg).connect(lp.frequency); lfo.start();
      lp.connect(g).connect(master);
      beds.empire = { stop() { g.gain.setTargetAtTime(.0001, ctx.currentTime, .6); setTimeout(() => { os.forEach(o => o.stop()); lfo.stop(); }, 2500); } };
    } else if (!on && beds.empire) { beds.empire.stop(); delete beds.empire; }
  }
  function chime() {
    if (!ready()) return; const t = ctx.currentTime;
    [1046.5, 1567.98, 2093].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f;
      env(g, t + i * .09, .01, .06 / (i + 1), 2.6); o.connect(g).connect(master); o.start(t); o.stop(t + 3.2); });
  }

  let ducked = false;
  function level() { return muted ? 0 : (ducked ? .12 : .8); }
  try { muted = localStorage.getItem('iw-muted') === '1'; } catch (e) {}
  return {
    duck(on) { ducked = on; if (master) master.gain.setTargetAtTime(level(), ctx.currentTime, .3); },
    init, tick, whoosh, boom, thunder, typeBlip, rev, chime,
    world(name) { cityBed(name === 'gotham'); driveBed(name === 'porsche'); empireBed(name === 'lifestyle'); },
    toggleMute() { muted = !muted; try { localStorage.setItem('iw-muted', muted ? '1' : '0'); } catch (e) {} if (master) master.gain.setTargetAtTime(level(), ctx.currentTime, .1); return muted; },
    get muted() { return muted; }, get running() { return ready(); }
  };
})();
