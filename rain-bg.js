/* Pixel rain — falls when the happy/sad toggle is switched to sad */
(function () {
  var checkbox = document.querySelector('.main-checkbox');
  if (!checkbox) return;

  // settings you can tweak
  var PIXEL = 3;            // size of one "pixel" in the rain
  var GROUND_OFFSET = 52;   // drops splash on top of the taskbar (52px tall)
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MAX_DROPS = reduceMotion ? 30 : 110;
  var colors = ['#00ffff', '#7fdcff', '#b8f3ff'];

  var canvas = document.createElement('canvas');
  canvas.className = 'rain-bg';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var drops = [];
  var splashes = [];
  var intensity = 0;
  var target = 0;
  var running = false;
  var w = 0, h = 0;

  function snap(v) { return Math.round(v / PIXEL) * PIXEL; }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function makeDrop() {
    return {
      x: Math.random() * w,
      y: -Math.random() * h,
      len: (Math.floor(Math.random() * 3) + 2) * PIXEL,
      speed: (reduceMotion ? 3 : 6) + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0.4 + Math.random() * 0.5
    };
  }

  function addSplash(x, y, color) {
    for (var k = -1; k <= 1; k += 2) {
      splashes.push({
        x: x, y: y,
        vx: k * (0.8 + Math.random()),
        vy: -1.5 - Math.random() * 1.5,
        life: 14, color: color
      });
    }
  }

  function frame() {
    intensity += (target - intensity) * 0.03;
    var wanted = Math.round(MAX_DROPS * intensity);
    while (drops.length < wanted) drops.push(makeDrop());

    ctx.clearRect(0, 0, w, h);
    var ground = h - GROUND_OFFSET;

    for (var i = drops.length - 1; i >= 0; i--) {
      var d = drops[i];
      d.y += d.speed;
      if (d.y + d.len > ground) {
        if (Math.random() < 0.5) addSplash(d.x, ground - PIXEL, d.color);
        if (drops.length > wanted) { drops.splice(i, 1); continue; }
        d.x = Math.random() * w;
        d.y = -d.len - Math.random() * 120;
      }
      ctx.globalAlpha = d.alpha;
      ctx.fillStyle = d.color;
      ctx.fillRect(snap(d.x), snap(d.y), PIXEL, d.len);
    }

    for (var j = splashes.length - 1; j >= 0; j--) {
      var s = splashes[j];
      s.x += s.vx;
      s.vy += 0.25;
      s.y += s.vy;
      s.life--;
      if (s.life <= 0) { splashes.splice(j, 1); continue; }
      ctx.globalAlpha = s.life / 14;
      ctx.fillStyle = s.color;
      ctx.fillRect(snap(s.x), snap(s.y), PIXEL, PIXEL);
    }
    ctx.globalAlpha = 1;

    if (target === 0 && drops.length === 0 && splashes.length === 0) {
      running = false;
      ctx.clearRect(0, 0, w, h);
      return;
    }
    requestAnimationFrame(frame);
  }

  function setRain(on) {
    target = on ? 1 : 0;
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  }

  window.addEventListener('resize', resize);
  resize();
  checkbox.addEventListener('change', function () { setRain(checkbox.checked); });
  if (checkbox.checked) setRain(true);
})();
