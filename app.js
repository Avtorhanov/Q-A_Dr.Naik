/*
 * app.js — интерфейс: язык RU/EN, темы оформления, поиск, каталог, встроенный плеер, раздел «О проекте».
 * Данные: data/qa.json (вопросы и ссылки) и data/sources.json (список источников).
 * Тексты ответов в публичной базе не хранятся (см. NOTICE.md).
 */
(function () {
  "use strict";

  var CONFIG = {
    standalone: false,       // true в однофайловой сборке standalone.html
    // Дата последнего пополнения базы (ГГГГ-ММ-ДД). Показывается в шапке и в разделе «О проекте».
    // После каждого пополнения data/qa.json поменяйте её здесь.
    dataVersion: "2026-11-26"
  };
  if (window.QA_CONFIG) Object.keys(window.QA_CONFIG).forEach(function (k) { CONFIG[k] = window.QA_CONFIG[k]; });

  /*
   * ВЫКЛЮЧАТЕЛИ ФУНКЦИЙ. Код обеих функций остаётся в файле; чтобы вернуть функцию, замените false на true.
   *
   * player — кнопки «Смотреть здесь» и «Слушать здесь»: запись играет в карточке с сайта источника
   *          (YouTube, Rutube, OK или прямая ссылка media_url). Сама запись не скачивается и не хранится.
   * reader — кнопка «Читать здесь» и загрузка файла private_texts.json в разделе «О проекте».
   *          Включать после письменного разрешения правообладателя (см. NOTICE.md).
   *
   * При false приложение показывает только ссылки на источник.
   */
  var FEATURES = {
    player: true,
    reader: false
  };
  if (CONFIG.features) Object.keys(CONFIG.features).forEach(function (k) { FEATURES[k] = !!CONFIG.features[k]; });

  /* ------------------------------------------------------------------ */
  /* Тексты интерфейса                                                    */
  /* ------------------------------------------------------------------ */
  var I18N = {
    ru: {
      title: "Поиск по Q&A Закира Найка",
      brand: "Вопрос — ответ",
      brandSub: "Закир Найк, неофициальный указатель",
      updated: "Обновлено {d}",
      tabSearch: "Поиск", tabCatalog: "Каталог", tabAbout: "О проекте",
      skinLabel: "Оформление", skinAuto: "Как в системе", skinLight: "Светлая", skinNavy: "Нави", skinForest: "Тёмная",
      h1: "Найдите ответ Закира Найка на ваш вопрос",
      lead: "Поиск по реальным сессиям вопросов и ответов, эфирам и книге. Приложение ничего не сочиняет: оно находит такой же вопрос и показывает ответ в источнике.",
      placeholder: "Напишите вопрос…", qLabel: "Ваш вопрос", clear: "Очистить", find: "Найти",
      tryLabel: "Например", topicsLabel: "Темы в базе",
      examples: ["Почему в Исламе запрещена свинина?", "Кто создал Бога?", "Можно ли курить во время поста?", "Почему разрешено многоженство?", "Музыка — это харам?", "Можно ли пить безалкогольное пиво?"],
      stats: "В базе <b>{n}</b> {qw}: <b>{ru}</b> с ответом на русском, <b>{en}</b> — на английском.",
      qForms: ["вопрос", "вопроса", "вопросов"],
      loading: "Загружаю базу вопросов…",
      loadError: "Не удалось загрузить базу вопросов (data/qa.json). Если вы открыли файл index.html прямо с устройства, откройте standalone.html или сайт проекта.",
      stDirect: "Найден ответ", stNear: "Прямого ответа нет", stNone: "В базе нет ответа", stVague: "Уточните вопрос",
      noteNear: "Точно такого вопроса в базе нет. Вот самые близкие:",
      noteNone: "По этому вопросу в базе ничего похожего не нашлось. Приложение не отвечает от себя.",
      noteVague: "Запрос слишком общий. Добавьте, о чём именно вопрос: например, «пост», «хиджаб», «проценты».",
      openCatalog: "Открыть каталог",
      same: "Этот же вопрос в других источниках", related: "Близкие вопросы", more: "Показать ещё",
      match: "совпадение {p}%",
      kind: { video: "Видео", audio_clip: "Аудио", transcript: "Текст сессии", book: "Книга", lecture: "Лекция" },
      kindShort: { video: "видео", audio_clip: "аудио", transcript: "текст", book: "книга", lecture: "лекция" },
      voRu: "русская озвучка", inRu: "на русском", inEn: "на английском",
      official: "официальный сайт",
      watchHere: "Смотреть здесь", watchHereFrom: "Смотреть здесь с {tc}", listenHere: "Слушать здесь", readHere: "Читать здесь",
      openYT: "Открыть на YouTube", fromTime: "В источнике с {tc}", atSource: "В источнике",
      openVideo: "Открыть видео", watchRead: "Смотреть и читать в источнике",
      readAtSource: "Читать ответ в источнике", openBook: "Открыть книгу, стр. {p}", openBookNoPage: "Открыть книгу",
      listen: "Слушать в источнике", copy: "Скопировать ссылку", copied: "Ссылка скопирована", copyFail: "Не получилось скопировать. Ссылка: {u}",
      closePanel: "Закрыть", speed: "Скорость", fromTc: "с {tc}", fromStart: "с начала",
      copyWhere: "копия", altCopy: "Другая копия", openHere: "Открыть страницу ролика здесь",
      notOpened: "{a} не открылся здесь.", fellBack: "Показана копия с {b}.",
      failTitle: "Этот ролик не получается показать внутри приложения.",
      failHint: "Откройте его на сайте источника.", failHintApp: "Его можно открыть здесь же, на странице источника.",
      yt100: "Ролик удалён или скрыт на YouTube.", yt150: "Владелец запретил показывать его в других приложениях и на сайтах.",
      yt153: "YouTube не принял встроенный плеер.", ytOther: "Плеер YouTube сообщил об ошибке.",
      fileErr: "Файл на сайте источника не открылся.", slow: "Не загружается?",
      unavailable: "Ролик удалён из источника (проверено {d}).",
      ytHelp: "YouTube просит войти или ролик не играет?", ytOpen: "Открыть в YouTube", ytAlways: "Всегда в YouTube",
      watchInYT: "Смотреть в YouTube",
      ytModeOn: "Ролики YouTube теперь открываются в приложении YouTube. Вернуть можно в разделе «О проекте».",
      ytModeOff: "Ролики YouTube снова играют в карточке.",
      aYt: "Ролики YouTube",
      aYtP: "Надпись «Войдите в аккаунт, чтобы подтвердить, что вы не бот» в плеере — это проверка самого YouTube. Обойти её внутри встроенного плеера нельзя, а чаще всего она появляется при VPN. Тогда удобнее открывать ролики сразу в приложении YouTube, где вы уже вошли в аккаунт. Ролики с копией на Rutube или с другого сайта при этом по-прежнему играют в карточке.",
      aYtCard: "В карточке", aYtApp: "В приложении YouTube",
      srcLine: "Источник", openSource: "Открыть источник",
      sSource: "Источник", sWhere: "Где", sDate: "Дата", sAlso: "Также", sNote: "Пометка",
      uploaded: "опубликовано: {d}", page: "стр. {p}", qNo: "вопрос №{n} по порядку", qOf: "вопрос {n} из {t}", dur: "вся сессия: {d}",
      hh: "ч", mm: "мин", timecode: "таймкод {tc}", clip: "отдельная запись, с начала",
      textAtSource: "В источнике есть полный текст ответа.",
      internal: "внутренний тест",
      catTitle: "Все вопросы в базе",
      catLead: "Вопросы сгруппированы по источникам. Нажмите на вопрос, чтобы открыть ответ.",
      fTopic: "Тема", fType: "Вид источника", fLang: "Язык ответа", fText: "Слово в вопросе",
      allTopics: "Все темы", allTypes: "Все источники", allLangs: "Любой",
      langRu: "Русский", langEn: "Английский",
      catCount: "Показано: <b>{n}</b> из {t}", catEmpty: "Под эти условия ничего не подходит. Сбросьте фильтры.",
      topics: {
        god: "Бог и вера", quran: "Коран и наука", jesus: "Иисус и христианство", religions: "Индуизм и другие религии",
        women: "Женщины и семья", halal: "Халяль и харам", worship: "Намаз, пост, хадж", peace: "Джихад, мир, терроризм",
        afterlife: "Жизнь после смерти", muslims: "Мусульмане и общество", other: "Разное"
      },
      foot: "Неофициальный проект. Не связан с Закиром Найком, IRF и Peace TV. Приложение не даёт религиозных заключений и не отвечает от себя: оно только показывает, где находится ответ. Права на материалы принадлежат их правообладателям.",
      aTitle: "О проекте",
      aLead: "Это указатель реальных ответов Закира Найка. По вашему вопросу он находит такой же вопрос из выступлений и показывает, где посмотреть, послушать или прочитать ответ.",
      aHow: "Как это работает",
      aHowList: ["Вы пишете вопрос на русском или английском.", "Приложение сравнивает его с вопросами в базе. Текст ответа не генерируется: языковая модель в поиске не участвует.", "Вы получаете ответ из источника: видео с нужной минуты, аудио, текст сессии на официальном сайте или страницу книги."],
      aPlay: "Как смотреть, слушать и читать",
      aPlayOn: [
        "Видео с YouTube, Rutube и OK открывается прямо в карточке, с минуты, где звучит вопрос. Запись идёт с сайта источника: приложение ничего не скачивает и не хранит.",
        "Аудио играет здесь, если в базе есть прямая ссылка на файл. Иначе откроется страница источника."
      ],
      aPlayOff: ["Видео и аудио открываются на сайте источника: кнопка ведёт сразу к нужной записи, а где известен таймкод — к нужной минуте."],
      aReadOn: "Текст ответа показывается здесь только с разрешения правообладателя или во внутреннем тесте, и всегда со ссылкой на источник.",
      aReadOff: "Текст ответа здесь не показывается: на это нужно разрешение правообладателя. Прочитать его можно в источнике.",
      aMarks: "Что означают пометки",
      aMarkDirect: "В базе есть такой же вопрос.",
      aMarkNear: "Точного совпадения нет, показаны самые близкие вопросы.",
      aMarkNone: "Ничего похожего не найдено. Приложение не отвечает от себя.",
      aMarkOff: "Ссылка ведёт на официальный сайт zakirnaik.com.",
      aText: "Статус проекта",
      aTextP: "Проект имеет статус — неофициальный, ожидает разрешения правообладателей на использование материала с указанием источника в самом приложении.",
      aNot: "Чего приложение не делает",
      aNotList: ["Не сочиняет и не пересказывает ответы.", "Не даёт фетв и собственных религиозных суждений.", "Не представляет Закира Найка и его организации."],
      aState: "Состояние базы",
      aStateP: "Вопросов: <b>{n}</b>. Играет прямо в приложении: <b>{pl}</b>. С полным текстом в источнике: <b>{tx}</b>. С точным таймкодом: <b>{tc}</b>. Версия базы: {ver}.",
      aSources: "Источники",
      stUsed: "в базе", stPartial: "в базе частично", stTodo: "ещё не обработан",
      aInternal: "Внутренний тест: тексты ответов",
      aInternalP: "Если у вас есть разрешение или вы тестируете для себя, загрузите файл private_texts.json. Тексты сохранятся только на этом устройстве и никуда не отправляются.",
      aInternalHave: "Загружено текстов на этом устройстве: <b>{n}</b>.",
      aInternalClear: "Удалить тексты с устройства",
      aInternalOk: "Тексты загружены: {n}", aInternalBad: "Файл не подошёл: нужен JSON вида {\"qa_0001\": \"текст ответа\"}", aInternalCleared: "Тексты удалены"
    },
    en: {
      title: "Zakir Naik Q&A search",
      brand: "Question & Answer",
      brandSub: "Zakir Naik, unofficial index",
      updated: "Updated {d}",
      months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      tabSearch: "Search", tabCatalog: "Catalogue", tabAbout: "About",
      skinLabel: "Appearance", skinAuto: "Match the system", skinLight: "Light", skinNavy: "Navy", skinForest: "Dark",
      h1: "Find Zakir Naik's answer to your question",
      lead: "Search across real question-and-answer sessions, broadcasts and a book. The app writes nothing itself: it finds the same question and shows the answer at its source.",
      placeholder: "Type your question…", qLabel: "Your question", clear: "Clear", find: "Search",
      tryLabel: "For example", topicsLabel: "Topics in the database",
      examples: ["Why is pork forbidden in Islam?", "Who created God?", "Does smoking break the fast?", "Why is polygamy allowed?", "Is music haram?", "Is non-alcoholic beer permitted?"],
      stats: "<b>{n}</b> {qw} in the database: <b>{en}</b> answered in English, <b>{ru}</b> in Russian.",
      qForms: ["question", "questions", "questions"],
      loading: "Loading the question database…",
      loadError: "Could not load the question database (data/qa.json). If you opened index.html straight from your device, open standalone.html or the project site instead.",
      stDirect: "Answer found", stNear: "No direct answer", stNone: "Not in the database", stVague: "Be more specific",
      noteNear: "There is no exact match in the database. These are the closest questions:",
      noteNone: "Nothing similar was found for this question. The app does not answer on its own.",
      noteVague: "The query is too general. Say what the question is about, for example “fasting”, “hijab” or “interest”.",
      openCatalog: "Open the catalogue",
      same: "The same question in other sources", related: "Related questions", more: "Show more",
      match: "match {p}%",
      kind: { video: "Video", audio_clip: "Audio", transcript: "Session transcript", book: "Book", lecture: "Lecture" },
      kindShort: { video: "video", audio_clip: "audio", transcript: "text", book: "book", lecture: "lecture" },
      voRu: "Russian voice-over", inRu: "in Russian", inEn: "in English",
      official: "official site",
      watchHere: "Watch here", watchHereFrom: "Watch here from {tc}", listenHere: "Listen here", readHere: "Read here",
      openYT: "Open on YouTube", fromTime: "At the source from {tc}", atSource: "At the source",
      openVideo: "Open the video", watchRead: "Watch and read at the source",
      readAtSource: "Read the answer at the source", openBook: "Open the book, p. {p}", openBookNoPage: "Open the book",
      listen: "Listen at the source", copy: "Copy the link", copied: "Link copied", copyFail: "Could not copy. Link: {u}",
      closePanel: "Close", speed: "Speed", fromTc: "from {tc}", fromStart: "from the start",
      copyWhere: "copy", altCopy: "Another copy", openHere: "Open the video page here",
      notOpened: "{a} would not play here.", fellBack: "Showing the copy on {b}.",
      failTitle: "This video can't be shown inside the app.",
      failHint: "Open it on the source site.", failHintApp: "You can open it right here, on the source page.",
      yt100: "The video was removed or made private on YouTube.", yt150: "Its owner does not allow it to be shown in other apps and sites.",
      yt153: "YouTube refused the embedded player.", ytOther: "The YouTube player reported an error.",
      fileErr: "The file on the source site did not open.", slow: "Not loading?",
      unavailable: "The video has been removed from the source (checked {d}).",
      ytHelp: "YouTube asks you to sign in, or the video won't play?", ytOpen: "Open in YouTube", ytAlways: "Always in YouTube",
      watchInYT: "Watch on YouTube",
      ytModeOn: "YouTube videos now open in the YouTube app. You can change this back under “About”.",
      ytModeOff: "YouTube videos play inside the card again.",
      aYt: "YouTube videos",
      aYtP: "“Sign in to confirm you're not a bot” in the player is YouTube's own check. It can't be bypassed inside an embedded player, and it shows up most often over a VPN. In that case it's easier to open videos straight in the YouTube app, where you are already signed in. Videos with a copy on Rutube or another site still play inside the card.",
      aYtCard: "In the card", aYtApp: "In the YouTube app",
      srcLine: "Source", openSource: "Open the source",
      sSource: "Source", sWhere: "Where", sDate: "Date", sAlso: "See also", sNote: "Note",
      uploaded: "uploaded: {d}", page: "p. {p}", qNo: "question no. {n} in order", qOf: "question {n} of {t}", dur: "whole session: {d}",
      hh: "h", mm: "min", timecode: "timecode {tc}", clip: "separate recording, from the start",
      textAtSource: "The full text of the answer is available at the source.",
      internal: "internal test",
      catTitle: "All questions in the database",
      catLead: "Questions are grouped by source. Tap a question to open its answer.",
      fTopic: "Topic", fType: "Source type", fLang: "Answer language", fText: "Word in the question",
      allTopics: "All topics", allTypes: "All sources", allLangs: "Any",
      langRu: "Russian", langEn: "English",
      catCount: "Showing <b>{n}</b> of {t}", catEmpty: "Nothing matches these filters. Reset them to see everything.",
      topics: {
        god: "God & belief", quran: "Quran & science", jesus: "Jesus & Christianity", religions: "Hinduism & other religions",
        women: "Women & family", halal: "Halal & haram", worship: "Prayer, fasting, Hajj", peace: "Jihad, peace, terrorism",
        afterlife: "Life after death", muslims: "Muslims & society", other: "Other"
      },
      foot: "An unofficial project, not affiliated with Zakir Naik, the IRF or Peace TV. The app gives no religious rulings and does not answer on its own: it only shows where the answer is. All rights to the materials belong to their owners.",
      aTitle: "About",
      aLead: "This is an index of Zakir Naik's real answers. For your question it finds the same question in his talks and shows where to watch, listen to or read the answer.",
      aHow: "How it works",
      aHowList: ["You type a question in Russian or English.", "The app compares it with the questions in the database. No answer text is generated: no language model takes part in the search.", "You get the answer from its source: a video from the right minute, an audio recording, a session transcript on the official site or a page of a book."],
      aPlay: "Watching, listening and reading",
      aPlayOn: [
        "Videos from YouTube, Rutube and OK open right in the card, from the minute where the question is asked. The recording comes from the source site: the app downloads and stores nothing.",
        "Audio plays here when the database has a direct link to the file. Otherwise the source page opens."
      ],
      aPlayOff: ["Video and audio open on the source site: the button leads straight to the recording and, where the timecode is known, to the right minute."],
      aReadOn: "Answer text is shown here only with the rights holder's permission or in an internal test, and always with a link to the source.",
      aReadOff: "Answer text is not shown here: that needs the rights holder's permission. You can read it at the source.",
      aMarks: "What the labels mean",
      aMarkDirect: "The database has the same question.",
      aMarkNear: "No exact match; the closest questions are shown.",
      aMarkNone: "Nothing similar was found. The app does not answer on its own.",
      aMarkOff: "The link leads to the official site zakirnaik.com.",
      aText: "Project status",
      aTextP: "The project is unofficial. It is awaiting the rights holders' permission to use the material, with the source credited, inside the app itself.",
      aNot: "What the app does not do",
      aNotList: ["It does not compose or paraphrase answers.", "It gives no fatwas and no religious opinions of its own.", "It does not represent Zakir Naik or his organisations."],
      aState: "State of the database",
      aStateP: "Questions: <b>{n}</b>. Playable inside the app: <b>{pl}</b>. With full text at the source: <b>{tx}</b>. With an exact timecode: <b>{tc}</b>. Database version: {ver}.",
      aSources: "Sources",
      stUsed: "indexed", stPartial: "partly indexed", stTodo: "not processed yet",
      aInternal: "Internal test: answer texts",
      aInternalP: "If you have permission, or are testing for yourself, load a private_texts.json file. The texts stay on this device only and are not sent anywhere.",
      aInternalHave: "Texts loaded on this device: <b>{n}</b>.",
      aInternalClear: "Remove texts from this device",
      aInternalOk: "Texts loaded: {n}", aInternalBad: "The file does not fit: a JSON like {\"qa_0001\": \"answer text\"} is needed", aInternalCleared: "Texts removed"
    }
  };

  var TOPIC_KEYS = ["god", "quran", "jesus", "religions", "women", "halal", "worship", "peace", "afterlife", "muslims", "other"];
  var TYPE_KEYS = ["video", "transcript", "book", "audio_clip", "lecture"];
  var VIEWS = ["search", "catalog", "about"];
  var SKINS = ["forest", "navy", "light"];

  var state = {
    lang: "ru", view: "search", query: "", skin: "auto",
    data: [], sources: [], index: null, priv: {},
    cat: { topic: "all", type: "all", alang: "all", text: "" },
    shown: 5, last: null,
    ytApp: load("qa.yt") === "app" // ролики YouTube открывать в приложении YouTube, а не во встроенном плеере
  };
  var root = document.documentElement;

  /* ------------------------------------------------------------------ */
  /* Мелкие помощники                                                     */
  /* ------------------------------------------------------------------ */
  function $(id) { return document.getElementById(id); }
  function all(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function t(key, vars) {
    var s = I18N[state.lang][key];
    if (s == null) s = I18N.ru[key];
    if (typeof s !== "string") return s;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split("{" + k + "}").join(vars[k]); });
    return s;
  }
  function plural(n, forms) {
    if (state.lang === "en") return n === 1 ? forms[0] : forms[1];
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  }
  function save(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* хранилище недоступно — не страшно */ } }
  function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function drop(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }
  /* "2026-11-26" -> «26.11.2026» / "26 Nov 2026". Неверная строка возвращается как есть. */
  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    if (!m) return String(iso || "");
    if (state.lang !== "en") return m[3] + "." + m[2] + "." + m[1];
    var mon = I18N.en.months[parseInt(m[2], 10) - 1];
    return mon ? parseInt(m[3], 10) + " " + mon + " " + m[1] : String(iso);
  }
  function renderUpdated() {
    var el = $("upd");
    if (!el) return;
    var time = el.querySelector("time") || el.appendChild(document.createElement("time"));
    time.setAttribute("datetime", CONFIG.dataVersion);
    time.textContent = t("updated", { d: fmtDate(CONFIG.dataVersion) });
  }
  function safeUrl(u) { return /^https?:\/\//i.test(String(u || "")) ? String(u) : "#"; }
  function calm() {
    try { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }

  var toastTimer = null;
  function toast(msg) {
    var el = document.querySelector(".toast");
    if (!el) { el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg;
    void el.offsetWidth;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  /* ------------------------------------------------------------------ */
  /* Плавное раскрытие и сворачивание                                     */
  /* ------------------------------------------------------------------ */
  function whenDone(el, fn) {
    var fired = false;
    function go() {
      if (fired) return;
      fired = true;
      el.removeEventListener("transitionend", onEnd);
      if (fn) fn();
    }
    function onEnd(ev) { if (ev.target === el && ev.propertyName === "grid-template-rows") go(); }
    el.addEventListener("transitionend", onEnd);
    setTimeout(go, 320);
  }
  function wrapReveal(html) { return '<div class="reveal"><div class="reveal-in">' + html + "</div></div>"; }
  function expand(el) {
    void el.offsetHeight;
    el.classList.add("open");
    whenDone(el, function () { if (el.classList.contains("open")) el.classList.add("done"); });
  }
  function collapse(el, then) {
    el.classList.remove("done");
    void el.offsetHeight;
    el.classList.remove("open");
    whenDone(el, then);
  }
  // <details> каталога: высота анимируется, атрибут open меняется в начале или в конце
  function toggleDetails(d) {
    var body = d.querySelector(".dbody");
    if (!body || !body.animate || calm()) { d.open = !d.open; return; }
    if (d._busy) return;
    d._busy = true;
    var ease = "cubic-bezier(.2,.8,.2,1)", h, a;
    var release = function () { d._busy = false; d.classList.remove("closing"); };
    if (!d.open) {
      d.open = true;
      h = body.scrollHeight;
      a = body.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: Math.min(280, 160 + h * 0.08), easing: ease });
      a.onfinish = a.oncancel = release;
    } else {
      h = body.scrollHeight;
      d.classList.add("closing");
      a = body.animate([{ height: h + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: Math.min(240, 140 + h * 0.06), easing: ease });
      a.onfinish = a.oncancel = function () { d.open = false; release(); };
    }
  }

  /* ------------------------------------------------------------------ */
  /* Темы оформления                                                      */
  /* ------------------------------------------------------------------ */
  function systemSkin() {
    var host = root.getAttribute("data-theme"), dark = false;
    if (host) dark = host === "dark";
    else { try { dark = matchMedia("(prefers-color-scheme: dark)").matches; } catch (e) { /* ignore */ } }
    return dark ? "forest" : "light";
  }
  var skinTimer = null;
  function applySkin(animate) {
    var s = state.skin === "auto" ? systemSkin() : state.skin;
    if (animate && !calm() && root.getAttribute("data-skin") !== s) {
      root.classList.add("skin-anim");
      clearTimeout(skinTimer);
      skinTimer = setTimeout(function () { root.classList.remove("skin-anim"); }, 260);
    }
    root.setAttribute("data-skin", s);
    all("[data-skin-set]").forEach(function (b) { b.setAttribute("aria-checked", String(b.getAttribute("data-skin-set") === state.skin)); });
    var bg = "";
    try { bg = getComputedStyle(root).getPropertyValue("--bg").trim(); } catch (e) { /* ignore */ }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta && bg) meta.setAttribute("content", bg);
    // Android-приложение красит системные панели под тему
    try { if (window.AndroidApp && window.AndroidApp.setBars && bg) window.AndroidApp.setBars(bg, s !== "light"); } catch (e) { /* ignore */ }
  }
  function setSkin(pref) {
    state.skin = SKINS.indexOf(pref) >= 0 ? pref : "auto";
    if (state.skin === "auto") drop("qa.skin"); else save("qa.skin", state.skin);
    applySkin(true);
  }
  function skinMenu(open) {
    var menu = $("skin-menu"), btn = $("skin-btn");
    if (open == null) open = !menu.classList.contains("open");
    menu.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", String(open));
  }

  /* ------------------------------------------------------------------ */
  /* Запись базы -> части карточки                                        */
  /* ------------------------------------------------------------------ */
  function qText(r) { return state.lang === "ru" ? r.question_ru : (r.question_en || r.question_original); }
  function origText(r) {
    var o = r.question_original || "";
    var shown = qText(r) || "";
    return o && o.toLowerCase() !== shown.toLowerCase() ? o : "";
  }
  function langLabel(r) {
    if (r.answer_lang === "ru") return (r.source.type === "video" || r.source.type === "lecture") ? t("voRu") : t("inRu");
    return t("inEn");
  }
  function ytId(url) {
    var m = /(?:[?&]v=|youtu\.be\/|\/embed\/|\/shorts\/)([\w-]{11})/.exec(String(url || ""));
    return m ? m[1] : null;
  }
  function secs(tc) {
    var p = String(tc || "").split(":").map(Number);
    if (!p.length || p.some(isNaN)) return 0;
    while (p.length < 3) p.unshift(0);
    return p[0] * 3600 + p[1] * 60 + p[2];
  }
  function durText(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return ((h ? h + " " + t("hh") + " " : "") + (m ? m + " " + t("mm") : "")).trim();
  }
  function answerText(r) {
    if (!FEATURES.reader) return null;
    if (state.priv[r.id]) return { text: state.priv[r.id], internal: true };
    if (r.answer_text && (r.rights === "granted" || r.rights === "public")) return { text: r.answer_text, internal: false };
    return null;
  }
  function locator(r) {
    var s = r.source;
    if (s.timecode) return s.timecode;
    if (s.type === "book" && s.page) return t("page", { p: s.page });
    if (s.question_no) return "№ " + s.question_no;
    return t("kindShort")[s.type] || "";
  }

  // Плееры площадок, которые встраиваются в карточку
  function embedOf(url, start) {
    var u = String(url || ""), id = ytId(u), m, q;
    if (id) {
      q = "?autoplay=1&rel=0&playsinline=1&enablejsapi=1" + (start ? "&start=" + start : "");
      try { if (location.protocol === "https:") q += "&origin=" + encodeURIComponent(location.origin); } catch (e) { /* ignore */ }
      return { kind: "frame", host: "YouTube", yt: true, start: start, src: "https://www.youtube.com/embed/" + id + q };
    }
    m = /rutube\.ru\/(?:video|play\/embed|shorts)\/([0-9a-f]{32})/i.exec(u);
    if (m) return { kind: "frame", host: "Rutube", start: start, src: "https://rutube.ru/play/embed/" + m[1] + "/" + (start ? "?t=" + start : "") };
    m = /ok\.ru\/video(?:embed)?\/(\d+)/i.exec(u);
    if (m) return { kind: "frame", host: "OK", start: start, src: "https://ok.ru/videoembed/" + m[1] + "?autoplay=1" + (start ? "&fromTime=" + start : "") };
    return null;
  }
  // Файл по прямой ссылке на сайте источника (source.media_url): играет обычный плеер браузера
  function fileOf(url, type, start, host, audioHint) {
    if (!url || !/^https:\/\//i.test(url)) return null;
    var audio = type ? type === "audio" : (/\.(mp3|m4a|aac|ogg|oga|opus|wav)([?#]|$)/i.test(url) || audioHint);
    return { kind: audio ? "audio" : "video", src: url + (start ? "#t=" + start : ""), host: host || "", start: start };
  }
  function hostName(url) {
    var m = /^https?:\/\/(?:www\.|m\.)?([^\/?#]+)/i.exec(String(url || ""));
    return m ? m[1] : "";
  }
  // Все способы проиграть запись прямо в карточке, по порядку: файл источника, сама запись, копии из «Также».
  // Если первый не открылся, плеер сам переходит к следующему.
  function mediaList(r) {
    var s = r.source, start = s.timecode ? secs(s.timecode) : 0, out = [], m;
    var page = s.url_at_time || s.url;
    var pub = String(s.publisher || "").replace(/\s*\(.*\)\s*$/, "") || hostName(s.url);
    m = fileOf(s.media_url, s.media_type, start, pub, s.type === "audio_clip");
    if (m) { m.page = page; out.push(m); }
    if (s.status !== "unavailable") {
      m = embedOf(s.url, start);
      if (m) { m.page = page; out.push(m); }
    }
    (s.also || []).forEach(function (a) {
      var c = fileOf(a.media_url, a.media_type, 0, hostName(a.url), false) || embedOf(a.url, 0);
      if (c) { c.page = a.url; c.alt = true; out.push(c); }
    });
    if (state.ytApp) out = out.filter(function (x) { return !x.yt; });
    return out;
  }
  // Ссылка на ролик YouTube с нужной минуты (для приложения YouTube)
  function ytWatchUrl(url, start) {
    var id = ytId(url);
    return id ? "https://www.youtube.com/watch?v=" + id + (start ? "&t=" + start + "s" : "") : null;
  }
  function recYtUrl(r) {
    var s = r.source;
    if (s.status === "unavailable") return null;
    return ytWatchUrl(s.url, s.timecode ? secs(s.timecode) : 0);
  }
  // Android: ролик YouTube открывается в приложении YouTube (там пользователь уже вошёл в аккаунт)
  function openExternal(url) {
    try {
      if (window.AndroidApp && typeof window.AndroidApp.openExternal === "function") { window.AndroidApp.openExternal(String(url)); return true; }
    } catch (e) { /* ignore */ }
    return false;
  }
  function mediaOf(r) {
    return mediaList(r)[0] || null;
  }
  // В Android-приложении страницу источника можно открыть во встроенном окне, не выходя из приложения
  function canViewer() {
    try { return !!(window.AndroidApp && typeof window.AndroidApp.openViewer === "function"); } catch (e) { return false; }
  }
  function openViewer(url) {
    try { window.AndroidApp.openViewer(String(url)); return true; } catch (e) { return false; }
  }
  // Запись — ролик или аудио на странице источника, которую нельзя встроить (Дзен, Muslim Central)
  function viewerKind(r) {
    var s = r.source;
    if (s.status === "unavailable" || !/^https:\/\//i.test(s.url || "") || /\.pdf([?#]|$)/i.test(s.url)) return null;
    if (s.type === "video" || s.type === "lecture") return /muslimcentral|podm8/i.test(s.url) ? "audio" : "video";
    if (s.type === "audio_clip") return "audio";
    return null;
  }
  function playerOn() {
    if (!FEATURES.player) return false;
    // со страницы, открытой с диска (file://), площадки не разрешают встраивать плеер
    try { return location.protocol !== "file:"; } catch (e) { return false; }
  }

  function sourceLabel(r) {
    var s = r.source;
    if (s.type === "transcript") return t("readAtSource");
    if (s.type === "book") return s.page ? t("openBook", { p: s.page }) : t("openBookNoPage");
    if (s.type === "audio_clip") return t("listen");
    if (ytId(s.url)) return s.timecode ? t("fromTime", { tc: s.timecode }) : t("openYT");
    if (s.type === "lecture" && !mediaOf(r) && /muslimcentral|podm8/i.test(s.url || "")) return t("listen");
    return s.text_at_source ? t("watchRead") : t("openVideo");
  }

  function actionsHtml(r) {
    var s = r.source, link = safeUrl(s.url_at_time || s.url), out = [], primary = false;
    var m = playerOn() ? mediaOf(r) : null;
    var yt = !m && playerOn() && state.ytApp ? recYtUrl(r) : null;
    var vk = !m && !yt && canViewer() ? viewerKind(r) : null;
    if (yt) {
      out.push('<a class="btn" data-act="yt-app" href="' + esc(yt) + '" target="_blank" rel="noopener">▶ ' + esc(t("watchInYT")) + " ↗</a>");
      primary = true;
    } else if (m) {
      var label = m.kind === "audio" ? t("listenHere") : (s.timecode && !m.alt ? t("watchHereFrom", { tc: s.timecode }) : t("watchHere"));
      out.push('<button class="btn" type="button" data-act="play" data-id="' + esc(r.id) + '" aria-expanded="false">▶ ' + esc(label) + "</button>");
      primary = true;
    } else if (vk) {
      // Android: страница источника откроется во встроенном окне приложения
      out.push('<button class="btn" type="button" data-act="viewer" data-url="' + esc(link) + '">▶ ' + esc(vk === "audio" ? t("listenHere") : t("watchHere")) + "</button>");
      primary = true;
    }
    if (answerText(r)) {
      out.push('<button class="btn' + (primary ? " ghost" : "") + '" type="button" data-act="read" data-id="' + esc(r.id) + '" aria-expanded="false">' + esc(t("readHere")) + "</button>");
      primary = true;
    }
    out.push('<a class="btn' + (primary ? " ghost" : "") + '" href="' + esc(link) + '" target="_blank" rel="noopener">' + esc(m || vk || yt ? t("atSource") : sourceLabel(r)) + " ↗</a>");
    out.push('<button class="btn quiet icon" type="button" data-act="copy" data-id="' + esc(r.id) + '" aria-label="' + esc(t("copy")) + '" title="' + esc(t("copy")) + '">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg></button>');
    return '<div class="actions">' + out.join("") + "</div>";
  }

  function slipHtml(r) {
    var s = r.source, rows = [];
    rows.push("<dt>" + esc(t("sSource")) + "</dt><dd>" + esc(s.title) + "<br><span>" + esc(s.publisher || "") + "</span></dd>");
    var where = [];
    if (s.timecode) where.push('<span class="num">' + esc(t("timecode", { tc: s.timecode })) + "</span>");
    if (s.type === "book" && s.question_no) where.push(esc(t("qOf", { n: s.question_no, t: s.question_total || "?" })));
    if (s.type === "book" && s.page) where.push('<span class="num">' + esc(t("page", { p: s.page })) + "</span>");
    if (s.type === "transcript" && s.question_no) where.push(esc(t("qNo", { n: s.question_no })));
    if (s.duration_min) where.push(esc(t("dur", { d: durText(s.duration_min) })));
    if (!where.length && (s.type === "video" || s.type === "audio_clip")) where.push(esc(t("clip")));
    if (where.length) rows.push("<dt>" + esc(t("sWhere")) + "</dt><dd>" + where.join(", ") + "</dd>");
    if (s.date) rows.push("<dt>" + esc(t("sDate")) + '</dt><dd class="num">' + esc(s.date_kind === "upload" ? t("uploaded", { d: s.date }) : s.date) + "</dd>");
    var note = state.lang === "ru" ? s.note_ru : s.note_en;
    if (note) rows.push("<dt>" + esc(t("sNote")) + "</dt><dd>" + esc(note) + "</dd>");
    if (s.also && s.also.length) {
      rows.push("<dt>" + esc(t("sAlso")) + '</dt><dd class="also">' + s.also.map(function (a) {
        return '<a href="' + esc(safeUrl(a.url)) + '" target="_blank" rel="noopener">' + esc(state.lang === "ru" ? a.label_ru : a.label_en) + " ↗</a>";
      }).join("") + "</dd>");
    }
    return '<dl class="slip">' + rows.join("") + "</dl>";
  }

  function cardHtml(r, opt) {
    opt = opt || {};
    var s = r.source, eb = [];
    eb.push('<span class="kind">' + esc(t("kind")[s.type] || s.type) + "</span>");
    eb.push("<span>" + esc(langLabel(r)) + "</span>");
    if (s.official) eb.push('<span class="flag">' + esc(t("official")) + "</span>");
    if (opt.score != null) eb.push('<span class="score">' + esc(t("match", { p: Math.round(opt.score * 100) })) + "</span>");

    var html = '<article class="card' + (opt.top ? " top" : "") + '" data-rec="' + esc(r.id) + '">';
    html += '<div class="eyebrow">' + eb.join("") + "</div>";
    html += '<p class="q">' + esc(qText(r)) + "</p>";
    var o = origText(r);
    if (o) html += '<p class="orig" lang="' + esc(r.question_lang || "") + '">' + esc(o) + "</p>";
    html += actionsHtml(r);
    if (s.status === "unavailable") html += '<p class="note warn">' + esc(t("unavailable", { d: fmtDate(s.checked || "") })) + "</p>";
    html += '<div class="player-slot"></div>';
    if (!answerText(r) && s.text_at_source && (opt.top || opt.note)) {
      html += '<p class="note">' + esc(t("textAtSource")) + "</p>";
    }
    html += slipHtml(r);
    html += "</article>";
    return html;
  }

  /* ------------------------------------------------------------------ */
  /* Плеер и читалка внутри карточки                                      */
  /* ------------------------------------------------------------------ */
  function barHtml(r, where, link, alt) {
    link = safeUrl(link || r.source.url_at_time || r.source.url);
    return '<div class="media-bar"><span class="where">' + esc(where) + "</span>" +
      (alt ? '<button class="alt" type="button" data-act="alt">' + esc(t("altCopy")) + "</button>" : "") +
      '<a href="' + esc(link) + '" target="_blank" rel="noopener">' + esc(t("atSource")) + " ↗</a>" +
      '<button class="x" type="button" data-act="close-panel" aria-label="' + esc(t("closePanel")) + '">✕</button></div>';
  }
  var frameSeq = 0;
  function playerHtml(r, idx, note) {
    var list = mediaList(r), m = list[idx] || list[0], s = r.source, title = esc(s.title || "");
    var where = (m.host ? m.host + ", " : "") + (m.alt ? t("copyWhere") : (s.timecode ? t("fromTc", { tc: s.timecode }) : t("fromStart")));
    var more = idx + 1 < list.length;
    var head = note ? '<p class="media-note">' + esc(note) + "</p>" : "";
    if (m.kind === "audio") {
      var rates = [1, 1.25, 1.5, 2].map(function (x) {
        return '<button type="button" data-act="rate" data-rate="' + x + '" aria-pressed="' + (x === 1) + '">' + String(x).replace(".", state.lang === "ru" ? "," : ".") + "×</button>";
      }).join("");
      return '<div class="media">' + head + '<div class="media-audio"><audio controls preload="metadata" src="' + esc(m.src) + '"></audio>' +
        '<div class="speeds"><span>' + esc(t("speed")) + "</span>" + rates + "</div></div>" + barHtml(r, where, m.page, more) + "</div>";
    }
    if (m.kind === "video") {
      return '<div class="media">' + head + '<div class="frame"><video controls playsinline preload="metadata" src="' + esc(m.src) + '"></video></div>' + barHtml(r, where, m.page, more) + "</div>";
    }
    var help = "";
    if (m.yt) {
      // YouTube может закрыть встроенный плеер проверкой «вы не бот»; снаружи её не видно, поэтому выход всегда под рукой
      help = '<p class="yt-help"><span>' + esc(t("ytHelp")) + "</span>" +
        '<a data-act="yt-app" href="' + esc(ytWatchUrl(m.src, m.start) || m.page) + '" target="_blank" rel="noopener">' + esc(t("ytOpen")) + " ↗</a>" +
        (more ? '<button type="button" data-act="alt">' + esc(t("altCopy")) + "</button>" : "") +
        '<button type="button" data-act="yt-mode" data-mode="app">' + esc(t("ytAlways")) + "</button></p>";
    }
    return '<div class="media">' + head + '<div class="frame"><iframe id="qa-frame-' + (++frameSeq) + '"' + (m.yt ? ' data-yt="1"' : "") + ' src="' + esc(m.src) + '" title="' + title +
      '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>' +
      help + barHtml(r, where, m.page, more) + "</div>";
  }
  // Ни один способ не сработал: объяснить и дать открыть страницу источника
  function failHtml(r, m, reason) {
    var page = (m && m.page) || r.source.url_at_time || r.source.url, app = canViewer();
    return '<div class="media"><div class="media-fail" role="status"><p><b>' + esc(t("failTitle")) + "</b> " + (reason ? esc(reason) + " " : "") +
      esc(app ? t("failHintApp") : t("failHint")) + '</p><div class="actions">' +
      (app ? '<button class="btn" type="button" data-act="viewer" data-url="' + esc(safeUrl(page)) + '">▶ ' + esc(t("openHere")) + "</button>" : "") +
      (app ? "" : '<a class="btn" href="' + esc(safeUrl(page)) + '" target="_blank" rel="noopener">' + esc(t("atSource")) + " ↗</a>") +
      '<button class="btn quiet" type="button" data-act="close-panel">' + esc(t("closePanel")) + "</button></div></div></div>";
  }
  function ytReason(code) {
    code = Number(code);
    if (code === 100) return t("yt100");
    if (code === 101 || code === 150) return t("yt150");
    if (code === 152 || code === 153) return t("yt153");
    return t("ytOther");
  }
  // Поставить в слот вариант номер idx и следить, откроется ли он
  function mountPlayer(slot, r, idx, note) {
    silence(slot);
    slot.setAttribute("data-idx", String(idx));
    slot.innerHTML = playerHtml(r, idx, note);
    void slot.offsetHeight;
    var av = slot.querySelector("audio, video");
    if (av) {
      av.addEventListener("error", function () { if (av.isConnected) mediaFailed(slot, r, t("fileErr")); });
      try { var p = av.play(); if (p && p.catch) p.catch(function () { /* запустит пользователь */ }); } catch (e) { /* ignore */ }
    }
    var fr = slot.querySelector("iframe[data-yt]");
    if (fr) watchYouTube(slot, fr);
  }
  // Текущий вариант не открылся: перейти к следующему или показать, что делать
  function mediaFailed(slot, r, reason) {
    if (slot.getAttribute("data-kind") !== "play") return;
    var list = mediaList(r), idx = parseInt(slot.getAttribute("data-idx") || "0", 10) || 0, cur = list[idx];
    if (idx + 1 < list.length) {
      mountPlayer(slot, r, idx + 1, (reason || t("notOpened", { a: (cur && cur.host) || "" })) + " " + t("fellBack", { b: list[idx + 1].host }));
      return;
    }
    silence(slot);
    slot.innerHTML = failHtml(r, cur, reason);
  }
  /* YouTube сообщает об ошибке плеера (ролик удалён, запрещено встраивание) через postMessage.
     Чтобы он начал присылать события, ему нужно отправить «listening». */
  function watchYouTube(slot, fr) {
    var tries = 0;
    var hello = function () {
      if (!fr.isConnected || fr._ytOk) return;
      try { fr.contentWindow.postMessage(JSON.stringify({ event: "listening", id: fr.id, channel: "widget" }), "*"); } catch (e) { /* ignore */ }
      if (++tries < 30) setTimeout(hello, 400);
    };
    fr.addEventListener("load", function () { tries = 0; hello(); });
    hello();
    // Через 10 с ролик так и не загрузился (нет длительности): проверка «вы не бот» или YouTube недоступен в этой сети.
    // Подсказку с выходом подсветить, плеер не убирать.
    setTimeout(function () {
      if (!fr.isConnected || fr._ytDur) return;
      var help = slot.querySelector(".yt-help");
      if (help) help.classList.add("alert");
    }, 10000);
  }
  window.addEventListener("message", function (ev) {
    if (!/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(String(ev.origin))) return;
    var data = ev.data;
    if (typeof data === "string") { try { data = JSON.parse(data); } catch (e) { return; } }
    if (!data || !data.event) return;
    var fr = all("iframe[data-yt]").filter(function (f) { return f.contentWindow === ev.source; })[0];
    if (!fr) return;
    fr._ytOk = true;
    if (data.info && typeof data.info === "object" && (data.info.duration > 0 || (data.info.videoData && data.info.videoData.title))) {
      fr._ytDur = true;
      var help = fr.closest(".media") && fr.closest(".media").querySelector(".yt-help.alert");
      if (help) help.classList.remove("alert");
    }
    if (data.event === "onError") {
      var slot = fr.closest(".player-slot"), card = slot && slot.closest(".card");
      var r = card ? recById(card.getAttribute("data-rec")) : null;
      if (slot && r) mediaFailed(slot, r, ytReason(data.info));
    }
  });
  function readerHtml(r) {
    var a = answerText(r), s = r.source, link = safeUrl(s.url_at_time || s.url);
    var bits = [s.title, s.publisher, s.date].filter(Boolean).join(", ");
    return '<div class="reader"><div class="text" lang="' + esc(r.answer_lang || "") + '">' + esc(a.text) + "</div>" +
      '<p class="src">' + (a.internal ? '<span class="pill near">' + esc(t("internal")) + "</span> " : "") +
      esc(t("srcLine")) + ": " + esc(bits) + '. <a href="' + esc(link) + '" target="_blank" rel="noopener">' + esc(t("openSource")) + " ↗</a></p></div>";
  }
  function markButtons(card, kind) {
    all('[data-act="play"], [data-act="read"]', card).forEach(function (b) {
      b.setAttribute("aria-expanded", String(b.getAttribute("data-act") === kind));
    });
  }
  function silence(slot) {
    all("audio, video", slot).forEach(function (el) { try { el.pause(); } catch (e) { /* ignore */ } });
    all("iframe", slot).forEach(function (el) { el.removeAttribute("src"); });
  }
  function closePanel(card, instant) {
    var slot = card.querySelector(".player-slot");
    if (!slot || !slot.firstChild) return;
    silence(slot);
    slot.removeAttribute("data-kind");
    markButtons(card, null);
    var box = slot.firstChild;
    if (instant || !box.classList || !box.classList.contains("reveal")) { slot.innerHTML = ""; return; }
    collapse(box, function () { if (box.parentNode === slot) slot.removeChild(box); });
  }
  function openPanel(card, r, kind) {
    var slot = card.querySelector(".player-slot");
    if (!slot) return;
    if (slot.getAttribute("data-kind") === kind) { closePanel(card); return; }
    // одновременно играет только одна запись
    if (kind === "play") all('.player-slot[data-kind="play"]').forEach(function (other) { if (other !== slot) closePanel(other.closest(".card")); });
    if (slot.firstChild) { silence(slot); slot.innerHTML = ""; }
    slot.setAttribute("data-kind", kind);
    markButtons(card, kind);
    if (kind === "play") {
      // Плеер ставится сразу во всю величину, без анимации: в iOS Safari iframe, вставленный
      // в сворачивающуюся (нулевую, обрезанную, полупрозрачную) обёртку, не прорисовывается,
      // пока приложение не свернуть и не открыть снова.
      mountPlayer(slot, r, 0);
      showPlayer(slot);
      return;
    }
    slot.innerHTML = wrapReveal(readerHtml(r));
    expand(slot.firstChild);
  }
  // Если плеер ушёл за край экрана — докрутить, чтобы он был виден целиком
  function showPlayer(slot) {
    var go = function () {
      if (!slot.isConnected || !slot.firstChild) return;
      var b = slot.getBoundingClientRect(), vh = window.innerHeight || document.documentElement.clientHeight;
      if (b.bottom > vh || b.top < 0) {
        try { slot.scrollIntoView({ block: "nearest", behavior: calm() ? "auto" : "smooth" }); } catch (e) { slot.scrollIntoView(false); }
      }
    };
    if (window.requestAnimationFrame) requestAnimationFrame(go); else go();
  }

  /* ------------------------------------------------------------------ */
  /* Поиск                                                                */
  /* ------------------------------------------------------------------ */
  function runSearch(query, keepShown) {
    state.query = query;
    if (!keepShown) state.shown = 5;
    $("clear").hidden = !query;
    var out = $("out"), rest = $("rest");
    if (!state.index) return;
    out.classList.remove("fresh");
    if (!query.trim()) { out.innerHTML = ""; rest.hidden = false; state.last = null; syncUrl(); return; }

    var res = QASearch.search(state.index, query, { lang: state.lang, records: state.data });
    state.last = res;
    rest.hidden = res.status === "direct" || res.status === "near";
    var D = QASearch.THRESHOLDS.DIRECT, html = "";

    if (res.status === "direct") {
      var top = res.hits[0];
      var same = res.hits.slice(1).filter(function (h) { return h.score >= D; }).slice(0, 4);
      var others = res.hits.slice(1 + same.length).slice(0, state.shown);
      html += '<div class="status"><span class="pill ok">' + esc(t("stDirect")) + "</span></div>";
      html += cardHtml(state.data[top.i], { top: true, score: top.score });
      if (same.length) {
        html += '<p class="subhead">' + esc(t("same")) + "</p>";
        same.forEach(function (h) { html += cardHtml(state.data[h.i], { score: h.score }); });
      }
      if (others.length) {
        html += '<p class="subhead">' + esc(t("related")) + "</p>";
        others.forEach(function (h) { html += cardHtml(state.data[h.i], { score: h.score }); });
        if (res.hits.length > 1 + same.length + others.length) html += '<button class="btn ghost more" type="button" data-act="more">' + esc(t("more")) + "</button>";
      }
    } else if (res.status === "near") {
      var list = res.hits.slice(0, state.shown);
      html += '<div class="status"><span class="pill near">' + esc(t("stNear")) + "</span><p>" + esc(t("noteNear")) + "</p></div>";
      list.forEach(function (h) { html += cardHtml(state.data[h.i], { score: h.score }); });
      if (res.hits.length > list.length) html += '<button class="btn ghost more" type="button" data-act="more">' + esc(t("more")) + "</button>";
    } else {
      var vague = res.status === "vague";
      html += '<div class="status"><span class="pill ' + (vague ? "near" : "none") + '">' + esc(t(vague ? "stVague" : "stNone")) + "</span><p>" +
        esc(t(vague ? "noteVague" : "noteNone")) + "</p></div>";
      html += '<a class="btn ghost more" href="#catalog">' + esc(t("openCatalog")) + "</a>";
    }
    out.innerHTML = html;
    // у найденного ответа текст (если он разрешён) раскрыт сразу
    var topCard = out.querySelector(".card.top");
    if (topCard) {
      var tr = recById(topCard.getAttribute("data-rec"));
      if (tr && answerText(tr)) openPanel(topCard, tr, "read");
    }
    if (!keepShown) {
      all("#out > *").forEach(function (el, i) { el.style.setProperty("--n", Math.min(i, 6)); });
      void out.offsetWidth;
      out.classList.add("fresh");
    }
    syncUrl();
  }

  function syncUrl() {
    // На сайте вопрос попадает в адрес страницы (?q=…), чтобы ссылкой можно было поделиться.
    try {
      if (CONFIG.standalone || !window.history || !history.replaceState) return;
      var u = new URL(location.href);
      if (state.query.trim()) u.searchParams.set("q", state.query.trim()); else u.searchParams.delete("q");
      history.replaceState(null, "", u.pathname + u.search + u.hash);
    } catch (e) { /* в некоторых окружениях адрес менять нельзя */ }
  }

  /* ------------------------------------------------------------------ */
  /* Главный экран: примеры, темы, статистика                             */
  /* ------------------------------------------------------------------ */
  function renderRest() {
    $("examples").innerHTML = t("examples").map(function (e) {
      return '<button class="chip" type="button" data-act="example">' + esc(e) + "</button>";
    }).join("");
    var counts = {};
    state.data.forEach(function (r) { (r.topics || ["other"]).forEach(function (k) { counts[k] = (counts[k] || 0) + 1; }); });
    $("topics").innerHTML = TOPIC_KEYS.filter(function (k) { return counts[k]; }).map(function (k) {
      return '<button class="topic" type="button" data-act="topic" data-topic="' + k + '"><span>' + esc(t("topics")[k]) + "</span><span>" + counts[k] + "</span></button>";
    }).join("");
    var n = state.data.length;
    $("stats").innerHTML = t("stats", {
      n: n, qw: plural(n, t("qForms")),
      ru: state.data.filter(function (r) { return r.answer_lang === "ru"; }).length,
      en: state.data.filter(function (r) { return r.answer_lang === "en"; }).length
    });
  }

  /* ------------------------------------------------------------------ */
  /* Каталог                                                              */
  /* ------------------------------------------------------------------ */
  function fillSelect(el, items, value) {
    el.innerHTML = items.map(function (it) { return '<option value="' + esc(it[0]) + '">' + esc(it[1]) + "</option>"; }).join("");
    el.value = value;
  }
  function renderFilters() {
    fillSelect($("f-topic"), [["all", t("allTopics")]].concat(TOPIC_KEYS.map(function (k) { return [k, t("topics")[k]]; })), state.cat.topic);
    fillSelect($("f-type"), [["all", t("allTypes")]].concat(TYPE_KEYS.map(function (k) { return [k, t("kind")[k]]; })), state.cat.type);
    fillSelect($("f-lang"), [["all", t("allLangs")], ["ru", t("langRu")], ["en", t("langEn")]], state.cat.alang);
    $("f-text").value = state.cat.text;
  }
  function renderCatalog() {
    var c = state.cat, needle = c.text.trim().toLowerCase().replace(/ё/g, "е");
    var titleCount = {};
    state.data.forEach(function (r) { titleCount[r.source.title] = (titleCount[r.source.title] || 0) + 1; });
    var groups = {}, order = [], shown = 0;
    state.data.forEach(function (r) {
      if (c.topic !== "all" && (r.topics || []).indexOf(c.topic) < 0) return;
      if (c.type !== "all" && r.source.type !== c.type) return;
      if (c.alang !== "all" && r.answer_lang !== c.alang) return;
      if (needle) {
        var hay = (r.question_ru + " " + (r.question_en || "") + " " + (r.question_original || "")).toLowerCase().replace(/ё/g, "е");
        if (hay.indexOf(needle) < 0) return;
      }
      var grouped = titleCount[r.source.title] > 1;
      var key = grouped ? "t:" + r.source.title : "p:" + r.source.publisher + "|" + r.answer_lang;
      if (!groups[key]) {
        groups[key] = { label: grouped ? r.source.title : (r.source.publisher + ", " + langLabel(r)), rows: [] };
        order.push(key);
      }
      groups[key].rows.push(r);
      shown++;
    });
    order.sort(function (a, b) { return groups[b].rows.length - groups[a].rows.length; });
    $("cat-count").innerHTML = t("catCount", { n: shown, t: state.data.length });
    if (!shown) { $("groups").innerHTML = '<p class="empty">' + esc(t("catEmpty")) + "</p>"; return; }
    var openAll = shown <= 24;
    $("groups").innerHTML = order.map(function (k) {
      var g = groups[k];
      return '<details class="group"' + (openAll ? " open" : "") + '><summary><span class="ttl">' + esc(g.label) + '</span><span class="cnt">' + g.rows.length +
        '</span><span class="chev" aria-hidden="true"></span></summary><div class="dbody"><ul class="rows">' + g.rows.map(function (r) {
          return '<li><button class="row" type="button" data-act="row" data-id="' + esc(r.id) + '" aria-expanded="false"><span class="loc">' + esc(locator(r)) +
            "</span><span>" + esc(qText(r)) + "</span></button></li>";
        }).join("") + "</ul></div></details>";
    }).join("");
  }

  /* ------------------------------------------------------------------ */
  /* О проекте                                                            */
  /* ------------------------------------------------------------------ */
  function setYtMode(app) {
    if (state.ytApp === app) return;
    state.ytApp = app;
    if (app) save("qa.yt", "app"); else drop("qa.yt");
    all('.player-slot[data-kind="play"]').forEach(function (slot) { closePanel(slot.closest(".card"), true); });
    if (state.query) runSearch(state.query, true);
    try { renderCatalog(); } catch (e) { /* ignore */ }
    if ($("about") && $("about").innerHTML) renderAbout();
    toast(t(app ? "ytModeOn" : "ytModeOff"));
  }
  function renderAbout() {
    var n = state.data.length;
    var li = function (arr) { return arr.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join(""); };
    var privN = Object.keys(state.priv).length;
    var html = "";
    html += '<div class="view">';
    html += '<div class="block"><h1>' + esc(t("aTitle")) + '</h1><p class="lead">' + esc(t("aLead")) + "</p></div>";
    html += '<div class="panel"><h2>' + esc(t("aHow")) + '</h2><div class="prose"><ol>' + li(t("aHowList")) + "</ol></div></div>";
    var playList = (playerOn() ? t("aPlayOn") : t("aPlayOff")).concat([t(FEATURES.reader ? "aReadOn" : "aReadOff")]);
    html += '<div class="panel"><h2>' + esc(t("aPlay")) + '</h2><div class="prose"><ul>' + li(playList) + "</ul></div></div>";
    if (playerOn()) {
      html += '<div class="panel" id="yt-setting"><h2>' + esc(t("aYt")) + '</h2><div class="prose"><p>' + esc(t("aYtP")) + "</p></div>" +
        '<div class="seg" role="group" aria-label="' + esc(t("aYt")) + '">' +
        '<button type="button" data-act="yt-mode" data-mode="card" aria-pressed="' + (!state.ytApp) + '">' + esc(t("aYtCard")) + "</button>" +
        '<button type="button" data-act="yt-mode" data-mode="app" aria-pressed="' + state.ytApp + '">' + esc(t("aYtApp")) + "</button></div></div>";
    }
    html += '<div class="panel"><h2>' + esc(t("aMarks")) + '</h2><dl class="legend">' +
      '<dt><span class="pill ok">' + esc(t("stDirect")) + "</span></dt><dd>" + esc(t("aMarkDirect")) + "</dd>" +
      '<dt><span class="pill near">' + esc(t("stNear")) + "</span></dt><dd>" + esc(t("aMarkNear")) + "</dd>" +
      '<dt><span class="pill none">' + esc(t("stNone")) + "</span></dt><dd>" + esc(t("aMarkNone")) + "</dd>" +
      '<dt><span class="pill ok">' + esc(t("official")) + "</span></dt><dd>" + esc(t("aMarkOff")) + "</dd>" +
      "</dl></div>";
    html += '<div class="panel"><h2>' + esc(t("aText")) + '</h2><div class="prose"><p>' + esc(t("aTextP")) + "</p></div></div>";
    html += '<div class="panel"><h2>' + esc(t("aNot")) + '</h2><div class="prose"><ul>' + li(t("aNotList")) + "</ul></div></div>";
    html += '<div class="panel"><h2>' + esc(t("aState")) + '</h2><p class="stats">' + t("aStateP", {
      n: n,
      pl: playerOn() ? state.data.filter(function (r) { return !!mediaOf(r); }).length : 0,
      tx: state.data.filter(function (r) { return r.source.text_at_source; }).length,
      tc: state.data.filter(function (r) { return r.source.timecode; }).length,
      ver: esc(fmtDate(CONFIG.dataVersion))
    }) + "</p></div>";
    if (state.sources.length) {
      html += '<div class="panel"><h2>' + esc(t("aSources")) + '</h2><ul class="srclist">' + state.sources.map(function (s) {
        var st = s.status === "used" ? "stUsed" : s.status === "partial" ? "stPartial" : "stTodo";
        return '<li><span class="st ' + esc(s.status) + '">' + esc(t(st)) + "</span>" +
          '<a href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener">' + esc(state.lang === "ru" ? s.name_ru : s.name_en) + " ↗</a>" +
          "<p>" + esc(state.lang === "ru" ? s.note_ru : s.note_en) + "</p></li>";
      }).join("") + "</ul></div>";
    }
    if (FEATURES.reader) {
      html += '<div class="panel"><h2>' + esc(t("aInternal")) + '</h2><div class="prose"><p>' + esc(t("aInternalP")) + "</p>" +
        (privN ? '<p class="stats">' + t("aInternalHave", { n: privN }) + "</p>" : "") + "</div>" +
        '<div class="filebox"><input type="file" id="priv-file" accept=".json,application/json" aria-label="private_texts.json">' +
        (privN ? '<button class="btn quiet" type="button" data-act="priv-clear">' + esc(t("aInternalClear")) + "</button>" : "") + "</div></div>";
    }
    html += "</div>";
    $("about").innerHTML = html;
  }

  function setPrivate(obj) {
    var clean = {}, n = 0;
    Object.keys(obj || {}).forEach(function (k) {
      var v = obj[k];
      if (v && typeof v === "object") v = v.text;
      if (typeof v === "string" && v.trim() && /^qa_\d+$/.test(k)) { clean[k] = v; n++; }
    });
    state.priv = clean;
    return n;
  }

  /* ------------------------------------------------------------------ */
  /* Язык и разделы                                                       */
  /* ------------------------------------------------------------------ */
  function applyLang() {
    root.lang = state.lang;
    document.title = t("title");
    all("[data-i18n]").forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
    all("[data-i18n-ph]").forEach(function (el) { el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))); });
    all("[data-i18n-aria]").forEach(function (el) { el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria"))); });
    all(".lang button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === state.lang)); });
    renderUpdated();
    if (!state.index) return;
    renderRest(); renderFilters(); renderCatalog(); renderAbout();
    runSearch(state.query, true);
  }
  function setLang(l) {
    state.lang = l === "en" ? "en" : "ru";
    save("qa.lang", state.lang);
    applyLang();
  }
  function setView(v) {
    if (VIEWS.indexOf(v) < 0) v = "search";
    var changed = state.view !== v;
    state.view = v;
    VIEWS.forEach(function (k) {
      var el = $("view-" + k);
      el.hidden = k !== v;
      el.classList.remove("enter");
      if (k === v && changed) { void el.offsetWidth; el.classList.add("enter"); }
    });
    $("tabs").style.setProperty("--i", VIEWS.indexOf(v));
    all(".tabs a").forEach(function (a) {
      if (a.getAttribute("data-view") === v) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    // запись не должна играть в скрытом разделе
    if (changed) all('.player-slot[data-kind="play"]').forEach(function (slot) {
      var view = slot.closest("section.view");
      if (view && view.hidden) closePanel(slot.closest(".card"), true);
    });
  }
  function viewFromHash() {
    var h = "";
    try { h = (location.hash || "").replace(/^#/, ""); } catch (e) { /* ignore */ }
    setView(h || "search");
  }
  function detectLang() {
    var saved = load("qa.lang");
    if (saved === "ru" || saved === "en") return saved;
    try {
      var p = new URL(location.href).searchParams.get("lang");
      if (p === "ru" || p === "en") return p;
    } catch (e) { /* ignore */ }
    var nav = (navigator.language || "ru").toLowerCase();
    return /^(ru|uk|be|kk|ky|uz|tg|tt|ba|ce|az|hy|ka|mo)/.test(nav) ? "ru" : "en";
  }

  /* ------------------------------------------------------------------ */
  /* События                                                              */
  /* ------------------------------------------------------------------ */
  function recById(id) {
    for (var i = 0; i < state.data.length; i++) if (state.data[i].id === id) return state.data[i];
    return null;
  }
  function copyLink(r) {
    var url = r.source.url_at_time || r.source.url;
    var text = qText(r) + "\n" + url;
    var fail = function () { toast(t("copyFail", { u: url })); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { toast(t("copied")); }, fail);
      else fail();
    } catch (e) { fail(); }
  }
  function toggleRow(btn, r) {
    var li = btn.parentNode, box = li.querySelector(".reveal");
    if (box) {
      var card = box.querySelector(".card");
      if (card) closePanel(card, true);
      btn.setAttribute("aria-expanded", "false");
      collapse(box, function () { if (box.parentNode) box.parentNode.removeChild(box); });
    } else {
      btn.insertAdjacentHTML("afterend", wrapReveal(cardHtml(r, { note: true })));
      btn.setAttribute("aria-expanded", "true");
      expand(btn.nextElementSibling);
    }
  }

  document.addEventListener("click", function (ev) {
    // меню тем закрывается по нажатию мимо него
    if (!ev.target.closest(".skin")) skinMenu(false);
    var sum = ev.target.closest("summary");
    if (sum && sum.parentNode.classList.contains("group")) { ev.preventDefault(); toggleDetails(sum.parentNode); return; }

    var el = ev.target.closest("[data-act], [data-lang], [data-skin-set], #skin-btn");
    if (!el) return;
    if (el.id === "skin-btn") { skinMenu(); return; }
    if (el.hasAttribute("data-skin-set")) { setSkin(el.getAttribute("data-skin-set")); skinMenu(false); return; }
    if (el.hasAttribute("data-lang")) { setLang(el.getAttribute("data-lang")); return; }
    var act = el.getAttribute("data-act"), r = el.getAttribute("data-id") ? recById(el.getAttribute("data-id")) : null;
    if (act === "example") { $("q").value = el.textContent; runSearch(el.textContent); window.scrollTo(0, 0); }
    else if (act === "topic") { state.cat = { topic: el.getAttribute("data-topic"), type: "all", alang: "all", text: "" }; renderFilters(); renderCatalog(); try { location.hash = "catalog"; } catch (e) { setView("catalog"); } window.scrollTo(0, 0); }
    else if (act === "more") { state.shown += 6; runSearch(state.query, true); }
    else if (act === "copy" && r) copyLink(r);
    else if ((act === "play" || act === "read") && r) openPanel(el.closest(".card"), r, act);
    else if (act === "close-panel") closePanel(el.closest(".card"));
    else if (act === "yt-app") {
      // Android — в приложение YouTube; браузер сам откроет ссылку (на iPhone — в приложении YouTube, если оно есть)
      if (openExternal(el.getAttribute("href"))) ev.preventDefault();
      var yslot = el.closest(".player-slot");
      if (yslot) silence(yslot);
    }
    else if (act === "yt-mode") setYtMode(el.getAttribute("data-mode") === "app");
    else if (act === "viewer") { if (!openViewer(el.getAttribute("data-url"))) window.open(el.getAttribute("data-url"), "_blank", "noopener"); }
    else if (act === "alt") {
      var aslot = el.closest(".player-slot"), acard = el.closest(".card"), ar = acard && recById(acard.getAttribute("data-rec"));
      if (aslot && ar) { var ai = (parseInt(aslot.getAttribute("data-idx") || "0", 10) || 0) + 1; if (ai < mediaList(ar).length) mountPlayer(aslot, ar, ai); }
    }
    else if (act === "rate") {
      var box = el.closest(".media-audio"), au = box && box.querySelector("audio");
      if (au) au.playbackRate = Number(el.getAttribute("data-rate")) || 1;
      all("[data-rate]", box).forEach(function (b) { b.setAttribute("aria-pressed", String(b === el)); });
    }
    else if (act === "row" && r) toggleRow(el, r);
    else if (act === "priv-clear") { state.priv = {}; drop("qa.private"); toast(t("aInternalCleared")); renderAbout(); runSearch(state.query, true); }
  });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") skinMenu(false); });

  document.addEventListener("change", function (ev) {
    var el = ev.target;
    if (el.id === "f-topic") state.cat.topic = el.value;
    else if (el.id === "f-type") state.cat.type = el.value;
    else if (el.id === "f-lang") state.cat.alang = el.value;
    else if (el.id === "priv-file" && el.files && el.files[0]) {
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var n = setPrivate(JSON.parse(String(fr.result)));
          if (!n) throw new Error("empty");
          save("qa.private", JSON.stringify(state.priv));
          toast(t("aInternalOk", { n: n }));
        } catch (e) { toast(t("aInternalBad")); }
        renderAbout(); runSearch(state.query, true);
      };
      fr.readAsText(el.files[0]);
      return;
    } else return;
    renderCatalog();
  });
  document.addEventListener("input", function (ev) {
    if (ev.target.id === "f-text") { state.cat.text = ev.target.value; renderCatalog(); }
    else if (ev.target.id === "q") $("clear").hidden = !ev.target.value;
  });
  $("form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    runSearch($("q").value);
    try { $("q").blur(); } catch (e) { /* ignore */ }
  });
  $("clear").addEventListener("click", function () { $("q").value = ""; runSearch(""); $("q").focus(); });
  window.addEventListener("hashchange", viewFromHash);

  // «Как в системе»: следим за системной темой и за темой окна, в которое встроена страница
  try {
    var mq = matchMedia("(prefers-color-scheme: dark)");
    var onSys = function () { if (state.skin === "auto") applySkin(true); };
    if (mq.addEventListener) mq.addEventListener("change", onSys); else if (mq.addListener) mq.addListener(onSys);
    new MutationObserver(onSys).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  } catch (e) { /* ignore */ }

  /* ------------------------------------------------------------------ */
  /* Запуск                                                               */
  /* ------------------------------------------------------------------ */
  function loadData() {
    if (window.QA_DATA) return Promise.resolve({ qa: window.QA_DATA, sources: window.QA_SOURCES || [] });
    var get = function (name) {
      return fetch(name, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(name + ": " + r.status); return r.json(); });
    };
    return Promise.all([get("data/qa.json"), get("data/sources.json").catch(function () { return []; })]).then(function (a) { return { qa: a[0], sources: a[1] }; });
  }

  var savedSkin = load("qa.skin");
  state.skin = SKINS.indexOf(savedSkin) >= 0 ? savedSkin : "auto";
  applySkin(false);
  state.lang = detectLang();
  applyLang();
  viewFromHash();
  $("out").innerHTML = '<p class="empty">' + esc(t("loading")) + "</p>";

  loadData().then(function (d) {
    state.data = d.qa;
    state.sources = d.sources;
    state.index = QASearch.buildIndex(state.data);
    try { var p = load("qa.private"); if (p) setPrivate(JSON.parse(p)); } catch (e) { /* ignore */ }
    $("out").innerHTML = "";
    var q = "";
    try { q = new URL(location.href).searchParams.get("q") || ""; } catch (e) { /* ignore */ }
    if (q) $("q").value = q;
    state.query = q;
    applyLang();
  }).catch(function () {
    $("out").innerHTML = '<div class="status"><span class="pill none">!</span><p>' + esc(t("loadError")) + "</p></div>";
  });

  // Офлайн-кэш и установка «на экран Домой» — только на настоящем сайте (https), не в предпросмотре и не в Android-приложении.
  try {
    if (!CONFIG.standalone && !window.AndroidApp && "serviceWorker" in navigator && location.protocol === "https:" && window.top === window.self) {
      navigator.serviceWorker.register("sw.js").catch(function () { /* не критично */ });
    }
  } catch (e) { /* ignore */ }
})();
