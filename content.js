/* =========================================================
   content.js — the Content Control Deck
   1. Local time (Ho Chi Minh City) + stardate in the title
   2. Blinking indicator lights next to the readouts
   3. Type in the box to preview the Cybersigil font
   4. A random mood on the status panel
   ========================================================= */
(function () {
  /* ---------- 1. clock + stardate ---------- */
  var clock = document.getElementById('clock');
  var stardate = document.getElementById('stardate');

  function tick() {
    var now = new Date();
    if (clock) {
      clock.textContent = now.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit'
      });
    }
    if (stardate) {
      // year + day of the year, e.g. 2026.296
      var start = Date.UTC(now.getUTCFullYear(), 0, 0);
      var day = Math.floor((now - start) / 86400000);
      stardate.textContent = 'STARDATE ' + now.getUTCFullYear() + '.' + String(day).padStart(3, '0');
    }
  }
  tick();
  setInterval(tick, 10000);

  /* ---------- 2. blinking lights ---------- */
  var COLOURS = ['var(--red)', 'var(--amber)', 'var(--teal)', 'var(--mauve)', 'var(--lilac)', 'var(--cream)'];
  document.querySelectorAll('.lights').forEach(function (cell) {
    for (var i = 0; i < 3; i++) {
      var light = document.createElement('i');
      light.style.background = COLOURS[Math.floor(Math.random() * COLOURS.length)];
      light.style.setProperty('--b', (2 + Math.random() * 4).toFixed(1) + 's');
      light.style.setProperty('--d', (-Math.random() * 4).toFixed(1) + 's');
      cell.appendChild(light);
    }
  });

  /* ---------- 3. type to preview the font ---------- */
  var input = document.getElementById('fontInput');
  var sample = document.getElementById('fontSample');
  if (input && sample) {
    var fallback = sample.textContent;
    input.addEventListener('input', function () {
      sample.textContent = input.value.trim() ? input.value : fallback;
    });
  }

  /* ---------- 4. mood of the day ---------- */
  var MOODS = ['DREAMY', 'GLITCHY', 'NOSTALGIC', 'CAFFEINATED', 'SPARKLY', 'IN ORBIT', 'BUFFERING'];
  var mood = document.getElementById('mood');
  if (mood) mood.textContent = MOODS[Math.floor(Math.random() * MOODS.length)];
})();
