// Сайт-приглашение: обратный отсчёт, анкета и то, что гость делает руками: переворачивает открытку,
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
})();
