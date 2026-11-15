/*
 * sw.js — офлайн-кэш для сайта (GitHub Pages) и установки «на экран Домой».
 * Страница и база: сначала сеть, при её отсутствии — сохранённая копия.
 * Видео и аудио не кэшируются: они всегда идут с сайта источника.
 */
var CACHE = "qa-v2-2026-11-15";
var SHELL = ["./", "index.html", "styles.css", "search.js", "app.js", "data/qa.json", "data/sources.json", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png"];

self.addEventListener("install", function (ev) {
  ev.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (ev) {
  ev.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (ev) {
  var req = ev.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  ev.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || caches.match("index.html"); });
    })
  );
});
