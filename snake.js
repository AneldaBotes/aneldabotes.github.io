/* Nokia Snake easter egg
   Click the spinning Nokia -> a vintage LCD screen opens with Snake II.
   Self-contained: injects its own CSS and markup.
   Controls: arrows / WASD / 2 4 6 8, 5 or Space = start/pause, Esc = close.
   Phones: swipe on the screen or use the pad underneath. */
(function () {
  var trigger = document.querySelector('.nokia-spin');
  if (!trigger) return;

  /* ---------- styles ---------- */
  var css = `
  .nokia-spin { cursor: pointer; pointer-events: auto; }
  .nokia-stage { z-index: 20; }

  .sn-overlay {
    position: fixed;
    inset: 0;
    z-index: 99998;
    display: none;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 18px;
    background: rgba(0, 0, 20, 0.88);
    padding: 16px;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
  .sn-overlay.open { display: flex; }

  .sn-device {
    position: relative;
    width: min(92vw, 680px);
    padding: 18px;
    background: #141414;
    border-radius: 34px;
    box-shadow:
      inset 0 0 0 3px #2a2a2a,
      inset 0 0 18px rgba(0, 0, 0, 0.9),
      0 0 0 2px #000,
      0 18px 40px rgba(0, 0, 0, 0.6);
  }
  .sn-lcd {
    position: relative;
    background: #9bc20f;
    border-radius: 18px;
    padding: 4.5% 4.5% 5%;
    box-shadow: inset 0 0 30px rgba(40, 60, 0, 0.35);
    overflow: hidden;
  }
  /* faint pixel grid, like a real LCD */
  .sn-lcd::after {
    content: "";
    position: absolute;
    inset: 4.5% 4.5% 5%;
    background-image:
      linear-gradient(to right, rgba(60, 90, 0, 0.13) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(60, 90, 0, 0.13) 1px, transparent 1px);
    background-size: calc(100% / 84) calc(100% / 48);
    pointer-events: none;
  }
  .sn-lcd canvas {
    display: block;
    width: 100%;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    /* the little shadow real LCD pixels cast */
    filter: drop-shadow(2px 2px 0 rgba(40, 60, 0, 0.22));
  }

  .sn-close {
    position: absolute;
    top: -14px;
    right: -14px;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 2px solid #9bc20f;
    background: #141414;
    color: #9bc20f;
    font-family: 'Press Start 2P', monospace;
    font-size: 12px;
    cursor: pointer;
  }
  .sn-close:hover { background: #9bc20f; color: #141414; }

  /* touch pad: only on phones/tablets */
  .sn-pad { display: none; }
  @media (pointer: coarse) {
    .sn-close { top: 4px; right: 4px; width: 30px; height: 30px; font-size: 10px; }
    .sn-pad {
      display: grid;
      grid-template-columns: repeat(3, 64px);
      grid-template-rows: repeat(3, 56px);
      gap: 6px;
    }
    .sn-pad button {
      border: none;
      border-radius: 12px;
      background: #2a2a2a;
      color: #9bc20f;
      font-family: 'Press Start 2P', monospace;
      font-size: 14px;
      box-shadow: inset 0 -4px 0 rgba(0, 0, 0, 0.5);
    }
    .sn-pad button:active { transform: translateY(2px); box-shadow: none; }
    .sn-pad .up { grid-column: 2; grid-row: 1; }
    .sn-pad .left { grid-column: 1; grid-row: 2; }
    .sn-pad .mid { grid-column: 2; grid-row: 2; font-size: 10px; }
    .sn-pad .right { grid-column: 3; grid-row: 2; }
    .sn-pad .down { grid-column: 2; grid-row: 3; }
  }
  `;
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- markup ---------- */
  var overlay = document.createElement('div');
  overlay.className = 'sn-overlay';
  overlay.innerHTML =
    '<div class="sn-device">' +
      '<button class="sn-close" aria-label="Close">X</button>' +
      '<div class="sn-lcd"><canvas width="84" height="48"></canvas></div>' +
    '</div>' +
    '<div class="sn-pad">' +
      '<button class="up" data-k="2">▲</button>' +
      '<button class="left" data-k="4">◀</button>' +
      '<button class="mid" data-k="5">5</button>' +
      '<button class="right" data-k="6">▶</button>' +
      '<button class="down" data-k="8">▼</button>' +
    '</div>';
  document.body.appendChild(overlay);

  var canvas = overlay.querySelector('canvas');
  var isTouch = window.matchMedia('(pointer: coarse)').matches;
  var START_MSG = isTouch ? 'TAP TO PLAY' : 'PRESS 5';
  if (isTouch) overlay.querySelector('.sn-pad .mid').textContent = 'II';
  var ctx = canvas.getContext('2d');
  var BG = '#9bc20f';
  var INK = '#101a00';

  /* ---------- layout (real Nokia 84x48 screen) ----------
     rows 1-5: score + level, row 7: line, rows 9-47: bordered field */
  var CELL = 4;
  var COLS = 20, ROWS = 9;
  var FX = 2, FY = 11;           // top-left pixel of the playfield

  /* ---------- pixel fonts ---------- */
  // chunky 4x5 digits for the score bar
  var DIGITS = {
    '0': '0110100110011001' + '0110', '1': '0010011000100010' + '0111',
    '2': '1110000100100100' + '1111', '3': '1110000101100001' + '1110',
    '4': '0011010110011111' + '0001', '5': '1111100011100001' + '1110',
    '6': '0111100011101001' + '0110', '7': '1111000100100100' + '0100',
    '8': '0110100101101001' + '0110', '9': '0110100101110001' + '1110'
  };
  function drawDigits(str, x, y) {
    ctx.fillStyle = INK;
    for (var i = 0; i < str.length; i++) {
      var g = DIGITS[str[i]];
      for (var p = 0; p < 20; p++) {
        if (g[p] === '1') ctx.fillRect(x + i * 5 + (p % 4), y + Math.floor(p / 4), 1, 1);
      }
    }
  }
  // small 3x5 letters for messages
  var FONT = {
    A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',
    E:'111100110100111',F:'111100110100100',G:'011100101101011',H:'101101111101101',
    I:'111010010010111',K:'101101110101101',L:'100100100100111',M:'101111111101101',
    N:'110101101101101',O:'010101101101010',P:'110101110100100',R:'110101110101101',
    S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',
    W:'101101111111101',Y:'101101010010010',X:'101101010101101',
    '0':'111101101101111','1':'010110010010111','2':'110001010100111','3':'110001010001110',
    '4':'101101111001001','5':'111100110001110','6':'011100111101111','7':'111001010010010',
    '8':'111101111101111','9':'111101111001110',' ':'000000000000000','!':'010010010000010',
    ':':'000010000010000'
  };
  function text(str, y) {
    var x = Math.round((84 - (str.length * 4 - 1)) / 2);
    ctx.fillStyle = INK;
    for (var i = 0; i < str.length; i++) {
      var g = FONT[str[i]] || FONT[' '];
      for (var p = 0; p < 15; p++) {
        if (g[p] === '1') ctx.fillRect(x + i * 4 + (p % 3), y + Math.floor(p / 3), 1, 1);
      }
    }
  }

  /* ---------- snake sprites (4x4, drawn facing right) ----------
     rotated for other directions; the offset rows give the
     textured, slightly zig-zag body from the original game */
  var SPR = {
    straight: ['0000', '1110', '0111', '0000'],
    head:     ['0010', '1111', '1110', '0000'],   // body is to the left
    headOpen: ['0101', '1110', '1100', '0011'],   // mouth open near food
    tail:     ['0000', '0011', '0111', '0000']    // body is to the right
  };
  function rotate(p, times) {
    for (var t = 0; t < times; t++) {
      var n = [];
      for (var r = 0; r < 4; r++) {
        var row = '';
        for (var c = 0; c < 4; c++) row += p[3 - c][r];
        n.push(row);
      }
      p = n;
    }
    return p;
  }
  function stamp(p, x, y) {
    for (var r = 0; r < 4; r++)
      for (var c = 0; c < 4; c++)
        if (p[r][c] === '1') ctx.fillRect(x + c, y + r, 1, 1);
  }
  // direction from a to b, handling wrap-around: 0 right, 1 down, 2 left, 3 up
  function dirTo(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y;
    if (dx > 1) dx = -1; if (dx < -1) dx = 1;
    if (dy > 1) dy = -1; if (dy < -1) dy = 1;
    if (dx === 1) return 0;
    if (dy === 1) return 1;
    if (dx === -1) return 2;
    return 3;
  }

  /* ---------- game state ---------- */
  var state = 'menu';
  var snake, dir, queue, food, score, level, eaten, tickMs, timer, blink = 0;
  var best = 0;
  try { best = parseInt(localStorage.getItem('snakeBest'), 10) || 0; } catch (e) {}

  /* ---------- sound ---------- */
  var audio = null;
  function beep(freq, len) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var o = audio.createOscillator(), g = audio.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.value = 0.04;
      o.connect(g); g.connect(audio.destination);
      o.start();
      o.stop(audio.currentTime + len);
    } catch (e) {}
  }

  /* ---------- drawing ---------- */
  function pad(n, len) { return ('0000' + n).slice(-len); }

  function frame() {
    ctx.clearRect(0, 0, 84, 48);   // transparent, so only the pixels cast a shadow
    ctx.fillStyle = INK;
    // score bar
    drawDigits(pad(score || 0, 4), 1, 1);
    drawDigits(pad(level || 1, 2), 74, 1);
    ctx.fillRect(0, 7, 84, 1);
    // playfield border
    ctx.fillRect(0, 9, 84, 1);
    ctx.fillRect(0, 47, 84, 1);
    ctx.fillRect(0, 9, 1, 39);
    ctx.fillRect(83, 9, 1, 39);
  }

  function drawSnake() {
    ctx.fillStyle = INK;
    var nearFood = Math.abs(snake[0].x - food.x) + Math.abs(snake[0].y - food.y) === 1;
    for (var i = 0; i < snake.length; i++) {
      var s = snake[i];
      var x = FX + s.x * CELL, y = FY + s.y * CELL;
      if (i === 0) {
        var facing = dirTo(snake[1], s);
        stamp(rotate(nearFood ? SPR.headOpen : SPR.head, facing), x, y);
      } else if (i === snake.length - 1) {
        stamp(rotate(SPR.tail, dirTo(s, snake[i - 1])), x, y);
      } else {
        var a = dirTo(s, snake[i - 1]), b = dirTo(s, snake[i + 1]);
        if (a % 2 === b % 2) {
          stamp(rotate(SPR.straight, a % 2), x, y);
        } else {
          // corner: 2x2 core plus arms toward both neighbours
          ctx.fillRect(x + 1, y + 1, 2, 2);
          [a, b].forEach(function (d) {
            if (d === 0) ctx.fillRect(x + 3, y + 1, 1, 2);
            if (d === 1) ctx.fillRect(x + 1, y + 3, 2, 1);
            if (d === 2) ctx.fillRect(x, y + 1, 1, 2);
            if (d === 3) ctx.fillRect(x + 1, y, 2, 1);
          });
        }
      }
    }
  }

  function drawFood() {
    ctx.fillStyle = INK;
    var x = FX + food.x * CELL, y = FY + food.y * CELL;
    ctx.fillRect(x + 1, y, 1, 1);
    ctx.fillRect(x, y + 1, 1, 1);
    ctx.fillRect(x + 2, y + 1, 1, 1);
    ctx.fillRect(x + 1, y + 2, 1, 1);
  }

  function box(x, y, w, h) {
    ctx.fillStyle = BG;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = INK;
    ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
  }

  function render() {
    frame();
    if (state === 'menu') {
      text('SNAKE II', 16);
      text('BEST: ' + best, 25);
      if (blink % 2 === 0) text(START_MSG, 36);
      return;
    }
    drawFood();
    drawSnake();
    if (state === 'paused') {
      box(22, 22, 40, 11);
      text('PAUSED', 25);
    }
    if (state === 'over') {
      box(8, 13, 68, 31);
      text('GAME OVER!', 17);
      text('SCORE: ' + score, 25);
      if (blink % 2 === 0) text(START_MSG, 34);
    }
  }

  /* ---------- logic ---------- */
  function placeFood() {
    var f;
    do {
      f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some(function (s) { return s.x === f.x && s.y === f.y; }));
    food = f;
  }

  function start() {
    snake = [{ x: 8, y: 4 }, { x: 7, y: 4 }, { x: 6, y: 4 }, { x: 5, y: 4 }, { x: 4, y: 4 }];
    dir = { x: 1, y: 0 };
    queue = [];
    score = 0;
    level = 1;
    eaten = 0;
    tickMs = 200;
    placeFood();
    state = 'playing';
    loop();
  }

  function loop() {
    clearTimeout(timer);
    if (state !== 'playing') return;
    step();
    render();
    if (state === 'playing') timer = setTimeout(loop, tickMs);
  }

  function step() {
    if (queue.length) dir = queue.shift();
    var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    // Snake II: walls wrap around
    if (head.x < 0) head.x = COLS - 1;
    if (head.x >= COLS) head.x = 0;
    if (head.y < 0) head.y = ROWS - 1;
    if (head.y >= ROWS) head.y = 0;

    var eating = head.x === food.x && head.y === food.y;
    var body = eating ? snake : snake.slice(0, -1);
    if (body.some(function (s) { return s.x === head.x && s.y === head.y; })) {
      gameOver();
      return;
    }
    snake.unshift(head);
    if (eating) {
      eaten++;
      score += level;               // more points at higher levels, like the original
      beep(1500, 0.04);
      if (eaten % 5 === 0 && level < 9) {
        level++;
        tickMs = Math.max(70, tickMs - 15);
      }
      if (snake.length >= COLS * ROWS) { gameOver(); return; }
      placeFood();
    } else {
      snake.pop();
    }
  }

  function gameOver() {
    state = 'over';
    clearTimeout(timer);
    beep(160, 0.45);
    if (score > best) {
      best = score;
      try { localStorage.setItem('snakeBest', best); } catch (e) {}
    }
    render();
  }

  function turn(x, y) {
    if (state !== 'playing') return;
    var last = queue.length ? queue[queue.length - 1] : dir;
    if ((last.x === -x && last.y === -y) || (last.x === x && last.y === y)) return;
    if (queue.length < 3) queue.push({ x: x, y: y });
  }

  function press(k) {
    if (k === '2') turn(0, -1);
    else if (k === '8') turn(0, 1);
    else if (k === '4') turn(-1, 0);
    else if (k === '6') turn(1, 0);
    else if (k === '5') {
      beep(900, 0.03);
      if (state === 'menu' || state === 'over') start();
      else if (state === 'playing') { state = 'paused'; clearTimeout(timer); render(); }
      else if (state === 'paused') { state = 'playing'; loop(); }
    }
  }

  /* ---------- open / close ---------- */
  function open() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    state = 'menu';
    score = 0; level = 1;
    render();
  }
  function close() {
    if (state === 'playing') state = 'paused';
    clearTimeout(timer);
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  trigger.addEventListener('click', open);
  overlay.querySelector('.sn-close').addEventListener('click', close);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

  var KEYS = {
    ArrowUp: '2', ArrowDown: '8', ArrowLeft: '4', ArrowRight: '6',
    w: '2', s: '8', a: '4', d: '6', W: '2', S: '8', A: '4', D: '6',
    '2': '2', '8': '8', '4': '4', '6': '6', '5': '5', ' ': '5', Enter: '5'
  };
  document.addEventListener('keydown', function (e) {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') { close(); return; }
    var k = KEYS[e.key];
    if (!k) return;
    e.preventDefault();             // stop arrows/space scrolling the page
    press(k);
  });

  overlay.querySelectorAll('.sn-pad button').forEach(function (b) {
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); press(b.dataset.k); });
  });

  // swipe on the screen; tap = 5
  var sx = 0, sy = 0;
  canvas.addEventListener('touchstart', function (e) {
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  canvas.addEventListener('touchend', function (e) {
    e.preventDefault();             // stops the tap also firing a click below
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) { press('5'); return; }
    if (Math.abs(dx) > Math.abs(dy)) press(dx > 0 ? '6' : '4');
    else press(dy > 0 ? '8' : '2');
  });

  // mouse click on the screen works like 5 too
  canvas.addEventListener('click', function () { press('5'); });

  setInterval(function () {
    blink++;
    if (overlay.classList.contains('open') && (state === 'menu' || state === 'over')) render();
  }, 500);
})();
