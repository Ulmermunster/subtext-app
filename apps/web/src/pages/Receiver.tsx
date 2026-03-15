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
<meta name="theme-color" content="#FFF8E7">
<title>Que. — The Blind Taste Test</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:linear-gradient(180deg,#FFF8E7 0%,#FFFBF0 40%,#FFF3D0 100%);
  font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;
  -webkit-font-smoothing:antialiased;min-height:100vh;min-height:100dvh;overflow-x:hidden;color:#1A1A2E;
  -webkit-text-size-adjust:100%}
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.container{max-width:100%;width:100%;margin:0 auto;
  padding:max(20px,env(safe-area-inset-top)) 20px max(20px,env(safe-area-inset-bottom));
  position:relative;z-index:1;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:100vh;min-height:100dvh}

.blob{position:fixed;border-radius:50%;pointer-events:none;z-index:0}
.blob-1{top:-120px;right:-80px;width:400px;height:400px;
  background:radial-gradient(circle,rgba(245,166,35,.15) 0%,transparent 70%)}
.blob-2{bottom:-100px;left:-60px;width:350px;height:350px;
  background:radial-gradient(circle,rgba(255,217,106,.12) 0%,transparent 70%)}

.wordmark{font-size:18px;font-weight:800;color:#1A1A2E;letter-spacing:-.5px;margin-bottom:16px}
.wordmark .dot{color:#F5A623}

.from-tag{font-size:15px;font-weight:600;color:#1A1A2E;margin-bottom:24px;text-align:center;padding:0 16px}

.orb-wrap{position:relative;width:180px;height:180px;margin-bottom:16px;cursor:pointer;
  -webkit-tap-highlight-color:transparent;user-select:none;touch-action:manipulation}
.orb{width:180px;height:180px;border-radius:50%;
  background:linear-gradient(135deg,#F5A623,#FFD96A);
  border:4px solid #fff;display:flex;align-items:center;justify-content:center;
  position:relative;z-index:2;transition:transform .3s ease;
  box-shadow:0 0 60px rgba(245,166,35,.2)}
.orb:active{transform:scale(.96)}
.orb-emoji{font-size:48px;transition:opacity .3s ease}
.orb-hint{position:absolute;bottom:-28px;left:0;right:0;text-align:center;
  font-size:13px;color:#9CA3AF;font-weight:600}

.ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  border-radius:50%;border:1.5px solid rgba(245,166,35,.25);z-index:1;
  animation:pulse 2.5s ease-out infinite}
.ring-1{width:210px;height:210px}
.ring-2{width:240px;height:240px;animation-delay:.4s}
@keyframes pulse{0%{transform:translate(-50%,-50%) scale(.95);opacity:.6}
  100%{transform:translate(-50%,-50%) scale(1.15);opacity:0}}

.mystery{font-size:16px;font-weight:700;color:#9CA3AF;margin:20px 0 4px;letter-spacing:1px}
.subtitle{font-size:11px;color:#9CA3AF;font-weight:500}

.orb-bars{display:flex;align-items:center;gap:3px;height:60px;opacity:0;
  position:absolute;transition:opacity .4s ease}
.orb-bars.active{opacity:1}
.orb-bar{width:4px;border-radius:2px;background:#1A1A2E;
  animation:wave 1.2s ease-in-out infinite alternate}
@keyframes wave{0%{height:12px}100%{height:var(--h,40px)}}

.scrubber{width:100%;max-width:280px;margin:12px 0;opacity:0;transition:opacity .3s ease}
.scrubber.active{opacity:1}
.scrub-track{width:100%;height:4px;background:#F0E6C8;border-radius:2px;overflow:hidden}
.scrub-fill{height:100%;background:linear-gradient(90deg,#F5A623,#FFD96A);border-radius:2px;transition:width .3s linear}
.scrub-times{display:flex;justify-content:space-between;margin-top:4px;
  font-size:11px;color:#9CA3AF;font-weight:500}

.reactions{display:flex;gap:12px;margin:20px 0;opacity:0;transform:translateY(20px);
  transition:opacity .4s ease,transform .4s ease;width:100%;max-width:320px;justify-content:center}
.reactions.active{opacity:1;transform:translateY(0)}
.react-btn{border:none;border-radius:999px;padding:14px 0;font-size:16px;font-weight:700;
  cursor:pointer;transition:transform .15s ease,box-shadow .15s ease;
  display:flex;align-items:center;justify-content:center;gap:8px;font-family:inherit;
  flex:1;min-height:48px;touch-action:manipulation}
.react-btn:active{transform:scale(.95)}
.btn-vibe{background:#10B981;color:#fff}
.btn-vibe.selected{box-shadow:0 0 0 3px rgba(16,185,129,.4)}
.btn-nope{background:#F97316;color:#fff}
.btn-nope.selected{box-shadow:0 0 0 3px rgba(249,115,22,.4)}

.hint{font-size:12px;color:#9CA3AF;font-weight:500;text-align:center;
  margin:4px 0;transition:opacity .3s ease}

.reveal{display:none;flex-direction:column;align-items:center;gap:8px;width:100%;
  padding:0 16px}
.reveal.active{display:flex}
.reveal-label{font-size:14px;color:#9CA3AF;font-weight:600;
  opacity:0;animation:fadeUp .5s ease forwards}
.album-art{width:min(200px,50vw);height:min(200px,50vw);border-radius:20px;object-fit:cover;
  box-shadow:0 8px 40px rgba(0,0,0,.12);border:4px solid #fff;
  opacity:0;transform:scale(.7) rotate(-3deg);
  animation:popIn .5s cubic-bezier(.34,1.56,.64,1) forwards;animation-delay:.15s}
.reveal-title{font-size:24px;font-weight:800;color:#1A1A2E;text-align:center;
  opacity:0;animation:fadeUp .4s ease forwards;animation-delay:.34s;
  overflow-wrap:break-word;word-break:break-word;max-width:100%}
.reveal-meta{font-size:14px;color:#9CA3AF;font-weight:500;text-align:center;
  opacity:0;animation:fadeUp .4s ease forwards;animation-delay:.46s;
  overflow-wrap:break-word;word-break:break-word;max-width:100%}
.reaction-badge{border-radius:999px;padding:10px 24px;font-size:14px;font-weight:700;
  opacity:0;animation:fadeUp .4s ease forwards;animation-delay:.58s}
.badge-vibe{background:rgba(16,185,129,.1);color:#10B981}
.badge-nope{background:rgba(249,115,22,.1);color:#F97316}
.spotify-cta{display:inline-flex;align-items:center;gap:8px;background:#1DB954;color:#fff;
  border-radius:999px;padding:14px 28px;font-size:14px;font-weight:700;text-decoration:none;
  margin-top:8px;opacity:0;animation:fadeUp .4s ease forwards;animation-delay:.74s;
  min-height:48px;touch-action:manipulation}
.sendback-cta{display:inline-flex;align-items:center;gap:6px;background:#1A1A2E;color:#fff;
  border-radius:999px;padding:14px 28px;font-size:14px;font-weight:700;text-decoration:none;
  margin-top:8px;opacity:0;animation:fadeUp .4s ease forwards;animation-delay:.88s;
  min-height:48px;touch-action:manipulation;margin-bottom:16px}

@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes popIn{0%{opacity:0;transform:scale(.7) rotate(-3deg)}70%{opacity:1;transform:scale(1.06) rotate(-1deg)}
  100%{opacity:1;transform:scale(1) rotate(-2deg)}}

#confetti{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100}

.error-state{text-align:center;padding:40px 20px}
.error-emoji{font-size:48px;margin-bottom:16px}
.error-title{font-size:20px;font-weight:700;margin-bottom:8px}
.error-sub{font-size:14px;color:#9CA3AF}

.vis-hidden{visibility:hidden;position:absolute;pointer-events:none}
</style>
</head>
<body>
<div class="blob blob-1"></div>
<div class="blob blob-2"></div>
<canvas id="confetti"></canvas>

<div class="container">
  <div id="loading" class="error-state">
    <div style="width:24px;height:24px;border:2px solid #F0E6C8;border-top-color:#F5A623;
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
        <span class="orb-emoji" id="orbEmoji">\\u{1F3B5}</span>
        <div class="orb-bars" id="orbBars"></div>
      </div>
      <div class="orb-hint" id="orbHint">tap to play</div>
    </div>
    <div class="mystery" id="mysteryLabel">??? \\u00B7 ???</div>
    <div class="subtitle">no artist \\u00B7 no title \\u00B7 no skipping</div>

    <div class="scrubber" id="scrubber">
      <div class="scrub-track"><div class="scrub-fill" id="scrubFill"></div></div>
      <div class="scrub-times">
        <span id="elapsed">0:00</span>
        <span id="remaining">0:30</span>
      </div>
    </div>

    <div class="reactions" id="reactions">
      <button class="react-btn btn-vibe" id="btnVibe" onclick="react('VIBE')">\\u{1F44D} Vibe</button>
      <button class="react-btn btn-nope" id="btnNope" onclick="react('NOPE')">\\u{1F44E} Nope</button>
    </div>

    <div class="hint" id="hint"></div>
  </div>

  <div id="revealSection" class="reveal">
    <div class="wordmark">Que<span class="dot">.</span></div>
    <div class="reveal-label">The song was...</div>
    <img class="album-art" id="revealArt" src="" alt="">
    <div class="reveal-title" id="revealTitle"></div>
    <div class="reveal-meta" id="revealMeta"></div>
    <div class="reaction-badge" id="revealBadge"></div>
    <a class="spotify-cta" id="spotifyCta" href="#" target="_blank" rel="noopener">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
      Open in Spotify
    </a>
    <a class="sendback-cta" id="sendbackCta" href="/send">\\u{1F3B5} Que one back</a>
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

      if (data.previewUrl) {
        audio = new Audio();
        audio.preload = 'auto';
        audio.setAttribute('playsinline', '');
        audio.setAttribute('webkit-playsinline', '');
        audio.src = data.previewUrl;
        audio.load();
      }
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

    if (audio) {
      var playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(function() {
          clipTimeout = setTimeout(function() {
            if (audio && !audio.paused) { audio.pause(); }
          }, 30000);
        }).catch(function() {
          setupEmbed();
        });
      }
    } else {
      setupEmbed();
    }
    startClipTimer(30);
  }

  $orbWrap.addEventListener('click', function() {
    if (revealed) return;
    if (!vibeData) return;

    if (playing) {
      if (audio) {
        if (audio.paused) {
          audio.play();
          $orbBars.classList.add('active');
        } else {
          audio.pause();
          $orbBars.classList.remove('active');
        }
      }
      return;
    }

    startPlayback();
  });

  function setupEmbed() {
    var iframe = document.createElement('iframe');
    var src = 'https://open.spotify.com/embed/track/' + vibeData.spotifyId +
      '?utm_source=generator&theme=0';
    if (vibeData.mode === 'PICK' && vibeData.startSec) {
      src += '&t=' + vibeData.startSec;
    }
    iframe.src = src;
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:300px;height:80px;border:0;opacity:0.01';
    document.body.appendChild(iframe);
  }

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

  function launchConfetti() {
    var canvas = document.getElementById('confetti');
    var ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var colors = ['#F5A623','#FFD96A','#F97316','#10B981','#3B82F6','#EC4899'];
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
})();
</script>
</body>
</html>`;
