# 한국어 Quiz — Native Android

Aplikasi Android untuk kuis kosakata Korea. Ini versi **native** dari
[Korean Quiz — DeepSeek Harness version](https://github.com/rifqilubis/korean-quiz-deepseek-harness-version):
kuis web yang sudah teruji dibungkus jadi APK Android, seluruh isinya dibundel di dalam aplikasi.

**252 kata · 4 pilihan · 1 jawaban benar · 100% offline · tanpa satu pun izin**

## Unduh & pasang

1. Buka halaman **[Releases](../../releases)** repo ini.
2. Unduh berkas `app-debug.apk`.
3. Di ponsel: buka berkas itu → izinkan *Install unknown apps* untuk browser/file manager
   (hanya sekali) → **Install**.
4. Ikon `한` muncul di layar utama. Buka, dan kuis langsung jalan — tanpa internet.

> APK ini ditandatangani dengan debug key. Cukup untuk dipasang sendiri dan dibagikan,
> tapi belum layak untuk Google Play (perlu upload key tersendiri).

## Kenapa ini disebut versi native

| | Versi web (PWA) | Versi native (repo ini) |
| --- | --- | --- |
| Pemasangan | "Tambahkan ke layar utama" dari browser | APK sungguhan, ikon adaptif Android |
| Izin |—| **tidak ada izin sama sekali** |
| Isi kuis | diunduh sekali lalu di-cache | sudah ada di dalam APK sejak awal |
| Pelafalan | Web Speech API (kalau ada suara Korea) | **TextToSpeech bawaan Android** (`Locale.KOREAN`) |
| Tombol kembali | keluar dari browser | mengikuti riwayat halaman, baru keluar |
| Tampilan | bilah alamat browser | layar penuh, tanpa bilah apa pun |

## Cara kerjanya

- Isi kuis ada di `app/src/main/assets/` — salinan identik dari repo web.
- Dimuat lewat **WebViewAssetLoader**, sehingga halamannya berjalan di origin
  `https://appassets.androidplatform.net/assets/…`, bukan `file://`. Ini penting:
  di `file://` WebView, `localStorage` (rekor skor & pilihan tema) tidak dapat diandalkan.
- **Service worker dimatikan** dengan sengaja (permintaan `sw.js` dijawab 404 oleh
  `shouldInterceptRequest`). Asetnya sudah ada di dalam APK, jadi SW tidak diperlukan —
  dan cache SW justru berisiko menyajikan berkas lama setelah aplikasi diperbarui.
- **Pelafalan**: Android WebView tidak punya Web Speech API. `MainActivity` menyisipkan
  shim kecil (`TTS_SHIM`) supaya `window.speechSynthesis` terlihat ada dan tombol 🔊 muncul,
  tapi suaranya diteruskan ke `TextToSpeech` Android lewat jembatan `AndroidTTS`.
  Berkat itu, **tidak ada satu pun berkas web yang perlu diubah**.

## Struktur

```
korean-quiz-android/
├─ app/
│  ├─ build.gradle                 konfigurasi modul (compileSdk 34, minSdk 24)
│  └─ src/main/
│     ├─ AndroidManifest.xml        tanpa izin; launcher + MainActivity
│     ├─ java/…/MainActivity.kt     WebView, asset loader, jembatan TTS
│     ├─ assets/                    isi kuis (salinan dari repo web)
│     └─ res/
│        ├─ drawable/               latar gradien ikon adaptif
│        ├─ mipmap-*/               ikon peluncur + lapisan depan adaptif (5 kerapatan)
│        └─ values/                 nama aplikasi, warna, tema
├─ gradle/wrapper/                  Gradle 8.7
├─ tools/
│  ├─ make-android-icons.py         bikin ulang ikon dari font Korea
│  └─ sync-assets.py                salin aset dari repo web ke dalam APK
└─ .github/workflows/android.yml    bangun APK otomatis + rilis
```

## Membangun sendiri

**Lewat Android Studio:** buka folder ini, tunggu Gradle sync, lalu Run.

**Lewat terminal** (butuh JDK 17 + Android SDK):

```bash
./gradlew assembleDebug
# APK: app/build/outputs/apk/debug/app-debug.apk
```

**Tanpa memasang apa pun:** push ke GitHub — workflow di `.github/workflows/android.yml`
membangun APK-nya di server GitHub dan melampirkannya sebagai artifact. Push tag `v*`
otomatis membuat Release berisi APK-nya.

## Memperbarui isi kuis

Kuis web adalah sumber kebenarannya. Setelah repo web diubah:

```bash
python tools/sync-assets.py ../korean-quiz
```

Skrip itu menyalin ulang `index.html`, `css/`, `js/`, `icons/`, `manifest.json`, dan `sw.js`
tanpa mengubahnya sama sekali. Ikon Android dibuat ulang dengan:

```bash
python tools/make-android-icons.py
```

## Catatan jujur

Kode ini ditulis dan diverifikasi lewat build GitHub Actions, bukan lewat emulator —
tidak ada Android SDK maupun emulator di mesin tempat proyek ini dibuat. Yang sudah
dipastikan: APK benar-benar terbangun, isinya (aset kuis, `classes.dex`, ikon) lengkap,
dan dapat dipasang. Yang belum diuji langsung di perangkat: perilaku WebView saat
dijalankan, ukuran huruf di layar berbeda, dan suara TTS Korea (tergantung apakah
ponselmu punya data suara Korea — kalau tidak, tombol 🔊 tidak muncul dengan sendirinya).

## Lisensi & asal

Kuis, bank kata, dan tampilannya berasal dari repo
[korean-quiz-deepseek-harness-version](https://github.com/rifqilubis/korean-quiz-deepseek-harness-version).
