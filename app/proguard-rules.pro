# Aturan ProGuard/R8.
# Kuis ini hanya WebView + satu jembatan JavaScript, jadi tidak ada yang perlu
# dipertahankan khusus. Berkas ini disediakan supaya build release siap dipakai.

# Menjaga kelas jembatan JavaScript bila kelak minify diaktifkan.
-keepclassmembers class com.rifqilubis.koreanquiz.MainActivity$TtsBridge {
    public *;
}
