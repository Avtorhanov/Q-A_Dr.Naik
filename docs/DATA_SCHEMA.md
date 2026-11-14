# Формат базы (версия 2)

Файл `data/qa.json` — список записей. Одна запись — один вопрос и место, где на него дан ответ.
Проверка формата: `python3 tools/validate.py`.

```json
{
  "id": "qa_0015",
  "question_ru": "Если Бог заранее знает наши грехи, почему нас за них наказывают?",
  "question_en": "If God knows everything we do, then why is our fate determined and why are we punished?",
  "question_original": "If God knows everything we do, then why is our fate determined and why are we punished?",
  "question_lang": "en",
  "answer_text": null,
  "answer_lang": "en",
  "source": {
    "type": "video",
    "title": "Does God Exist? (Doha, Qatar, 2016)",
    "publisher": "YouTube (via islamicity.org)",
    "url": "https://www.youtube.com/watch?v=hkP-g9EcYbo",
    "timecode": "04:39:52",
    "url_at_time": "https://www.youtube.com/watch?v=hkP-g9EcYbo&t=16792s",
    "date": "2016"
  },
  "topics": ["god"],
  "keywords": ["предопределение", "судьба", "кадар"],
  "rights": "pending",
  "verified": false
}
```

## Поля записи

| Поле | Обязательно | Что это |
|---|---|---|
| `id` | да | `qa_` и четыре цифры, без повторов |
| `question_ru` | да | Вопрос по-русски (перевод или оригинал) |
| `question_en` | желательно | Вопрос по-английски для английского интерфейса |
| `question_original` | да | Вопрос так, как он задан, или название ролика |
| `question_lang`, `answer_lang` | да | `ru` или `en` |
| `answer_text` | да | Дословный текст ответа или `null`. Пока `rights` равно `pending`, только `null` |
| `topics` | да | Одна или несколько тем: `god`, `quran`, `jesus`, `religions`, `women`, `halal`, `worship`, `peace`, `afterlife`, `muslims`, `other` |
| `keywords` | нет | Синонимы и слова, которых нет в вопросе |
| `rights` | да | `pending` — разрешения нет, `granted` — есть, `public` — открытая лицензия |
| `verified` | да | `true` только после ручной сверки с источником |

## Поля источника (`source`)

| Поле | Обязательно | Что это |
|---|---|---|
| `type` | да | `video`, `audio_clip`, `transcript` (текст сессии), `book`, `lecture` |
| `title` | да | Название выступления, ролика или книги |
| `publisher` | да | Где опубликовано |
| `url` | да | Ссылка на источник |
| `timecode` | нет | Начало вопроса, `ЧЧ:ММ:СС` или `ММ:СС` |
| `url_at_time` | с таймкодом | Ссылка, открывающая запись с этой минуты |
| `date` | нет | Дата выступления: год или `ДД.ММ.ГГГГ` |
| `date_kind` | нет | `upload`, если известна только дата публикации |
| `media_url` | нет | Новое в версии 2. Прямая ссылка `https://` на файл `.mp3`, `.m4a`, `.mp4`: запись играет внутри приложения |
| `media_type` | нет | Новое в версии 2. `audio` или `video`, если по ссылке этого не видно |
| `page` | для книги | Страница PDF |
| `question_no`, `question_total` | нет | Номер вопроса по порядку и число вопросов |
| `duration_min` | нет | Длина всей записи в минутах |
| `text_at_source` | нет | `true`, если на странице источника есть текст ответа |
| `official` | нет | `true` для zakirnaik.com |
| `note_ru`, `note_en` | нет | Пометка для пользователя |
| `also` | нет | Список `{ "url", "label_ru", "label_en" }`: та же запись на других площадках |

Встроенный плеер сам узнаёт ссылки YouTube, Rutube и OK. Для них `media_url` не нужен.

## Файл `data/sources.json`

Список источников для раздела «О проекте»: `id`, `status` (`used`, `partial`, `todo`), `url`, `name_ru`, `name_en`, `note_ru`, `note_en`.

## Файл `private_texts.json` (в репозиторий не входит)

Тексты ответов для внутреннего теста:

```json
{ "qa_0015": "Дословный текст ответа…" }
```
