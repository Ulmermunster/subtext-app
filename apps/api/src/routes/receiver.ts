const RECEIVER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0a0a0f">
<title>Que. — The Blind Taste Test</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,700;0,800;1,800&family=Be+Vietnam+Pro:wght@400;500;700&display=swap');
body{background-color:#0a0a0f;
  background-image:radial-gradient(at 0% 0%,rgba(255,107,157,.08) 0px,transparent 50%),
    radial-gradient(at 100% 100%,rgba(255,179,71,.05) 0px,transparent 50%),
    radial-gradient(at 50% 50%,rgba(0,204,204,.04) 0px,transparent 50%);
  font-family:'Be Vietnam Pro','Plus Jakarta Sans',system-ui,-apple-system,sans-serif;
  -webkit-font-smoothing:antialiased;min-height:100vh;min-height:100dvh;overflow-x:hidden;color:#ffffff;
  -webkit-text-size-adjust:100%}

.container{max-width:100%;width:100%;margin:0 auto;
  padding:max(20px,env(safe-area-inset-top)) 20px max(20px,env(safe-area-inset-bottom));
  position:relative;z-index:1;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:100vh;min-height:100dvh}

.blob{position:fixed;border-radius:50%;pointer-events:none;z-index:0}
.blob-1{top:-120px;right:-80px;width:400px;height:400px;
  background:radial-gradient(circle,rgba(255,107,157,.06) 0%,transparent 70%)}
.blob-2{bottom:-100px;left:-60px;width:350px;height:350px;
  background:radial-gradient(circle,rgba(0,204,204,.04) 0%,transparent 70%)}

.wordmark{font-size:22px;font-weight:900;font-style:italic;color:#FF6B9D;letter-spacing:-.5px;
  margin-bottom:16px;font-family:'Plus Jakarta Sans',system-ui,sans-serif}
.wordmark .dot{color:#FFB347}

.from-tag{font-size:15px;font-weight:600;color:#ffffff;margin-bottom:24px;text-align:center;padding:0 16px}

.orb-wrap{position:relative;width:220px;height:220px;margin-bottom:16px;cursor:pointer;
  -webkit-tap-highlight-color:transparent;user-select:none;touch-action:manipulation}
.orb{width:220px;height:220px;border-radius:2.5rem;
  background:rgba(255,255,255,.1);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
  border:3px solid rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;
  position:relative;z-index:2;overflow:hidden;
  box-shadow:inset 0 0 30px rgba(255,255,255,.1),0 20px 50px rgba(0,0,0,.4)}
.orb{transition:transform 80ms ease-out}
.orb::before{content:'';position:absolute;inset:12px;border-radius:1.5rem;
  background:linear-gradient(135deg,#FF1493,#00FFFF);filter:blur(40px);opacity:.5;
  animation:nebula 8s ease-in-out infinite alternate}
.orb::after{content:'';position:absolute;inset:0;
  background:linear-gradient(to top right,transparent,rgba(255,255,255,.1),rgba(255,255,255,.2));
  border-radius:2.5rem}
@keyframes nebula{0%{border-radius:30% 70% 70% 30%/30% 30% 70% 70%;transform:scale(1)}
  100%{border-radius:70% 30% 30% 70%/70% 70% 30% 30%;transform:scale(1.2)}}
.orb:active{transform:scale(.96)}
.orb-emoji{font-size:48px;transition:opacity .3s ease;position:relative;z-index:3;
  filter:drop-shadow(0 2px 8px rgba(0,0,0,.2))}
.orb-hint{position:absolute;bottom:-32px;left:0;right:0;text-align:center;
  font-size:13px;color:#6b7280;font-weight:600;letter-spacing:.5px;text-transform:uppercase}

.ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  border-radius:2.5rem;border:1.5px solid rgba(255,20,147,.25);z-index:3;
  animation:pulse 2.5s ease-out infinite}
.ring-1{width:250px;height:250px}
.ring-2{width:280px;height:280px;animation-delay:.4s}
@keyframes pulse{0%{transform:translate(-50%,-50%) scale(.95);opacity:.6}
  100%{transform:translate(-50%,-50%) scale(1.15);opacity:0}}

.mystery{font-size:12px;font-weight:800;color:#6b7280;margin:24px 0 4px;letter-spacing:3px;
  text-transform:uppercase;font-family:'Plus Jakarta Sans',system-ui,sans-serif}
.subtitle{font-size:11px;color:#6b7280;font-weight:500;font-style:italic;opacity:.8}

.orb-bars{display:flex;align-items:center;gap:3px;height:60px;opacity:0;
  position:absolute;transition:opacity .4s ease;z-index:3}
.orb-bars.active{opacity:1}
.orb-bar{width:4px;border-radius:2px;background:linear-gradient(to top,#FFB347,#FF6B9D);
  animation:wave 1.2s ease-in-out infinite alternate;
  filter:drop-shadow(0 0 4px rgba(255,107,157,.6))}
@keyframes wave{0%{height:12px}100%{height:var(--h,40px)}}

.scrubber{width:100%;max-width:280px;margin:12px 0;opacity:0;transition:opacity .3s ease}
.scrubber.active{opacity:1}
.scrub-track{width:100%;height:4px;background:rgba(255,255,255,.15);border-radius:2px;overflow:hidden}
.scrub-fill{height:100%;background:linear-gradient(90deg,#FF1493,#FF6B9D);border-radius:2px;
  transition:width .3s linear;filter:drop-shadow(0 0 6px rgba(255,20,147,.4))}
.scrub-times{display:flex;justify-content:space-between;margin-top:4px;
  font-size:11px;color:#6b7280;font-weight:500}

.reactions{display:flex;gap:12px;margin:20px 0;opacity:0;transform:translateY(20px);
  transition:opacity .4s ease,transform .4s ease;width:100%;max-width:320px;justify-content:center}
.reactions.active{opacity:1;transform:translateY(0)}
.react-btn{border:none;border-radius:999px;padding:14px 0;font-size:15px;font-weight:700;
  cursor:pointer;transition:transform .15s ease,box-shadow .15s ease;
  display:flex;align-items:center;justify-content:center;gap:8px;
  font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-style:italic;letter-spacing:1px;
  flex:1;min-height:48px;touch-action:manipulation;backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px)}
.react-btn:active{transform:scale(.95)}
.btn-vibe{background:rgba(255,255,255,.05);color:#FACC15;
  border:1.5px solid rgba(250,204,21,.3);
  box-shadow:0 0 15px rgba(250,204,21,.15)}
.btn-vibe:hover{box-shadow:0 0 25px rgba(250,204,21,.3)}
.btn-vibe.selected{box-shadow:0 0 20px rgba(250,204,21,.4);border-color:rgba(250,204,21,.6);
  background:rgba(250,204,21,.15)}
.btn-nope{background:rgba(255,255,255,.05);color:#FF1493;
  border:1.5px solid rgba(255,20,147,.3);
  box-shadow:0 0 15px rgba(255,20,147,.15)}
.btn-nope:hover{box-shadow:0 0 25px rgba(255,20,147,.3)}
.btn-nope.selected{box-shadow:0 0 20px rgba(255,20,147,.4);border-color:rgba(255,20,147,.6);
  background:rgba(255,20,147,.15)}

.hint{font-size:12px;color:#6b7280;font-weight:500;text-align:center;
  margin:4px 0;transition:opacity .3s ease;font-style:italic}


@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes popIn{0%{opacity:0;transform:scale(.7) rotate(-3deg)}70%{opacity:1;transform:scale(1.06) rotate(-1deg)}
  100%{opacity:1;transform:scale(1) rotate(-2deg)}}

#confetti{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100}

.error-state{text-align:center;padding:40px 20px}
.error-emoji{font-size:48px;margin-bottom:16px}
.error-title{font-size:20px;font-weight:700;margin-bottom:8px;color:#ffffff;
  font-family:'Plus Jakarta Sans',system-ui,sans-serif}
.error-sub{font-size:14px;color:#6b7280}

.unmask-wrap{display:none;flex-direction:column;align-items:center;justify-content:center;gap:20px;
  width:100%;min-height:100vh;min-height:100dvh;padding:0 16px;animation:fadeUp .4s ease forwards;
  position:fixed;inset:0;z-index:50;background-color:rgba(10,10,15,.95)}
.unmask-wrap.active{display:flex}
.unmask-btn{border:none;border-radius:999px;padding:20px 56px;font-size:20px;font-weight:800;
  cursor:pointer;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-style:italic;
  min-height:60px;touch-action:manipulation;
  background:linear-gradient(135deg,#FF6B9D,#FFB347);color:#1a0a12;
  box-shadow:0 4px 24px rgba(255,107,157,.3),0 0 48px rgba(255,179,71,.15);transition:transform .15s ease;letter-spacing:1px}
.unmask-btn:active{transform:scale(.95)}
.unmask-sub{font-size:13px;color:#6b7280;font-weight:500;font-style:italic}

.guess-wrap{display:none;flex-direction:column;align-items:center;gap:10px;
  width:100%;max-width:320px;margin:12px auto 0;padding:0}
.guess-wrap.active{display:flex}
.guess-prompt{font-size:15px;font-weight:700;color:#ffffff;text-align:center;
  font-family:'Plus Jakarta Sans',system-ui,sans-serif}
.guess-pills{display:flex;flex-direction:column;gap:8px;width:100%;max-width:320px}
.guess-pill{border:2px solid rgba(255,255,255,.08);border-radius:999px;padding:14px 24px;
  font-size:15px;font-weight:600;color:#ffffff;
  background:rgba(255,255,255,.05);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  cursor:pointer;font-family:inherit;min-height:48px;touch-action:manipulation;
  transition:all .2s ease;text-align:center}
.guess-pill:active{transform:scale(.97)}
.guess-pill.correct{background:linear-gradient(135deg,#FF6B9D,#FFB347);border-color:#FFB347;color:#1a0a12}
.guess-pill.wrong{background:rgba(255,255,255,.03);border-color:rgba(255,255,255,.05);color:#6b7280}
.guess-pill.reveal{border-color:#FF6B9D;color:#FF6B9D}
.guess-pill.locked{pointer-events:none}
.guess-result{font-size:14px;font-weight:600;text-align:center;
  opacity:0;animation:fadeUp .4s ease forwards}
.guess-wrap.fade-out{opacity:0;transform:translateY(-8px);transition:opacity .4s ease,transform .4s ease;pointer-events:none}
.orb.revealed{background:none;border:none;box-shadow:none;overflow:hidden;border-radius:2rem}
.orb.revealed::before,.orb.revealed::after{display:none}
.orb.revealed .orb-bars{opacity:0!important}
.orb-revealed-art{width:100%;height:100%;object-fit:cover;border-radius:2rem;
  position:absolute;top:0;left:0;opacity:0;transition:opacity .6s ease;z-index:3}
.orb-revealed-art.visible{opacity:1;box-shadow:0 0 0 3px #FF1493,0 0 20px rgba(255,20,147,.4),0 0 40px rgba(255,20,147,.2)}
.orb-play-pause{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  z-index:5;width:56px;height:56px;border-radius:50%;
  background:rgba(0,0,0,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  display:none;align-items:center;justify-content:center;
  border:1.5px solid rgba(255,255,255,.2);
  transition:opacity .3s ease,transform .15s ease;cursor:pointer}
.orb-play-pause.visible{display:flex}
.orb-play-pause:active{transform:translate(-50%,-50%) scale(.9)}
.orb-play-pause svg{fill:#ffffff;width:24px;height:24px}
.mystery.revealed-title{color:#FF6B9D;font-size:22px;font-weight:900;font-style:italic;
  letter-spacing:-1px;text-transform:uppercase;
  font-family:'Plus Jakarta Sans',system-ui,sans-serif;transition:all .4s ease}
.subtitle.revealed-meta{color:#6b7280;font-size:13px;font-weight:500;
  transition:all .4s ease}
.inline-actions{display:none;flex-direction:column;align-items:center;gap:8px;
  width:100%;max-width:320px;margin:16px auto 0;padding:0;
  opacity:0;transform:translateY(12px);transition:opacity .5s ease,transform .5s ease}
.inline-actions.active{display:flex}
.inline-actions.visible{opacity:1;transform:translateY(0)}
.inline-actions .vibe-row{display:flex;gap:10px;width:100%}
.inline-actions .vibe-btn{border:none;border-radius:999px;padding:12px 0;font-size:15px;
  font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',system-ui,sans-serif;
  font-style:italic;letter-spacing:1px;flex:1;min-height:48px;
  touch-action:manipulation;transition:transform .15s ease,box-shadow .15s ease;
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.inline-actions .vibe-btn:active{transform:scale(.95)}
.inline-actions .vibe-btn-yes{background:rgba(255,255,255,.05);color:#FACC15;
  border:1.5px solid rgba(250,204,21,.3);box-shadow:0 0 15px rgba(250,204,21,.15)}
.inline-actions .vibe-btn-yes.selected{box-shadow:0 0 20px rgba(250,204,21,.4);
  border-color:rgba(250,204,21,.6);background:rgba(250,204,21,.15)}
.inline-actions .vibe-btn-no{background:rgba(255,255,255,.05);color:#FF1493;
  border:1.5px solid rgba(255,20,147,.3);box-shadow:0 0 15px rgba(255,20,147,.15)}
.inline-actions .vibe-btn-no.selected{box-shadow:0 0 20px rgba(255,20,147,.4);
  border-color:rgba(255,20,147,.6);background:rgba(255,20,147,.15)}
.inline-actions .action-link{display:inline-flex;align-items:center;justify-content:center;
  gap:8px;border-radius:999px;padding:12px 24px;font-size:14px;font-weight:700;
  text-decoration:none;min-height:48px;touch-action:manipulation;width:100%}
.inline-actions .spotify-link{background:#1DB954;color:#fff;
  box-shadow:0 4px 16px rgba(29,185,84,.25)}
.inline-actions .queback-link{background:linear-gradient(135deg,#FF6B9D,#FFB347);color:#1a0a12;
  box-shadow:0 4px 24px rgba(255,107,157,.3);
  font-family:'Plus Jakarta Sans',system-ui,sans-serif}
</style>
</head>
<body>
<div class="blob blob-1"></div>
<div class="blob blob-2"></div>
<canvas id="confetti"></canvas>

<div class="container">
  <div id="loading" class="error-state">
    <div style="width:24px;height:24px;border:2px solid rgba(255,255,255,0.1);border-top-color:#FF6B9D;
      border-radius:50%;animation:spin .6s linear infinite;margin:0 auto"></div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  </div>

  <div id="error" class="error-state" style="display:none">
    <div class="error-emoji" id="errorEmoji"></div>
    <div class="error-title" id="errorTitle">This clip has expired</div>
    <div class="error-sub" id="errorSub">Mystery clips only last 72 hours.</div>
  </div>

  <div id="landing" style="display:none;flex-direction:column;align-items:center;width:100%">
    <div class="wordmark">Que<span class="dot">.</span></div>
    <div class="from-tag" id="fromTag"></div>
    <div class="orb-wrap" id="orbWrap">
      <div class="ring ring-1"></div>
      <div class="ring ring-2"></div>
      <div class="orb" id="orb">
        <span class="orb-emoji" id="orbEmoji">\u{1F3B5}</span>
        <div class="orb-bars" id="orbBars"></div>
        <img class="orb-revealed-art" id="orbRevealArt" src="" alt="">
        <div class="orb-play-pause" id="orbPlayPause">
          <svg id="playPauseIcon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
      <div class="orb-hint" id="orbHint">tap to play</div>
    </div>
    <div class="mystery" id="mysteryLabel">??? \u00B7 ???</div>
    <div class="subtitle" id="subtitleLabel">no artist \u00B7 no title \u00B7 no skipping</div>

    <div class="scrubber" id="scrubber">
      <div class="scrub-track"><div class="scrub-fill" id="scrubFill"></div></div>
      <div class="scrub-times">
        <span id="elapsed">0:00</span>
        <span id="remaining">0:30</span>
      </div>
    </div>

    <div class="reactions" id="reactions">
      <button class="react-btn btn-vibe" id="btnVibe" onpointerdown="hapticConfirmRaw()" onclick="react('VIBE')">\u{1F44D} Vibe</button>
      <button class="react-btn btn-nope" id="btnNope" onpointerdown="triggerHaptic()" onclick="react('NOPE')">\u{1F44E} Nope</button>
    </div>

    <div class="hint" id="hint"></div>

    <div id="guessSection" class="guess-wrap">
      <div class="guess-prompt">Who's the artist?</div>
      <div class="guess-pills" id="guessPills"></div>
      <div class="guess-result" id="guessResult"></div>
    </div>

    <div id="inlineActions" class="inline-actions">
      <div class="vibe-row">
        <button class="vibe-btn vibe-btn-yes" id="inlineVibe" onpointerdown="hapticConfirmRaw()" onclick="inlineReact('VIBE')">\u{1F44D} Vibe</button>
        <button class="vibe-btn vibe-btn-no" id="inlineNope" onpointerdown="triggerHaptic()" onclick="inlineReact('NOPE')">\u{1F44E} Nope</button>
      </div>
      <a class="action-link spotify-link" id="inlineSpotify" href="#" target="_blank" rel="noopener">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
        Open in Spotify
      </a>
      <a class="action-link queback-link" href="/send">\u{1F3B5} Que one back</a>
    </div>
  </div>

  <div id="unmaskSection" class="unmask-wrap">
    <div class="wordmark">Que<span class="dot">.</span></div>
    <div id="unmaskEmoji" style="font-size:72px">\u{1F50A}</div>
    <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">Time's up!</div>
    <button class="unmask-btn" id="btnUnmask" onpointerdown="hapticRevealRaw()" onclick="doReveal()">\u{1F3AD} Tap to unmask</button>
    <div class="unmask-sub">see who you've been listening to</div>
  </div>

</div>

<script>
(function(){
  var vibeId, vibeData, audio, currentReaction = null, playing = false, revealed = false;
  var isGuessMode = false, artistChoices = [], correctArtist = '', guessLocked = false;
  var clipTimeout = null, progressInterval = null;
  var API = location.origin;

  var $loading = document.getElementById('loading');
  var $error = document.getElementById('error');
  var $landing = document.getElementById('landing');
  var $unmaskSection = document.getElementById('unmaskSection');
  var $guessSection = document.getElementById('guessSection');
  var $guessPills = document.getElementById('guessPills');
  var $guessResult = document.getElementById('guessResult');
  var $inlineActions = document.getElementById('inlineActions');
  var $inlineSpotify = document.getElementById('inlineSpotify');
  var $orbRevealArt = document.getElementById('orbRevealArt');
  var $orbPlayPause = document.getElementById('orbPlayPause');
  var $playPauseIcon = document.getElementById('playPauseIcon');
  var $mysteryLabel = document.getElementById('mysteryLabel');
  var $subtitleLabel = document.getElementById('subtitleLabel');
  var $fromTag = document.getElementById('fromTag');
  var $orbWrap = document.getElementById('orbWrap');
  var $orb = document.getElementById('orb');
  var $orbEmoji = document.getElementById('orbEmoji');
  var $orbBars = document.getElementById('orbBars');
  var $orbHint = document.getElementById('orbHint');
  var $scrubber = document.getElementById('scrubber');
  var $scrubFill = document.getElementById('scrubFill');
  var $elapsed = document.getElementById('elapsed');
  var $remaining = document.getElementById('remaining');
  var $reactions = document.getElementById('reactions');
  var $btnVibe = document.getElementById('btnVibe');
  var $btnNope = document.getElementById('btnNope');
  var $hint = document.getElementById('hint');

  function showError(emoji, title, sub) {
    $loading.style.display = 'none';
    $landing.style.display = 'none';
    $error.style.display = 'block';
    document.getElementById('errorEmoji').textContent = emoji;
    document.getElementById('errorTitle').textContent = title;
    document.getElementById('errorSub').textContent = sub;
  }

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function createOrbBars() {
    for (var i = 0; i < 12; i++) {
      var bar = document.createElement('div');
      bar.className = 'orb-bar';
      bar.style.setProperty('--h', (20 + Math.random() * 30) + 'px');
      bar.style.animationDelay = (i * 0.08) + 's';
      $orbBars.appendChild(bar);
    }
  }
  createOrbBars();

  var pathParts = location.pathname.split('/');
  vibeId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];

  if (!vibeId) {
    showError('\\u{1F914}', 'No clip found', 'Check the link and try again.');
    return;
  }

  fetch(API + '/vibes/' + vibeId, {credentials:'include'})
    .then(function(r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(function(data) {
      vibeData = data;
      isGuessMode = data.gameMode === 'guess';
      if (isGuessMode && data.artistChoices) {
        artistChoices = data.artistChoices;
        correctArtist = data.trackArtist;
      }
      $loading.style.display = 'none';
      $landing.style.display = 'flex';
      $fromTag.textContent = data.senderDisplayName + (isGuessMode
        ? " challenged you \\u{1F3AF}"
        : " que'd you a song \\u{1F440}");
      // In guess mode, hide Vibe/Nope reactions (artist guessing replaces them)
      if (isGuessMode) {
        document.getElementById('reactions').style.display = 'none';
      }
    })
    .catch(function(err) {
      if (err.message === '404') {
        showError('\\u{1F4A8}', 'This clip has expired', 'Mystery clips only last 72 hours.');
      } else {
        showError('\\u{1F635}', 'Something went wrong', 'Check your connection and try again.');
      }
    });

  // Bass pulse state
  var audioCtx = null, analyser = null, audioSource = null, bassPulseRaf = null;

  function startBassPulse() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC || !audio) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      if (!audioSource) {
        audioSource = audioCtx.createMediaElementSource(audio);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        audioSource.connect(analyser);
        analyser.connect(audioCtx.destination);
      }
      var dataArray = new Uint8Array(analyser.frequencyBinCount);
      function tick() {
        analyser.getByteFrequencyData(dataArray);
        var bassSum = 0;
        for (var i = 0; i < 8; i++) bassSum += dataArray[i];
        var bassAvg = bassSum / 8 / 255;
        var s = 1 + bassAvg * 0.06;
        $orb.style.transform = 'scale(' + s + ')';
        bassPulseRaf = requestAnimationFrame(tick);
      }
      tick();
    } catch(e) {}
  }

  function stopBassPulse() {
    if (bassPulseRaf) { cancelAnimationFrame(bassPulseRaf); bassPulseRaf = null; }
    $orb.style.transform = '';
  }

  // -- Haptics --
  // Mirrors the ios-haptics library pattern:
  // Try navigator.vibrate (Android), fall back to checkbox-switch trick (iOS).
  // Label wraps input, appends to document.head, click, remove synchronously.
  var _hasVibrate = typeof navigator.vibrate === 'function';
  var _isTouch = window.matchMedia('(pointer: coarse)').matches;

  function _hapticTick() {
    try {
      if (_hasVibrate) { navigator.vibrate(20); return; }
      if (!_isTouch) return;
      var lbl = document.createElement('label');
      lbl.ariaHidden = 'true';
      lbl.style.display = 'none';
      var inp = document.createElement('input');
      inp.type = 'checkbox';
      inp.setAttribute('switch', '');
      lbl.appendChild(inp);
      document.head.appendChild(lbl);
      lbl.click();
      document.head.removeChild(lbl);
    } catch(e) {}
  }

  // Light tap — single tick for buttons
  window.triggerHaptic = function() { _hapticTick(); };

  // Confirm — two ticks for Vibe reaction
  window.hapticConfirmRaw = function() {
    if (_hasVibrate) { try { navigator.vibrate([25, 50, 25]); } catch(e) {} return; }
    _hapticTick();
    setTimeout(_hapticTick, 120);
  };

  // Dramatic reveal — three ticks for unmask moment
  window.hapticRevealRaw = function() {
    if (_hasVibrate) { try { navigator.vibrate([30, 60, 30, 80, 100]); } catch(e) {} return; }
    _hapticTick();
    setTimeout(_hapticTick, 120);
    setTimeout(_hapticTick, 240);
  };

  // Error — three quick ticks for wrong guess
  window.hapticErrorRaw = function() {
    if (_hasVibrate) { try { navigator.vibrate([15, 40, 15, 40, 15]); } catch(e) {} return; }
    _hapticTick();
    setTimeout(_hapticTick, 120);
    setTimeout(_hapticTick, 240);
  };

  function startPlayback() {
    playing = true;
    $orbEmoji.style.opacity = '0';
    $orbBars.classList.add('active');
    $orbHint.textContent = '';
    $scrubber.classList.add('active');
    if (isGuessMode) {
      mountGuessGame();
      $hint.textContent = 'guess the artist \u2014 tap a name below';
    } else {
      $reactions.classList.add('active');
      $hint.textContent = 'artist reveals at the end';
    }

    var audioUrl = API + '/vibes/' + vibeId + '/audio';
    audio = new Audio();
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');
    audio.crossOrigin = 'anonymous';
    audio.src = audioUrl;
    document.body.appendChild(audio);
    audio.play().then(function() {
      startBassPulse();
      clipTimeout = setTimeout(function() {
        if (audio && !audio.paused) { audio.pause(); }
      }, 30000);
    }).catch(function() {
      $hint.textContent = 'could not play audio \\u2014 try opening in browser';
    });
    startClipTimer(30);
  }

  $orbWrap.addEventListener('pointerdown', function() {
    if (!revealed && vibeData) triggerHaptic();
  });

  function updatePlayPauseIcon(paused) {
    if (!$playPauseIcon) return;
    $playPauseIcon.innerHTML = paused
      ? '<path d="M8 5v14l11-7z"/>'
      : '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
  }

  $orbWrap.addEventListener('click', function() {
    if (!vibeData) return;

    // Post-reveal: toggle play/pause on the audio
    if (revealed) {
      if (!audio) return;
      if (audio.paused) {
        audio.play();
        updatePlayPauseIcon(false);
      } else {
        audio.pause();
        updatePlayPauseIcon(true);
      }
      return;
    }

    if (playing) {
      if (audio) {
        if (audio.paused) { audio.play(); $orbBars.classList.add('active'); startBassPulse(); }
        else { audio.pause(); $orbBars.classList.remove('active'); stopBassPulse(); }
      }
      return;
    }

    startPlayback();
  });

  function startClipTimer(duration) {
    var start = Date.now();
    progressInterval = setInterval(function() {
      var elapsed = (Date.now() - start) / 1000;
      var pct = Math.min(100, (elapsed / duration) * 100);
      $scrubFill.style.width = pct + '%';
      $elapsed.textContent = formatTime(Math.min(elapsed, duration));
      $remaining.textContent = formatTime(Math.max(0, duration - elapsed));
      if (elapsed >= duration) {
        clearInterval(progressInterval);
        onClipEnd();
      }
    }, 250);
  }

  window.react = function(type) {
    if (revealed) return;
    currentReaction = type;
    $btnVibe.classList.toggle('selected', type === 'VIBE');
    $btnNope.classList.toggle('selected', type === 'NOPE');
    $hint.textContent = (type === 'VIBE' ? '\\u{1F44D}' : '\\u{1F44E}') + ' locked in \\u2014 artist reveals at the end';

    fetch(API + '/vibes/' + vibeId + '/react', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify({reaction: type})
    }).catch(function(){});
  };

  function onClipEnd() {
    clearTimeout(clipTimeout);
    clearInterval(progressInterval);
    if (audio) { try { audio.pause(); } catch(e){} }
    $orbBars.classList.remove('active');
    stopBassPulse();

    if (isGuessMode && guessLocked) {
      // Guess already made — player is already morphed, just stop audio gracefully
      // The inline actions (Vibe/Nope, Spotify, Que back) stay visible
      return;
    }

    if (isGuessMode && !guessLocked) {
      // Time ran out without a guess — auto-reveal
      guessLocked = true;
      var pills = $guessPills.querySelectorAll('.guess-pill');
      for (var i = 0; i < pills.length; i++) {
        pills[i].classList.add('locked');
        if (pills[i].getAttribute('data-artist') === correctArtist) {
          pills[i].classList.add('reveal');
        }
      }
      $guessResult.textContent = '\\u23F0 Time\\'s up!';
      $guessResult.style.color = '#9CA3AF';
      // Fetch reveal data and morph in-place (no reaction needed — time gate passes since 30s elapsed)
      fetch(API + '/vibes/' + vibeId + '/reveal', {credentials:'include'})
        .then(function(r) { console.log('Timeout reveal status:', r.status); return r.json(); })
        .then(function(data) {
          console.log('Timeout reveal data:', JSON.stringify(data));
          if (data.error) { console.error('Timeout reveal error:', data.error); return; }
          window._revealData = data;
          setTimeout(function() {
            // Morph orb -> album art
            $orbRevealArt.src = data.albumArt;
            $orbRevealArt.classList.add('visible');
            $orb.classList.add('revealed');
            $orbEmoji.style.display = 'none';
            var rings = document.querySelectorAll('.ring');
            for (var r = 0; r < rings.length; r++) rings[r].style.display = 'none';
            $mysteryLabel.textContent = data.title;
            $mysteryLabel.classList.add('revealed-title');
            $subtitleLabel.textContent = data.artist + ' \\u00B7 ' + data.albumName;
            $subtitleLabel.classList.add('revealed-meta');
            $inlineSpotify.href = data.spotifyUrl;
            revealed = true;
            $orbPlayPause.classList.add('visible'); updatePlayPauseIcon(audio && audio.paused);
            // Fade out pills, show action buttons
            $guessSection.classList.add('fade-out');
            $hint.style.opacity = '0';
            setTimeout(function() {
              $guessSection.style.display = 'none';
              $hint.style.display = 'none';
              $inlineActions.classList.add('active');
              void $inlineActions.offsetWidth;
              $inlineActions.classList.add('visible');
            }, 400);
          }, 1000);
        }).catch(function(){});
      return;
    }

    if (revealed) return;

    $landing.style.display = 'none';

    // Show "Tap to unmask" interstitial — user gesture required for haptic
    $unmaskSection.classList.add('active');
  }

  // Called from the unmask button's onclick (user gesture context)
  window.doReveal = function() {
    if (revealed) return;
    revealed = true;
    $orbPlayPause.classList.add('visible'); updatePlayPauseIcon(audio && audio.paused);
    hapticRevealRaw();
    $unmaskSection.classList.remove('active');
    $unmaskSection.style.display = 'none';
    // Show #landing again, morph orb in-place
    $landing.style.display = 'flex';
    // Hide reactions row (already voted during playback)
    $reactions.style.display = 'none';
    $hint.style.display = 'none';
    fetch(API + '/vibes/' + vibeId + '/reveal', {credentials:'include'})
      .then(function(r) { console.log('Vibe reveal status:', r.status); return r.json(); })
      .then(function(data) {
        console.log('Vibe reveal data:', JSON.stringify(data));
        if (data.error) { console.error('Vibe reveal error:', data.error); return; }
        window._revealData = data;
        $orbRevealArt.src = data.albumArt;
        $orbRevealArt.classList.add('visible');
        $orb.classList.add('revealed');
        $orbEmoji.style.display = 'none';
        $orbBars.classList.remove('active');
        var rings = document.querySelectorAll('.ring');
        for (var r = 0; r < rings.length; r++) rings[r].style.display = 'none';
        $mysteryLabel.textContent = data.title;
        $mysteryLabel.classList.add('revealed-title');
        $subtitleLabel.textContent = data.artist + ' \\u00B7 ' + data.albumName;
        $subtitleLabel.classList.add('revealed-meta');
        $inlineSpotify.href = data.spotifyUrl;
        // Show scrubber at 100%
        $scrubFill.style.width = '100%';
        // Show Vibe/Nope + action buttons
        $inlineActions.classList.add('active');
        void $inlineActions.offsetWidth;
        $inlineActions.classList.add('visible');
      }).catch(function() {
        showError('\\u{1F635}', 'Reveal failed', 'Something went wrong loading the track info.');
      });
  };

  // --- Guess the Artist game ---
  function mountGuessGame() {
    $guessSection.classList.add('active');
    $guessPills.innerHTML = '';

    for (var i = 0; i < artistChoices.length; i++) {
      var pill = document.createElement('button');
      pill.className = 'guess-pill';
      pill.textContent = artistChoices[i];
      pill.setAttribute('data-artist', artistChoices[i]);
      pill.setAttribute('onpointerdown', 'triggerHaptic()');
      pill.addEventListener('click', handleGuess);
      $guessPills.appendChild(pill);
    }
  }

  function handleGuess(e) {
    if (guessLocked) return;
    guessLocked = true;

    // Do NOT stop audio — music keeps playing seamlessly

    var chosen = e.target.getAttribute('data-artist');
    var isCorrect = chosen === correctArtist;
    var pills = $guessPills.querySelectorAll('.guess-pill');

    // Lock all pills
    for (var i = 0; i < pills.length; i++) {
      pills[i].classList.add('locked');
    }

    if (isCorrect) {
      e.target.classList.add('correct');
      $guessResult.textContent = '\\u{1F389} You got it!';
      $guessResult.style.color = '#FF6B9D';
      hapticConfirmRaw();
      setTimeout(launchConfetti, 300);
    } else {
      e.target.classList.add('wrong');
      for (var j = 0; j < pills.length; j++) {
        if (pills[j].getAttribute('data-artist') === correctArtist) {
          pills[j].classList.add('correct');
        }
      }
      $guessResult.textContent = '\\u{1F614} Not quite...';
      $guessResult.style.color = '#9CA3AF';
      hapticErrorRaw();
    }

    // IMPORTANT: Chain reaction POST -> reveal GET to avoid race condition.
    // The /reveal endpoint gates on vibe.reaction existing in DB.
    // If we fire-and-forget the reaction, /reveal may 403 because the row hasn't been updated yet.
    fetch(API + '/vibes/' + vibeId + '/react', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify({reaction: isCorrect ? 'VIBE' : 'NOPE'})
    })
    .then(function() {
      return fetch(API + '/vibes/' + vibeId + '/reveal', {credentials:'include'});
    })
    .then(function(r) {
      console.log('Reveal response status:', r.status);
      return r.json();
    })
    .then(function(data) {
      console.log('Reveal data:', JSON.stringify(data));
      if (data.error) { console.error('Reveal returned error:', data.error); return; }
      window._revealData = data;
      // Morph the player in-place: orb -> album art, ??? -> title/artist
      $orbRevealArt.src = data.albumArt;
      $orbRevealArt.classList.add('visible');
      $orb.classList.add('revealed');
      $orbEmoji.style.display = 'none';
      // Hide pulse rings
      var rings = document.querySelectorAll('.ring');
      for (var r = 0; r < rings.length; r++) rings[r].style.display = 'none';
      // Update text labels
      $mysteryLabel.textContent = data.title;
      $mysteryLabel.classList.add('revealed-title');
      $subtitleLabel.textContent = data.artist + ' \\u00B7 ' + data.albumName;
      $subtitleLabel.classList.add('revealed-meta');
      // Set Spotify link
      $inlineSpotify.href = data.spotifyUrl;
      revealed = true;
      // Audio keeps playing after guess — show pause icon if audio is active
      $orbPlayPause.classList.add('visible');
      updatePlayPauseIcon(audio && audio.paused);
    }).catch(function(err) { console.error('Reveal chain failed:', err); });

    // After a short pause, fade out pills and show action buttons
    setTimeout(function() {
      $guessSection.classList.add('fade-out');
      $hint.style.opacity = '0';
      $hint.style.transition = 'opacity .4s ease';

      setTimeout(function() {
        $guessSection.style.display = 'none';
        $hint.style.display = 'none';
        // Show Vibe/Nope + Spotify + Que back inline
        $inlineActions.classList.add('active');
        void $inlineActions.offsetWidth;
        $inlineActions.classList.add('visible');
      }, 400);
    }, 1200);
  }

  // Inline Vibe/Nope reaction handler (used in both guess and vibe modes post-reveal)
  window.inlineReact = function(type) {
    currentReaction = type;
    document.getElementById('inlineVibe').classList.toggle('selected', type === 'VIBE');
    document.getElementById('inlineNope').classList.toggle('selected', type === 'NOPE');
    fetch(API + '/vibes/' + vibeId + '/react', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify({reaction: type})
    }).catch(function(){});
  };


  function launchConfetti() {
    var canvas = document.getElementById('confetti');
    var ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var colors = ['#FF6B9D','#FFB347','#00CCCC','#FF1493','#ffffff','#0a3a3a'];
    var particles = [];
    for (var i = 0; i < 80; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 14 - 4,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rv: (Math.random() - 0.5) * 10,
        alpha: 1
      });
    }

    var gravity = 0.35;
    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var alive = false;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rv;
        if (p.y > canvas.height * 0.85) p.alpha -= 0.03;
        if (p.alpha <= 0) continue;
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // Page Visibility API — pause audio when tab/browser is hidden
  document.addEventListener('visibilitychange', function() {
    if (document.hidden && audio && !audio.paused) {
      audio.pause();
      $orbBars.classList.remove('active');
      stopBassPulse();
      if (revealed && $orbPlayPause) updatePlayPauseIcon(true);
    }
  });
})();
</script>
</body>
</html>`;

export { RECEIVER_HTML };
