#!/usr/bin/env python3
"""
Проверяет базу data/qa.json перед публикацией. Запуск: python3 tools/validate.py
Ошибки (код выхода 1) — то, что ломает приложение или нарушает принципы проекта.
Предупреждения — то, что стоит поправить, но работать не мешает.
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TOPICS = {"god", "quran", "jesus", "religions", "women", "halal", "worship", "peace", "afterlife", "muslims", "other"}
TYPES = {"video", "transcript", "book", "audio_clip", "lecture"}
RIGHTS = {"pending", "granted", "public"}
TC = re.compile(r"^\d{1,2}:\d{2}(:\d{2})?$")


def secs(tc):
    p = [int(x) for x in tc.split(":")]
    while len(p) < 3:
        p.insert(0, 0)
    return p[0] * 3600 + p[1] * 60 + p[2]


def main():
    data = json.loads((ROOT / "data" / "qa.json").read_text(encoding="utf-8"))
    errors, warns, seen = [], [], set()
    for n, r in enumerate(data):
        rid = r.get("id", "#%d" % n)
        err = lambda m: errors.append("%s: %s" % (rid, m))
        warn = lambda m: warns.append("%s: %s" % (rid, m))
        if not re.match(r"^qa_\d{4}$", str(r.get("id", ""))):
            err("id должен быть вида qa_0001")
        if rid in seen:
            err("повтор id")
        seen.add(rid)
        for f in ("question_ru", "question_original"):
            if not str(r.get(f) or "").strip():
                err("пустое поле " + f)
        if not str(r.get("question_en") or "").strip():
            warn("нет question_en (английский интерфейс покажет оригинал)")
        if r.get("question_lang") not in ("ru", "en") or r.get("answer_lang") not in ("ru", "en"):
            err("question_lang и answer_lang: только ru или en")
        if r.get("rights") not in RIGHTS:
            err("rights: pending, granted или public")
        if r.get("answer_text") and r.get("rights") == "pending":
            err("текст ответа при rights: pending публиковать нельзя (перенесите его в private_texts.json)")
        if not isinstance(r.get("verified"), bool):
            err("verified: true или false")
        bad = set(r.get("topics") or []) - TOPICS
        if bad or not r.get("topics"):
            err("topics: нужна хотя бы одна тема из списка, лишние: %s" % sorted(bad))
        s = r.get("source") or {}
        if s.get("type") not in TYPES:
            err("source.type: " + ", ".join(sorted(TYPES)))
        if not str(s.get("title") or "").strip():
            err("пустой source.title")
        if not re.match(r"^https?://", str(s.get("url") or "")):
            err("source.url должен начинаться с http:// или https://")
        tc = s.get("timecode")
        if tc:
            if not TC.match(tc):
                err("timecode: формат ЧЧ:ММ:СС или ММ:СС")
            elif not s.get("url_at_time"):
                warn("есть timecode, но нет url_at_time")
            elif "youtu" in s["url_at_time"] and ("t=%ds" % secs(tc)) not in s["url_at_time"]:
                err("url_at_time не совпадает с timecode (ожидается t=%ds)" % secs(tc))
        if s.get("media_url") and not str(s["media_url"]).startswith("https://"):
            err("media_url должен начинаться с https://")
        for a in s.get("also") or []:
            if not re.match(r"^https?://", str(a.get("url") or "")) or not a.get("label_ru") or not a.get("label_en"):
                err("also: нужны url, label_ru и label_en")

    # Дата обновления в шапке: app.js (dataVersion) и запасной текст в index.html должны совпадать
    app_js = (ROOT / "app.js").read_text(encoding="utf-8")
    index_html = (ROOT / "index.html").read_text(encoding="utf-8")
    m_app = re.search(r'dataVersion:\s*"(\d{4}-\d{2}-\d{2})"', app_js)
    m_idx = re.search(r'id="upd"><time datetime="(\d{4}-\d{2}-\d{2})"', index_html)
    if not m_app:
        errors.append('app.js: dataVersion должен быть датой вида "2026-11-26"')
    elif m_idx and m_idx.group(1) != m_app.group(1):
        warns.append("index.html: дата в шапке (%s) не совпадает с dataVersion в app.js (%s); на сайте покажется дата из app.js" % (m_idx.group(1), m_app.group(1)))

    for w in warns:
        print("предупреждение:", w)
    for e in errors:
        print("ОШИБКА:", e)
    print("\nЗаписей: %d, сверено вручную: %d, ошибок: %d, предупреждений: %d" % (
        len(data), sum(1 for r in data if r.get("verified") is True), len(errors), len(warns)))
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
