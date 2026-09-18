// Generates the Matrix rain columns (originally 5 hardcoded blocks of 40
// <div>s each, plus 40 hand-written CSS rules for position/timing).
// Here the column count adapts to the actual page width instead of being
// locked to a fixed 5000px layout.
(function () {
  var COLUMN_SPACING = 25; // px between columns, matches the original's spacing

  var CHAR_SETS = [
    "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン123456789",
    "ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポヴァィゥェォャュョッABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "アカサタナハマヤラワイキシチニヒミリウクスツヌフムユルエケセテネヘメレオコソトノホモヨロヲン0987654321",
    "ンヲロヨモホノトソコオレメヘネテセケエルユムフヌツスクウリミヒニチシキイワラヤマハナタサカア",
    "ガザダバパギジヂビピグズヅブプゲゼデベペゴゾドボポヴァィゥェォャュョッ!@#$%^&*()_+-=[]{}|;:,.<>?"
  ];

  function randomBetween(min, max) {
    return (Math.random() * (max - min) + min);
  }

  function buildMatrix(mountId) {
    var mount = document.getElementById(mountId);
    if (!mount) return;

    mount.innerHTML = ''; // clear before rebuilding (e.g. on resize)

    var columnCount = Math.ceil(window.innerWidth / COLUMN_SPACING) + 2;

    for (var i = 0; i < columnCount; i++) {
      var col = document.createElement('div');
      col.className = 'matrix-column';
      col.style.left = (i * COLUMN_SPACING) + 'px';
      col.style.animationDelay = '-' + randomBetween(1.5, 4).toFixed(1) + 's';
      col.style.animationDuration = randomBetween(2.3, 4.5).toFixed(1) + 's';
      col.setAttribute('data-chars', CHAR_SETS[Math.floor(Math.random() * CHAR_SETS.length)]);
      mount.appendChild(col);
    }
  }

  var resizeTimer;
  function scheduleRebuild() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      buildMatrix('matrix-bg');
    }, 300);
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildMatrix('matrix-bg');
  });

  window.addEventListener('resize', scheduleRebuild);
})();
