/* Thirst-trap easter egg
   Adds a tiny "exclusive content" link to the left of the self-portrait.
   Click -> fake age verification -> BSOD "unauthorized access" -> "jk lol" screen.
   Self-contained: injects its own CSS. Needs an element with class "self-portrait". */
(function () {
  var portrait = document.querySelector('.self-portrait');
  if (!portrait) return;

  /* ---------- styles ---------- */
  var css = `
  .tt-bait {
    font-family: 'VT323', monospace;
    font-size: 0.95rem;
    color: #ff9fe0;
    opacity: 0.75;
    text-decoration: underline dotted;
    white-space: nowrap;
    z-index: 4;
  }
  .tt-bait:hover { opacity: 1; color: #ff1ab3; }

  .tt-overlay {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 51, 0.85);
    font-family: 'VT323', monospace;
  }

  /* stage 1: age verification window */
  .tt-win {
    width: 320px;
    max-width: 90vw;
    background: #c0c0c0;
    border: 3px solid #ffffff;
    border-right-color: #404040;
    border-bottom-color: #404040;
    box-shadow: 6px 6px 0 #ff1ab3;
  }
  .tt-title {
    background: #000080;
    color: #ffffff;
    font-family: 'Press Start 2P', cursive;
    font-size: 0.55rem;
    padding: 6px 8px;
  }
  .tt-winbody { padding: 16px; color: #000000; font-size: 1.2rem; }
  .tt-overlay .tt-status { margin: 0 0 10px; min-height: 1.5em; color: #000000 !important; }
  .tt-bar {
    height: 22px;
    background: #ffffff;
    border: 2px solid #404040;
    border-right-color: #ffffff;
    border-bottom-color: #ffffff;
    padding: 2px;
  }
  .tt-fill {
    height: 100%;
    width: 0;
    background: repeating-linear-gradient(90deg, #000080 0 12px, transparent 12px 15px);
    animation: tt-load 3s steps(14) forwards;
  }
  @keyframes tt-load { to { width: 100%; } }

  /* stage 2: BSOD */
  .tt-bsod {
    position: fixed;
    inset: 0;
    background: #0000aa;
    color: #ffffff;
    font-size: 1.5rem;
    line-height: 1.4;
    padding: 8vh 10vw;
    cursor: none;
  }
  .tt-bsod-head { text-align: center; margin-bottom: 28px; }
  .tt-bsod-head span { background: #aaaaaa; color: #0000aa; padding: 0 12px; }
  .tt-bsod p { margin: 0 0 8px; max-width: 760px; }
  .tt-bsod .tt-gap { margin-bottom: 28px; }
  .tt-cursor { animation: tt-blink 1s steps(1) infinite; }
  @keyframes tt-blink { 50% { visibility: hidden; } }

  /* stage 3: jk lol */
  .tt-jk {
    position: fixed;
    inset: 0;
    background: #000099;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 22px;
    text-align: center;
    padding: 20px;
  }
  .tt-jk h2 {
    font-family: 'Press Start 2P', cursive;
    font-size: 2.2rem;
    color: #ff1ab3;
    text-shadow: 4px 4px 0 #00ffff;
    margin: 0;
  }
  .tt-jk p { color: #00ffff; font-size: 1.8rem; margin: 0; }
  .tt-back {
    font-family: 'Press Start 2P', cursive;
    font-size: 0.65rem;
    background: #ff1ab3;
    color: #ffffff;
    border: 3px solid #00ffff;
    box-shadow: 3px 3px 0 #ffffff;
    padding: 10px 16px;
  }
  .tt-back:active { box-shadow: none; transform: translate(3px, 3px); }
  .tt-btnrow { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
  .tt-selfie-btn { background: #00ffff; color: #000033; border-color: #ff1ab3; }

  /* selfie webcam window */
  .tt-cam {
    width: 360px;
    max-width: 92vw;
    background: #c0c0c0;
    border: 3px solid #ffffff;
    border-right-color: #404040;
    border-bottom-color: #404040;
    box-shadow: 6px 6px 0 #ff1ab3;
  }
  .tt-cam-title {
    background: #000080;
    color: #ffffff;
    font-family: 'Press Start 2P', cursive;
    font-size: 0.55rem;
    padding: 6px 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .tt-rec { color: #ff3b3b; animation: tt-blink 1s steps(1) infinite; }
  .tt-cam-body { padding: 10px; text-align: center; }
  .tt-cam canvas {
    width: 100%;
    display: block;
    background: #000;
    border: 2px solid #404040;
    border-right-color: #ffffff;
    border-bottom-color: #ffffff;
    image-rendering: pixelated;
  }
  .tt-overlay .tt-cam-msg { color: #000000 !important; font-size: 1.2rem; margin: 8px 0; min-height: 1.4em; }
  .tt-cam-btns { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
  .tt-cam-btns button {
    font-family: 'VT323', monospace;
    font-size: 1.1rem;
    background: #c0c0c0;
    border: 2px solid #ffffff;
    border-right-color: #404040;
    border-bottom-color: #404040;
    padding: 3px 14px;
  }
  .tt-cam-btns button:active { border-color: #404040 #ffffff #ffffff #404040; }
  .tt-count {
    position: absolute;
    font-family: 'Press Start 2P', cursive;
    font-size: 3rem;
    color: #ff1ab3;
    text-shadow: 3px 3px 0 #00ffff;
  }
  `;
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- the bait link ---------- */
  var bait = document.createElement('a');
  bait.href = '#';
  bait.className = 'tt-bait';
  bait.textContent = '🔞 my exclusive content';
  document.body.appendChild(bait);

  // sits to the left of the portrait, about halfway down
  function placeBait() {
    var r = portrait.getBoundingClientRect();
    var isFixed = getComputedStyle(portrait).position === 'fixed';
    bait.style.position = isFixed ? 'fixed' : 'absolute';
    var sx = isFixed ? 0 : window.scrollX;
    var sy = isFixed ? 0 : window.scrollY;
    bait.style.top = (r.top + sy + r.height * 0.6) + 'px';
    bait.style.left = (r.left + sx - bait.offsetWidth - 8) + 'px';
  }
  placeBait();
  portrait.addEventListener('load', placeBait);
  window.addEventListener('resize', placeBait);

  /* ---------- the prank ---------- */
  var overlay = null;

  function beep() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 220;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) { /* no sound, no problem */ }
  }

  function showAgeCheck() {
    overlay = document.createElement('div');
    overlay.className = 'tt-overlay';
    overlay.innerHTML =
      '<div class="tt-win">' +
        '<div class="tt-title">AGE_VERIFY.exe</div>' +
        '<div class="tt-winbody">' +
          '<p class="tt-status">Verifying age...</p>' +
          '<div class="tt-bar"><div class="tt-fill"></div></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    var lines = [
      'Verifying age...',
      'Scanning for grey hairs...',
      'Checking birth certificate...',
      'Calling your mom...',
      'Hmm. Suspicious...'
    ];
    var status = overlay.querySelector('.tt-status');
    var i = 0;
    var timer = setInterval(function () {
      i++;
      if (i < lines.length) status.textContent = lines[i];
    }, 600);

    setTimeout(function () {
      clearInterval(timer);
      showBSOD();
    }, 3200);
  }

  function showBSOD() {
    overlay.innerHTML =
      '<div class="tt-bsod">' +
        '<div class="tt-bsod-head"><span>UNAUTHORIZED ACCESS</span></div>' +
        '<p class="tt-gap">A fatal exception 0xTHIRSTY has occurred at CURIOSITY.SYS:00069.</p>' +
        '<p>* Your curiosity has been logged.</p>' +
        '<p class="tt-gap">* Your browser history has been notified.</p>' +
        '<p style="text-align:center;">Press any key to continue <span class="tt-cursor">_</span></p>' +
      '</div>';
    beep();

    // short delay so a stray click doesn't skip the BSOD instantly
    setTimeout(function () {
      document.addEventListener('keydown', onContinue);
      overlay.addEventListener('click', onContinue);
    }, 500);
  }

  function onContinue() {
    document.removeEventListener('keydown', onContinue);
    overlay.removeEventListener('click', onContinue);
    showJk();
  }

  function showJk() {
    overlay.innerHTML =
      '<div class="tt-jk">' +
        '<h2>jk lol.</h2>' +
        '<p>you\'ve been thirst-trapped 💅</p>' +
        '<div class="tt-btnrow">' +
          '<button class="tt-back tt-selfie-btn">TAKE A THIRST-TRAP SELFIE?</button>' +
          '<button class="tt-back tt-close">BACK TO SAFETY</button>' +
        '</div>' +
      '</div>';
    overlay.querySelector('.tt-close').addEventListener('click', closePrank);
    overlay.querySelector('.tt-selfie-btn').addEventListener('click', showSelfie);
  }

  /* ---------- the selfie ----------
     Camera only starts after the visitor clicks AND allows it in the browser.
     Nothing is uploaded: the photo only exists on their screen, and "SAVE"
     downloads it to their own device. */
  var stream = null;
  var rafId = null;

  function stopCamera() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
    stream = null;
  }

  function stamp() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return "'" + String(d.getFullYear()).slice(2) + ' ' + p(d.getMonth() + 1) + ' ' + p(d.getDate());
  }

  function showSelfie() {
    overlay.innerHTML =
      '<div class="tt-cam">' +
        '<div class="tt-cam-title"><span>WEBCAM.exe</span><span class="tt-rec">● REC</span></div>' +
        '<div class="tt-cam-body">' +
          '<div style="position:relative;display:flex;align-items:center;justify-content:center;">' +
            '<canvas width="320" height="240"></canvas>' +
          '</div>' +
          '<p class="tt-cam-msg">Waking up the camera...</p>' +
          '<div class="tt-cam-btns"></div>' +
        '</div>' +
      '</div>';

    var canvas = overlay.querySelector('canvas');
    var msg = overlay.querySelector('.tt-cam-msg');
    var btns = overlay.querySelector('.tt-cam-btns');
    var ctx = canvas.getContext('2d');

    // tiny canvas = chunky Y2K pixels when scaled up
    var small = document.createElement('canvas');
    small.width = 80;
    small.height = 60;
    var sctx = small.getContext('2d');

    var video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.muted = true;

    function setButtons(list) {
      btns.innerHTML = '';
      list.forEach(function (b) {
        var el = document.createElement('button');
        el.textContent = b[0];
        el.addEventListener('click', b[1]);
        btns.appendChild(el);
      });
    }

    function drawFrame(withStamp) {
      sctx.save();
      sctx.translate(small.width, 0);
      sctx.scale(-1, 1); // mirror, like a real selfie cam
      sctx.drawImage(video, 0, 0, small.width, small.height);
      sctx.restore();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
      // pink tint for the vibe
      ctx.fillStyle = 'rgba(255, 26, 179, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (withStamp) {
        ctx.font = '22px VT323, monospace';
        ctx.fillStyle = '#ff9a1a';
        ctx.textAlign = 'right';
        ctx.fillText(stamp(), canvas.width - 10, canvas.height - 10);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#00ffff';
        ctx.fillText('THIRST TRAP CERTIFIED ✓', 10, 24);
      }
    }

    function live() {
      drawFrame(false);
      rafId = requestAnimationFrame(live);
    }

    function startLive() {
      msg.textContent = 'Work it.';
      live();
      setButtons([['📸 SNAP', countdown], ['CLOSE', closePrank]]);
    }

    function countdown() {
      setButtons([]);
      var wrap = canvas.parentNode;
      var n = 3;
      var label = document.createElement('div');
      label.className = 'tt-count';
      label.textContent = n;
      wrap.appendChild(label);
      var t = setInterval(function () {
        n--;
        if (n > 0) { label.textContent = n; return; }
        clearInterval(t);
        label.remove();
        snap();
      }, 700);
    }

    function snap() {
      cancelAnimationFrame(rafId);
      rafId = null;
      drawFrame(true);
      msg.textContent = 'Iconic. Truly.';
      setButtons([
        ['RETAKE', startLive],
        ['SAVE', function () {
          var a = document.createElement('a');
          a.download = 'thirst-trap-selfie.png';
          a.href = canvas.toDataURL('image/png');
          a.click();
        }],
        ['CLOSE', closePrank]
      ]);
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      msg.textContent = 'No camera found. Lucky you.';
      setButtons([['CLOSE', closePrank]]);
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(function (s) {
        if (!overlay) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
        stream = s;
        video.srcObject = s;
        return video.play().then(startLive);
      })
      .catch(function () {
        msg.textContent = 'Camera shy? Valid. 💅';
        setButtons([['CLOSE', closePrank]]);
      });
  }

  function closePrank() {
    stopCamera();
    overlay.remove();
    overlay = null;
    document.body.style.overflow = '';
  }

  bait.addEventListener('click', function (e) {
    e.preventDefault();
    if (!overlay) showAgeCheck();
  });
})();
