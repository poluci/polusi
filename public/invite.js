// Сайт-приглашение: обратный отсчёт, анкета и то, что гость делает руками: переворачивает открытку, достаёт пластинку, перебирает снимки,
// отрывает корешок билета; в календаре день обводится, когда до него докрутили
(function () {
  var embedded = window.self !== window.top;
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  var form = document.querySelector('.rsvp');
  if (form) {
    var sync = function () { form.classList.toggle('no', form.querySelector('input[name=attending][value=no]').checked); };
    form.addEventListener('change', sync);
    sync();
  }

  // Открытка: лицо и оборот. В предпросмотре конструктора сразу показываем оборот с текстом.
  var card = document.querySelector('.postcard');
  if (card) {
    var flip = function () {
      var on = card.classList.toggle('flipped');
      card.setAttribute('aria-pressed', on ? 'true' : 'false');
    };
    if (embedded) card.classList.add('flipped');
    card.addEventListener('click', flip);
    card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
  }

  // Билет: корешок отрывается и ведёт к анкете
  var stub = document.querySelector('.ticket-stub');
  if (stub) {
    stub.addEventListener('click', function (e) {
      var rsvp = document.getElementById('rsvp');
      if (!rsvp || calm) return;
      e.preventDefault();
      stub.closest('.ticket').classList.add('torn');
      setTimeout(function () { rsvp.scrollIntoView({ behavior: 'smooth' }); }, 650);
    });
  }

  // Календарь: день праздника обводится, когда месяц появился на экране
  var month = document.querySelector('.month');
  if (month && !calm && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-ready');
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { month.classList.add('drawn'); io.disconnect(); }
    }, { threshold: .6 });
    io.observe(month);
  }

  var onPress = function (el, fn) {
    el.addEventListener('click', fn);
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
  };

  // Пластинка: по нажатию диск выезжает из конверта и крутится
  var record = document.querySelector('.record');
  if (record) onPress(record, function () {
    var on = record.classList.toggle('out');
    record.setAttribute('aria-pressed', on ? 'true' : 'false');
  });

  // Полароид: верхний снимок уходит в сторону и ложится под низ стопки
  var stack = document.querySelector('.stack');
  if (stack) {
    var snaps = [].slice.call(stack.querySelectorAll('.snap')).reverse();
    var busy = false;
    onPress(stack, function () {
      if (busy) return;
      busy = true;
      snaps[0].classList.add('away');
      setTimeout(function () {
        snaps.push(snaps.shift());
        snaps.forEach(function (s, i) { s.classList.remove('s0', 's1', 's2', 'away'); s.classList.add('s' + i); });
        busy = false;
      }, calm ? 0 : 420);
    });
  }

  // Плакат: цифры даты набегают от нуля
  var nums = document.querySelectorAll('.pl-date [data-to]');
  if (nums.length && !calm) {
    var t0 = performance.now();
    var run = function (now) {
      var k = Math.min(1, (now - t0) / 1100), ease = 1 - Math.pow(1 - k, 4);
      [].forEach.call(nums, function (el) { el.textContent = String(Math.round(ease * Number(el.dataset.to))).padStart(2, '0'); });
      if (k < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }

  // Табло: каждая ячейка перещёлкивает буквы и останавливается на своей
  var flaps = document.querySelectorAll('.flap');
  if (flaps.length && !calm) {
    var ABC = 'АБВГДЕЖЗИКЛМНОПРСТУФЦЧШЭЯ', DIG = '0123456789';
    [].forEach.call(flaps, function (el, i) {
      var want = el.dataset.c, pool = /\d/.test(want) ? DIG : /[А-ЯЁA-Z]/.test(want) ? ABC : '';
      if (!pool) return;
      var left = 6 + (i % 7) + Math.floor(Math.random() * 6);
      el.classList.add('spin');
      var tick = setInterval(function () {
        if (--left <= 0) { clearInterval(tick); el.textContent = want; el.classList.remove('spin'); return; }
        el.textContent = pool[Math.floor(Math.random() * pool.length)];
      }, 70);
    });
  }

  // Чат: сообщения приходят по одному, перед входящими «печатает»
  var feed = document.querySelector('.chat-feed');
  if (feed && !calm && !embedded) {
    var msgs = [].slice.call(feed.querySelectorAll('.msg'));
    var typing = document.createElement('p');
    typing.className = 'typing';
    typing.setAttribute('aria-hidden', 'true');
    typing.innerHTML = '<i></i><i></i><i></i>';
    msgs.forEach(function (m) { m.classList.add('wait'); });
    var next = function (i) {
      if (i >= msgs.length) return;
      var m = msgs[i], incoming = m.classList.contains('in');
      if (incoming) feed.appendChild(typing);
      setTimeout(function () {
        if (typing.parentNode) typing.remove();
        m.classList.remove('wait');
        m.classList.add('pop');
        next(i + 1);
      }, incoming ? 650 + Math.min(900, m.textContent.length * 14) : 700);
    };
    setTimeout(function () { next(0); }, 300);
  }
})();
