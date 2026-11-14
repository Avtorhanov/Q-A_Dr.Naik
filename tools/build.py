#!/usr/bin/env python3
"""
Собирает однофайловую версию приложения: standalone.html.
В неё вшиты стили, скрипты и база, поэтому файл можно открыть без сайта и без сервера.

  python3 tools/build.py                 -> standalone.html
  python3 tools/build.py --no-player -o preview.html
        (для окон предпросмотра, где чужие сайты встроить нельзя: остаются только ссылки на источник)
  python3 tools/build.py --reader        (включить читалку текста в этой сборке)
"""
import argparse, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def js_json(obj):
    # JSON внутри <script>: закрывающий тег и разделители строк экранируются
    s = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    return s.replace("</", "<\\/").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-o", "--out", default=str(ROOT / "standalone.html"))
    ap.add_argument("--no-player", action="store_true", help="выключить встроенный плеер в этой сборке")
    ap.add_argument("--reader", action="store_true", help="включить читалку текста в этой сборке")
    args = ap.parse_args()

    html = read("index.html")
    qa = json.loads(read("data/qa.json"))
    sources = json.loads(read("data/sources.json"))
    config = {"standalone": True}
    features = {}
    if args.no_player:
        features["player"] = False
    if args.reader:
        features["reader"] = True
    if features:
        config["features"] = features

    # файлы, которых рядом с одиночным файлом не будет
    html = re.sub(r'<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\n', "", html)
    html = html.replace('<link rel="stylesheet" href="styles.css">', "<style>\n" + read("styles.css") + "</style>")
    data_js = ("window.QA_CONFIG=" + js_json(config) + ";\n" +
               "window.QA_DATA=" + js_json(qa) + ";\n" +
               "window.QA_SOURCES=" + js_json(sources) + ";")
    html = html.replace('<script src="search.js"></script>', "<script>\n" + data_js + "\n</script>\n<script>\n" + read("search.js") + "</script>")
    html = html.replace('<script src="app.js"></script>', "<script>\n" + read("app.js") + "</script>")
    assert 'src="search.js"' not in html and 'src="app.js"' not in html and 'href="styles.css"' not in html

    pathlib.Path(args.out).write_text(html, encoding="utf-8")
    print("%s: %d КБ, вопросов: %d, выключатели: %s" % (args.out, len(html.encode("utf-8")) // 1024, len(qa), features or "как в app.js"))


if __name__ == "__main__":
    main()
