// Главная: появление блоков, смена экрана в липком телефоне, живой отсчёт
(function () {
  // Превью-телефоны: приглашение рисуется в ширину 390 и ужимается под экран
  function fit() { document.querySelectorAll('.screen').forEach(function (s) { s.firstElementChild.style.transform = 'scale(' + s.clientWidth / 390 + ')'; }); }
  fit(); addEventListener('resize', fit);

  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px 15% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  var screens = document.querySelectorAll('.story-stage .screen');
  var steps = document.querySelectorAll('.step');
  var so = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      steps.forEach(function (s) { s.classList.toggle('active', s === e.target); });
      screens.forEach(function (s, i) { s.classList.toggle('on', i === +e.target.dataset.show); });
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach(function (s) { so.observe(s); });

  var c = document.querySelector('.count');
  if (c) {
    var t = Date.parse(c.dataset.date), b = c.querySelectorAll('b');
    var pad = function (n) { return String(n).padStart(2, '0'); };
    (function tick() {
      var d = Math.max(0, t - Date.now()) / 1000;
      b[0].textContent = Math.floor(d / 86400); b[1].textContent = pad(Math.floor(d / 3600) % 24);
      b[2].textContent = pad(Math.floor(d / 60) % 60); b[3].textContent = pad(Math.floor(d) % 60);
      setTimeout(tick, 1000);
    })();
  }
})();
