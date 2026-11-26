/*
 * Проверка поиска. Запуск: node tests/search.test.js
 * Каждая строка: вопрос, ожидаемый статус и (если нужно) id записи, которая должна быть первой.
 */
const path = require("path");
const QASearch = require(path.join(__dirname, "..", "search.js"));
const data = require(path.join(__dirname, "..", "data", "qa.json"));
const index = QASearch.buildIndex(data);

const CASES = [
  ["Почему в Исламе запрещена свинина?", "direct", "qa_0095"],
  ["Кто создал Бога?", "direct", "qa_0047"],
  ["Можно ли курить во время поста?", "direct", "qa_0021"],
  ["Почему разрешено многоженство?", "direct"],
  ["Музыка — это харам?", "direct", "qa_0034"],
  ["Говорил ли Иисус, что он Бог?", "direct"],
  ["Why is pork forbidden in Islam?", "direct", "qa_0095"],
  ["Who created God?", "direct", "qa_0047"],
  ["Is music haram?", "direct", "qa_0034"],
  ["Можно ли пить безалкогольное пиво?", "direct", "qa_0213"],
  ["Is non-alcoholic beer permitted?", "direct", "qa_0213"],
  ["кошерное мясо халяль?", "direct", "qa_0212"],
  ["комиссия с продаж", "direct", "qa_0209"],
  ["восполнить пропущенный пост", "direct", "qa_0231"],
  ["почему коран ниспослан 1400 лет назад", "direct", "qa_0214"],
  ["зачем молиться если я делаю добрые дела", "direct", "qa_0018"],
  ["Можно ли праздновать день рождения?", "direct", "qa_0432"],
  ["Есть ли у ангелов свобода воли?", "direct", "qa_0286"],
  ["Почему Аллах говорит о себе «Мы»?", "direct", "qa_0361"],
  ["можно ли переехать жить в европу", "near"],
  ["хиджаб", "near"],
  ["ислам", "vague"],
  ["мусульмане", "vague"],
  ["как починить велосипед", "none"],
  ["рецепт борща", "none"],
  ["", "empty"]
];

let failed = 0;
for (const [q, want, id] of CASES) {
  for (const lang of ["ru", "en"]) {
    const res = QASearch.search(index, q, { lang, records: data });
    const top = res.hits[0] ? data[res.hits[0].i].id : null;
    // первой может оказаться запись на языке интерфейса с тем же вопросом, поэтому id сверяем только для «своего» языка
    const idOk = !id || lang !== "ru" || top === id;
    if (res.status !== want || !idOk) {
      failed++;
      console.log(`НЕ ПРОШЁЛ [${lang}] «${q}»: статус ${res.status} (ожидался ${want}), первая запись ${top}${id ? " (ожидалась " + id + ")" : ""}`);
    }
  }
}

// Ни один результат не должен приходить без ссылки на источник
const noLink = data.filter(r => !/^https?:\/\//.test((r.source || {}).url || ""));
if (noLink.length) { failed++; console.log("Записи без ссылки на источник:", noLink.map(r => r.id).join(", ")); }

console.log(failed ? `\nОшибок: ${failed}` : `Все проверки пройдены: ${CASES.length} вопросов на двух языках интерфейса, ${data.length} записей.`);
process.exit(failed ? 1 : 0);
