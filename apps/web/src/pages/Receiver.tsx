import { useEffect, useRef } from 'react';

/**
 * Receiver page — replaces the React SPA DOM with standalone receiver HTML.
 * Uses DOMParser + manual script execution instead of document.write
 * (which is unreliable across browsers, especially on mobile).
 */
export default function Receiver() {
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current) return;
    injected.current = true;

    const parser = new DOMParser();
    const doc = parser.parseFromString(RECEIVER_HTML, 'text/html');

    // Replace head (styles, meta tags, fonts)
    document.head.innerHTML = doc.head.innerHTML;

    // Replace body content
    document.body.innerHTML = doc.body.innerHTML;
    document.body.style.cssText = '';
    document.body.className = '';

    // Scripts injected via innerHTML don't execute — recreate them
    document.querySelectorAll('script').forEach((old) => {
      const fresh = document.createElement('script');
      fresh.textContent = old.textContent;
      old.parentNode!.replaceChild(fresh, old);
    });
  }, []);

  return null;
}

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
  position:relative;z-index:2;transition:transform .3s ease;overflow:hidden;
  box-shadow:inset 0 0 30px rgba(255,255,255,.1),0 20px 50px rgba(0,0,0,.4)}
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
.orb-bar{width:4px;border-radius:2px;background:rgba(255,255,255,.9);
  animation:wave 1.2s ease-in-out infinite alternate;
  filter:drop-shadow(0 0 4px rgba(0,255,255,.6))}
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

.reveal{display:none;flex-direction:column;align-items:center;gap:10px;width:100%;
  padding:0 16px}
.reveal.active{display:flex}
.reveal-label{font-size:13px;color:#6b7280;font-weight:600;letter-spacing:2px;
  text-transform:uppercase;opacity:0;animation:fadeUp .5s ease forwards}
.album-art-wrap{position:relative;cursor:pointer;-webkit-tap-highlight-color:transparent}
.album-art{width:min(220px,55vw);height:min(220px,55vw);border-radius:2rem;object-fit:cover;
  box-shadow:0 12px 48px rgba(0,0,0,.3),0 0 0 3px #FF1493,0 0 20px rgba(255,20,147,.3);
  border:none;opacity:0;transform:scale(.7) rotate(-3deg);
  animation:popIn .5s cubic-bezier(.34,1.56,.64,1) forwards;animation-delay:.15s}
.album-play-pause{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  z-index:5;width:56px;height:56px;border-radius:50%;
  background:rgba(0,0,0,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  display:flex;align-items:center;justify-content:center;
  border:1.5px solid rgba(255,255,255,.2);
  opacity:0;animation:fadeUp .4s ease forwards;animation-delay:.5s;
  transition:transform .15s ease}
.album-play-pause:active{transform:translate(-50%,-50%) scale(.9)}
.album-play-pause svg{fill:#ffffff;width:24px;height:24px}
.reveal-title{font-size:28px;font-weight:900;font-style:italic;color:#FF6B9D;text-align:center;
  text-transform:uppercase;letter-spacing:-1px;line-height:1.1;
  font-family:'Plus Jakarta Sans',system-ui,sans-serif;
  opacity:0;animation:fadeUp .4s ease forwards;animation-delay:.34s;
  overflow-wrap:break-word;word-break:break-word;max-width:100%}
.reveal-meta{font-size:14px;color:#6b7280;font-weight:500;text-align:center;
  opacity:0;animation:fadeUp .4s ease forwards;animation-delay:.46s;
  overflow-wrap:break-word;word-break:break-word;max-width:100%}
.reveal-meta span{font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1px}
.reaction-badge{border-radius:999px;padding:10px 24px;font-size:14px;font-weight:700;
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  opacity:0;animation:fadeUp .4s ease forwards;animation-delay:.58s}
.badge-vibe{background:rgba(0,204,204,.1);color:#00CCCC;
  border:1px solid rgba(0,204,204,.2);box-shadow:0 0 12px rgba(34,211,238,.15)}
.badge-nope{background:rgba(255,107,157,.1);color:#FF6B9D;
  border:1px solid rgba(255,107,157,.2);box-shadow:0 0 12px rgba(255,107,157,.15)}
.spotify-cta{display:inline-flex;align-items:center;gap:8px;background:#1DB954;color:#fff;
  border-radius:999px;padding:14px 28px;font-size:14px;font-weight:700;text-decoration:none;
  margin-top:8px;opacity:0;animation:fadeUp .4s ease forwards;animation-delay:.74s;
  min-height:48px;touch-action:manipulation;
  box-shadow:0 4px 16px rgba(29,185,84,.25)}
.sendback-cta{display:inline-flex;align-items:center;gap:6px;
  background:linear-gradient(135deg,#FF6B9D,#FFB347);color:#1a0a12;
  border-radius:999px;padding:14px 28px;font-size:14px;font-weight:700;text-decoration:none;
  margin-top:8px;opacity:0;animation:fadeUp .4s ease forwards;animation-delay:.88s;
  min-height:48px;touch-action:manipulation;margin-bottom:16px;
  box-shadow:0 4px 24px rgba(255,107,157,.3);
  font-family:'Plus Jakarta Sans',system-ui,sans-serif}

@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes popIn{0%{opacity:0;transform:scale(.7) rotate(-3deg)}70%{opacity:1;transform:scale(1.06) rotate(-1deg)}
  100%{opacity:1;transform:scale(1) rotate(-2deg)}}

#confetti{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100}

.error-state{text-align:center;padding:40px 20px}
.error-emoji{font-size:48px;margin-bottom:16px}
.error-title{font-size:20px;font-weight:700;margin-bottom:8px;color:#ffffff;
  font-family:'Plus Jakarta Sans',system-ui,sans-serif}
.error-sub{font-size:14px;color:#6b7280}
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
      </div>
      <div class="orb-hint" id="orbHint">tap to play</div>
    </div>
    <div class="mystery" id="mysteryLabel">??? \u00B7 ???</div>
    <div class="subtitle">no artist \u00B7 no title \u00B7 no skipping</div>

    <div class="scrubber" id="scrubber">
      <div class="scrub-track"><div class="scrub-fill" id="scrubFill"></div></div>
      <div class="scrub-times">
        <span id="elapsed">0:00</span>
        <span id="remaining">0:30</span>
      </div>
    </div>

    <div class="reactions" id="reactions">
      <button class="react-btn btn-vibe" id="btnVibe" onclick="react('VIBE')">\u{1F44D} Vibe</button>
      <button class="react-btn btn-nope" id="btnNope" onclick="react('NOPE')">\u{1F44E} Nope</button>
    </div>

    <div class="hint" id="hint"></div>
  </div>

  <div id="revealSection" class="reveal">
    <div class="wordmark">Que<span class="dot">.</span></div>
    <div class="reveal-label">The song was...</div>
    <div class="album-art-wrap" id="albumArtWrap">
      <img class="album-art" id="revealArt" src="" alt="">
      <div class="album-play-pause" id="albumPlayPause">
        <svg id="revealPlayPauseIcon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </div>
    </div>
    <div class="reveal-title" id="revealTitle"></div>
    <div class="reveal-meta" id="revealMeta"></div>
    <div class="reaction-badge" id="revealBadge"></div>
    <a class="spotify-cta" id="spotifyCta" href="#" target="_blank" rel="noopener">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
      Open in Spotify
    </a>
    <a class="sendback-cta" id="sendbackCta" href="/send">\u{1F3B5} Que one back</a>
  </div>
</div>

<script>
(function(){
  var vibeId, vibeData, audio, currentReaction = null, playing = false, revealed = false;
  var clipTimeout = null, progressInterval = null;
  var API = location.origin;

  var $loading = document.getElementById('loading');
  var $error = document.getElementById('error');
  var $landing = document.getElementById('landing');
  var $revealSection = document.getElementById('revealSection');
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
  var $revealArt = document.getElementById('revealArt');
  var $albumArtWrap = document.getElementById('albumArtWrap');
  var $revealPlayPauseIcon = document.getElementById('revealPlayPauseIcon');
  var $revealTitle = document.getElementById('revealTitle');
  var $revealMeta = document.getElementById('revealMeta');
  var $revealBadge = document.getElementById('revealBadge');
  var $spotifyCta = document.getElementById('spotifyCta');
  var $sendbackCta = document.getElementById('sendbackCta');

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

  fetch(API + '/vibes/' + vibeId)
    .then(function(r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(function(data) {
      vibeData = data;
      $loading.style.display = 'none';
      $landing.style.display = 'flex';
      $fromTag.textContent = data.senderDisplayName + " que'd you a song \\u{1F440}";
    })
    .catch(function(err) {
      if (err.message === '404') {
        showError('\\u{1F4A8}', 'This clip has expired', 'Mystery clips only last 72 hours.');
      } else {
        showError('\\u{1F635}', 'Something went wrong', 'Check your connection and try again.');
      }
    });

  function startPlayback() {
    playing = true;
    $orbEmoji.style.opacity = '0';
    $orbBars.classList.add('active');
    $orbHint.textContent = '';
    $scrubber.classList.add('active');
    $reactions.classList.add('active');
    $hint.textContent = 'artist reveals at the end';

    var audioUrl = API + '/vibes/' + vibeId + '/audio';
    audio = new Audio();
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');
    audio.crossOrigin = 'anonymous';
    audio.src = audioUrl;
    document.body.appendChild(audio);
    audio.play().then(function() {
      clipTimeout = setTimeout(function() {
        if (audio && !audio.paused) { audio.pause(); }
      }, 30000);
    }).catch(function() {
      $hint.textContent = 'could not play audio \\u2014 try opening in browser';
    });
    startClipTimer(30);
  }

  $orbWrap.addEventListener('click', function() {
    if (revealed) return;
    if (!vibeData) return;

    if (playing) {
      if (audio) {
        if (audio.paused) { audio.play(); $orbBars.classList.add('active'); }
        else { audio.pause(); $orbBars.classList.remove('active'); }
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
      body: JSON.stringify({reaction: type})
    }).catch(function(){});
  };

  function onClipEnd() {
    if (revealed) return;
    revealed = true;
    clearTimeout(clipTimeout);
    clearInterval(progressInterval);
    if (audio) { try { audio.pause(); } catch(e){} }
    $orbBars.classList.remove('active');

    setTimeout(function() { triggerReveal(); }, 400);
  }

  function triggerReveal() {
    fetch(API + '/vibes/' + vibeId + '/reveal')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        $landing.style.display = 'none';
        $revealSection.classList.add('active');

        $revealArt.src = data.albumArt;
        $revealTitle.textContent = data.title;
        $revealMeta.textContent = data.artist + ' \\u00B7 ' + data.albumName;
        $spotifyCta.href = data.spotifyUrl;

        var reaction = data.reaction || currentReaction;
        if (reaction === 'VIBE') {
          $revealBadge.textContent = '\\u{1F44D} You vibed with this';
          $revealBadge.className = 'reaction-badge badge-vibe';
        } else if (reaction === 'NOPE') {
          $revealBadge.textContent = '\\u{1F44E} Not your vibe \\u2014 fair enough';
          $revealBadge.className = 'reaction-badge badge-nope';
        } else {
          $revealBadge.style.display = 'none';
        }

        if (reaction === 'VIBE') {
          setTimeout(launchConfetti, 780);
        }
      })
      .catch(function() {
        showError('\\u{1F635}', 'Reveal failed', 'Something went wrong loading the track info.');
      });
  }

  // Play/pause on revealed album art
  function updateRevealPlayPause(paused) {
    if (!$revealPlayPauseIcon) return;
    $revealPlayPauseIcon.innerHTML = paused
      ? '<path d="M8 5v14l11-7z"/>'
      : '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
  }
  $albumArtWrap.addEventListener('click', function() {
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      updateRevealPlayPause(false);
    } else {
      audio.pause();
      updateRevealPlayPause(true);
    }
  });

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
    }
  });
})();
</script>
</body>
</html>`;

