// Generates the pixel-art heart grid (originally hand-written as 143 individual
// <div> elements). The pattern below encodes the same shape compactly:
// . = empty, P = pink, S = soft-pink, W = white
(function () {
  var PATTERN = [
    "..PPP...PPP..",
    ".PSSSP.PSSSP.",
    "PSSWWSPSWWSSP",
    "PSWWWWSWWWWSP",
    "PSWWWWWWWWWSP",
    ".PSWWWWWWWSP.",
    "..PSWWWWWSP..",
    "...PSWWWSP...",
    "....PSWSP....",
    ".....PSP.....",
    "......P......"
  ];

  var CLASS_MAP = {
    '.': '',
    'P': 'pink',
    'S': 'soft-pink',
    'W': 'white'
  };

  function buildHeart(mountId) {
    var mount = document.getElementById(mountId);
    if (!mount) return;

    var heart = document.createElement('div');
    heart.className = 'heart';

    PATTERN.forEach(function (row) {
      row.split('').forEach(function (code) {
        var pixel = document.createElement('div');
        pixel.className = 'pixel' + (CLASS_MAP[code] ? ' ' + CLASS_MAP[code] : '');
        heart.appendChild(pixel);
      });
    });

    mount.appendChild(heart);
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildHeart('glowing-heart');
  });
})();
