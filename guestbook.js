(function () {
  var API = 'https://guestbook-api.botesanelda.workers.dev';
  var list = document.getElementById('guestbook-entries');
  var input = document.querySelector('.guestbook-input');
  var sendBtn = document.querySelector('.guestbook-send');
  var avatarClasses = ['avatar-a', 'avatar-b', 'avatar-c'];

  function createEntry(text, index) {
    var entry = document.createElement('div');
    entry.className = 'guestbook-entry';

    var avatar = document.createElement('div');
    avatar.className = 'guestbook-avatar ' + avatarClasses[index % avatarClasses.length];

    var p = document.createElement('p');
    p.className = 'guestbook-entry-text';
    p.textContent = text;

    entry.appendChild(avatar);
    entry.appendChild(p);
    return entry;
  }

  function render(entries) {
    if (!Array.isArray(entries)) return;
    list.innerHTML = '';
    entries.forEach(function (e, i) {
      list.appendChild(createEntry(e.text, i));
    });
  }

  function loadEntries() {
    fetch(API)
      .then(function (r) { return r.json(); })
      .then(render)
      .catch(function () {});
  }

  function postMessage() {
    var text = input.value.trim();
    if (!text) return;
    sendBtn.disabled = true;
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    })
      .then(function (r) { return r.json(); })
      .then(function (entries) {
        render(entries);
        input.value = '';
      })
      .catch(function () {
        alert('could not send, try again');
      })
      .then(function () {
        sendBtn.disabled = false;
        input.focus();
      });
  }

  sendBtn.addEventListener('click', postMessage);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') postMessage();
  });

  loadEntries();
})();
