// Позови — сервис сайтов-приглашений. Первая версия без внешних зависимостей.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const views = require('./views');

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// ---------- хранилище ----------

function loadDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { events: [], rsvps: [] };
  }
}

let db = loadDb();

function saveDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

const findBySlug = (slug) => db.events.find((e) => e.slug === slug);
const findByKey = (key) => db.events.find((e) => e.key === key);
const rsvpsFor = (event) => db.rsvps.filter((r) => r.eventId === event.id);

// ---------- утилиты ----------

const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

function makeSlug(names, date) {
  const base = names
    .toLowerCase()
    .split('')
    .map((ch) => (ch in TRANSLIT ? TRANSLIT[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-i-/g, '-')
    .slice(0, 40) || 'event';
  let slug = date ? `${base}-${date.slice(0, 4)}` : base;
  let n = 2;
  while (findBySlug(slug)) slug = `${base}-${n++}`;
  return slug;
}

const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const MAX_PHOTO = 8 * 1024 * 1024;

function readRaw(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('too large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const readBody = async (req) => Object.fromEntries(new URLSearchParams((await readRaw(req, 100_000)).toString()));

// Форма конструктора: обычные поля плюс одно фото (multipart/form-data)
async function readForm(req) {
  const type = req.headers['content-type'] || '';
  const bm = type.match(/boundary=(?:"([^"]+)"|([^;]+))/);
  if (!type.startsWith('multipart/form-data') || !bm) return { fields: await readBody(req), file: null };
  const raw = await readRaw(req, MAX_PHOTO + 200_000);
  const sep = Buffer.from('--' + (bm[1] || bm[2]));
  const fields = {};
  let file = null;
  let start = raw.indexOf(sep);
  while (start !== -1) {
    const next = raw.indexOf(sep, start + sep.length);
    if (next === -1) break;
    const part = raw.subarray(start + sep.length + 2, next - 2);
    const headEnd = part.indexOf('\r\n\r\n');
    if (headEnd !== -1) {
      const head = part.subarray(0, headEnd).toString();
      const body = part.subarray(headEnd + 4);
      const name = (head.match(/name="([^"]*)"/) || [])[1];
      if (/filename="/.test(head)) {
        if (name === 'photo' && body.length) file = body;
      } else if (name) fields[name] = body.toString('utf8');
    }
    start = next;
  }
  return { fields, file };
}

// Сохраняет фото, если это настоящий JPEG, PNG или WebP; иначе null
function savePhoto(buf) {
  if (!buf || buf.length > MAX_PHOTO) return null;
  const ext =
    buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff ? 'jpg'
    : buf.subarray(0, 4).toString('hex') === '89504e47' ? 'png'
    : buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP' ? 'webp'
    : null;
  if (!ext) return null;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `${crypto.randomBytes(10).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  return name;
}

const clip = (v, max = 500) => String(v || '').trim().slice(0, max);
const THEMES = Object.keys(views.THEMES);
const KINDS = ['wedding', 'birthday', 'other'];

function eventFromForm(f) {
  return {
    kind: KINDS.includes(f.kind) ? f.kind : 'wedding',
    names: clip(f.names, 80),
    date: /^\d{4}-\d{2}-\d{2}$/.test(f.date) ? f.date : '',
    time: /^\d{2}:\d{2}$/.test(f.time) ? f.time : '',
    venue: clip(f.venue, 120),
    address: clip(f.address, 200),
    message: clip(f.message, 2000),
    program: clip(f.program, 2000),
    dresscode: clip(f.dresscode, 500),
    colors: clip(f.colors, 200),
    contact: clip(f.contact, 200),
    deadline: /^\d{4}-\d{2}-\d{2}$/.test(f.deadline) ? f.deadline : '',
    theme: THEMES.includes(f.theme) ? f.theme : 'klassika',
  };
}

function validateEvent(e) {
  const errors = [];
  if (!e.names) errors.push('Укажите имена или название события.');
  if (!e.date) errors.push('Укажите дату события.');
  return errors;
}

function send(res, status, body, type = 'text/html; charset=utf-8', extra = {}) {
  res.writeHead(status, { 'Content-Type': type, ...extra });
  res.end(body);
}

const redirect = (res, to) => send(res, 303, '', 'text/plain', { Location: to });

function serveStatic(res, file) {
  const full = path.join(PUBLIC_DIR, path.normalize(file).replace(/^(\.\.[/\\])+/, ''));
  if (!full.startsWith(PUBLIC_DIR) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    return send(res, 404, views.notFound());
  }
  const types = { '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' };
  send(res, 200, fs.readFileSync(full), types[path.extname(full)] || 'application/octet-stream', { 'Cache-Control': 'public, max-age=3600' });
}

function csvFor(event) {
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Имя', 'Придёт', 'Сколько человек', 'Пожелания по меню', 'Трансфер', 'Комментарий', 'Дата ответа'];
  const rows = rsvpsFor(event).map((r) => [
    r.name, r.attending ? 'да' : 'нет', r.attending ? r.count : 0, r.menu, r.transfer ? 'нужен' : '', r.comment,
    new Date(r.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
  ]);
  // BOM и точка с запятой — чтобы русский Excel открыл файл без мастера импорта
  return '﻿' + [head, ...rows].map((r) => r.map(cell).join(';')).join('\r\n');
}

// ---------- демо-сайты для лендинга ----------

const MESSAGES = {
  'demo-bilet': 'Едем за город на целый день: церемония в саду, ужин на веранде и танцы до последней электрички. Обратный трансфер организуем.',
  'demo-telegramma': 'Женимся. Без вас никак. Церемония короткая, ужин долгий, танцы до утра. Ответьте до первого июля, чтобы мы успели рассадить всех рядом с теми, кого вы любите.',
  'demo-menu': 'Мы любим долгие ужины, поэтому свадьба будет одним большим ужином. Шеф готовит пять подач, а мы готовим тосты. Если у вас есть ограничения в еде, напишите в анкете.',
  'demo-plastinka': 'Сорок лет, а пластинки всё те же. Будет бар, хорошая музыка и все, с кем я её слушал. Заявки на песни принимаю в анкете.',
  'demo-polaroid': 'Мы собрали снимки за пять лет вместе и поняли, что на всех не хватает вас. Приезжайте в Сосны, будем снимать новые.',
  'demo-programmka': 'Свадьба в трёх действиях, антракт с шампанским и финал на танцполе. Партер весь ваш, места не нумерованы.',
  'demo-plakat': 'Десять лет назад мы собрались в подвале на Лиговском. Сегодня нас сто человек. Отмечаем вместе со всеми, кто был рядом.',
  'demo-kniga': 'Бабушке Нине восемьдесят. Собираемся всей семьёй, со внуками и правнуками. Принесите старые фотографии и истории, бабушка очень их ждёт.',
  'demo-chat': 'Отмечаю двадцать пять. Будет бар, друзья и немного караоке. Приходите в чём удобно, главное приходите.',
  'demo-chek': 'Тридцать три, возраст серьёзный, поэтому отмечаем несерьёзно. Бар забронирован, счёт за мной.',
  'demo-vystavka': 'Мы долго собирали эту выставку из общих поездок, ужинов и смешных снимков. Открытие одно, вход только по приглашениям.',
  'demo-tablo': 'Двадцать лет после выпуска. Собираемся всем классом, зовём и учителей. Альбомы с собой обязательно.',
  'demo-vino': 'Мы познакомились на дегустации, поэтому свадьбу празднуем на винодельне. Будут виноградники, длинный стол и закат над Кубанью.',
  'demo-tetrad': 'Мне будет семь! Будет торт, аниматор и много игр. Мама говорит, чтобы взрослые тоже приходили.',
};
const PROGRAMS = {
  'demo-bilet': '15:30 Сбор гостей у дома\n16:00 Церемония в саду\n17:30 Ужин на веранде\n21:00 Танцы и костёр',
  'demo-telegramma': '18:00 Сбор гостей\n18:30 Церемония\n19:30 Ужин\n22:00 Танцы',
  'demo-polaroid': '16:00 Сбор гостей на холме\n16:30 Церемония\n18:00 Ужин в шатре\n22:00 Костёр и танцы',
  'demo-vystavka': '16:00 Открытие и игристое\n16:30 Церемония\n18:00 Ужин\n21:00 Танцы',
  'demo-plakat': '19:00 Сбор гостей\n20:00 Концерт\n22:00 Вечеринка до утра',
  'demo-menu': '17:00 Аперитив в саду\n18:00 Ужин из пяти подач\n21:00 Торт\n22:00 Танцы',
  'demo-plastinka': '20:00 Сбор у бара\n20:30 Первый сет\n22:00 Торт и тосты\n23:00 Танцы до закрытия',
  'demo-programmka': '17:00 Сбор гостей в фойе\n18:00 Церемония\n19:00 Ужин и тосты\n22:00 Танцы',
  'demo-kniga': '15:00 Сбор гостей\n15:30 Праздничный обед\n17:00 Фото и воспоминания\n18:00 Чай и торт',
  'demo-chek': '19:00 Сбор гостей\n19:30 Ужин\n21:00 Торт\n22:00 Танцы',
  'demo-tablo': '19:00 Встреча в фойе\n19:30 Ужин\n21:00 Слово учителям\n22:00 Танцы',
  'demo-vino': '16:00 Сбор гостей и игристое\n17:00 Церемония в винограднике\n18:30 Ужин за длинным столом\n21:00 Танцы',
  'demo-tetrad': '12:00 Встреча гостей\n12:30 Игры с аниматором\n14:00 Обед и торт\n15:00 Подарки',
};

function seedDemos() {
  const demos = [
    { slug: 'demo-klassika', theme: 'klassika', kind: 'wedding', names: 'Анна и Михаил', date: '2027-06-19', time: '15:00', venue: 'Усадьба «Архангельское»', address: 'Московская обл., Красногорск, пос. Архангельское', colors: '#f3ece1, #c9a96e, #8a8f7a',
      photoUrl: '/static/photos/usadba-cover.jpg', gallery: ['/static/photos/usadba-rotonda.jpg', '/static/photos/usadba-stol.jpg'] },
    { slug: 'demo-sad', theme: 'sad', kind: 'wedding', names: 'Полина и Денис', date: '2027-07-24', time: '16:00', venue: 'Загородный клуб «Сосны»', address: 'Ленинградская обл., Всеволожский р-н, Сосны', colors: '#e8eedf, #7f9a6e, #f4efe6',
      photoUrl: '/static/photos/sosny-cover.jpg', gallery: ['/static/photos/sosny-holm.jpg', '/static/photos/sosny-les.jpg'] },
    { slug: 'demo-noch', theme: 'noch', kind: 'birthday', names: 'Катя, 30', date: '2026-12-12', time: '19:00', venue: 'Ресторан «Северяне»', address: 'Москва, ул. Большая Дмитровка, 7/5', colors: '#ffd6e0, #ffe15c, #ffffff', dresscode: 'Яркое и нарядное, блёстки приветствуются.',
      photoUrl: '/static/photos/afisha-cover.jpg', gallery: ['/static/photos/afisha-tost.jpg', '/static/photos/afisha-bar.jpg'] },
    { slug: 'demo-zhurnal', theme: 'zhurnal', kind: 'wedding', names: 'Алиса и Марк', date: '2027-09-04', time: '16:00', venue: 'Ресторан «Белуга»', address: 'Москва, ул. Моховая, 15/1', colors: '#27313b, #d9d4cc, #8c8c84',
      photoUrl: '/static/photos/glavnaya-hero.jpg', gallery: ['/static/photos/glavnaya-konfetti.jpg', '/static/photos/usadba-stol.jpg'] },
    { slug: 'demo-otkrytka', theme: 'otkrytka', kind: 'wedding', names: 'Ольга и Иван', date: '2027-05-22', time: '14:00', venue: 'Особняк Смирнова', address: 'Москва, Тверской бульвар, 22', colors: '#1e2b4a, #c5ccd3, #fbfbf8' },
    { slug: 'demo-bilet', theme: 'bilet', kind: 'wedding', names: 'Ксения и Лев', date: '2027-08-14', time: '15:30', venue: 'Дача на Оке', address: 'Тульская обл., Поленово', deadline: '2027-07-01', colors: '#29453a, #edf1e6, #b23a2f' },
    { slug: 'demo-kalendar', theme: 'kalendar', kind: 'wedding', names: 'Мария и Денис', date: '2027-06-12', time: '15:00', venue: 'Загородный клуб «Лесное»', address: 'Ленинградская обл., Репино', colors: '#8a6670, #e9dfdc, #c9b8a8',
      photoUrl: '/static/photos/glavnaya-bereg.jpg' },
    { slug: 'demo-tablo', theme: 'tablo', kind: 'other', names: 'Встреча выпускников', date: '2027-06-27', time: '19:00', venue: 'Кафе «Перрон»', address: 'Москва, Комсомольская пл., 3', colors: '#23262b, #f0b429, #f1f2f0' },
    { slug: 'demo-plastinka', theme: 'plastinka', kind: 'birthday', names: 'Серёга, 40', date: '2027-02-20', time: '20:00', venue: 'Бар «Пластинка»', address: 'Москва, Мясницкая ул., 13', colors: '#2d3a5a, #e4572e, #f3f2ef',
      photoUrl: '/static/photos/afisha-bar.jpg' },
    { slug: 'demo-polaroid', theme: 'polaroid', kind: 'wedding', names: 'Лиза и Артём', date: '2027-08-07', time: '16:00', venue: 'Загородный клуб «Сосны»', address: 'Ленинградская обл., Всеволожский р-н, Сосны', colors: '#d6d8d4, #7f9a6e, #2e3a58',
      photoUrl: '/static/photos/sosny-holm.jpg', gallery: ['/static/photos/sosny-les.jpg', '/static/photos/usadba-rotonda.jpg'] },
    { slug: 'demo-telegramma', theme: 'telegramma', kind: 'wedding', names: 'Вера и Олег', date: '2027-07-17', time: '18:00', venue: 'Ресторан «Пушкинъ»', address: 'Москва, Тверской бульвар, 26А', deadline: '2027-07-01', colors: '#2d4a7a, #9aa6b2, #763e8c' },
    { slug: 'demo-menu', theme: 'menu', kind: 'wedding', names: 'Таня и Саша', date: '2027-07-03', time: '17:00', venue: 'Ресторан «Сад»', address: 'Москва, Петровский бульвар, 21', colors: '#5e2433, #dddcd3, #23241f' },
    { slug: 'demo-programmka', theme: 'programmka', kind: 'wedding', names: 'Наташа и Глеб', date: '2027-10-09', time: '17:00', venue: 'Театр-кафе «Маска»', address: 'Санкт-Петербург, наб. реки Фонтанки, 65', colors: '#9e2428, #2a1d1a, #e5ddd6' },
    { slug: 'demo-vino', theme: 'vino', kind: 'wedding', names: 'Дарья и Илья', date: '2027-09-18', time: '16:00', venue: 'Винодельня «Южная»', address: 'Краснодарский край, Темрюкский р-н', colors: '#4a1c25, #b8a77c, #2b2e22' },
    { slug: 'demo-vystavka', theme: 'vystavka', kind: 'wedding', names: 'Вика и Ян', date: '2027-05-15', time: '16:00', venue: 'Центр «Винзавод»', address: 'Москва, 4-й Сыромятнический пер., 1/8', colors: '#1b1b1a, #c4c4bf, #7f8a7a',
      photoUrl: '/static/photos/usadba-rotonda.jpg', gallery: ['/static/photos/glavnaya-konfetti.jpg', '/static/photos/sosny-les.jpg'] },
    { slug: 'demo-kniga', theme: 'kniga', kind: 'other', names: 'Юбилей бабушки Нины', date: '2027-03-03', time: '15:00', venue: 'Ресторан «Чехов»', address: 'Москва, ул. Чехова, 6', colors: '#e8721c, #1f1f1d, #fbfaf7' },
    { slug: 'demo-plakat', theme: 'plakat', kind: 'other', names: 'Север 10 лет', date: '2026-12-25', time: '19:00', venue: 'Клуб «Огни»', address: 'Санкт-Петербург, Лиговский пр., 50', colors: '#e2231a, #141414, #ededea' },
    { slug: 'demo-chat', theme: 'chat', kind: 'birthday', names: 'Даша, 25', date: '2027-04-17', time: '19:00', venue: 'Бар «Сделано»', address: 'Москва, Покровка, 17', colors: '#3a8ee6, #dcf4c8, #e7a35a' },
    { slug: 'demo-chek', theme: 'chek', kind: 'birthday', names: 'Костя, 33', date: '2027-01-23', time: '19:00', venue: 'Бар «Жигули»', address: 'Москва, Новый Арбат, 11', colors: '#3b3f45, #c8c4b8, #222222' },
    { slug: 'demo-tetrad', theme: 'tetrad', kind: 'birthday', names: 'Миша, 7 лет', date: '2027-04-10', time: '12:00', venue: 'Детский клуб «Космос»', address: 'Москва, ул. Строителей, 4', colors: '#233a8a, #d1342f, #f8fafc', dresscode: 'Удобная одежда для игр. Можно в костюме космонавта.' },
  ];
  const common = {
    message: 'Дорогие друзья! Мы будем счастливы разделить с вами этот день. Приходите, будет красиво, вкусно и очень душевно.',
    program: '15:00 Сбор гостей и фуршет\n16:00 Церемония\n17:30 Банкет\n23:00 Торт и финал вечера',
    dresscode: 'Будем рады, если вы поддержите палитру праздника. Просим не выбирать белый цвет.',
    contact: 'Организатор Ольга, +7 900 000-00-00',
    deadline: '',
  };
  let changed = false;
  // Демо шаблонов, которых больше нет, убираем вместе с ответами
  const stale = db.events.filter((e) => e.demo && !THEMES.includes(e.theme)).map((e) => e.id);
  if (stale.length) {
    db.events = db.events.filter((e) => !stale.includes(e.id));
    db.rsvps = db.rsvps.filter((r) => !stale.includes(r.eventId));
    changed = true;
  }
  for (const d of demos) {
    const old = findBySlug(d.slug);
    if (old) {
      if (old.photoUrl !== d.photoUrl) { Object.assign(old, { photoUrl: d.photoUrl, gallery: d.gallery }); changed = true; }
      continue;
    }
    const event = { id: crypto.randomUUID(), key: d.slug === 'demo-klassika' ? 'demo-kabinet' : crypto.randomBytes(12).toString('base64url'), demo: true, createdAt: Date.now(), ...common, ...d,
      dresscode: d.dresscode || (d.kind === 'wedding' ? common.dresscode : 'Как вам удобно. Если хочется, поддержите цвета праздника.'),
      program: PROGRAMS[d.slug] || (d.kind === 'birthday' ? '19:00 Встреча гостей\n19:30 Ужин\n21:00 Сюрприз от друзей\n22:00 Танцы' : d.kind === 'other' ? '18:00 Сбор гостей\n18:30 Ужин\n20:00 Программа вечера\n22:00 Танцы' : common.program),
      message: MESSAGES[d.slug] || (d.kind === 'birthday' ? 'Мне исполняется 30, и я хочу встретить эту дату с самыми близкими. Приходите!' : d.kind === 'other' ? 'Будет вечер, который запомнится. Ждём всех, приходите!' : common.message) };
    db.events.push(event);
    if (d.slug === 'demo-klassika') {
      const sample = [
        ['Елена Смирнова', true, 2, 'без глютена', true, 'Очень ждём!'],
        ['Игорь Петров', true, 1, '', false, ''],
        ['Бабушка Валя', true, 1, 'без острого', true, 'Нужна помощь с дорогой'],
        ['Сергей и Мария Ковалёвы', false, 0, '', false, 'К сожалению, будем в отъезде. Поздравляем!'],
      ];
      sample.forEach(([name, attending, count, menu, transfer, comment], i) =>
        db.rsvps.push({ id: crypto.randomUUID(), eventId: event.id, name, attending, count, menu, transfer, comment, createdAt: Date.now() - (i + 1) * 86400000 }));
    }
    changed = true;
  }
  if (changed) saveDb();
}

// ---------- маршруты ----------

async function handle(req, res) {
  const url = new URL(req.url, BASE_URL);
  const p = url.pathname;
  const method = req.method;

  if (p.startsWith('/static/')) return serveStatic(res, p.slice('/static/'.length));
  const up = p.match(/^\/u\/([a-f0-9]{20}\.(jpg|png|webp))$/);
  if (up && method === 'GET') {
    const file = path.join(UPLOAD_DIR, up[1]);
    if (!fs.existsSync(file)) return send(res, 404, views.notFound());
    const types = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    return send(res, 200, fs.readFileSync(file), types[up[2]], { 'Cache-Control': 'public, max-age=31536000, immutable' });
  }
  if (method === 'GET' && p === '/') return send(res, 200, views.landing());
  if (method === 'GET' && p === '/privacy') return send(res, 200, views.privacy());
  if (method === 'GET' && p === '/templates') return send(res, 200, views.templates());

  if (p === '/new') {
    if (method === 'GET') return send(res, 200, views.builder({ event: { theme: url.searchParams.get('theme') || 'klassika', kind: 'wedding' } }));
    if (method === 'POST') {
      const { fields, file } = await readForm(req);
      const event = eventFromForm(fields);
      const errors = validateEvent(event);
      const photo = file && savePhoto(file);
      if (file && !photo) errors.push('Фото не подошло: загрузите JPG, PNG или WebP до 8 МБ.');
      if (errors.length) return send(res, 422, views.builder({ event, errors }));
      if (photo) event.photo = photo;
      Object.assign(event, { id: crypto.randomUUID(), key: crypto.randomBytes(12).toString('base64url'), slug: makeSlug(event.names, event.date), createdAt: Date.now() });
      db.events.push(event);
      saveDb();
      return redirect(res, `/c/${event.key}?created=1`);
    }
  }

  let m = p.match(/^\/i\/([a-z0-9-]+)$/);
  if (m && method === 'GET') {
    const event = findBySlug(m[1]);
    if (!event) return send(res, 404, views.notFound());
    return send(res, 200, views.invite(event, { baseUrl: BASE_URL, ok: url.searchParams.get('ok') }));
  }

  m = p.match(/^\/i\/([a-z0-9-]+)\/rsvp$/);
  if (m && method === 'POST') {
    const event = findBySlug(m[1]);
    if (!event) return send(res, 404, views.notFound());
    const f = await readBody(req);
    const name = clip(f.name, 100);
    if (!name || f.consent !== 'on') return redirect(res, `/i/${event.slug}?ok=err#rsvp`);
    const attending = f.attending === 'yes';
    db.rsvps.push({
      id: crypto.randomUUID(), eventId: event.id, name, attending,
      count: attending ? Math.min(Math.max(parseInt(f.count, 10) || 1, 1), 10) : 0,
      menu: clip(f.menu, 300), transfer: f.transfer === 'on', comment: clip(f.comment, 1000), createdAt: Date.now(),
    });
    saveDb();
    return redirect(res, `/i/${event.slug}?ok=${attending ? 'yes' : 'no'}#rsvp`);
  }

  m = p.match(/^\/c\/([A-Za-z0-9_-]+)(\/edit|\/guests\.csv)?$/);
  if (m) {
    const event = findByKey(m[1]);
    if (!event) return send(res, 404, views.notFound());
    if (!m[2] && method === 'GET') return send(res, 200, views.cabinet(event, rsvpsFor(event), { baseUrl: BASE_URL, created: url.searchParams.get('created'), saved: url.searchParams.get('saved') }));
    if (m[2] === '/guests.csv' && method === 'GET') {
      return send(res, 200, csvFor(event), 'text/csv; charset=utf-8', { 'Content-Disposition': `attachment; filename="guests-${event.slug}.csv"` });
    }
    if (m[2] === '/edit' && method === 'GET') return send(res, 200, views.builder({ event, editKey: event.key }));
    if (m[2] === '/edit' && method === 'POST') {
      if (event.demo) return redirect(res, `/c/${event.key}`);
      const { fields, file } = await readForm(req);
      const updated = eventFromForm(fields);
      const errors = validateEvent(updated);
      const photo = file && savePhoto(file);
      if (file && !photo) errors.push('Фото не подошло: загрузите JPG, PNG или WebP до 8 МБ.');
      if (errors.length) return send(res, 422, views.builder({ event: { ...event, ...updated }, errors, editKey: event.key }));
      if (photo) updated.photo = photo;
      else if (fields.removePhoto === 'on') updated.photo = '';
      Object.assign(event, updated, { updatedAt: Date.now() });
      saveDb();
      return redirect(res, `/c/${event.key}?saved=1`);
    }
  }

  send(res, 404, views.notFound());
}

seedDemos();

http
  .createServer((req, res) => {
    handle(req, res).catch((err) => {
      console.error(err);
      if (!res.headersSent) send(res, 500, views.error());
    });
  })
  .listen(PORT, () => console.log(`Позови: ${BASE_URL}`));
