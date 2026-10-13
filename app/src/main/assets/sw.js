/* =========================================================================
   한국어 Quiz — service worker
   Tujuan: kuis tetap bisa dibuka tanpa internet (pesawat, roaming mahal,
   sinyal jelek) dan pembaruan tetap masuk saat ada koneksi.

   Semua path relatif terhadap lokasi sw.js, jadi tetap benar walau situs
   dipasang di sub-folder (mis. /korean-quiz-deepseek-harness-version/).

   Naikkan CACHE setiap kali berkas di ASSETS berubah, supaya pengguna
   menerima versi baru.
   ========================================================================= */

const CACHE = "kq-dsh-v1";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/app.js",
  "./js/data.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

/* ---------- install: simpan kerangka aplikasi ---------- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Satu berkas gagal tidak boleh menggagalkan seluruh instalasi.
      .then((cache) => Promise.all(ASSETS.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

/* ---------- activate: buang cache versi lama ---------- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

/* ---------- fetch ---------- */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Halaman: coba jaringan dulu supaya pembaruan cepat terlihat,
  // kalau offline pakai salinan di cache.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() =>
          caches
            .match("./index.html")
            .then((hit) => hit || caches.match("./"))
            .then((hit) => hit || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } }))
        )
    );
    return;
  }

  // Aset: cache dulu (cepat & hemat kuota), lalu jaringan.
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
