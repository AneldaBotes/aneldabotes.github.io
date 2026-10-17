/* =========================================================
   gallery.js — surveillance wall
   Turns each .gallery-tile into a camera feed (CAM number,
   REC dot, place name from the image's alt text, live clock),
   glitches a random feed now and then, and runs the lightbox.
   To add a photo: just add another .gallery-tile in the HTML.
   ========================================================= */
(function () {
  var tiles = Array.prototype.slice.call(document.querySelectorAll('.gallery-tile'));
  var overlay = document.getElementById('lightboxOverlay');
  var lbImg = document.getElementById('lightboxImage');
  var closeBtn = document.getElementById('lightboxClose');
  var lbId = document.getElementById('lightboxCam');
  var lbPlace = document.getElementById('lightboxPlace');
  var lbTime = document.getElementById('lightboxTime');
  var count = document.getElementById('feedCount');
  var hudClock = document.getElementById('hudClock');

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function clock() {
    var d = new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }
  function fullStamp() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + clock();
  }

  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (count) count.textContent = tiles.length;

  /* ---------- build the camera overlay on each tile ---------- */
  tiles.forEach(function (tile, i) {
    var img = tile.querySelector('img');
    var cam = 'CAM_' + pad(i + 1);
    var place = (img.getAttribute('alt') || 'UNKNOWN').toUpperCase();

    var hud = document.createElement('div');
    hud.className = 'cam-hud';
    hud.innerHTML =
      '<span class="cam-id">' + cam + '</span>' +
      '<span class="cam-rec">REC</span>' +
      '<span class="cam-place"></span>' +
      '<span class="cam-time"></span>';
    hud.querySelector('.cam-place').textContent = place;
    tile.appendChild(hud);

    tile.setAttribute('tabindex', '0');
    tile.setAttribute('role', 'button');
    tile.setAttribute('aria-label', cam + ', ' + place + ', open feed');

    function markBroken() { tile.classList.add('no-signal'); }
    img.addEventListener('error', markBroken);
    if (img.complete && img.naturalWidth === 0) markBroken();

    function open() { openFeed(img.getAttribute('src'), img.getAttribute('alt'), cam, place); }
    tile.addEventListener('click', open);
    tile.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  /* ---------- clocks ---------- */
  var times = document.querySelectorAll('.gallery-tile .cam-time');
  function tickClock() {
    var t = clock();
    for (var i = 0; i < times.length; i++) times[i].textContent = t;
    if (lbTime) lbTime.textContent = fullStamp();
    if (hudClock) hudClock.textContent = fullStamp();
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ---------- random glitch ---------- */
  if (!calm && tiles.length) {
    setInterval(function () {
      var t = tiles[Math.floor(Math.random() * tiles.length)];
      t.classList.add('glitch');
      setTimeout(function () { t.classList.remove('glitch'); }, 400);
    }, 2600);
  }

  /* ---------- lightbox ---------- */
  var lastFocus = null;

  function openFeed(src, alt, cam, place) {
    lastFocus = document.activeElement;
    lbImg.src = src;
    lbImg.alt = alt || '';
    lbId.textContent = cam;
    lbPlace.textContent = place;
    tickClock();
    overlay.classList.add('active');
    closeBtn.focus();
  }

  function closeFeed() {
    overlay.classList.remove('active');
    lbImg.src = '';
    if (lastFocus) lastFocus.focus();
  }

  closeBtn.addEventListener('click', closeFeed);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeFeed();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeFeed();
  });
})();
