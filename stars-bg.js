// Generates random star positions for the starfield background
// (originally from Uiverse.io by amir_6539, which hardcoded every star's
// x/y as a box-shadow value — here we generate the same effect at random on load).
(function () {
  var FIELD_SIZE = 2000; // matches the 2000px loop height in the CSS animation

  function randomShadows(count) {
    var shadows = [];
    for (var i = 0; i < count; i++) {
      var x = Math.floor(Math.random() * FIELD_SIZE);
      var y = Math.floor(Math.random() * FIELD_SIZE);
      shadows.push(x + 'px ' + y + 'px #fff');
    }
    return shadows.join(', ');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var stars = document.getElementById('stars');
    if (!stars) return; // starfield isn't on this page

    stars.style.setProperty('--stars-shadow', randomShadows(700));
    document.getElementById('stars2').style.setProperty('--stars2-shadow', randomShadows(200));
    document.getElementById('stars3').style.setProperty('--stars3-shadow', randomShadows(100));
  });
})();
