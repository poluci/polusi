// Обратный отсчёт и скрытие лишних полей анкеты, если гость не придёт
(function () {
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
    var sync = function () {
      var no = form.querySelector('input[name=attending][value=no]').checked;
      form.classList.toggle('no', no);
    };
    form.addEventListener('change', sync);
    sync();
  }
})();
