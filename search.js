/*
 * search.js — поиск по базе вопросов. Работает в браузере и в Node (для тестов).
 *
 * Сейчас это поиск по словам с учётом форм слова и словаря синонимов RU ⇄ EN.
 * Он НЕ сочиняет ответы: только сравнивает вопрос пользователя с вопросами в базе.
 * Позже этот файл можно заменить на семантический поиск (эмбеддинги),
 * оставив те же функции buildIndex() и search().
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.QASearch = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Пороги: >= DIRECT — «найден ответ»; >= NEAR — «прямого ответа нет, вот близкие».
  var THRESHOLDS = { DIRECT: 0.62, NEAR: 0.22 };
  // Слово, которого нет в базе, снижает оценку как «умеренно редкое» слово.
  var UNKNOWN_DF = 10;

  var STOP = new Set((
    "и в во на не ни ли а но что как это то же или у к ко о об от до для по из с со за при если мне меня я мы вы он она они их его ее " +
    "бы быть есть ну да так там тут вот еще уже только тоже также когда где чем чтобы который которая которые которых которого этот эта эти того тому " +
    "кто какой какая какие каков ваш ваши мой моя свой своя свои себя нам нас вам вас им ей ему ними него нее про над под без между разве правда " +
    "почему зачем ли же всё все всех всем весь очень более менее быть был была были будет будут такой такое этом этого " +
    "время времени раз сейчас нибудь либо пожалуйста скажите расскажите объясните подскажите хочу знать узнать " +
    "during while please tell explain know want cant dont doesnt isnt arent wont didnt " +
    "the a an is are was were be been being of in to for and or do does did why what how if it its this that these those there their they them " +
    "he she his her him you your we our i my me on at by from with as about into not no so than then when who whom which will shall may might must " +
    "have has had can could should would also some any all very just only am"
  ).split(/\s+/));

  // Слова, которые встречаются почти в каждом вопросе: учитываются, но с малым весом.
  var SOFT_WORDS = (
    "ислам исламе ислама исламу исламом исламский исламская исламское islam islamic мусульманин мусульмане мусульман мусульманам мусульманами мусульманка " +
    "muslim muslims закир найк наик zakir naik доктор dr вопрос вопросы вопроса ответ ответы ответит question questions answer answers ask asks asked " +
    "говорит говорят сказано says say said считается относится нужно надо можно"
  ).split(/\s+/);

  // Группы слов с одним смыслом (RU и EN). Слово из группы находит любое другое слово из неё.
  var GROUPS = [
    ["бог", "бога", "богу", "боге", "богом", "боги", "господь", "господа", "аллах", "аллаха", "аллаху", "аллахе", "аллахом", "всевышний", "творец", "создатель", "god", "gods", "allah", "lord", "creator", "almighty"],
    ["создал", "создала", "создать", "создан", "сотворил", "сотворен", "сотворение", "несотворен", "творение", "created", "create", "creates", "creation", "uncreated"],
    ["существует", "существуют", "существование", "существования", "exist", "exists", "existence"],
    ["доказать", "докажи", "докажите", "доказательство", "доказательства", "доказывает", "доказывают", "доказана", "доказано", "prove", "proves", "proven", "proof", "evidence"],
    ["атеист", "атеиста", "атеисту", "атеистам", "атеистка", "атеистки", "атеизм", "безбожник", "atheist", "atheists", "atheism"],
    ["агностик", "агностики", "агностиками", "агностикам", "агностицизм", "agnostic", "agnostics", "agnosticism"],
    ["коран", "корана", "коране", "корану", "кораном", "куран", "quran", "koran", "qur"],
    ["наука", "науки", "науке", "науку", "наукой", "научный", "научная", "научное", "научно", "научные", "научных", "технологий", "science", "scientific", "scientifically", "technology"],
    ["ошибка", "ошибки", "ошибку", "ошибок", "недостаток", "недостатки", "противоречие", "противоречия", "error", "errors", "mistake", "mistakes", "flaw", "flaws", "contradiction", "contradictions"],
    ["иисус", "иисуса", "иисусе", "иисусу", "иисусом", "иса", "исы", "исе", "христос", "христа", "jesus", "christ", "isa"],
    ["библия", "библии", "библию", "библией", "евангелие", "евангелии", "евангелия", "bible", "biblical", "gospel", "gospels"],
    ["христианин", "христианина", "христианка", "христианки", "христиане", "христиан", "христианам", "христианство", "христианстве", "christian", "christians", "christianity"],
    ["троица", "троицы", "троицу", "троице", "триединство", "trinity", "triune"],
    ["дух", "духа", "духе", "духом", "spirit", "ghost"],
    ["душа", "души", "душу", "душе", "душой", "soul", "souls"],
    ["индуизм", "индуизме", "индуизма", "индуизму", "индус", "индуса", "индусы", "индусов", "индуист", "индуисты", "индуистка", "индуистки", "индуистов", "индуистам", "индуистом", "индуистские", "индуистской", "hindu", "hindus", "hinduism", "веды", "вед", "ведах", "vedas", "veda", "vedic"],
    ["идол", "идолы", "идолам", "идолов", "идолами", "идолопоклонство", "идолопоклонства", "статуя", "статуи", "изображение", "образа", "idol", "idols", "idolatry", "statue", "image", "imageless"],
    ["будда", "будды", "буддизм", "буддист", "буддисты", "buddha", "buddhism", "buddhist"],
    ["женщина", "женщины", "женщин", "женщинам", "женщине", "женщину", "женщинами", "женский", "woman", "women", "female", "females"],
    ["жена", "жены", "жене", "жену", "женой", "жен", "женах", "женами", "супруга", "супруг", "супругов", "wife", "wives", "spouse", "spouses"],
    ["муж", "мужа", "мужу", "мужем", "мужей", "мужья", "мужьями", "husband", "husbands"],
    ["многоженство", "многоженства", "многоженстве", "полигамия", "полигамии", "polygamy", "polygyny", "polygamous"],
    ["многомужество", "полиандрия", "polyandry"],
    ["брак", "брака", "браке", "браки", "браком", "браку", "жениться", "женитьба", "женимся", "женятся", "женился", "замуж", "замужем", "свадьба", "никах", "никаха", "никахе", "marry", "marries", "married", "marrying", "marriage", "intermarriage", "wedding", "nikah"],
    ["развод", "развода", "разводе", "разводу", "развестись", "разводиться", "талак", "divorce", "divorced", "talaq"],
    ["хиджаб", "хиджаба", "хиджабе", "платок", "покрывало", "покрываться", "покрывать", "паранджа", "паранджу", "никаб", "чадра", "hijab", "veil", "veiled", "niqab", "headscarf", "burqa"],
    ["свинина", "свинину", "свинины", "свинине", "свинья", "свиньи", "свиней", "свиное", "pork", "pig", "pigs", "swine", "bacon"],
    ["алкоголь", "алкоголя", "алкоголе", "спиртное", "спиртного", "вино", "вина", "пиво", "водка", "выпивать", "пьянство", "alcohol", "alcoholic", "wine", "beer", "liquor", "intoxicants"],
    ["мясо", "мяса", "мясная", "мясную", "мясной", "невегетарианская", "вегетарианство", "вегетарианец", "вегетарианцем", "вегетарианская", "meat", "vegetarian", "vegetarianism", "nonvegetarian", "vegan"],
    ["животное", "животных", "животные", "животным", "забой", "забоя", "забивают", "animal", "animals", "slaughter", "slaughtering"],
    ["еда", "еду", "еды", "пища", "пищу", "пищи", "едят", "кушать", "food", "eat", "eats", "eating"],
    ["музыка", "музыку", "музыки", "музыке", "песни", "песня", "танцы", "танец", "танцевать", "music", "musical", "song", "songs", "singing", "dance", "dancing"],
    ["курение", "курения", "курить", "курит", "курю", "курят", "сигареты", "сигарета", "сигарет", "табак", "кальян", "вейп", "smoking", "smoke", "smokes", "cigarette", "cigarettes", "tobacco", "hookah", "vape", "vaping"],
    ["запрещено", "запрещена", "запрещены", "запрещен", "запрещает", "запрещают", "запрещать", "запрет", "запрета", "запретил", "нельзя", "харам", "forbidden", "forbid", "prohibit", "prohibited", "prohibits", "prohibition", "haram", "haraam", "banned", "ban", "unlawful"],
    ["разрешено", "разрешена", "разрешены", "разрешает", "разрешается", "дозволено", "дозволен", "дозволена", "допустимо", "халяль", "allowed", "allow", "permitted", "permissible", "permit", "permits", "halal", "lawful"],
    ["пост", "поста", "посту", "посте", "постом", "поститься", "постишься", "постится", "ураза", "уразу", "рамадан", "рамадана", "рамазан", "fasting", "fast", "fasts", "ramadan", "ramadhan", "ramadhaan"],
    ["намаз", "намаза", "намазе", "намазы", "намазом", "молитва", "молитвы", "молитву", "молитве", "молиться", "молятся", "молится", "салят", "pray", "prays", "praying", "prayer", "prayers", "salah", "salat", "namaz"],
    ["хадж", "хаджа", "хадже", "паломничество", "умра", "hajj", "pilgrimage", "umrah"],
    ["кааба", "каабе", "каабу", "каабы", "kaaba", "kaba", "kabah", "мекка", "мекке", "мекку", "мекки", "makkah", "mecca", "медина", "медину", "madinah", "medina"],
    ["рай", "рая", "раю", "рае", "раем", "джаннат", "джанна", "paradise", "heaven", "jannah"],
    ["ад", "ада", "аду", "аде", "адом", "джаханнам", "hell", "hellfire"],
    ["загробная", "загробной", "загробную", "ахират", "ахирате", "afterlife", "hereafter", "akhirah"],
    ["смерть", "смерти", "смертью", "умер", "умершего", "умерших", "мертвых", "мертвые", "death", "dead", "die", "dies", "died", "deceased"],
    ["воскресит", "воскресят", "воскрешение", "воскресение", "воскреснут", "resurrect", "resurrected", "resurrection", "raised"],
    ["могила", "могиле", "могил", "могилы", "хоронят", "хоронить", "похороны", "погребение", "кремируют", "кремация", "кремации", "сжигают", "сжигать", "grave", "graves", "buried", "bury", "burial", "cremated", "cremation", "cremate", "burnt", "burned"],
    ["судьба", "судьбы", "судьбу", "судьбе", "предопределение", "предопределения", "кадар", "предначертано", "fate", "destiny", "predestination", "predestined", "qadar", "qadr"],
    ["терроризм", "терроризма", "терроризме", "террорист", "террористы", "террористами", "террористов", "теракт", "terrorism", "terrorist", "terrorists", "terror"],
    ["экстремист", "экстремисты", "экстремизм", "фундаменталист", "фундаменталисты", "фундаменталистами", "фундаментализм", "extremist", "extremists", "extremism", "fundamentalist", "fundamentalists", "fundamentalism"],
    ["джихад", "джихада", "джихаде", "jihad", "jihaad"],
    ["убивать", "убивают", "убивает", "убийство", "убийства", "убить", "уничтожение", "kill", "kills", "killed", "killing", "killings", "murder"],
    ["мир", "мира", "миру", "мире", "миром", "мирная", "мирное", "peace", "peaceful"],
    ["меч", "мечом", "меча", "насилие", "насилием", "насилию", "sword", "violence", "violent"],
    ["секты", "сект", "секта", "течения", "течений", "мазхаб", "мазхабы", "мазхабов", "школы", "школ", "sect", "sects", "school", "schools", "madhhab", "madhab"],
    ["шиит", "шииты", "шиитов", "шиитам", "шиитах", "shia", "shias", "shiite", "shiites"],
    ["суннит", "сунниты", "суннитов", "sunni", "sunnis"],
    ["проценты", "процент", "процентов", "процентами", "риба", "ростовщичество", "кредит", "кредиты", "ипотека", "ипотеку", "заем", "банк", "банке", "банка", "interest", "riba", "usury", "loan", "loans", "mortgage", "bank", "banking"],
    ["страхование", "страховка", "страховку", "insurance", "insure"],
    ["наследство", "наследства", "наследование", "наследует", "наследуют", "inheritance", "inherit", "inherits"],
    ["свидетель", "свидетели", "свидетельство", "свидетелей", "свидетелем", "witness", "witnesses", "testimony"],
    ["кафир", "кафиры", "кафирами", "кяфир", "кяфиры", "неверный", "неверные", "неверных", "неверующих", "kafir", "kafirs", "kuffar", "infidel", "unbeliever", "unbelievers", "believers"],
    ["немусульманин", "немусульмане", "немусульман", "немусульманам", "немусульманка", "немусульманах", "немусульманами", "немусульманина", "nonmuslim", "nonmuslims"],
    ["принять", "принял", "приняла", "принимают", "принимает", "принятие", "принятия", "принимать", "шахада", "шахаду", "accept", "accepts", "accepted", "accepting", "convert", "converts", "converting", "conversion", "embrace", "revert", "shahadah", "shahada"],
    ["религия", "религии", "религий", "религию", "религиях", "религией", "вера", "веры", "вере", "веру", "religion", "religions", "faith", "faiths"],
    ["мухаммад", "мухаммада", "мухаммаде", "мухаммадом", "мухаммед", "мухаммеда", "магомет", "muhammad", "mohammed", "muhammed", "mohammad"],
    ["пророк", "пророка", "пророке", "пророки", "пророков", "пророком", "посланник", "посланника", "prophet", "prophets", "messenger"],
    ["смысл", "смысла", "смысле", "цель", "цели", "целью", "предназначение", "purpose", "meaning", "aim"],
    ["жизнь", "жизни", "жизнью", "живем", "живут", "жить", "life", "live", "lives", "living"],
    ["эволюция", "эволюции", "эволюцию", "дарвин", "дарвина", "evolution", "darwin", "darwinism"],
    ["родственники", "родственниках", "родственников", "родственниками", "родственнице", "двоюродная", "двоюродной", "кузина", "кузине", "relatives", "relative", "cousin", "cousins", "consanguineous"],
    ["вероотступничество", "вероотступник", "отступник", "apostasy", "apostate"],
    ["инвалид", "инвалиды", "инвалидов", "инвалидностью", "инвалидность", "больные", "больных", "бедные", "бедных", "страдания", "страдают", "страдать", "disability", "disabilities", "disabled", "sick", "poor", "suffer", "suffering"],
    ["перерождение", "перерождения", "перерождается", "реинкарнация", "реинкарнации", "карма", "кармы", "rebirth", "reborn", "reincarnation", "karma"],
    ["мечеть", "мечети", "мечетях", "мечетей", "mosque", "mosques", "masjid"],
    ["сунна", "сунне", "сунну", "сунны", "хадис", "хадисы", "хадисов", "хадисах", "sunnah", "sunna", "hadith", "hadiths"],
    ["родители", "родителям", "родителей", "мать", "мама", "маме", "отец", "отца", "папа", "parents", "mother", "father"],
    ["зубы", "зубов", "зубная", "зубную", "зубной", "паста", "пастой", "пасту", "toothpaste", "teeth", "brush", "brushing"],
    ["пятница", "пятницам", "пятницу", "пятницы", "friday", "fridays"],
    ["ид", "праздничный", "праздничная", "праздник", "байрам", "eid"],
    ["сплетни", "сплетничать", "злословие", "гиба", "backbiting", "gossip", "gheebah", "ghibah"],
    ["иудаизм", "иудаизме", "иудеи", "иудеях", "иудеев", "евреи", "евреев", "judaism", "jews", "jewish", "jew"],
    ["дебаты", "дебатов", "диспут", "debate", "debates"],
    ["богаче", "богатые", "богатство", "умнее", "отстали", "отсталость", "rich", "richer", "wealth", "smarter", "behind", "backward"],
    ["дуа", "мольба", "dua", "supplication"],
    ["имя", "имени", "именем", "называют", "назвать", "называть", "name", "named", "called", "call"],
    ["писания", "писание", "писаниях", "scripture", "scriptures"],
    ["аиша", "аише", "аиши", "аишей", "aisha", "ayesha"],
    ["невольница", "невольницы", "невольницами", "рабыня", "рабыни", "рабство", "slave", "slaves", "slavery"],
    ["планирование", "контрацепция", "противозачаточные", "planning", "contraception"],
    ["чудо", "чудеса", "чудесным", "чудес", "miracle", "miracles", "miraculously", "miraculous"],
    ["сын", "сына", "сыном", "сыну", "son"],
    ["грех", "грехи", "грехов", "греха", "грехом", "sin", "sins"],
    ["камень", "камня", "камнем", "rock", "stone"],
    ["наказание", "наказывают", "наказываются", "наказывается", "наказан", "punish", "punished", "punishment", "punishes"],
    ["добро", "добрые", "добрых", "добра", "милостыня", "милостыню", "садака", "благотворительность", "пожертвование", "пожертвования", "good", "charity", "deeds", "righteous", "donation"],
    ["знание", "знаний", "знания", "ученые", "ученых", "knowledge", "scholars", "scholar"],
    ["люди", "людей", "людям", "человек", "человека", "человеком", "человеку", "people", "human", "humans", "person", "man"],
    ["следовать", "следует", "следуют", "следуете", "практикуют", "практикует", "соблюдать", "follow", "follows", "following", "practise", "practice"],
    ["носить", "носят", "носит", "надевать", "надевают", "wear", "wears", "wearing"],
    ["слушать", "слушает", "слушают", "слушаю", "listen", "listens", "listening"],
    // --- добавлено в версии 2 (новые темы базы) ---
    ["дава", "дават", "даваат", "дагват", "призыв", "призыва", "призыве", "призывать", "проповедь", "dawah", "dawa", "daawah", "preaching"],
    ["кошерное", "кошерная", "кошерный", "кошер", "kosher"],
    ["комиссия", "комиссию", "комиссионные", "commission", "commissions"],
    ["переезд", "переехать", "переезжать", "эмиграция", "эмигрировать", "миграция", "мигрировать", "хиджра", "migrate", "migration", "immigrate", "emigrate", "hijrah"],
    ["сми", "медиа", "телевидение", "телевизор", "media", "television", "tv"],
    ["заступничество", "заступаются", "заступник", "заступиться", "шафаат", "посредник", "intercede", "intercession", "intercessor"],
    ["завет", "завета", "testament"],
    ["пришествие", "пришествия", "coming"],
    ["када", "восполнить", "восполнение", "возместить", "qada", "qadha"],
    ["фидья", "fidya", "fidyah"],
    ["каффара", "искупление", "kaffara", "kaffarah", "expiation"],
    ["сходства", "сходство", "сходствах", "похожи", "similarities", "similarity"],
    ["различия", "различие", "различиях", "отличия", "отличается", "differences", "difference", "differ"]
  ];

  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[’'`ʼ]/g, "")
      .replace(/non[\s-]+muslim/g, "nonmuslim")
      .replace(/non[\s-]+veg/g, "nonveg")
      .replace(/\bне[\s-]+мусульман/g, "немусульман");
  }

  var RU_END = (
    "иями ями ами ого его ому ему ыми ими иях ией ием ться тся ешь ишь ете ите ают яют уют ала ила ела али или ели ало ило " +
    "ая яя ое ее ые ие ый ий ой ых их ую юю ом ем ам ям ах ях ов ев ей ия ью ть ет ит ут ют ат ят ал ил ел ла ло ли а я о е ы и у ю ь й"
  ).split(" ").sort(function (a, b) { return b.length - a.length; });
  var EN_END = ["ing", "ed", "es", "s"];

  function stem(w) {
    var i, e;
    if (/[а-я]/.test(w)) {
      for (i = 0; i < RU_END.length; i++) {
        e = RU_END[i];
        if (w.length - e.length >= 3 && w.slice(-e.length) === e) return w.slice(0, -e.length);
      }
      return w;
    }
    if (w.length > 4 && w.slice(-3) === "ies") return w.slice(0, -3) + "y";
    for (i = 0; i < EN_END.length; i++) {
      e = EN_END[i];
      if (w.length - e.length >= 3 && w.slice(-e.length) === e) return w.slice(0, -e.length);
    }
    return w;
  }

  // слово или основа -> общий «смысловой» токен группы
  var CONCEPT = new Map();
  GROUPS.forEach(function (g, gi) {
    var id = "§" + gi;
    g.forEach(function (w) {
      var n = norm(w);
      CONCEPT.set(n, id);
      var st = stem(n);
      if (!CONCEPT.has(st)) CONCEPT.set(st, id);
    });
  });
  var SOFT = new Set();
  SOFT_WORDS.forEach(function (w) { SOFT.add(tok(norm(w))); });
  // «можно / нельзя / разрешено / запрещено» — общие рамки вопроса, малый вес
  ["запрещено", "разрешено"].forEach(function (w) { SOFT.add(CONCEPT.get(w)); });

  function tok(w) {
    return CONCEPT.get(w) || CONCEPT.get(stem(w)) || stem(w);
  }

  function words(s) {
    return (norm(s).match(/[a-zа-я0-9]+/g) || []).filter(function (w) {
      return (w.length > 1 || /\d/.test(w)) && !STOP.has(w);
    });
  }

  function tokens(s) {
    return words(s).map(tok);
  }

  function bare(s) {
    return String(s || "").replace(/\([^)]*\)/g, " ");
  }

  function buildIndex(records) {
    var docs = records.map(function (r, i) {
      var bag = new Map();
      function addField(text, weight) {
        tokens(text).forEach(function (t) {
          if ((bag.get(t) || 0) < weight) bag.set(t, weight);
        });
      }
      var src = r.source || {};
      addField(r.question_ru, 1);
      addField(r.question_en, 1);
      addField(r.question_original, 0.9);
      addField((r.keywords || []).join(" "), 0.8);
      addField(src.title, 0.45);
      return {
        i: i,
        bag: bag,
        // «ядро» вопроса без пометок в скобках вроде «(на урду)»
        core: [new Set(tokens(bare(r.question_ru))), new Set(tokens(bare(r.question_en || r.question_original)))]
      };
    });
    var df = new Map();
    docs.forEach(function (d) {
      d.bag.forEach(function (_, t) { df.set(t, (df.get(t) || 0) + 1); });
    });
    return { docs: docs, df: df, N: docs.length, vocab: Array.from(df.keys()) };
  }

  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      var best = cur[0];
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < best) best = cur[j];
      }
      if (best > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }

  // Незнакомое слово: ищем похожее в словаре базы и в словаре синонимов
  // (общее начало слова или опечатка в одну-две буквы).
  function fuzzy(index, t) {
    if (t.charAt(0) === "§" || t.length < 4) return null;
    if (!index.fuzzyList) {
      index.fuzzyList = [];
      index.vocab.forEach(function (v) {
        if (v.charAt(0) !== "§" && v.length >= 4) index.fuzzyList.push([v, v]);
      });
      CONCEPT.forEach(function (id, word) {
        if (word.length >= 4 && index.df.has(id)) index.fuzzyList.push([word, id]);
      });
    }
    var maxLev = t.length >= 9 ? 2 : 1;
    var best = null, bestScore = 0, i, v, k, sc, longer;
    for (i = 0; i < index.fuzzyList.length; i++) {
      v = index.fuzzyList[i][0];
      if (/[а-я]/.test(v) !== /[а-я]/.test(t)) continue;
      k = 0;
      while (k < t.length && k < v.length && t.charAt(k) === v.charAt(k)) k++;
      longer = Math.max(t.length, v.length);
      sc = 0;
      if (k >= 4 && k >= 0.7 * longer) sc = k / longer;
      else if (t.length >= 5 && lev(t, v, maxLev) <= maxLev) sc = 0.75;
      if (sc > bestScore) { bestScore = sc; best = index.fuzzyList[i][1]; }
    }
    return best;
  }

  function search(index, query, opts) {
    opts = opts || {};
    var raw = Array.from(new Set(tokens(query)));
    if (!raw.length) return { tokens: [], hits: [], status: "empty" };
    // Только общие слова («ислам», «мусульмане», «почему») — просим уточнить вопрос.
    if (raw.every(function (t) { return SOFT.has(t); })) return { tokens: raw, hits: [], status: "vague" };

    var q = raw.map(function (t) {
      var known = index.df.has(t), penalty = 1, use = t;
      if (!known) {
        var f = fuzzy(index, t);
        if (f) { use = f; penalty = 0.85; known = true; }
      }
      var df = known ? index.df.get(use) : UNKNOWN_DF;
      var w = Math.log(1 + index.N / df) * (SOFT.has(use) ? 0.3 : 1);
      return { t: use, w: w, penalty: penalty, soft: SOFT.has(use) };
    });
    var qset = new Map();
    q.forEach(function (x) { qset.set(x.t, x); });
    var total = q.reduce(function (s, x) { return s + x.w; }, 0);

    function idf(t) {
      return Math.log(1 + index.N / (index.df.get(t) || 0.5)) * (SOFT.has(t) ? 0.3 : 1);
    }

    var hits = [];
    index.docs.forEach(function (d) {
      var got = 0, strong = 0;
      q.forEach(function (x) {
        var fw = d.bag.get(x.t);
        if (fw) {
          got += x.w * fw * x.penalty;
          if (!x.soft) strong++;
        }
      });
      if (!got || !strong) return;
      var recall = got / total;
      var cover = 0;
      d.core.forEach(function (set) {
        var all = 0, hit = 0;
        set.forEach(function (t) {
          var w = idf(t);
          all += w;
          if (qset.has(t)) hit += w;
        });
        if (all && hit / all > cover) cover = hit / all;
      });
      var score = recall * (0.72 + 0.28 * cover);
      var rec = opts.records ? opts.records[d.i] : null;
      if (rec) {
        if (opts.lang && rec.answer_lang === opts.lang) score *= 1.03;
        if (rec.source && (rec.source.text_at_source || rec.source.timecode)) score *= 1.01;
      }
      score = Math.min(score, 1);
      // «Найден ответ» — только если вопрос из базы в целом совпал с запросом,
      // а не одно общее слово («женщина», «рай»). Иначе это «близкий вопрос».
      if (cover < 0.4 && strong < 2) score = Math.min(score, THRESHOLDS.DIRECT - 0.01);
      hits.push({ i: d.i, score: score, recall: recall, cover: cover, own: rec && opts.lang && rec.answer_lang === opts.lang ? 1 : 0 });
    });
    // при равной оценке первым идёт ответ на языке интерфейса
    hits.sort(function (a, b) { return b.score - a.score || b.own - a.own || a.i - b.i; });

    var status = "none";
    if (hits.length && hits[0].score >= THRESHOLDS.DIRECT) status = "direct";
    else if (hits.length && hits[0].score >= THRESHOLDS.NEAR) status = "near";
    return {
      tokens: raw,
      hits: hits.filter(function (h) { return h.score >= THRESHOLDS.NEAR; }),
      status: status
    };
  }

  return { buildIndex: buildIndex, search: search, tokens: tokens, stem: stem, THRESHOLDS: THRESHOLDS };
});
