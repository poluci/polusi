// Сайт-приглашение: обратный отсчёт, анкета, появление блоков, конфетти и живая обложка у каждого шаблона
(function () {
  var root = document.documentElement;
  var theme = (document.body.className.match(/theme-([a-z]+)/) || [])[1] || '';
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var embedded = window.self !== window.top;
  var css = getComputedStyle(document.body);
  var mark = css.getPropertyValue('--mark').trim() || '#ffd34d';
  var ink = css.getPropertyValue('--ink').trim() || '#222';
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  // ---------- отсчёт ----------
  var box = document.querySelector('.countdown');
  if (box) {
    var target = new Date(box.dataset.date).getTime();
    var labels = [['день', 'дня', 'дней'], ['час', 'часа', 'часов'], ['минута', 'минуты', 'минут']];
    var plural = function (n, f) {
      var a = n % 100, b = n % 10;
      return a > 10 && a < 20 ? f[2] : b > 1 && b < 5 ? f[1] : b === 1 ? f[0] : f[2];
    };
    var tick = function () {
      var left = Math.max(0, target - Date.now());
      if (!left) { box.innerHTML = ''; return; }
      var parts = [Math.floor(left / 864e5), Math.floor(left / 36e5) % 24, Math.floor(left / 6e4) % 60];
      box.innerHTML = parts.map(function (n, i) { return '<div><b>' + n + '</b><span>' + plural(n, labels[i]) + '</span></div>'; }).join('');
    };
    tick();
    setInterval(tick, 30000);
  }

  // ---------- появление блоков при прокрутке ----------
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !calm) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  // ---------- конфетти ----------
  function confetti(x, y, count) {
    if (calm) return;
    var c = document.createElement('canvas'), g = c.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2);
    c.className = 'confetti';
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    document.body.appendChild(c);
    g.scale(dpr, dpr);
    var colors = [mark, ink, '#ffffff', '#ff7aa2', '#7ad3ff'];
    var ps = [];
    for (var i = 0; i < (count || 140); i++) {
      var a = rnd(-Math.PI, 0), v = rnd(4, 13);
      ps.push({ x: x, y: y, vx: Math.cos(a) * v * rnd(.4, 1), vy: Math.sin(a) * v, r: rnd(0, 6.3), vr: rnd(-.3, .3), w: rnd(6, 11), h: rnd(3, 6), c: colors[i % colors.length] });
    }
    var t0 = performance.now();
    (function frame(t) {
      g.clearRect(0, 0, innerWidth, innerHeight);
      ps.forEach(function (p) {
        p.vy += .28; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore();
      });
      if (t - t0 < 3200) requestAnimationFrame(frame); else c.remove();
    })(t0);
  }

  // ---------- анкета ----------
  var form = document.querySelector('.rsvp');
  if (form) {
    var sync = function () { form.classList.toggle('no', form.querySelector('input[name=attending][value=no]').checked); };
    form.addEventListener('change', function (e) {
      sync();
      if (e.target.name === 'attending' && e.target.value === 'yes') {
        var r = e.target.nextElementSibling.getBoundingClientRect();
        confetti(r.left + r.width / 2, r.top, 80);
      }
    });
    sync();
  }
  if (/[?&]ok=yes/.test(location.search)) setTimeout(function () { confetti(innerWidth / 2, innerHeight * .6, 200); }, 300);

  // ---------- живые обложки ----------
  var cover = document.querySelector('.cover');
  var fx = document.querySelector('.fx');
  if (!cover || !fx) return;

  // Холст на всю обложку, рисует только пока обложка на экране
  function canvasLoop(draw, setup) {
    var c = document.createElement('canvas'), g = c.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2), w, h, state;
    fx.appendChild(c);
    function size() { w = cover.clientWidth; h = cover.clientHeight; c.width = w * dpr; c.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); state = setup(w, h); }
    size();
    addEventListener('resize', size);
    var on = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) requestAnimationFrame(loop); }).observe(cover);
    function loop(t) { if (!on) return; g.clearRect(0, 0, w, h); draw(g, w, h, state, t); if (!calm) requestAnimationFrame(loop); }
    requestAnimationFrame(loop);
  }

  var pointer = { x: 0, y: 0 };
  cover.addEventListener('pointermove', function (e) {
    var r = cover.getBoundingClientRect();
    pointer.x = (e.clientX - r.left) / r.width - .5; pointer.y = (e.clientY - r.top) / r.height - .5;
    cover.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    cover.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
  addEventListener('deviceorientation', function (e) {
    if (e.gamma == null) return;
    pointer.x = Math.max(-.5, Math.min(.5, e.gamma / 60)); pointer.y = Math.max(-.5, Math.min(.5, (e.beta - 45) / 60));
  });

  function spans(n, cls, each) {
    var out = '';
    for (var i = 0; i < n; i++) out += '<span class="' + cls + '" style="' + each(i) + '"></span>';
    fx.insertAdjacentHTML('beforeend', out);
  }

  var effects = {
    // Конверт: печать, клапан, письмо выезжает и превращается в обложку
    konvert: function () {
      if (embedded || calm || sessionStorage.getItem('opened-' + location.pathname)) return;
      var gate = document.createElement('div');
      gate.className = 'gate';
      gate.innerHTML = '<div class="env"><div class="env-back"></div><div class="env-letter"><span>' + (document.querySelector('.cover-names') || {}).textContent + '</span></div><div class="env-front"></div><div class="env-flap"></div><button class="seal" type="button" aria-label="Открыть приглашение">❦</button></div><p class="gate-hint">Нажмите на печать</p>';
      document.body.appendChild(gate);
      root.classList.add('locked');
      var open = function () {
        gate.classList.add('open');
        try { sessionStorage.setItem('opened-' + location.pathname, '1'); } catch (e) {}
        setTimeout(function () { gate.classList.add('gone'); root.classList.remove('locked'); }, 1700);
        setTimeout(function () { gate.remove(); }, 2600);
      };
      gate.addEventListener('click', open, { once: true });
    },

    // Море: три слоя волн и пузырьки
    more: function () {
      fx.insertAdjacentHTML('beforeend', [1, 2, 3].map(function (i) {
        return '<svg class="wave w' + i + '" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0 60 Q150 ' + (20 + i * 8) + ' 300 60 T600 60 T900 60 T1200 60 V120 H0Z"/></svg>';
      }).join(''));
      spans(18, 'bubble', function () { var s = rnd(4, 14); return 'left:' + rnd(0, 100) + '%;width:' + s + 'px;height:' + s + 'px;animation-duration:' + rnd(6, 14) + 's;animation-delay:-' + rnd(0, 14) + 's'; });
    },

    // Неон: свет за пальцем
    neon: function () { fx.innerHTML = '<span class="spot"></span>'; },

    // Цветение: лепестки падают и кружатся
    sakura: function () {
      canvasLoop(function (g, w, h, ps) {
        ps.forEach(function (p) {
          p.y += p.v; p.x += Math.sin((p.y + p.o) / 60) * .8 + pointer.x * 1.5; p.r += p.vr;
          if (p.y > h + 20) { p.y = -20; p.x = rnd(0, w); }
          if (p.x > w + 20) p.x = -20; if (p.x < -20) p.x = w + 20;
          g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(1, Math.abs(Math.cos(p.r * 1.3)) * .6 + .4);
          g.fillStyle = p.c; g.beginPath(); g.ellipse(0, 0, p.s, p.s * .62, 0, 0, 6.3); g.fill(); g.restore();
        });
      }, function (w, h) {
        var ps = [];
        for (var i = 0; i < 46; i++) ps.push({ x: rnd(0, w), y: rnd(-h, h), v: rnd(.5, 1.4), o: rnd(0, 400), r: rnd(0, 6), vr: rnd(-.03, .03), s: rnd(5, 10), c: ['#ffc4d6', '#ffb0c8', '#ffe3ec', '#f79ab8'][i % 4] });
        return ps;
      });
    },

    // Плёнка: перфорация, зерно и печатная машинка для имён
    kino: function () {
      fx.innerHTML = '<span class="perf l"></span><span class="perf r"></span><span class="grain"></span><span class="leader">3</span>';
      var n = document.querySelector('.cover-names');
      if (!n || calm || embedded) return;
      var text = n.textContent; n.setAttribute('aria-label', text); n.textContent = '';
      var i = 0;
      setTimeout(function type() { n.textContent = text.slice(0, ++i); if (i < text.length) setTimeout(type, rnd(60, 140)); else n.classList.add('typed'); }, 900);
    },

    // Звёздное небо: мерцание, параллакс за пальцем или наклоном телефона, падающие звёзды
    zvezdy: function () {
      canvasLoop(function (g, w, h, s, t) {
        s.px += (pointer.x - s.px) * .05; s.py += (pointer.y - s.py) * .05;
        s.stars.forEach(function (p) {
          var a = .45 + .55 * Math.sin(t / 900 * p.tw + p.o);
          g.globalAlpha = a; g.fillStyle = p.c;
          g.beginPath(); g.arc(p.x - s.px * p.z * 40, p.y - s.py * p.z * 40, p.r, 0, 6.3); g.fill();
        });
        g.globalAlpha = 1;
        var m = s.meteor;
        if (!m && Math.random() < .006) m = s.meteor = { x: rnd(w * .2, w), y: rnd(0, h * .4), l: 0 };
        if (m) {
          m.l += 1;
          var x = m.x - m.l * 9, y = m.y + m.l * 4.5, grd = g.createLinearGradient(x, y, x + 90, y - 45);
          grd.addColorStop(0, 'rgba(255,255,255,.95)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
          g.strokeStyle = grd; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 90, y - 45); g.stroke();
          if (m.l > 45) s.meteor = null;
        }
      }, function (w, h) {
        var stars = [];
        for (var i = 0; i < Math.round(w * h / 2600); i++) stars.push({ x: rnd(-20, w + 20), y: rnd(-20, h + 20), r: rnd(.3, 1.6), z: rnd(.2, 1), tw: rnd(.6, 2), o: rnd(0, 6), c: Math.random() < .15 ? '#ffe6a8' : '#ffffff' });
        return { stars: stars, px: 0, py: 0 };
      });
    },

    // Минимал: бегущая строка с именами
    minimal: function () {
      var n = (document.querySelector('.cover-names') || {}).textContent || '';
      var line = new Array(6).join('<span>' + n.replace(/</g, '&lt;') + '</span><i>✦</i>');
      fx.innerHTML = '<div class="run"><div>' + line + line + '</div></div>';
    },

    // Ретро: вращающееся солнце и полосы
    retro: function () { fx.innerHTML = '<span class="sun"></span><span class="stripes"></span>'; },

    // Акварель: пятна краски перетекают друг в друга
    akvarel: function () { spans(5, 'blob', function (i) { return 'animation-delay:-' + i * 3 + 's'; }); },

    // Детский: шарики летят вверх, нажмите — лопнет
    detsky: function () {
      var colors = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#c77dff', '#ff9f43'];
      spans(12, 'balloon', function (i) {
        return 'left:' + rnd(2, 88) + '%;--c:' + colors[i % colors.length] + ';animation-duration:' + rnd(9, 16) + 's;animation-delay:-' + rnd(0, 16) + 's;--s:' + rnd(.75, 1.15);
      });
      fx.addEventListener('click', function (e) {
        var b = e.target.closest('.balloon');
        if (!b || b.classList.contains('pop')) return;
        var r = b.getBoundingClientRect();
        b.classList.add('pop');
        confetti(r.left + r.width / 2, r.top + r.height / 3, 40);
        setTimeout(function () { b.classList.remove('pop'); b.style.animationDelay = '0s'; }, 600);
      });
    },

    // Диско: зеркальный шар и бегающие по стенам зайчики; нажмите — сменится свет
    disko: function () {
      fx.innerHTML = '<span class="ball"></span>';
      spans(26, 'dot', function () { return 'left:' + rnd(0, 100) + '%;top:' + rnd(0, 100) + '%;animation-duration:' + rnd(3, 7) + 's;animation-delay:-' + rnd(0, 7) + 's;--hue:' + Math.round(rnd(0, 360)) + 'deg'; });
      var hue = 0;
      cover.addEventListener('click', function () { hue = (hue + 70) % 360; fx.style.filter = 'hue-rotate(' + hue + 'deg)'; });
    },

    // Афиша: блёстки следуют за пальцем
    noch: function () {
      cover.addEventListener('pointermove', function (e) {
        if (calm || Math.random() > .5) return;
        var r = cover.getBoundingClientRect(), s = document.createElement('span');
        s.className = 'spark'; s.style.left = (e.clientX - r.left) + 'px'; s.style.top = (e.clientY - r.top) + 'px';
        fx.appendChild(s); setTimeout(function () { s.remove(); }, 900);
      });
    },
  };

  if (effects[theme]) effects[theme]();
})();
