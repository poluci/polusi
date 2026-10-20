// HTML-шаблоны страниц. Всё, что пришло от пользователя, проходит через esc().
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const BRAND = 'Позови';
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const THEMES = { klassika: 'Усадьба', sad: 'Белые ночи', noch: 'Афиша' };
const KINDS = { wedding: 'Свадьба', birthday: 'День рождения', other: 'Другой праздник' };

function formatDate(iso, withWeekday = true) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${d} ${MONTHS[m - 1]} ${y}` + (withWeekday ? `, ${WEEKDAYS[dt.getUTCDay()]}` : '');
}

const plural = (n, one, few, many) => {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
};

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Lora:ital,wght@0,400;0,600;1,400&family=Playfair+Display:wght@400;600&family=Golos+Text:wght@400;500;600&family=Forum&family=Yeseva+One&family=Unbounded:wght@800&display=swap" rel="stylesheet">';

function page({ title, body, css = 'app.css', head = '', bodyClass = '', fonts = null }) {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
${head}
${fonts ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?${fonts}&display=swap" rel="stylesheet">` : FONTS}
<link rel="stylesheet" href="/static/${css}">
</head>
<body class="${bodyClass}">
${body}
</body>
</html>`;
}

const header = () => `<header class="top"><a class="logo" href="/">${BRAND}</a><nav><a href="/#examples">Примеры</a><a href="/#prices">Цены</a><a class="btn btn-sm" href="/new">Создать</a></nav></header>`;
const footer = () => `<footer class="foot"><span>© ${new Date().getFullYear()} ${BRAND}</span><a href="/privacy">Политика конфиденциальности</a></footer>`;

// ---------- лендинг ----------

const LANDING_FONTS = 'family=Onest:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@1,500';

function landing() {
  const screen = (slug, title, extra = '') => `<span class="screen ${extra}"><iframe src="/i/${slug}" title="${title}" tabindex="-1" loading="lazy" aria-hidden="true"></iframe></span>`;
  const ticker = [
    ['Анна и Михаил', '19.06', 'Архангельское'], ['Катя, 30', '12.12', 'Большая Дмитровка'], ['Полина и Денис', '24.07', 'Финский залив'],
    ['Юбилей бабушки Нины', '03.03', 'Казань'], ['Лиза и Артём', '08.08', 'Сочи'], ['Мише 7 лет', '15.05', 'Екатеринбург'],
    ['Вера и Олег', '21.09', 'Суздаль'], ['Выпускной 11 «Б»', '27.06', 'Новосибирск'],
  ].map(([n, d, c]) => `<li><b>${n}</b><span>${d}</span><span>${c}</span></li>`).join('');
  const body = `
<header class="nav">
  <a class="logo" href="/"><span class="logo-mark"></span>${BRAND}</a>
  <nav><a href="#how">Как работает</a><a href="#features">Возможности</a><a href="#prices">Цены</a></nav>
  <a class="btn btn-dark btn-sm" href="/new">Создать</a>
</header>

<main>
  <section class="hero">
    <a class="badge reveal" href="#features"><span class="dot"></span>Ссылка приходит в Telegram с фото пары</a>
    <h1 class="reveal">Приглашение,<br>которое <i>хочется</i><br>открыть</h1>
    <p class="hero-sub reveal">Сайт вашей свадьбы или праздника за 10 минут. Гости отвечают по ссылке, вы видите ответы в таблице.</p>
    <div class="hero-cta reveal"><a class="btn btn-dark" href="/new">Создать бесплатно</a><a class="btn btn-ghost" href="/c/demo-kabinet">Открыть демо-кабинет</a></div>
    <div class="fan" aria-hidden="true">
      <a class="device d1" href="/i/demo-sad" target="_blank" tabindex="-1">${screen('demo-sad', 'Белые ночи')}</a>
      <a class="device d2" href="/i/demo-klassika" target="_blank" tabindex="-1">${screen('demo-klassika', 'Усадьба')}</a>
      <a class="device d3" href="/i/demo-noch" target="_blank" tabindex="-1">${screen('demo-noch', 'Афиша')}</a>
    </div>
  </section>

  <div class="ticker" aria-hidden="true"><ul>${ticker}${ticker}</ul></div>

  <section id="how" class="story">
    <div class="story-text">
      <p class="eyebrow">Как это работает</p>
      <div class="step" data-show="0"><span class="num">01</span><h2>Расскажите о дне</h2><p>Имена, дата, место и программа. Загрузите любимое фото, а остальное мы сверстаем сами.</p></div>
      <div class="step" data-show="1"><span class="num">02</span><h2>Выберите настроение</h2><p>Усадьба, белые ночи или яркая афиша. Шрифты, цвета и движение уже подобраны под каждое.</p></div>
      <div class="step" data-show="2"><span class="num">03</span><h2>Отправьте ссылку</h2><p>Гости открывают приглашение с телефона, отвечают в анкете, и ответ сразу падает к вам в кабинет.</p></div>
    </div>
    <div class="story-stage">
      <div class="device device-lg">
        ${screen('demo-klassika', 'Усадьба', 'on')}
        ${screen('demo-sad', 'Белые ночи')}
        ${screen('demo-noch', 'Афиша')}
      </div>
    </div>
  </section>

  <section id="features" class="bento-wrap">
    <h2 class="big reveal">Всё, что нужно,<br>и ничего лишнего</h2>
    <div class="bento">
      <article class="tile t-answers reveal">
        <h3>Ответы гостей в одном месте</h3>
        <p>Кто придёт, сколько человек, меню и трансфер. Выгрузка в Excel одной кнопкой.</p>
        <div class="mini-table">
          <div class="row"><span class="av">ЕС</span><b>Елена Смирнова</b><em class="yes">+2</em></div>
          <div class="row"><span class="av">ИП</span><b>Игорь Петров</b><em class="yes">+1</em></div>
          <div class="row"><span class="av">БВ</span><b>Бабушка Валя</b><em class="yes">трансфер</em></div>
          <div class="row"><span class="av">СК</span><b>Ковалёвы</b><em class="no">не смогут</em></div>
        </div>
      </article>
      <article class="tile t-count reveal">
        <h3>Отсчёт до праздника</h3>
        <div class="count" data-date="2027-06-19T15:00:00+03:00"><span><b>242</b>дня</span><span><b>03</b>часа</span><span><b>29</b>минут</span><span><b>12</b>секунд</span></div>
      </article>
      <article class="tile t-chat reveal">
        <h3>Красивое превью в мессенджере</h3>
        <div class="bubble">
          <img src="/static/photos/sosny-cover.jpg" alt="" loading="lazy">
          <div><b>Полина и Денис</b><span>Приглашаем на нашу свадьбу. 24 июля, в 16:00</span></div>
        </div>
      </article>
      <article class="tile t-photo reveal">
        <img src="/static/photos/glavnaya-konfetti.jpg" alt="" loading="lazy">
        <h3>Ваше фото на обложке</h3>
      </article>
      <article class="tile t-palette reveal">
        <h3>Дресс-код и палитра</h3>
        <div class="swatches"><i style="background:#efe0a8"></i><i style="background:#c9a96e"></i><i style="background:#8a8f7a"></i><i style="background:#1f3a2e"></i></div>
      </article>
      <article class="tile t-map reveal">
        <h3>Место на карте</h3>
        <p>Маршрут в Яндекс Картах одним нажатием.</p>
        <div class="pin"></div>
      </article>
    </div>
  </section>

  <section id="prices" class="prices">
    <h2 class="big reveal">Платите один раз</h2>
    <p class="sub reveal">Без подписок. Сейчас сервис в тестовом режиме, и всё бесплатно.</p>
    <div class="plans">
      <div class="plan reveal"><h3>Праздник</h3><p class="sum">от 490 ₽</p><ul><li>День рождения, юбилей, корпоратив</li><li>Анкета гостя</li><li>Кабинет с ответами</li></ul><a class="btn btn-ghost" href="/new">Выбрать</a></div>
      <div class="plan plan-main reveal"><span class="tag">Чаще выбирают</span><h3>Свадьба</h3><p class="sum">1 990 ₽</p><ul><li>Сайт с вашими фото</li><li>Анкета, меню, трансфер</li><li>Выгрузка в Excel</li></ul><a class="btn btn-light" href="/new">Выбрать</a></div>
      <div class="plan reveal"><h3>Свадьба плюс</h3><p class="sum">3 490 ₽</p><ul><li>Всё из «Свадьбы»</li><li>Рассадка по столам</li><li>Напоминания гостям</li></ul><a class="btn btn-ghost" href="/new">Выбрать</a></div>
    </div>
  </section>

  <section class="faq">
    <h2 class="big reveal">Вопросы</h2>
    <div>
      <details><summary>Нужно ли гостям что-то устанавливать?</summary><p>Нет. Это обычная ссылка, она открывается на любом телефоне.</p></details>
      <details><summary>Можно ли изменить сайт после рассылки?</summary><p>Да. Ссылка останется той же, гости увидят обновления.</p></details>
      <details><summary>Сколько живёт сайт?</summary><p>Не меньше года после события.</p></details>
    </div>
  </section>

  <section class="final">
    <h2>Позовите <i>красиво</i></h2>
    <a class="btn btn-light" href="/new">Создать приглашение</a>
  </section>
</main>

<footer class="foot2"><span>© ${new Date().getFullYear()} ${BRAND}</span><a href="/privacy">Политика конфиденциальности</a><span>Фото в примерах: Unsplash</span></footer>
<script src="/static/landing.js" defer></script>`;
  return page({
    title: `${BRAND} — сайты-приглашения на свадьбу и праздники`,
    head: '<meta name="description" content="Красивый сайт-приглашение на свадьбу или праздник за 10 минут. Анкета гостя, программа, карта, ответы в таблице.">',
    css: 'landing.css',
    fonts: LANDING_FONTS,
    bodyClass: 'landing',
    body,
  });
}

// ---------- конструктор ----------

function builder({ event = {}, errors = [], editKey = null }) {
  const v = (k) => esc(event[k] || '');
  const opt = (map, cur) => Object.entries(map).map(([k, label]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${label}</option>`).join('');
  const themePick = Object.entries(THEMES)
    .map(([k, label]) => `<label class="theme-pick theme-pick-${k}"><input type="radio" name="theme" value="${k}"${(event.theme || 'klassika') === k ? ' checked' : ''}><span>${label}</span></label>`)
    .join('');
  const action = editKey ? `/c/${editKey}/edit` : '/new';
  const body = `
${header()}
<main class="narrow">
  <h1>${editKey ? 'Редактировать приглашение' : 'Новое приглашение'}</h1>
  ${event.demo ? '<p class="note">Это демо-приглашение, изменения в нём не сохраняются.</p>' : ''}
  ${errors.length ? `<div class="errors">${errors.map((e) => `<p>${esc(e)}</p>`).join('')}</div>` : ''}
  <form method="post" action="${action}" class="form" enctype="multipart/form-data">
    <fieldset>
      <legend>Событие</legend>
      <label>Тип события<select name="kind">${opt(KINDS, event.kind)}</select></label>
      <label>Имена или название<input name="names" value="${v('names')}" placeholder="Анна и Михаил" required maxlength="80"></label>
      <div class="row">
        <label>Дата<input type="date" name="date" value="${v('date')}" required></label>
        <label>Время<input type="time" name="time" value="${v('time')}"></label>
      </div>
    </fieldset>
    <fieldset>
      <legend>Фото</legend>
      ${event.photo ? `<img class="photo-now" src="/u/${esc(event.photo)}" alt="Текущее фото"><label class="inline"><input type="checkbox" name="removePhoto"> Убрать фото</label>` : ''}
      <label>${event.photo ? 'Заменить фото' : 'Фото для обложки'} <small>JPG, PNG или WebP до 8 МБ. Лучше вертикальное</small><input type="file" name="photo" accept="image/jpeg,image/png,image/webp"></label>
    </fieldset>
    <fieldset>
      <legend>Место</legend>
      <label>Название места<input name="venue" value="${v('venue')}" placeholder="Ресторан «Сад»"></label>
      <label>Адрес<input name="address" value="${v('address')}" placeholder="Москва, ул. Садовая, 1"></label>
    </fieldset>
    <fieldset>
      <legend>Текст</legend>
      <label>Обращение к гостям<textarea name="message" rows="4" placeholder="Дорогие друзья! Мы будем счастливы...">${v('message')}</textarea></label>
      <label>Программа дня <small>каждый пункт с новой строки, время в начале</small><textarea name="program" rows="4" placeholder="15:00 Сбор гостей&#10;16:00 Церемония">${v('program')}</textarea></label>
      <label>Дресс-код<textarea name="dresscode" rows="2">${v('dresscode')}</textarea></label>
      <label>Цвета праздника <small>через запятую, например #f3ece1, #c9a96e</small><input name="colors" value="${v('colors')}"></label>
      <label>Контакт для вопросов<input name="contact" value="${v('contact')}" placeholder="Организатор Ольга, +7 900 000-00-00"></label>
      <label>Ответить до<input type="date" name="deadline" value="${v('deadline')}"></label>
    </fieldset>
    <fieldset>
      <legend>Стиль</legend>
      <div class="themes">${themePick}</div>
    </fieldset>
    <button class="btn" type="submit"${event.demo ? ' disabled' : ''}>${editKey ? 'Сохранить' : 'Создать приглашение'}</button>
  </form>
</main>
${footer()}`;
  return page({ title: `${editKey ? 'Редактирование' : 'Новое приглашение'} — ${BRAND}`, body });
}

// ---------- сайт-приглашение ----------

const INVITE_FONTS = {
  klassika: 'family=Forum&family=Alegreya:ital,wght@0,400;0,500;1,400',
  sad: 'family=Yeseva+One&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;1,7..72,400',
  noch: 'family=Unbounded:wght@400;800&family=Manrope:wght@400;500;700',
};

const THEME_COLOR = { klassika: '#efe0a8', sad: '#d9e4e8', noch: '#6b0f2a' };

// Портик усадьбы: фронтон, антаблемент и шесть колонн одной линией
function porticoSvg() {
  const cols = [0, 1, 2, 3, 4, 5].map((i) => {
    const x = 46 + i * 46;
    return `<path d="M${x} 92v108M${x + 14} 92v108M${x - 4} 92h22M${x - 4} 200h22"/>`;
  }).join('');
  return `<svg class="portico" viewBox="0 0 340 214" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
    <path class="draw" d="M24 74 170 20 316 74Z"/><path class="draw" d="M60 66 170 30 280 66"/>
    <path class="draw" d="M24 74h292M28 82h284M24 92h292"/>
    <g class="draw">${cols}</g>
    <path class="draw" d="M14 200h312M6 208h328"/></svg>`;
}

// Кромка соснового леса: ряд елей разной высоты, у каждой три яруса веток
function pinesSvg() {
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const f = (n) => n.toFixed(1);
  const trees = [];
  let x = -10;
  while (x < 1220) {
    const w = 34 + rnd() * 34;
    const h = 60 + rnd() * 110;
    const base = 200 - rnd() * 18;
    const top = base - h;
    const cx = x;
    const tier = (k) => top + h * k;
    const left = [
      [cx, top], [cx - w * 0.22, tier(0.36)], [cx - w * 0.1, tier(0.36)], [cx - w * 0.36, tier(0.68)],
      [cx - w * 0.16, tier(0.68)], [cx - w * 0.5, tier(1)],
    ];
    const right = left.slice(1).reverse().map(([px, py]) => [2 * cx - px, py]);
    trees.push('M' + [...left, ...right].map(([px, py]) => `${f(px)} ${f(py)}`).join('L') + 'Z');
    x += w * (0.45 + rnd() * 0.4);
  }
  return `<svg class="pines" viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path d="${trees.join('')}M0 184H1200V220H0Z"/></svg>`;
}

function coverNames(e) {
  const m = e.theme === 'noch' && e.names.match(/^(.*?)[,\s]+(\d{1,3})$/);
  if (m) return `<span class="n-name">${esc(m[1])}</span><span class="n-num">${esc(m[2])}</span>`;
  return esc(e.names);
}

function invite(e, { baseUrl, ok }) {
  const dateLine = [formatDate(e.date), e.time ? `в ${e.time}` : ''].filter(Boolean).join(', ');
  const program = (e.program || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const mm = l.match(/^(\d{1,2}[:.]\d{2})\s*[-—–]?\s*(.*)$/);
      return mm
        ? `<li><time>${esc(mm[1].replace('.', ':'))}</time><span>${esc(mm[2])}</span></li>`
        : `<li><time></time><span>${esc(l)}</span></li>`;
    })
    .join('');
  const colors = (e.colors || '')
    .split(',')
    .map((c) => c.trim())
    .filter((c) => /^#[0-9a-fA-F]{3,8}$/.test(c))
    .map((c) => `<span class="swatch" style="background:${c}"></span>`)
    .join('');
  const mapUrl = e.address ? `https://yandex.ru/maps/?text=${encodeURIComponent(e.address)}` : '';
  const thanks =
    ok === 'yes' ? '<p class="thanks" role="status">Ответ получен. Ждём вас!</p>'
    : ok === 'no' ? '<p class="thanks" role="status">Ответ получен. Жаль, что не получится, будем скучать.</p>'
    : ok === 'err' ? '<p class="thanks thanks-err" role="alert">Ответ не отправлен: впишите имя и отметьте согласие на обработку данных.</p>'
    : '';
  const lead = e.kind === 'wedding' ? 'Приглашаем на нашу свадьбу' : e.kind === 'birthday' ? 'Зову на день рождения' : 'Приглашаем на праздник';
  const desc = `${lead}. ${dateLine}${e.venue ? '. ' + e.venue : ''}`;
  const ogImage = e.photo ? `${baseUrl}/u/${e.photo}` : e.photoUrl ? (e.photoUrl.startsWith('/') ? baseUrl + e.photoUrl : e.photoUrl) : '';
  const head = `
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(e.names)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(baseUrl)}/i/${esc(e.slug)}">
<meta property="og:site_name" content="${BRAND}">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
<meta name="theme-color" content="${THEME_COLOR[e.theme] || THEME_COLOR.klassika}">`;
  const photoSrc = e.photo ? `/u/${e.photo}` : e.photoUrl || '';
  const art = !photoSrc && e.theme === 'klassika' ? porticoSvg() : '';
  const horizon = !photoSrc && e.theme === 'sad' ? pinesSvg() : '';
  const photo = photoSrc ? `<img class="cover-photo" src="${esc(photoSrc)}" alt="" fetchpriority="high">` : '';
  const body = `
<header class="cover${photoSrc ? ' has-photo' : ''}">
  ${photo}
  ${art}
  <p class="cover-lead">${lead}</p>
  <h1 class="cover-names">${coverNames(e)}</h1>
  <p class="cover-date">${esc(dateLine)}</p>
  ${e.date ? `<div class="countdown" data-date="${esc(e.date)}T${esc(e.time || '12:00')}:00+03:00" aria-label="До праздника осталось"></div>` : ''}
  ${horizon}
</header>

<main class="sheet">
${e.message ? `<section class="block block-message"><p class="message">${esc(e.message).replace(/\n/g, '<br>')}</p></section>` : ''}

${(e.gallery || []).length ? `<figure class="gallery">${e.gallery.slice(0, 2).map((src) => `<img src="${esc(src)}" alt="" loading="lazy">`).join('')}</figure>` : ''}

${program ? `<section class="block"><h2>Как пройдёт день</h2><ol class="program">${program}</ol></section>` : ''}

${e.venue || e.address ? `<section class="block"><h2>Где</h2>
  ${e.venue ? `<p class="venue">${esc(e.venue)}</p>` : ''}
  ${e.address ? `<p class="address">${esc(e.address)}</p><a class="link-btn" href="${mapUrl}" target="_blank" rel="noopener">Открыть в Яндекс Картах</a>` : ''}
</section>` : ''}

${e.dresscode || colors ? `<section class="block"><h2>Что надеть</h2>${e.dresscode ? `<p>${esc(e.dresscode)}</p>` : ''}${colors ? `<div class="swatches">${colors}</div>` : ''}</section>` : ''}

<section id="rsvp" class="block block-rsvp">
  <h2>Вы придёте?</h2>
  ${e.deadline ? `<p class="hint">Ответьте, пожалуйста, до ${formatDate(e.deadline, false)}.</p>` : ''}
  ${thanks}
  <form method="post" action="/i/${esc(e.slug)}/rsvp" class="rsvp">
    <label>Имя и фамилия<input name="name" required maxlength="100" autocomplete="name"></label>
    <fieldset class="choice"><legend class="sr">Ваш ответ</legend>
      <label><input type="radio" name="attending" value="yes" checked><span>Приду</span></label>
      <label><input type="radio" name="attending" value="no"><span>Не смогу</span></label>
    </fieldset>
    <label class="if-yes">Сколько вас будет, вместе с вами<select name="count">${[1, 2, 3, 4, 5, 6].map((n) => `<option>${n}</option>`).join('')}</select></label>
    <label class="if-yes">Пожелания по меню<input name="menu" maxlength="300" placeholder="Например, без мяса"></label>
    <label class="check if-yes"><input type="checkbox" name="transfer"><span>Нужен трансфер</span></label>
    <label>Комментарий<textarea name="comment" rows="2" maxlength="1000"></textarea></label>
    <label class="check consent"><input type="checkbox" name="consent" required><span>Согласен на обработку моих данных организаторами для подготовки праздника (<a href="/privacy" target="_blank">политика</a>)</span></label>
    <button type="submit">Отправить ответ</button>
  </form>
</section>

${e.contact ? `<section class="block"><h2>Если есть вопросы</h2><p>${esc(e.contact)}</p></section>` : ''}
</main>

<footer class="made">Сделано в <a href="/?from=${esc(e.slug)}">${BRAND}</a></footer>

<script src="/static/invite.js" defer></script>`;
  return page({
    title: `${e.names}: ${lead.toLowerCase()}`,
    css: 'invite.css',
    fonts: INVITE_FONTS[e.theme] || INVITE_FONTS.klassika,
    head,
    body,
    bodyClass: `theme-${e.theme}`,
  });
}

// ---------- кабинет ----------

function cabinet(e, rsvps, { baseUrl, created, saved }) {
  const yes = rsvps.filter((r) => r.attending);
  const total = yes.reduce((s, r) => s + (r.count || 1), 0);
  const link = `${baseUrl}/i/${e.slug}`;
  const rows = rsvps
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((r) => `<tr>
      <td>${esc(r.name)}</td>
      <td><span class="tag ${r.attending ? 'tag-yes' : 'tag-no'}">${r.attending ? 'придёт' : 'не придёт'}</span></td>
      <td>${r.attending ? r.count : '—'}</td>
      <td>${esc(r.menu) || '—'}</td>
      <td>${r.transfer ? 'нужен' : '—'}</td>
      <td>${esc(r.comment) || '—'}</td>
      <td class="nowrap">${new Date(r.createdAt).toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' })}</td>
    </tr>`)
    .join('');
  const body = `
${header()}
<main>
  ${created ? `<div class="notice"><b>Приглашение готово.</b> Сохраните адрес этой страницы в закладки: это вход в ваш кабинет, по нему видны ответы гостей. Никому его не отправляйте.</div>` : ''}
  ${saved ? '<div class="notice">Изменения сохранены.</div>' : ''}
  ${e.demo ? '<div class="notice">Это демо-кабинет. Так выглядят ответы гостей.</div>' : ''}
  <div class="cab-head">
    <div><p class="kicker">${KINDS[e.kind] || ''} · ${esc(formatDate(e.date))}</p><h1>${esc(e.names)}</h1></div>
    <div class="cab-actions">
      <a class="btn btn-ghost" href="/i/${esc(e.slug)}" target="_blank" rel="noopener">Открыть сайт</a>
      <a class="btn btn-ghost" href="/c/${esc(e.key)}/edit">Редактировать</a>
    </div>
  </div>

  <div class="share">
    <label>Ссылка для гостей<input id="share-link" readonly value="${esc(link)}"></label>
    <button class="btn" type="button" data-copy="#share-link">Скопировать</button>
  </div>

  <div class="stats">
    <div class="stat"><span class="num">${rsvps.length}</span><span>${plural(rsvps.length, 'ответ', 'ответа', 'ответов')}</span></div>
    <div class="stat"><span class="num">${yes.length}</span><span>придут</span></div>
    <div class="stat"><span class="num">${rsvps.length - yes.length}</span><span>не смогут</span></div>
    <div class="stat stat-accent"><span class="num">${total}</span><span>${plural(total, 'гость', 'гостя', 'гостей')} всего</span></div>
  </div>

  <div class="table-head"><h2>Ответы гостей</h2><a class="btn btn-sm btn-ghost" href="/c/${esc(e.key)}/guests.csv">Скачать для Excel</a></div>
  ${rsvps.length ? `<div class="table-wrap"><table>
    <thead><tr><th>Имя</th><th>Ответ</th><th>Человек</th><th>Меню</th><th>Трансфер</th><th>Комментарий</th><th>Дата</th></tr></thead>
    <tbody>${rows}</tbody></table></div>` : '<p class="muted empty">Пока никто не ответил. Отправьте ссылку гостям, и ответы появятся здесь.</p>'}
</main>
${footer()}
<script>
document.querySelectorAll('[data-copy]').forEach(function (b) {
  b.addEventListener('click', function () {
    var i = document.querySelector(b.dataset.copy); i.select();
    (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.reject()).catch(function () { document.execCommand('copy'); });
    b.textContent = 'Скопировано'; setTimeout(function () { b.textContent = 'Скопировать'; }, 1500);
  });
});
</script>`;
  return page({ title: `Кабинет: ${e.names} — ${BRAND}`, body, head: '<meta name="robots" content="noindex">' });
}

// ---------- служебные ----------

function privacy() {
  const body = `
${header()}
<main class="narrow prose">
  <h1>Политика конфиденциальности</h1>
  <p class="note">Черновик. Перед запуском для людей текст нужно проверить у юриста и указать данные оператора (ФИО самозанятого или ИП, ИНН, контакт).</p>
  <p>Сервис «${BRAND}» обрабатывает данные, которые гости оставляют в анкете на сайте-приглашении: имя, ответ о присутствии, число гостей, пожелания по меню, потребность в трансфере и комментарий.</p>
  <p>Цель обработки — передать ответ организаторам праздника, создавшим приглашение. Данные хранятся на серверах в России и не передаются третьим лицам, кроме организаторов этого праздника.</p>
  <p>Данные удаляются не позднее чем через год после даты события или раньше по запросу гостя или организатора.</p>
  <p>Чтобы отозвать согласие или удалить данные, напишите оператору по контакту, указанному на этой странице.</p>
</main>
${footer()}`;
  return page({ title: `Политика конфиденциальности — ${BRAND}`, body });
}

const notFound = () => page({ title: `Не найдено — ${BRAND}`, body: `${header()}<main class="narrow"><h1>Страница не найдена</h1><p>Проверьте ссылку или <a href="/">вернитесь на главную</a>.</p></main>` });
const error = () => page({ title: `Ошибка — ${BRAND}`, body: `${header()}<main class="narrow"><h1>Что-то пошло не так</h1><p>Попробуйте ещё раз через минуту.</p></main>` });

module.exports = { landing, builder, invite, cabinet, privacy, notFound, error, formatDate };
