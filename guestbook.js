(function () {
  var list = document.getElementById('guestbook-entries');
  var input = document.querySelector('.guestbook-input');
  var sendBtn = document.querySelector('.guestbook-send');
  var avatarClasses = ['avatar-a', 'avatar-b', 'avatar-c'];
  var STORAGE_KEY = 'cybernaut-guestbook-entries';

  function createEntry(text) {
    var entry = document.createElement('div');
    entry.className = 'guestbook-entry';

    var avatar = document.createElement('div');
    avatar.className = 'guestbook-avatar ' + avatarClasses[Math.floor(Math.random() * avatarClasses.length)];

    var p = document.createElement('p');
    p.className = 'guestbook-entry-text';
    p.textContent = text;

    entry.appendChild(avatar);
    entry.appendChild(p);
    return entry;
  }

  function loadEntries() {
    var saved = [];
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      saved = [];
    }
    saved.forEach(function (text) {
      list.appendChild(createEntry(text));
    });
  }

  function saveEntry(text) {
    var saved = [];
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      saved = [];
    }
    saved.push(text);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }

  function postMessage() {
    var text = input.value.trim();
    if (!text) return;
    list.appendChild(createEntry(text));
    saveEntry(text);
    input.value = '';
    input.focus();
  }

  sendBtn.addEventListener('click', postMessage);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') postMessage();
  });

  loadEntries();
})();
