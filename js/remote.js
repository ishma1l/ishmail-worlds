/* =====================================================================
   REMOTE — turns any TV remote / keyboard / mouse input into 6 actions:
   left, right, up, down, ok, back  (+ playpause)
   Android TV browsers don't all send the same events, so we accept
   key names, old keyCodes, history "back" navigation and media keys.
   ===================================================================== */
window.Remote = (function () {
  const MAP = {
    left:  { keys: ['ArrowLeft', 'Left', 'DPadLeft'], codes: [37, 21] },
    right: { keys: ['ArrowRight', 'Right', 'DPadRight'], codes: [39, 22] },
    up:    { keys: ['ArrowUp', 'Up', 'DPadUp'], codes: [38] },
    down:  { keys: ['ArrowDown', 'Down', 'DPadDown'], codes: [40, 20] },
    ok:    { keys: ['Enter', 'Select', 'Accept', 'NumpadEnter', 'DPadCenter'], codes: [13, 23, 66, 195] },
    back:  { keys: ['Escape', 'Backspace', 'GoBack', 'BrowserBack', 'Back', 'XF86Back'], codes: [27, 8, 4, 10009, 461, 166] },
    playpause: { keys: ['MediaPlayPause', 'MediaPlay', 'MediaPause', 'Play', 'Pause', 'PlayPause', ' '], codes: [179, 415, 19, 85, 126, 127, 250, 32] }
  };
  function action(e) {
    const k = e.key, c = e.keyCode || e.which;
    for (const a in MAP) if (MAP[a].keys.includes(k)) return a;
    if (!k || k === 'Unidentified' || k.length > 1 || k === ' ') for (const a in MAP) if (MAP[a].codes.includes(c)) {
      if (a === 'down' && c === 20 && k === 'CapsLock') continue;   // keyCode 20 is CapsLock on keyboards
      return a;
    }
    return null;
  }

  let handler = () => {}, lastKeyAt = 0;
  function on(fn) { handler = fn; }

  document.addEventListener('keydown', e => {
    const a = action(e); if (!a) return;
    e.preventDefault(); e.stopPropagation();
    lastKeyAt = performance.now();
    if (e.repeat && (a === 'ok' || a === 'back')) return;   // holding OK/Back shouldn't fire repeatedly
    handler(a, e);
  }, true);

  /* BACK on many TV browsers is a history navigation, not a key.
     Keep a guard entry in history so BACK lands here instead of leaving. */
  let allowLeave = false;
  function arm() { try { history.pushState({ iw: Date.now() }, ''); } catch (e) {} }
  window.addEventListener('popstate', () => {
    if (allowLeave) return;
    // if a keydown for Back just fired, the history pop is the same press — ignore it
    if (performance.now() - lastKeyAt > 350) handler('back', null);
    arm();
  });
  function leave() { allowLeave = true; history.go(-2); }

  /* Media keys routed through the OS media session (some remotes only do this) */
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', () => handler('playpause', null));
      navigator.mediaSession.setActionHandler('pause', () => handler('playpause', null));
    } catch (e) {}
  }

  /* mouse / pointer-mode remotes: show the cursor only while it's used */
  let pt;
  document.addEventListener('mousemove', () => { document.body.classList.add('pointer'); clearTimeout(pt); pt = setTimeout(() => document.body.classList.remove('pointer'), 3000); });

  return { on, arm, leave, action };
})();
