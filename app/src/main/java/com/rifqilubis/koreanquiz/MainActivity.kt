package com.rifqilubis.koreanquiz

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import java.util.Locale

/**
 *  한국어 Quiz — pembungkus native.
 *
 *  Seluruh isi kuis (HTML, CSS, JS, ikon) dibundel di dalam APK pada
 *  `app/src/main/assets/`, lalu dimuat lewat WebViewAssetLoader. Loader itu
 *  menyajikannya dari origin https://appassets.androidplatform.net, bukan
 *  file://, sehingga localStorage (rekor skor & pilihan tema) bekerja normal.
 *
 *  Aplikasi ini tidak meminta izin internet sama sekali: setelah dipasang,
 *  kuis berjalan penuh secara offline.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var tts: TextToSpeech? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        // Dipanggil sebagai setter eksplisit: sebagian WebSettings hanya punya
        // setter tanpa getter, sehingga sintaks properti Kotlin tidak berlaku.
        with(webView.settings) {
            setJavaScriptEnabled(true)
            setDomStorageEnabled(true)          // localStorage: rekor & tema
            setAllowFileAccess(false)
            setAllowContentAccess(false)
            setBuiltInZoomControls(false)
            setDisplayZoomControls(false)
            setSupportZoom(false)
            setSupportMultipleWindows(false)
            setMediaPlaybackRequiresUserGesture(false)
            setCacheMode(WebSettings.LOAD_DEFAULT)
        }

        webView.addJavascriptInterface(TtsBridge(), "AndroidTTS")

        webView.webViewClient = object : WebViewClient() {

            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                // Service worker sengaja dimatikan. Aset sudah ada di dalam APK,
                // jadi mode offline tidak perlu SW — dan cache SW justru bisa
                // menyajikan berkas lama setelah aplikasi diperbarui.
                if (request.url.path?.endsWith("/sw.js") == true) {
                    return WebResourceResponse(
                        "text/plain", "utf-8", 404, "Not Found",
                        emptyMap<String, String>(), null
                    )
                }
                return assetLoader.shouldInterceptRequest(request.url)
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val url = request.url
                if (url.host == "appassets.androidplatform.net") return false

                // Tautan luar dibuka di browser, bukan di dalam aplikasi.
                try {
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url.toString())))
                } catch (_: Exception) {
                    // Tidak ada browser terpasang: abaikan saja.
                }
                return true
            }

            override fun onPageFinished(view: WebView, url: String) {
                // Disisipkan setelah halaman siap, tapi tetap sebelum pengguna
                // menekan "Mulai kuis", sehingga tombol pelafalan ikut muncul.
                view.evaluateJavascript(TTS_SHIM, null)
            }
        }

        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")

        // Tombol kembali mengikuti riwayat halaman, baru keluar di halaman awal.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })

        tts = TextToSpeech(this) { status ->
            if (status == TextToSpeech.SUCCESS) {
                // setLanguage mengembalikan int, jadi dipanggil eksplisit.
                tts?.setLanguage(Locale.KOREAN)
            }
        }
    }

    override fun onDestroy() {
        tts?.stop()
        tts?.shutdown()
        tts = null
        super.onDestroy()
    }

    /** Jembatan dari halaman web ke mesin suara bawaan Android. */
    inner class TtsBridge {
        @JavascriptInterface
        fun speak(text: String) {
            val engine = tts ?: return
            engine.speak(text, TextToSpeech.QUEUE_FLUSH, Bundle(), UTTERANCE_ID)
        }
    }

    private companion object {
        const val UTTERANCE_ID = "korean-quiz"

        /**
         * Android WebView tidak menyediakan Web Speech API. Shim ini membuat
         * `window.speechSynthesis` terlihat ada (sehingga tombol 🔊 muncul),
         * tetapi suaranya diteruskan ke TextToSpeech Android lewat jembatan
         * `AndroidTTS`. Tidak ada berkas web yang perlu diubah.
         */
        val TTS_SHIM = """
            (function () {
              if (window.speechSynthesis || !window.AndroidTTS) return;
              function Utterance(text) {
                this.text = text;
                this.lang = 'ko-KR';
                this.rate = 1;
                this.pitch = 1;
                this.voice = null;
              }
              window.SpeechSynthesisUtterance = Utterance;
              window.speechSynthesis = {
                getVoices: function () { return []; },
                cancel: function () {},
                pause: function () {},
                resume: function () {},
                speak: function (utterance) {
                  try {
                    var text = utterance && utterance.text ? String(utterance.text) : '';
                    if (text) window.AndroidTTS.speak(text);
                  } catch (e) {}
                }
              };
            })();
        """.trimIndent()
    }
}
