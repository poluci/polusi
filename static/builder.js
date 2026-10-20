// Конструктор: живой предпросмотр в телефоне справа и превью загруженного фото
(function () {
  var form = document.getElementById('builder');
  var frame = document.querySelector('.preview iframe');
  if (!form) return;

  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var DAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  var LEADS = { wedding: 'Приглашаем на нашу свадьбу', birthday: 'Зову на день рождения', other: 'Приглашаем на праздник' };
  var photoUrl = '';

  var val = function (name) { var el = form.elements[name]; return el ? (el.value || '').trim() : ''; };
  var checked = function (name) { var el = form.querySelector('input[name=' + name + ']:checked'); return el ? el.value : ''; };

  function dateLine() {
    var d = val('date');
    if (!d) return '';
    var p = d.split('-').map(Number);
    var wd = DAYS[new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay()];
    return p[2] + ' ' + MONTHS[p[1] - 1] + ' ' + p[0] + ', ' + wd + (val('time') ? ', в ' + val('time') : '');
  }

  // Подменяет текст в приглашении внутри iframe; пустые поля оставляют пример
  function render() {
    var doc;
    try { doc = frame && frame.contentDocument; } catch (e) { return; }
    if (!doc || !doc.body) return;
    var set = function (sel, text) { var el = doc.querySelector(sel); if (el && text) el.textContent = text; };
    set('.cover-lead', LEADS[checked('kind')]);
    set('.cover-names', val('names'));
    set('.cover-date', dateLine());
    set('.venue', val('venue'));
    set('.address', val('address'));
    set('.message', val('message'));
    var cd = doc.querySelector('.countdown');
    if (cd && val('date')) cd.style.visibility = 'hidden';
    if (photoUrl) {
      var cover = doc.querySelector('.cover-photo');
      if (cover) cover.src = photoUrl;
    }
  }

  function fit() {
    var s = frame && frame.parentElement;
    if (s) frame.style.transform = 'scale(' + s.clientWidth / 390 + ')';
  }

  if (frame) {
    frame.addEventListener('load', render);
    fit();
    addEventListener('resize', fit);
  }

  form.addEventListener('input', render);
  form.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'theme' && frame) {
      frame.src = frame.src.replace(/\/i\/[a-z0-9-]+$/, '/i/demo-' + t.value);
    } else if (t.name === 'photo' && t.files && t.files[0]) {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      photoUrl = URL.createObjectURL(t.files[0]);
      var drop = t.closest('.drop'), img = drop.querySelector('.drop-img');
      img.src = photoUrl; img.hidden = false; drop.classList.add('has');
      drop.querySelector('.drop-text b').textContent = t.files[0].name;
    }
    render();
  });
})();
