// Happy/sad backgrounds
// Toggle on :)  -> swirl starfield
// Toggle on :(  -> raining stars
// Only the visible background animates; the other one pauses to save battery.

(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FADE_MS = 800; // keep in sync with the transition in toggle-bg.css
  const rnd = (a, b) => a + Math.random() * (b - a);

  // Shared engine: sizes a canvas and runs a draw loop that can start/stop
  function makeLoop(canvas, setup, draw) {
    const ctx = canvas.getContext('2d');
    const s = { ctx, W: 0, H: 0 };
    let running = false, raf = 0, last = 0;

    function resize() {
      const DPR = Math.min(devicePixelRatio || 1, 2);
      s.W = canvas.clientWidth; s.H = canvas.clientHeight;
      canvas.width = s.W * DPR; canvas.height = s.H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      setup(s);
      if (running) draw(s, performance.now() / 1000, 0);
    }

    function frame(now) {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      draw(s, now / 1000, dt);
      raf = requestAnimationFrame(frame);
    }

    resize();
    addEventListener('resize', resize);

    return {
      start() {
        if (running) return;
        running = true; last = performance.now();
        raf = requestAnimationFrame(frame);
      },
      stop() { running = false; cancelAnimationFrame(raf); }
    };
  }

  /* ---------- HAPPY: swirl starfield ---------- */
  const SWIRL = {
    count: 5500,   // number of stars (lower on small screens automatically)
    speed: 0.55,   // rotation speed
    twist: 0.9,    // how much inner stars outpace outer ones
    trail: 1.0,    // streak length
    colors: ['#2fe6ff', '#1c8cff', '#3a5bff', '#d23cff', '#ffb36b', '#ffffff'],
    weights: [3, 3, 2, 2, 1, 1]
  };

  function pickColor() {
    const total = SWIRL.weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < SWIRL.colors.length; i++) {
      if ((r -= SWIRL.weights[i]) < 0) return SWIRL.colors[i];
    }
    return SWIRL.colors[0];
  }

  function swirlSetup(s) {
    const { ctx, W, H } = s;
    s.cx = W * 0.5; s.cy = H * 0.52;
    s.R = Math.hypot(W, H) * 0.5;
    const n = Math.round(SWIRL.count * Math.min(1, (W * H) / (1200 * 800)) + 1200);
    s.stars = Array.from({ length: n }, () => {
      const bright = Math.random();
      return {
        r: Math.pow(Math.random(), 0.8) * s.R * 1.05,
        a: Math.random() * Math.PI * 2,
        size: 0.5 + Math.pow(bright, 3) * 2.8,
        col: pickColor(),
        tw: Math.random() * Math.PI * 2,
        tws: 1.2 + Math.random() * 3.5,
        streak: Math.random() < 0.28 ? 1 + Math.random() * 7 : 0,
        drift: 0.6 + Math.random() * 0.8
      };
    });
    const g = ctx.createRadialGradient(s.cx, s.cy, 0, s.cx, s.cy, s.R * 0.7);
    g.addColorStop(0, 'rgba(30,70,160,0.10)');
    g.addColorStop(0.6, 'rgba(60,20,120,0.04)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    s.glow = g;
  }

  function swirlDraw(s, t, dt) {
    const { ctx, W, H, cx, cy, R } = s;
    const omega = r => SWIRL.speed * (1 + SWIRL.twist * 6 / (1 + r / (R * 0.12))) * 0.35;

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#02020a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = s.glow;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    for (const st of s.stars) {
      const w = omega(st.r) * st.drift;
      if (!reduce) st.a += w * dt;
      const x = cx + Math.cos(st.a) * st.r;
      const y = cy + Math.sin(st.a) * st.r;
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;

      const tw = 0.5 + 0.5 * Math.sin(t * st.tws + st.tw);
      ctx.globalAlpha = tw;
      ctx.strokeStyle = ctx.fillStyle = st.col;

      if (st.streak) {
        const len = st.streak * SWIRL.trail * (0.5 + Math.min(w * 40, 4)) * 0.12;
        const a2 = st.a - len / Math.max(st.r, 30);
        ctx.lineWidth = st.size * 1.3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(cx + Math.cos(a2) * st.r, cy + Math.sin(a2) * st.r);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(x, y, st.size, 0, 6.2832);
      ctx.fill();
      if (st.size > 1.1) {
        ctx.globalAlpha = tw * 0.07;
        ctx.beginPath(); ctx.arc(x, y, st.size * 3.6, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = tw * 0.025;
        ctx.beginPath(); ctx.arc(x, y, st.size * 7, 0, 6.2832); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- SAD: raining stars ---------- */
  const RAIN = {
    streaks: 3.6,  // how many falling streaks
    speed: 1,      // fall speed
    dots: 1,       // tiny background stars
    glow: 1,       // bright columns at the bottom
    colors: [[40, 230, 255], [30, 200, 255], [60, 150, 255], [40, 230, 255], [190, 60, 255], [255, 70, 240], [225, 250, 255]]
  };

  const rainSprites = RAIN.colors.map(([r, g, b]) => {
    const c = document.createElement('canvas'); c.width = 4; c.height = 128;
    const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, `rgba(${r},${g},${b},0)`);
    gr.addColorStop(0.7, `rgba(${r},${g},${b},0.55)`);
    gr.addColorStop(0.96, `rgba(${r},${g},${b},1)`);
    gr.addColorStop(1, 'rgba(255,240,255,1)');
    x.fillStyle = gr; x.fillRect(1, 0, 2, 128);
    return c;
  });

  const colSprite = (() => {
    const c = document.createElement('canvas'); c.width = 2; c.height = 128;
    const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, 'rgba(120,20,220,0)');
    gr.addColorStop(0.6, 'rgba(150,30,240,0.35)');
    gr.addColorStop(1, 'rgba(255,80,245,0.9)');
    x.fillStyle = gr; x.fillRect(0, 0, 2, 128);
    return c;
  })();

  function spawnStreak(s, st, initial) {
    const { W, H } = s;
    st.x = Math.random() * W;
    const z = st.z = Math.pow(Math.random(), 2);
    st.len = (18 + z * 300 + rnd(0, 30)) * (H / 800 > 1 ? 1 : 0.9);
    st.v = 140 + z * 650 + rnd(0, 120);
    st.w = 0.6 + z * 5.5;
    st.y = initial ? rnd(-st.len, H) : -st.len - rnd(0, H * 0.3);
    st.k = (Math.random() * rainSprites.length) | 0;
    st.a = 0.45 + 0.55 * Math.min(1, z * 0.8 + Math.random() * 0.45);
    return st;
  }

  function rainSetup(s) {
    const { ctx, W, H } = s;
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#000000');
    bg.addColorStop(0.45, '#05001a');
    bg.addColorStop(0.75, '#14004a');
    bg.addColorStop(0.92, '#5a0ca8');
    bg.addColorStop(1, '#c02cd8');
    s.bg = bg;

    const area = W * H;
    s.streaks = Array.from({ length: Math.round((area / 9000) * RAIN.streaks) + 20 }, () => spawnStreak(s, {}, true));
    s.dots = Array.from({ length: Math.round((area / 2200) * RAIN.dots) + 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H * 0.92,
      r: rnd(0.4, 1.4), p: Math.random() * 6.28, f: rnd(1, 4),
      c: Math.random() < 0.45 ? '#3fe6ff' : Math.random() < 0.5 ? '#ffffff' : Math.random() < 0.5 ? '#b866ff' : '#ff6af0'
    }));
    s.cols = Array.from({ length: Math.round((W / 2.2) * RAIN.glow) }, () => ({
      x: Math.random() * W, w: rnd(0.8, 2.6),
      h: rnd(0.04, 0.3) * H * (Math.random() < 0.15 ? 1.4 : 1),
      p: Math.random() * 6.28, f: rnd(1.5, 5), a: rnd(0.25, 0.8)
    }));
  }

  function rainDraw(s, t, dt) {
    const { ctx, W, H } = s;

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = s.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    for (const d of s.dots) {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * d.f + d.p);
      ctx.fillStyle = d.c;
      ctx.fillRect(d.x, d.y, d.r * 1.6, d.r * 1.6);
    }

    for (const c of s.cols) {
      ctx.globalAlpha = c.a * (0.55 + 0.45 * Math.sin(t * c.f + c.p));
      ctx.drawImage(colSprite, c.x, H - c.h, c.w, c.h);
    }

    const fade = H * 0.22;
    for (const st of s.streaks) {
      if (!reduce) st.y += st.v * RAIN.speed * dt;
      if (st.y - st.len > H) { spawnStreak(s, st, false); continue; }
      let a = st.a;
      if (st.y > H - fade) a *= Math.max(0, (H - st.y) / fade);
      if (a <= 0.01) continue;
      ctx.globalAlpha = a;
      ctx.drawImage(rainSprites[st.k], st.x, st.y - st.len, st.w, st.len);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- Wire up to the happy/sad toggle ---------- */
  const swirlCv = document.getElementById('bg-swirl');
  const rainCv = document.getElementById('bg-rain');
  if (!swirlCv || !rainCv) return;

  const swirl = makeLoop(swirlCv, swirlSetup, swirlDraw);
  const rain = makeLoop(rainCv, rainSetup, rainDraw);
  const toggle = document.querySelector('.main-checkbox');
  let stopTimer;

  function apply() {
    const sad = !!(toggle && toggle.checked);
    const [show, showCv, hide, hideCv] = sad
      ? [rain, rainCv, swirl, swirlCv]
      : [swirl, swirlCv, rain, rainCv];

    show.start();
    showCv.classList.remove('is-hidden');
    hideCv.classList.add('is-hidden');

    clearTimeout(stopTimer);
    stopTimer = setTimeout(() => hide.stop(), FADE_MS); // pause once faded out
  }

  if (toggle) toggle.addEventListener('change', apply);
  addEventListener('pageshow', apply); // browser may restore the toggle on Back
  apply();
})();
