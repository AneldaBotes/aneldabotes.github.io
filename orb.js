// Builds the rainbow orb (originally from Uiverse.io by 20essentials)
// Generates the repeated sphere/item markup in JS instead of hand-writing it in HTML.
(function () {
  var SPHERE_COUNT = 9;
  var ITEM_COUNT = 9;

  function buildOrb(mountId) {
    var mount = document.getElementById(mountId);
    if (!mount) return;

    var container = document.createElement('section');
    container.className = 'container';

    var loader = document.createElement('section');
    loader.className = 'loader';

    for (var s = 0; s < SPHERE_COUNT; s++) {
      var sphere = document.createElement('article');
      sphere.className = 'sphere sphere' + (s + 1);
      sphere.style.setProperty('--rot', s);

      for (var i = 1; i <= ITEM_COUNT; i++) {
        var item = document.createElement('div');
        item.className = 'item';
        item.style.setProperty('--rot-y', i);
        sphere.appendChild(item);
      }

      loader.appendChild(sphere);
    }

    container.appendChild(loader);
    mount.appendChild(container);
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildOrb('rainbow-orb');
  });
})();
