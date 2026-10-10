/* =========================================================
   pet.js — caped pixel cat for the About Me page
   Black cat, magenta cape, green eyes. Drawn pixel-by-pixel
   on a tiny canvas that CSS scales up crisp.
   Click her (or PET) to pet → purr + hearts.
   FEED → she munches a little cyan fish.
   She also blinks, looks around and yawns on her own.
   ========================================================= */
(function () {
  var W = 64, H = 56;

  var PAL = {
    K: '#07060c', // outline
    B: '#25222f', // fur
    H: '#3f3b54', // fur highlight
    D: '#16141d', // fur shade
    P: '#ff9fd6', // inner ear
    G: '#3dff7a', // eye green
    g: '#0f9e45', // eye rim
    E: '#ffffff', // eye glint / sparkles
    k: '#000000', // pupil
    C: '#ff5fb0', // blush
    N: '#ff8fc8', // nose / tongue
    u: '#8a80a6', // mouth line
    O: '#4a0a2a', // open mouth
    M: '#ff1ab3', // cape
    m: '#a8007a', // cape shade
    L: '#ff7fdc', // cape light
    R: '#ff2fc8', // heart
    r: '#ffb3ec', // heart shine
    w: '#d8d4ea', // whiskers
    F: '#00ffff', // fish
    f: '#00909e'  // fish dark
  };

  /* ---------- shape helpers ---------- */
  function inEllipse(x, y, cx, cy, rx, ry) {
    var dx = (x - cx) / rx, dy = (y - cy) / ry;
    return dx * dx + dy * dy <= 1;
  }
  function sign(ax, ay, bx, by, cx, cy) {
    return (ax - cx) * (by - cy) - (bx - cx) * (ay - cy);
  }
  function inTri(x, y, a, b, c) {
    var d1 = sign(x, y, a[0], a[1], b[0], b[1]);
    var d2 = sign(x, y, b[0], b[1], c[0], c[1]);
    var d3 = sign(x, y, c[0], c[1], a[0], a[1]);
    var neg = d1 < 0 || d2 < 0 || d3 < 0;
    var pos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(neg && pos);
  }
  function inPoly(x, y, pts) {
    var inside = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  /* each part gets its own black outline, so overlapping
     parts (head over collar, body over cape) stay readable */
  function stamp(grid, test, colorAt) {
    var cells = [], inMask = new Uint8Array(W * H), x, y, i;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      if (test(x, y)) { i = y * W + x; cells.push(i); inMask[i] = 1; }
    }
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    cells.forEach(function (i) {
      var cx = i % W, cy = (i / W) | 0;
      dirs.forEach(function (d) {
        var nx = cx + d[0], ny = cy + d[1];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;
        var j = ny * W + nx;
        if (!inMask[j]) grid[j] = 'K';
      });
    });
    cells.forEach(function (i) { grid[i] = colorAt(i % W, (i / W) | 0); });
  }
  function put(grid, x, y, c) {
    if (x >= 0 && y >= 0 && x < W && y < H) grid[y * W + x] = c;
  }
  function pattern(grid, x0, y0, rows, skipCols) {
    rows.forEach(function (row, ry) {
      for (var rx = 0; rx < row.length; rx++) {
        if (skipCols && rx < skipCols) continue;
        var c = row[rx];
        if (c !== '.' && c !== ' ') put(grid, x0 + rx, y0 + ry, c);
      }
    });
  }

  /* ---------- little sprites ---------- */
  var EYES = {
    center: ['.ggg.', 'gEGGg', 'gGkGg', 'gGkGg', '.ggg.'],
    left:   ['.ggg.', 'gEGGg', 'gkGGg', 'gkGGg', '.ggg.'],
    right:  ['.ggg.', 'gEGGg', 'gGGkg', 'gGGkg', '.ggg.'],
    happy:  ['.....', '.GGG.', 'G...G', '.....', '.....'],
    closed: ['.....', '.....', 'G...G', '.GGG.', '.....']
  };
  var FISH = [
    '..fff...f',
    '.fFFFf.ff',
    'fkFFFFFFf',
    '.fFFFf.ff',
    '..fff...f'
  ];
  var HEART = ['RR.RR', 'RrRRR', 'RRRRR', '.RRR.', '..R..'];

  /* ---------- build one frame of the cat ---------- */
  function buildCat(p) {
    var g = new Array(W * H).fill(null);
    var cx = 26, oy = p.bob;   // head bobs 1px when she breathes
    var fl = [0, 1, 2, 1][p.cape];

    // cape (behind her), flowing out to the right
    var cape = [[15, 34], [17, 28], [34, 27], [42, 28], [49, 30 - fl], [56, 31 - fl * 2],
                [59, 33 - fl], [57, 36], [54, 39 + fl], [48, 42 + fl], [40, 43], [34, 41], [16, 38]];
    stamp(g, function (x, y) { return inPoly(x + 0.5, y + 0.5, cape); }, function (x, y) {
      var d = y - 0.2 * (x - 34);               // runs along the cape's sweep
      if (d <= 28.6) return 'L';
      if (x > 37 && ((Math.floor(d + p.cape * 0.5) % 5) + 5) % 5 === 0) return 'm';
      if (d >= 38) return 'm';
      return 'M';
    });

    // tail curling round to the front-right
    // long tail: sweeps out along the floor, then curls up at the tip
    var tx = p.tail, tail = [];
    for (var ti = 0; ti <= 40; ti++) {
      var t = ti / 40, it = 1 - t;
      var P = [[34, 46], [50, 50], [61, 44], [53 + tx, 35]];
      tail.push({
        x: it * it * it * P[0][0] + 3 * it * it * t * P[1][0] + 3 * it * t * t * P[2][0] + t * t * t * P[3][0],
        y: it * it * it * P[0][1] + 3 * it * it * t * P[1][1] + 3 * it * t * t * P[2][1] + t * t * t * P[3][1],
        r: 1.9 - 0.7 * t
      });
    }
    stamp(g, function (x, y) {
      for (var i = 0; i < tail.length; i++) {
        var dx = x - tail[i].x, dy = y - tail[i].y;
        if (dx * dx + dy * dy <= tail[i].r * tail[i].r) return true;
      }
      return false;
    }, function (x, y) { return y <= 42 && x >= 54 ? 'H' : 'B'; });

    // body: round and wide, like a sitting loaf
    stamp(g, function (x, y) { return y <= 47 && inEllipse(x, y, cx, 40, 12.5, 8.5); },
      function (x, y) {
        var nx = (x - cx) / 12.5, ny = (y - 40) / 8.5;
        if (nx < -0.4 && ny < -0.1 && nx + ny > -1.25) return 'H';
        if (nx > 0.65) return 'D';
        return 'B';
      });
    // haunch curves either side
    [[16, 43], [16, 44], [17, 45], [36, 43], [36, 44], [35, 45]].forEach(function (c) { put(g, c[0], c[1], 'D'); });

    // front paws, peeking out at the bottom
    stamp(g, function (x, y) {
      return inEllipse(x, y, 22, 47, 3.4, 1.6) || inEllipse(x, y, 30, 47, 3.4, 1.6);
    }, function () { return 'B'; });
    put(g, 21, 47, 'K'); put(g, 23, 47, 'K'); put(g, 29, 47, 'K'); put(g, 31, 47, 'K');

    // cape collar around the neck
    stamp(g, function (x, y) { return inEllipse(x, y, cx, 29 + oy, 11.5, 3); },
      function (x, y) { return y >= 31 + oy ? 'm' : 'M'; });

    // head + ears
    var eL = [[14, 15 + oy], [16, 3 + oy], [24, 10 + oy]];
    var eR = [[38, 15 + oy], [36, 3 + oy], [28, 10 + oy]];
    stamp(g, function (x, y) {
      return inEllipse(x, y, cx, 19 + oy, 12, 9.5) ||
        inTri(x + 0.5, y + 0.5, eL[0], eL[1], eL[2]) ||
        inTri(x + 0.5, y + 0.5, eR[0], eR[1], eR[2]);
    }, function (x, y) {
      if (inTri(x + 0.5, y + 0.5, [17, 12 + oy], [17, 6 + oy], [22, 10.5 + oy])) return 'P';
      if (inTri(x + 0.5, y + 0.5, [35, 12 + oy], [35, 6 + oy], [30, 10.5 + oy])) return 'P';
      var nx = (x - cx) / 12, ny = (y - 19 - oy) / 9.5;
      if (nx + ny < -0.85 && ny > -1.2) return 'H';
      if (ny > 0.8) return 'D';
      return 'B';
    });

    // heart clasp
    var clasp = ['R.R', 'RRR', '.R.'];
    stamp(g, function (x, y) {
      var r = clasp[y - 30 - oy], c = x - 25;
      return r && c >= 0 && c < 3 && r[c] === 'R';
    }, function (x, y) { return x === 25 && y === 30 + oy ? 'E' : 'r'; });

    // eyes
    var eye = EYES[p.eyes] || EYES.center;
    pattern(g, 18, 16 + oy, eye);
    pattern(g, 30, 16 + oy, eye);

    // blush
    for (var bx = 0; bx < 3; bx++) {
      put(g, 15 + bx, 22 + oy, 'C'); put(g, 35 + bx, 22 + oy, 'C');
      if (p.blush) { put(g, 15 + bx, 23 + oy, 'C'); put(g, 35 + bx, 23 + oy, 'C'); }
    }

    // nose
    put(g, 25, 22 + oy, 'N'); put(g, 26, 22 + oy, 'N'); put(g, 27, 22 + oy, 'N'); put(g, 26, 23 + oy, 'N');

    // mouth
    if (p.mouth === 'yawn') {
      pattern(g, 24, 24 + oy, ['.OOO.', 'OOOOO', 'OONOO', '.NNN.']);
    } else if (p.mouth === 'open') {
      pattern(g, 25, 24 + oy, ['OOO', '.N.']);
    } else {
      pattern(g, 24, 24 + oy, ['u.u.u', '.u.u.']);
    }

    // fish in her mouth while she eats
    if (p.fish >= 0) pattern(g, 22, 24 + oy, FISH, p.fish * 2);

    // whiskers (on top of everything, light so they show on black fur)
    [[13, 21], [12, 21], [11, 20], [10, 20], [9, 20],
     [13, 23], [12, 23], [11, 24], [10, 24], [9, 24]].forEach(function (w) {
      put(g, w[0], w[1] + oy, 'w');
      put(g, 2 * cx - w[0], w[1] + oy, 'w');
    });

    return g;
  }

  /* ---------- lying down, asleep, head on her paws ---------- */
  function buildSleeping(p) {
    var g = new Array(W * H).fill(null);
    var b = p.bob;                    // her back rises and falls

    // long tail, curling up behind her
    var tail = [];
    for (var ti = 0; ti <= 40; ti++) {
      var t = ti / 40, it = 1 - t;
      var P = [[47, 45], [60, 48], [62, 38], [55, 35]];
      tail.push({
        x: it * it * it * P[0][0] + 3 * it * it * t * P[1][0] + 3 * it * t * t * P[2][0] + t * t * t * P[3][0],
        y: it * it * it * P[0][1] + 3 * it * it * t * P[1][1] + 3 * it * t * t * P[2][1] + t * t * t * P[3][1],
        r: 1.9 - 0.7 * t
      });
    }

    stamp(g, function (x, y) {
      for (var i = 0; i < tail.length; i++) {
        var dx = x - tail[i].x, dy = y - tail[i].y;
        if (dx * dx + dy * dy <= tail[i].r * tail[i].r) return true;
      }
      return false;
    }, function (x, y) { return y <= 40 ? 'H' : 'B'; });

    // body, stretched out flat
    stamp(g, function (x, y) { return y <= 47 && inEllipse(x, y, 34, 42, 17, 6.5 + b * 0.6); },
      function (x, y) { return (x - 34) / 17 > 0.7 ? 'D' : 'B'; });

    // cape draped over her like a blanket
    var cape = [[22, 39], [26, 35 - b], [36, 33 - b], [46, 34 - b], [53, 37], [55, 42],
                [51, 45], [46, 43], [40, 44], [34, 43], [28, 43], [23, 42]];
    stamp(g, function (x, y) { return inPoly(x + 0.5, y + 0.5, cape); }, function (x, y) {
      if (y <= 35 - b) return 'L';
      if (x > 27 && (x + y) % 6 === 0) return 'm';
      if (y >= 42) return 'm';
      return 'M';
    });

    // front paws stretched out
    stamp(g, function (x, y) {
      return inEllipse(x, y, 13, 46, 4.2, 1.8) || inEllipse(x, y, 20, 47, 4.2, 1.6);
    }, function () { return 'B'; });
    put(g, 11, 46, 'K'); put(g, 18, 47, 'K');

    // head resting on the paws
    var cx = 20, cy = 37;
    var eL = [[9, 33], [11, 22], [18, 29]], eR = [[31, 33], [29, 22], [22, 29]];
    stamp(g, function (x, y) {
      return inEllipse(x, y, cx, cy, 11, 8.5) ||
        inTri(x + 0.5, y + 0.5, eL[0], eL[1], eL[2]) ||
        inTri(x + 0.5, y + 0.5, eR[0], eR[1], eR[2]);
    }, function (x, y) {
      if (inTri(x + 0.5, y + 0.5, [12, 30], [12, 25], [16, 29])) return 'P';
      if (inTri(x + 0.5, y + 0.5, [28, 30], [28, 25], [24, 29])) return 'P';
      var nx = (x - cx) / 11, ny = (y - cy) / 8.5;
      if (nx + ny < -0.85 && ny > -1.2) return 'H';
      if (ny > 0.8) return 'D';
      return 'B';
    });

    // sleepy face
    pattern(g, 13, 34, EYES.closed);
    pattern(g, 23, 34, EYES.closed);
    for (var bx = 0; bx < 3; bx++) { put(g, 11 + bx, 39, 'C'); put(g, 27 + bx, 39, 'C'); }
    put(g, 19, 39, 'N'); put(g, 20, 39, 'N'); put(g, 21, 39, 'N'); put(g, 20, 40, 'N');
    pattern(g, 18, 41, ['u.u.u', '.u.u.']);
    [[8, 39], [7, 39], [6, 38], [5, 38], [8, 41], [7, 41], [6, 42], [5, 42]].forEach(function (w) {
      put(g, w[0], w[1], 'w');
    });

    return g;
  }

  /* ---------- DOM ---------- */
  var wrap = document.createElement('div');
  wrap.className = 'pet-cat';
  wrap.innerHTML =
    '<div class="pet-bubble" aria-live="polite"></div>' +
    '<canvas class="pet-canvas" width="' + W + '" height="' + H + '" tabindex="0" ' +
      'role="button" aria-haspopup="menu" aria-label="A black pixel cat in a magenta cape"></canvas>' +
    '<div class="pet-actions" role="menu" hidden>' +
      '<button type="button" class="pet-btn" role="menuitem" data-act="pet">&#9825; PET</button>' +
      '<button type="button" class="pet-btn" role="menuitem" data-act="feed">&gt;&lt;&gt; FEED</button>' +
      '<button type="button" class="pet-btn" role="menuitem" data-act="play">@ PLAY</button>' +
    '</div>' +
    '<canvas class="pet-yarn" width="9" height="9" hidden></canvas>';
  document.body.appendChild(wrap);

  var canvas = wrap.querySelector('.pet-canvas');
  var ctx = canvas.getContext('2d');
  var bubble = wrap.querySelector('.pet-bubble');
  var yarn = wrap.querySelector('.pet-yarn');
  var yctx = yarn.getContext('2d');

  /* ---------- sparkles + hearts ---------- */
  var sparkles = [
    { x: 7, y: 12, s: 2, ph: 0 }, { x: 53, y: 9, s: 2, ph: 2 },
    { x: 4, y: 31, s: 1, ph: 3 }, { x: 40, y: 4, s: 0, ph: 2 },
    { x: 28, y: 1, s: 0, ph: 1 }
  ];
  var hearts = [];
  var zs = [];                                    // floating Zzz while she sleeps
  var ZBIG = ['EEEEE', '...E.', '..E..', '.E...', 'EEEEE'];
  var ZSMALL = ['EEE', '..E', '.E.', 'E..', 'EEE'];

  /* ---------- sleep after 2 minutes with no activity ---------- */
  var SLEEP_AFTER = 2 * 60 * 1000;
  var lastActive = Date.now();
  var asleep = false;
  ['mousemove', 'mousedown', 'keydown', 'scroll', 'wheel', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, function () { lastActive = Date.now(); }, { passive: true });
  });

  function drawSparkle(sp, t) {
    var size = Math.max(0, sp.s - [0, 1, 0, 2][(t + sp.ph) % 4] + (sp.s ? 0 : 1));
    if (((t + sp.ph) % 6) === 5) return; // twinkle off
    ctx.fillStyle = PAL.E;
    ctx.fillRect(sp.x, sp.y, 1, 1);
    for (var r = 1; r <= size; r++) {
      ctx.fillRect(sp.x + r, sp.y, 1, 1); ctx.fillRect(sp.x - r, sp.y, 1, 1);
      ctx.fillRect(sp.x, sp.y + r, 1, 1); ctx.fillRect(sp.x, sp.y - r, 1, 1);
    }
  }

  /* ---------- state ---------- */
  var frame = 0;
  var action = null;      // { type, start, len }
  var nextIdle = 25;
  var nextBlink = 18;
  var bubbleTimer = null;

  function say(text, ms) {
    bubble.textContent = text;
    bubble.classList.add('show');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubble.classList.remove('show'); }, ms);
  }

  function start(type, len) { action = { type: type, start: frame, len: len }; }

  function pet() {
    if (action && action.type === 'feed') return;
    start('pet', 16);
    say('purrr~', 2600);
    purr();
  }
  function feed() {
    if (action && (action.type === 'feed' || action.type === 'fed')) return;
    start('feed', 18);
    say('nom nom', 2900);
  }

  /* ---------- play: chase the yarn ball and trot back ---------- */
  var run = null;   // { dist, g } in screen px

  function play() {
    if (action && (action.type === 'feed' || action.type === 'play')) return;
    var g = canvas.offsetWidth / W;                       // screen px per sprite px
    var room = window.innerWidth - wrap.getBoundingClientRect().left - 60 * g - 16;
    run = { g: g, dist: Math.max(0, Math.min(70 * g, room)) };
    start('play', 34);
    say('!!', 900);
  }

  // where she is (x, px) and where the ball is, at step t of the game
  function playState(t) {
    var d = run.dist, g = run.g, p = { x: 0, hop: 0, flip: false, ball: null, phase: 'ready' };
    var home = 61 * g, end = d + 50 * g;
    if (t < 3) {                                   // wiggle, ball appears
      p.ball = home; p.phase = 'ready';
    } else if (t < 13) {                           // chase right
      var k = (t - 3) / 10;
      p.x = d * k; p.flip = true; p.hop = t % 2; p.phase = 'run';
      p.ball = home + (end - home) * Math.min(1, k * 1.15);
    } else if (t < 19) {                           // pounce + catch
      p.x = d; p.flip = true; p.phase = 'catch';
      p.ball = t < 16 ? end : null;
      p.hop = t === 13 ? 2 : 0;
    } else if (t < 29) {                           // trot home
      p.x = d * (1 - (t - 19) / 10); p.hop = t % 2; p.phase = 'run';
    } else {
      p.phase = 'settle';
    }
    return p;
  }

  function drawYarn(spin) {
    var rows = ['..fFFf...', '.FFfFFF..', 'FfFFFfFF.', 'FFFfFFFf.', 'fFFFfFFF.', '.FfFFFfF.', '..FFfF...'];
    yctx.clearRect(0, 0, 9, 9);
    rows.forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) {
        var c = row[(x + spin) % 8] === 'f' ? 'f' : (row[x] === '.' ? null : 'F');
        if (row[x] === '.' || !c) continue;
        yctx.fillStyle = PAL[c];
        yctx.fillRect(x, y + 1, 1, 1);
      }
    });
    yctx.fillStyle = PAL.F;                         // loose thread
    yctx.fillRect(8, 7, 1, 1); yctx.fillRect(7, 8, 1, 1);
  }

  /* ---------- Sims-style menu, beside her ---------- */
  var menu = wrap.querySelector('.pet-actions');

  function openMenu() {
    menu.hidden = false;
    menu.classList.remove('pop');
    void menu.offsetWidth;            // restart the pop animation
    menu.classList.add('pop');
  }
  function closeMenu() { menu.hidden = true; menu.classList.remove('pop'); }

  canvas.addEventListener('click', function (e) {
    e.stopPropagation();
    if (action && action.type === 'play') return;
    if (!menu.hidden) { closeMenu(); return; }
    openMenu();
  });
  canvas.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (action && action.type === 'play') return;
    if (!menu.hidden) { closeMenu(); return; }
    openMenu();
    menu.querySelector('.pet-btn').focus();
  });
  menu.querySelectorAll('.pet-btn').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      closeMenu();
      var act = b.dataset.act;
      act === 'feed' ? feed() : act === 'play' ? play() : pet();
    });
  });
  document.addEventListener('click', function (e) {
    if (!menu.hidden && !menu.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) { closeMenu(); canvas.focus(); }
  });

  /* ---------- soft purr (only ever after a click) ---------- */
  var audio = null;
  function purr() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audio = audio || new AC();
      var a = audio, now = a.currentTime, dur = 2.2;
      var buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
      var data = buf.getChannelData(0), last = 0;
      for (var i = 0; i < data.length; i++) {          // brown-ish rumble
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        data[i] = last * 3.5;
      }
      var src = a.createBufferSource(); src.buffer = buf;
      var lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
      var trem = a.createGain(); trem.gain.value = 0.5;
      var lfo = a.createOscillator(); lfo.frequency.value = 24;
      var lfoAmt = a.createGain(); lfoAmt.gain.value = 0.5;
      lfo.connect(lfoAmt); lfoAmt.connect(trem.gain);
      var out = a.createGain();
      out.gain.setValueAtTime(0.0001, now);
      out.gain.exponentialRampToValueAtTime(0.35, now + 0.25);
      out.gain.setValueAtTime(0.35, now + dur - 0.6);
      out.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.connect(lp); lp.connect(trem); trem.connect(out); out.connect(a.destination);
      src.start(now); lfo.start(now); src.stop(now + dur); lfo.stop(now + dur);
    } catch (e) { /* no sound, no problem */ }
  }

  /* ---------- loop ---------- */
  function pose() {
    var p = {
      bob: Math.floor(frame / 5) % 2,
      cape: (frame >> 1) % 4,
      tail: [-1, 0, 1, 0][(frame >> 2) % 4],
      eyes: 'center', mouth: 'w', fish: -1, blush: false, hop: 0
    };
    if (frame >= nextBlink && frame < nextBlink + 1) p.eyes = 'closed';

    if (action) {
      var t = frame - action.start;
      if (t >= action.len) {
        var done = action.type;
        action = null;
        if (done === 'play') { run = null; wrap.style.transform = ''; canvas.classList.remove('flip'); yarn.hidden = true; }
        if (done === 'feed') start('fed', 7);
      } else {
        switch (action.type) {
          case 'pet':
            p.eyes = 'happy'; p.blush = true;
            if (t % 3 === 0) hearts.push({ x: 18 + Math.floor(Math.random() * 14), y: 8, life: 9 });
            break;
          case 'feed':
            p.fish = Math.min(4, Math.floor(t / 4));
            p.mouth = t % 4 < 2 ? 'open' : 'w';
            p.eyes = t % 4 < 2 ? 'closed' : 'happy';
            if (p.fish >= 4) p.fish = -1;
            break;
          case 'fed':
            p.eyes = 'happy'; p.blush = true;
            if (t === 1) hearts.push({ x: 24, y: 8, life: 9 });
            break;
          case 'look':
            p.eyes = t < action.len / 2 ? 'left' : 'right';
            break;
          case 'play':
            var ps = playState(t);
            p.hop = ps.hop;
            p.cape = frame % 4;
            if (ps.phase === 'ready') { p.eyes = 'right'; p.bob = t % 2; }
            if (ps.phase === 'run') { p.eyes = ps.flip ? 'left' : 'center'; p.bob = 0; }
            if (ps.phase === 'catch') {
              p.eyes = 'happy'; p.blush = true; p.bob = 0;
              if (t === 15) hearts.push({ x: 24, y: 8, life: 9 });
              if (t === 15) say('meooow', 1400);
            }
            if (ps.phase === 'settle') { p.eyes = 'happy'; p.blush = true; }
            break;
          case 'yawn':
            p.eyes = 'closed'; p.mouth = t > 1 && t < action.len - 1 ? 'yawn' : 'open';
            p.cape = 2;
            break;
        }
      }
    }
    return p;
  }

  function tick() {
    frame++;

    var sleepy = !action && Date.now() - lastActive > SLEEP_AFTER;
    if (sleepy && !asleep) { asleep = true; closeMenu(); }
    if (!sleepy && asleep) {                      // waking up: big yawn
      asleep = false; zs = [];
      start('yawn', 9);
      nextIdle = frame + 40;
    }

    if (frame > nextBlink + 1) nextBlink = frame + 18 + Math.floor(Math.random() * 20);
    if (!asleep && !action && frame >= nextIdle) {
      Math.random() < 0.55 ? start('look', 12) : start('yawn', 9);
      nextIdle = frame + 40 + Math.floor(Math.random() * 40);
    }

    var p = pose();
    if (asleep) {
      p.eyes = 'closed'; p.mouth = 'w'; p.blush = true;
      p.bob = Math.floor(frame / 10) % 2;         // slow, deep breaths
      p.cape = 1; p.tail = 0;
      if (frame % 12 === 0) zs.push({ x: 30, y: 18, life: 14 });
    }
    var grid = asleep ? buildSleeping(p) : buildCat(p);
    var lift = [0, 2, 3][p.hop || 0];
    ctx.clearRect(0, 0, W, H);

    // playing: move her across the page and roll the ball
    if (action && action.type === 'play' && run) {
      var ps = playState(frame - action.start), g = run.g;
      wrap.style.transform = 'translateX(' + Math.round(ps.x) + 'px)';
      canvas.classList.toggle('flip', ps.flip);
      if (ps.ball === null) {
        yarn.hidden = true;
      } else {
        yarn.hidden = false;
        yarn.style.width = yarn.style.height = 9 * g + 'px';
        yarn.style.left = Math.round(canvas.offsetLeft + ps.ball - ps.x) + 'px';
        yarn.style.top = Math.round(canvas.offsetTop + 41 * g) + 'px';
        drawYarn(ps.phase === 'run' ? frame % 8 : 0);
      }
    }

    // soft shadow under her
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    for (var y = 47; y <= 51; y++) for (var x = 5; x <= 60; x++) {
      if (asleep ? inEllipse(x, y, 32, 49, 26, 2) : inEllipse(x, y, 33, 49, 24, 2.2)) ctx.fillRect(x, y, 1, 1);
    }

    for (var i = 0; i < grid.length; i++) {
      if (!grid[i]) continue;
      ctx.fillStyle = PAL[grid[i]];
      ctx.fillRect(i % W, ((i / W) | 0) - lift, 1, 1);
    }

    sparkles.forEach(function (sp) { drawSparkle(sp, frame >> 1); });

    hearts = hearts.filter(function (h) { return h.life > 0; });
    hearts.forEach(function (h) {
      HEART.forEach(function (row, ry) {
        for (var rx = 0; rx < row.length; rx++) {
          if (row[rx] === '.') continue;
          ctx.fillStyle = PAL[row[rx]];
          ctx.fillRect(h.x + rx, h.y + ry, 1, 1);
        }
      });
      h.y -= 1; h.life -= 1;
    });

    zs = zs.filter(function (z) { return z.life > 0; });
    zs.forEach(function (z) {
      var spr = z.life > 7 ? ZSMALL : ZBIG;
      ctx.fillStyle = PAL.w;
      spr.forEach(function (row, ry) {
        for (var rx = 0; rx < row.length; rx++) {
          if (row[rx] === 'E') ctx.fillRect(z.x + rx, z.y + ry, 1, 1);
        }
      });
      if (frame % 2 === 0) { z.y -= 1; z.x += z.life % 4 === 0 ? 1 : 0; }
      z.life -= frame % 2 === 0 ? 1 : 0;
    });
  }

  tick();
  setInterval(tick, 150);
})();
