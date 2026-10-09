/* Pixel pet cat — a tiny Tamagotchi with a black tortie cat.
   Each visitor gets their own cat, saved in their browser (localStorage).
   Feed, play, nap, clean, and click or stroke the screen to pet (it purrs). */
(function () {
  // ---------- settings you can tweak ----------
  var MIN = 60 * 1000;
  var FOOD_DROP = 6 * MIN;     // lose 1 food every 6 minutes
  var FUN_DROP = 5 * MIN;      // lose 1 fun every 5 minutes (twice as fast if messy)
  var ENERGY_DROP = 10 * MIN;  // lose 1 energy every 10 minutes awake
  var ENERGY_GAIN = 30 * 1000; // gain 1 energy every 30 seconds asleep
  var MESS_EVERY = 8 * MIN;    // a mess appears about every 8 minutes
  var PURR_VOLUME = 0.5;       // 0 = silent, 1 = loudest
  var STORAGE_KEY = 'cybernaut-pet';

  // ---------- screen ----------
  var W = 40, H = 30, SCALE = 3, TICK = 200;
  var LIGHT = { bg: '#b8f3ff', ink: '#000033', faint: 'rgba(0,0,51,0.08)' };
  var DARK = { bg: '#14204a', ink: '#5a7ab8', faint: 'rgba(90,122,184,0.08)' };

  // ---------- sprites (1 = pixel) ----------
  // Tortie cat: 1 = black fur, c = caramel, w = white, e = eyes, p = nose, s = sleepy eyes
  var HEAD_TOP = ['1........1..', '11......11..', '11c1111111..'];
  var FACES = {
    open:  ['111111cc11..', '111e11e111..', '1111pp1111..'],
    blink: ['111111cc11..', '1111111111..', '1111pp1111..'],
    happy: ['111e11ecc1..', '11e1ee1e11..', '1111pp1111..'],
    sad:   ['11e1111ec1..', '111e11e111..', '1111pp1111..'],
    sleep: ['111111cc11..', '11ss11ss11..', '1111pp1111..']
  };
  var BODY_A = ['.11w11111...', '..111111...1', '.11c1111w.1.', '.1111cc1111.', '.1w111111...', '.11.11.11...'];
  var BODY_B = ['.11w11111..1', '..111111..1.', '.11c1111w.1.', '.1111cc1111.', '.1w111111...', '.11.11.11...'];
  var EAT_MOUTH = '.11wpp111...';

  // fur colours by day, and a soft blue silhouette when the lights are off
  var CAT_DAY = { '1': '#1a1420', c: '#c8803a', w: '#ffffff', e: '#e8c43a', p: '#ff6fd8', s: '#6a6a8a' };
  var CAT_NIGHT = { '1': '#33478a', c: '#33478a', w: '#33478a', e: '#33478a', p: '#33478a', s: '#7a9ad8' };
  var HEART_COLORS = { '1': '#ff1ab3' };

  var ICON_FOOD = ['1.11.', '11111', '1.11.'];
  var ICON_FUN = ['11.11', '11111', '.111.', '..1..'];
  var ICON_ENERGY = ['1111', '..1.', '.1..', '1111'];
  var FISH = ['1.111.', '111111', '1.111.'];
  var BALL = ['.1.', '111', '.1.'];
  var HEART = ['1.1', '111', '.1.'];
  var POOP = ['..1.', '.11.', '1111'];
  var ZED = ['111', '.1.', '111'];

  function catSprite(face, tailUp, eating) {
    var body = (tailUp ? BODY_B : BODY_A).slice();
    if (eating) body[0] = EAT_MOUTH;
    return HEAD_TOP.concat(FACES[face], body);
  }

  // ---------- state ----------
  var state = { food: 3, fun: 3, energy: 4, mess: 0, asleep: false, last: Date.now() };
  try {
    var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.food === 'number') state = saved;
  } catch (e) {}

  function clamp(v) { return Math.max(0, Math.min(4, v)); }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  // apply time passing (also catches up after the visitor was away)
  function age(now) {
    var dt = Math.max(0, now - state.last);
    state.last = now;
    state.food = clamp(state.food - dt / FOOD_DROP);
    state.fun = clamp(state.fun - dt / FUN_DROP * (state.mess >= 2 ? 2 : 1));
    if (state.asleep) {
      state.energy = clamp(state.energy + dt / ENERGY_GAIN);
      if (state.energy >= 4) state.asleep = false;
    } else {
      state.energy = clamp(state.energy - dt / ENERGY_DROP);
      if (state.energy <= 0) state.asleep = true;
    }
    if (dt > TICK * 5) {
      state.mess = Math.min(3, state.mess + Math.floor(dt / MESS_EVERY));
    } else if (!state.asleep && Math.random() < dt / MESS_EVERY) {
      state.mess = Math.min(3, state.mess + 1);
    }
  }

  // ---------- build the device ----------
  var shell = document.createElement('div');
  shell.className = 'pet-shell';
  shell.innerHTML =
    '<div class="pet-logo">PIXEL PET</div>' +
    '<div class="pet-frame"><canvas class="pet-screen" aria-label="Your pixel cat" role="img"></canvas></div>' +
    '<div class="pet-buttons">' +
      '<button type="button" class="pet-btn" data-act="feed">FEED</button>' +
      '<button type="button" class="pet-btn" data-act="play">PLAY</button>' +
      '<button type="button" class="pet-btn" data-act="nap">NAP</button>' +
      '<button type="button" class="pet-btn" data-act="clean">CLEAN</button>' +
    '</div>';
  document.body.appendChild(shell);

  var canvas = shell.querySelector('.pet-screen');
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * SCALE * dpr;
  canvas.height = H * SCALE * dpr;
  ctx.setTransform(SCALE * dpr, 0, 0, SCALE * dpr, 0, 0);

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- animation state ----------
  var mode = 'idle';      // idle | eat | play | pet | clean | no
  var modeUntil = 0;
  var frame = 0;
  var catX = 14, dir = 1;
  var bites = 0;
  var floaters = [];      // hearts and z's drifting up
  var pendingMess = 0;

  function setMode(m, ms) { mode = m; modeUntil = Date.now() + ms; }

  // ---------- drawing ----------
  var pal = LIGHT;
  function px(x, y) { ctx.fillRect(x, y, 1, 1); }
  function sprite(rows, x, y, flip, colors) {
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      for (var c = 0; c < row.length; c++) {
        var ch = row[c];
        if (ch === '.') continue;
        if (colors) ctx.fillStyle = colors[ch] || pal.ink;
        px(flip ? x + row.length - 1 - c : x + c, y + r);
      }
    }
    if (colors) ctx.fillStyle = pal.ink;
  }
  function meter(icon, value, x) {
    sprite(icon, x, 1);
    var filled = Math.ceil(value - 0.001);
    for (var i = 0; i < 4; i++) {
      var dx = x + 7 + i * 2;
      if (i < filled) ctx.fillRect(dx, 2, 1, 3); else px(dx, 4);
    }
  }

  function draw() {
    pal = state.asleep ? DARK : LIGHT;
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, W, H);

    // faint LCD grid
    ctx.fillStyle = pal.faint;
    for (var gx = 0; gx < W; gx += 2) ctx.fillRect(gx, 0, 1, H);

    ctx.fillStyle = pal.ink;
    meter(ICON_FOOD, state.food, 1);
    meter(ICON_FUN, state.fun, 14);
    meter(ICON_ENERGY, state.energy, 27);
    for (var lx = 0; lx < W; lx += 2) px(lx, 6);
    for (var gx2 = 0; gx2 < W; gx2 += 3) px(gx2, 29);

    // messes, lined up from the right
    for (var m = 0; m < state.mess; m++) sprite(POOP, 35 - m * 5, 26);

    // the cat
    var tail = frame % 4 < 2;
    var face = 'open';
    var y = 17, x = catX, eating = false;
    if (state.asleep) {
      face = 'sleep'; tail = false;
    } else if (mode === 'eat') {
      eating = frame % 2 === 0;
    } else if (mode === 'play') {
      face = 'happy';
      y = frame % 2 === 0 ? 14 : 17;
    } else if (mode === 'pet') {
      face = 'happy';
      x = catX + (frame % 2);
    } else if (mode === 'no') {
      dir = frame % 2 === 0 ? 1 : -1;
    } else if (state.fun < 1.5 || state.food < 1) {
      face = 'sad';
    } else if (frame % 15 === 0) {
      face = 'blink';
    }
    sprite(catSprite(face, tail, eating), x, y, dir < 0, state.asleep ? CAT_NIGHT : CAT_DAY);

    // extras
    if (mode === 'eat') {
      var fish = FISH.map(function (r) { return r.slice(Math.min(bites, 5)); });
      sprite(fish, dir > 0 ? catX + 12 : catX - 6, 25);
    }
    if (mode === 'play') sprite(BALL, catX + 4, frame % 2 === 0 ? 9 : 12);
    if (mode === 'clean') {
      var sweepX = W - Math.floor((1 - (modeUntil - Date.now()) / 1000) * W);
      ctx.fillRect(Math.max(0, sweepX), 7, 2, 22);
    }
    if (!state.asleep && mode === 'idle' && state.food < 1 && frame % 4 < 2) {
      sprite(FISH, catX + 3, 9);
    }

    floaters.forEach(function (f) { sprite(f.rows, Math.round(f.x), Math.round(f.y), false, f.rows === HEART ? HEART_COLORS : null); });
  }

  // ---------- loop ----------
  function tick() {
    var now = Date.now();
    age(now);
    frame++;

    if (mode !== 'idle' && now > modeUntil) {
      if (mode === 'clean') state.mess = 0;
      mode = 'idle';
    }
    if (mode === 'eat' && frame % 2 === 0) bites++;
    if (pendingMess && now > pendingMess) {
      pendingMess = 0;
      state.mess = Math.min(3, state.mess + 1);
    }

    // wander when idle and awake
    if (!state.asleep && mode === 'idle' && !reduceMotion && Math.random() < 0.3) {
      if (Math.random() < 0.15) dir = -dir;
      catX += dir;
      var maxX = 23 - state.mess * 5;
      if (catX <= 1) { catX = 1; dir = 1; }
      if (catX >= Math.max(maxX, 8)) { catX = Math.max(maxX, 8); dir = -1; }
    }

    // floating z's while asleep
    if (state.asleep && frame % 6 === 0) {
      floaters.push({ rows: ZED, x: catX + 9, y: 16, vy: -0.6, life: 14 });
    }
    floaters = floaters.filter(function (f) {
      f.y += f.vy; f.x += (f.rows === ZED ? 0.3 : 0); f.life--;
      return f.life > 0 && f.y > 7;
    });

    if (!document.hidden) draw();
    if (frame % 10 === 0) save();
  }

  // ---------- purr sound ----------
  var audioCtx = null;
  var lastPurr = 0;
  function unlockAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  function purr() {
    var now = Date.now();
    if (!audioCtx || audioCtx.state !== 'running' || now - lastPurr < 1300 || PURR_VOLUME <= 0) return;
    lastPurr = now;
    var t = audioCtx.currentTime, dur = 1.4;
    var buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * dur), audioCtx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    var src = audioCtx.createBufferSource(); src.buffer = buf;
    var lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240;
    var rumble = audioCtx.createGain(); rumble.gain.value = 0.5;
    var lfo = audioCtx.createOscillator(); lfo.frequency.value = 26;
    var lfoDepth = audioCtx.createGain(); lfoDepth.gain.value = 0.5;
    lfo.connect(lfoDepth); lfoDepth.connect(rumble.gain);
    var out = audioCtx.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(PURR_VOLUME, t + 0.2);
    out.gain.setValueAtTime(PURR_VOLUME, t + dur - 0.35);
    out.gain.linearRampToValueAtTime(0, t + dur);
    src.connect(lp); lp.connect(rumble); rumble.connect(out); out.connect(audioCtx.destination);
    src.start(t); lfo.start(t); src.stop(t + dur); lfo.stop(t + dur);
  }

  // ---------- actions ----------
  function pet() {
    if (mode === 'pet' || mode === 'clean') return;
    state.fun = clamp(state.fun + 0.25);
    if (!state.asleep) setMode('pet', 1600);
    for (var i = 0; i < 3; i++) {
      floaters.push({ rows: HEART, x: catX + 2 + i * 3, y: 15 + i, vy: -0.7, life: 10 });
    }
    purr();
    draw();
  }

  var actions = {
    feed: function () {
      if (state.asleep) return;
      if (state.food >= 3.9) { setMode('no', 800); return; }
      state.food = clamp(state.food + 1);
      bites = 0;
      setMode('eat', 1800);
      if (!pendingMess && Math.random() < 0.5) pendingMess = Date.now() + 45 * 1000;
    },
    play: function () {
      if (state.asleep) return;
      if (state.energy < 1) { setMode('no', 800); return; }
      state.fun = clamp(state.fun + 1);
      state.energy = clamp(state.energy - 0.5);
      setMode('play', 2000);
    },
    nap: function () {
      state.asleep = !state.asleep;
      mode = 'idle';
    },
    clean: function () {
      if (state.asleep || state.mess === 0) return;
      state.fun = clamp(state.fun + 0.5);
      setMode('clean', 1000);
    }
  };

  shell.addEventListener('click', function (e) {
    var btn = e.target.closest('.pet-btn');
    if (!btn) return;
    unlockAudio();
    actions[btn.getAttribute('data-act')]();
    save();
    draw();
  });

  // click the screen, or stroke across it, to pet
  var stroke = 0;
  canvas.addEventListener('pointerdown', function () {
    unlockAudio();
    pet();
  });
  canvas.addEventListener('pointermove', function (e) {
    stroke += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);
    if (stroke > 120) { stroke = 0; pet(); }
  });
  canvas.addEventListener('pointerleave', function () { stroke = 0; });

  age(Date.now());
  draw();
  setInterval(tick, TICK);
  window.addEventListener('pagehide', save);
})();
