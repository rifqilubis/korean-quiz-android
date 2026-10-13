/* =========================================================================
   한국어 Quiz — logika kuis
   Alur: layar pengaturan -> soal (1 kata, 4 pilihan, 1 benar) -> hasil
   ========================================================================= */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Teks antarmuka (ID / EN)
     --------------------------------------------------------------------- */
  var STRINGS = {
    id: {
      modeKoId: "Kosakata Korea → Bahasa Indonesia",
      modeIdKo: "Kosakata Indonesia → Korea",
      modeMixed: "Campuran Korea ↔ Indonesia",
      questionCounter: "Soal {n} / {total}",
      scorePill: "Benar: {n}",
      askMeaning: "APA ARTI KATA INI?",
      askWord: "APA KATA KOREA DARI INI?",
      praise: ["Tepat sekali!", "Benar!", "Keren, betul!", "Mantap, benar!"],
      oops: ["Belum tepat.", "Salah.", "Masih keliru."],
      answerIs: "Jawabannya: {a}",
      next: "Soal berikutnya",
      finish: "Lihat hasil",
      startTitle: "Tebak arti kosakata Korea",
      startSub: "Satu kata muncul dan ada empat pilihan jawaban. Hanya satu yang benar. Bank soal berisi {total} kata.",
      directionLabel: "Arah terjemahan",
      countLabel: "Jumlah soal",
      countAll: "Semua",
      start: "Mulai kuis",
      bestLine: "Skor terbaik untuk pengaturan ini: {pct}% ({score}/{total})",
      bestNone: "Belum ada rekor untuk pengaturan ini.",
      hintKeys: "Tips: tekan 1-4 atau A-D untuk menjawab, Enter untuk lanjut.",
      installHint: "Buka menu browser → “Tambahkan ke layar utama” supaya bisa dibuka offline.",
      resultHeadline: "Hasil kuis",
      msgGreat: "Luar biasa! Kosakata Korea-mu sudah kuat.",
      msgGood: "Bagus! Sedikit lagi menuju sempurna.",
      msgOk: "Lumayan. Terus berlatih ya.",
      msgBad: "Jangan menyerah, ulangi dan hafalkan lagi.",
      statCorrect: "Benar",
      statWrong: "Salah",
      statTime: "Waktu",
      newBest: "🏆 Rekor baru!",
      playAgain: "Main lagi",
      changeSettings: "Ganti pengaturan",
      reviewTitle: "Pembahasan jawaban yang salah",
      yourAnswer: "Jawabanmu",
      noAnswer: "tidak dijawab",
      correctAnswer: "Jawaban benar",
      speakTitle: "Dengarkan pelafalan",
      langLocked: "Bahasa antarmuka terkunci selama kuis berlangsung"
    },
    en: {
      modeKoId: "Korean → Indonesian Vocabulary",
      modeIdKo: "Indonesian → Korean Vocabulary",
      modeMixed: "Mixed Korean ↔ Indonesian",
      questionCounter: "Question {n} / {total}",
      scorePill: "Correct: {n}",
      askMeaning: "WHAT DOES THIS WORD MEAN?",
      askWord: "WHAT IS THE KOREAN WORD FOR THIS?",
      praise: ["Exactly!", "Correct!", "Nice, that's right!", "Well done!"],
      oops: ["Not quite.", "Wrong.", "Still off."],
      answerIs: "The answer is: {a}",
      next: "Next question",
      finish: "See results",
      startTitle: "Guess the meaning of Korean words",
      startSub: "One word appears with four answer choices. Only one is correct. The question bank holds {total} words.",
      directionLabel: "Translation direction",
      countLabel: "Number of questions",
      countAll: "All",
      start: "Start quiz",
      bestLine: "Best score for these settings: {pct}% ({score}/{total})",
      bestNone: "No record yet for these settings.",
      hintKeys: "Tip: press 1-4 or A-D to answer, Enter to continue.",
      installHint: "Open your browser menu → “Add to Home screen” to use it offline.",
      resultHeadline: "Quiz result",
      msgGreat: "Outstanding! Your Korean vocabulary is strong.",
      msgGood: "Nice work! Almost perfect.",
      msgOk: "Not bad. Keep practising.",
      msgBad: "Don't give up — review and try again.",
      statCorrect: "Correct",
      statWrong: "Wrong",
      statTime: "Time",
      newBest: "🏆 New record!",
      playAgain: "Play again",
      changeSettings: "Change settings",
      reviewTitle: "Review of wrong answers",
      yourAnswer: "Your answer",
      noAnswer: "not answered",
      correctAnswer: "Correct answer",
      speakTitle: "Hear the pronunciation",
      langLocked: "Interface language is locked while the quiz runs"
    }
  };

  var LETTERS = ["A", "B", "C", "D"];
  var OPTION_COUNT = 4;
  var STORE_KEYS = { theme: "kq:theme", lang: "kq:lang", best: "kq:best:" };

  /* ---------------------------------------------------------------------
     State
     --------------------------------------------------------------------- */
  var state = {
    uiLang: "id",
    theme: "dark",
    settings: { direction: "ko-id", count: 20 },
    questions: [],
    index: 0,
    score: 0,
    answers: [],
    locked: false,
    running: false,
    startedAt: 0,
    elapsed: 0
  };

  var WORDS = (window.KQ_WORDS || []).slice();

  /* ---------------------------------------------------------------------
     DOM
     --------------------------------------------------------------------- */
  function $(id) { return document.getElementById(id); }

  var el = {
    modeLabel: $("modeLabel"),
    langBtn: $("langBtn"),
    langBtnText: $("langBtnText"),
    themeBtn: $("themeBtn"),

    screenStart: $("screen-start"),
    screenQuiz: $("screen-quiz"),
    screenResult: $("screen-result"),

    startTitle: $("startTitle"),
    startSub: $("startSub"),
    labelDirection: $("labelDirection"),
    labelCount: $("labelCount"),
    directionGroup: $("directionGroup"),
    countGroup: $("countGroup"),
    chipAll: $("chipAll"),
    startBtn: $("startBtn"),
    bestLine: $("bestLine"),
    hintKeys: $("hintKeys"),
    installHint: $("installHint"),

    questionCounter: $("questionCounter"),
    scorePill: $("scorePill"),
    progressBar: $("progressBar"),
    progressFill: $("progressFill"),

    quizCard: $("quizCard"),
    promptWord: $("promptWord"),
    promptRoman: $("promptRoman"),
    askText: $("askText"),
    speakBtn: $("speakBtn"),
    options: $("options"),
    feedback: $("feedback"),
    nextBtn: $("nextBtn"),

    ringFill: $("ringFill"),
    resultPercent: $("resultPercent"),
    resultFraction: $("resultFraction"),
    resultHeadline: $("resultHeadline"),
    resultMsg: $("resultMsg"),
    newBest: $("newBest"),
    statCorrect: $("statCorrect"),
    statWrong: $("statWrong"),
    statTime: $("statTime"),
    statCorrectLabel: $("statCorrectLabel"),
    statWrongLabel: $("statWrongLabel"),
    statTimeLabel: $("statTimeLabel"),
    againBtn: $("againBtn"),
    settingsBtn: $("settingsBtn"),
    reviewCard: $("reviewCard"),
    reviewTitle: $("reviewTitle"),
    reviewList: $("reviewList")
  };

  /* ---------------------------------------------------------------------
     Utilitas
     --------------------------------------------------------------------- */
  function t(key, vars) {
    var table = STRINGS[state.uiLang] || STRINGS.id;
    var value = table[key];
    if (value === undefined) value = STRINGS.id[key];
    if (typeof value === "string" && vars) {
      value = value.replace(/\{(\w+)\}/g, function (match, name) {
        return vars[name] !== undefined ? String(vars[name]) : match;
      });
    }
    return value;
  }

  function shuffle(list) {
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\uac00-\ud7a3 ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* Dua label dianggap terlalu mirip bila salah satunya termuat di label lain
     (mis. "kereta" vs "kereta api", "문" vs "창문") agar tidak ada dua jawaban benar. */
  function tooSimilar(a, b) {
    var x = normalize(a);
    var y = normalize(b);
    if (!x || !y) return true;
    return x === y || x.indexOf(y) >= 0 || y.indexOf(x) >= 0;
  }

  function formatTime(ms) {
    var total = Math.max(0, Math.round(ms / 1000));
    var minutes = Math.floor(total / 60);
    var seconds = total % 60;
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  }

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (err) { /* localStorage bisa diblokir (mis. mode privat) */ }
    return null;
  }

  function bestKey() {
    var total = state.settings.count > 0
      ? Math.min(state.settings.count, WORDS.length)
      : WORDS.length;
    return STORE_KEYS.best + state.settings.direction + ":" + total;
  }

  function loadBest() {
    var raw = store(bestKey());
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (err) { return null; }
  }

  /* ---------------------------------------------------------------------
     Tema & bahasa
     --------------------------------------------------------------------- */
  function applyTheme(theme) {
    state.theme = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", state.theme);
    store(STORE_KEYS.theme, state.theme);

    // Bilah alamat browser di ponsel ikut warna tema.
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", state.theme === "light" ? "#f4f5fb" : "#08080f");
  }

  function applyLang(lang) {
    state.uiLang = lang === "en" ? "en" : "id";
    store(STORE_KEYS.lang, state.uiLang);
    document.documentElement.lang = state.uiLang;
    el.langBtnText.textContent = state.uiLang === "id" ? "ID" : "EN";

    el.startTitle.textContent = t("startTitle");
    el.startSub.textContent = t("startSub", { total: WORDS.length });
    el.labelDirection.textContent = t("directionLabel");
    el.labelCount.textContent = t("countLabel");
    el.chipAll.textContent = t("countAll");
    el.startBtn.textContent = t("start");
    el.hintKeys.textContent = t("hintKeys");
    el.installHint.textContent = t("installHint");

    el.resultHeadline.textContent = t("resultHeadline");
    el.newBest.textContent = t("newBest");
    el.statCorrectLabel.textContent = t("statCorrect");
    el.statWrongLabel.textContent = t("statWrong");
    el.statTimeLabel.textContent = t("statTime");
    el.againBtn.textContent = t("playAgain");
    el.settingsBtn.textContent = t("changeSettings");
    el.reviewTitle.textContent = t("reviewTitle");
    el.speakBtn.title = t("speakTitle");

    updateModeLabel();

    if (state.running) {
      // Soal sudah dibangun dengan bahasa ini; perbarui label saja.
      refreshStatus();
    } else {
      refreshBestLine();
      if (!el.screenResult.hidden) renderResult();
    }
  }

  function updateModeLabel() {
    var direction = state.running && state.questions[state.index]
      ? state.questions[state.index].dir
      : state.settings.direction;
    var map = { "ko-id": "modeKoId", "id-ko": "modeIdKo", "mixed": "modeMixed" };
    el.modeLabel.textContent = t(map[direction] || "modeKoId");
  }

  /* ---------------------------------------------------------------------
     Membangun soal
     --------------------------------------------------------------------- */
  function meaningField() { return state.uiLang === "en" ? "en" : "id"; }

  function collectDistractors(word, key, correct) {
    var sameField = WORDS.filter(function (w) {
      return w.ko !== word.ko && w[key] && !tooSimilar(w[key], correct);
    });
    var fallback = WORDS.filter(function (w) {
      return w.ko !== word.ko && w[key];
    });
    var pool = shuffle(sameField.length >= OPTION_COUNT - 1 ? sameField : fallback);

    var used = [correct];
    var out = [];
    for (var i = 0; i < pool.length && out.length < OPTION_COUNT - 1; i++) {
      var label = pool[i][key];
      var duplicate = false;
      for (var j = 0; j < used.length; j++) {
        if (used[j] === label || tooSimilar(used[j], label)) { duplicate = true; break; }
      }
      if (duplicate) continue;
      used.push(label);
      out.push(label);
    }
    return out;
  }

  function makeQuestion(word, direction) {
    var dir = direction === "mixed"
      ? (Math.random() < 0.5 ? "ko-id" : "id-ko")
      : direction;
    var askKo = dir === "ko-id";
    var field = meaningField();
    var key = askKo ? field : "ko";
    var correct = word[key];

    var options = shuffle([correct].concat(collectDistractors(word, key, correct)));

    return {
      word: word,
      dir: dir,
      askKo: askKo,
      key: key,
      prompt: askKo ? word.ko : word[field],
      roman: askKo ? word.rom : "",
      options: options,
      correctText: correct,
      correctIndex: options.indexOf(correct)
    };
  }

  function buildQuestions() {
    var wanted = state.settings.count > 0 ? state.settings.count : WORDS.length;
    var count = Math.min(wanted, WORDS.length);
    var picked = shuffle(WORDS).slice(0, count);
    return picked.map(function (word) {
      return makeQuestion(word, state.settings.direction);
    });
  }

  /* ---------------------------------------------------------------------
     Layar
     --------------------------------------------------------------------- */
  function showScreen(name) {
    el.screenStart.hidden = name !== "start";
    el.screenQuiz.hidden = name !== "quiz";
    el.screenResult.hidden = name !== "result";
    el.langBtn.disabled = name === "quiz";
    el.langBtn.title = name === "quiz" ? t("langLocked") : "";
  }

  function refreshBestLine() {
    var best = loadBest();
    var total = state.settings.count > 0
      ? Math.min(state.settings.count, WORDS.length)
      : WORDS.length;
    el.bestLine.textContent = best
      ? t("bestLine", { pct: best.pct, score: best.score, total: best.total })
      : t("bestNone");
  }

  function refreshStatus() {
    var total = state.questions.length;
    el.questionCounter.textContent = t("questionCounter", {
      n: Math.min(state.index + 1, total),
      total: total
    });
    el.scorePill.textContent = t("scorePill", { n: state.score });
    var progress = total ? (state.index / total) * 100 : 0;
    el.progressFill.style.width = progress + "%";
    el.progressBar.setAttribute("aria-valuenow", String(Math.round(progress)));
  }

  /* ---------------------------------------------------------------------
     Alur kuis
     --------------------------------------------------------------------- */
  function startQuiz() {
    if (!WORDS.length) return;

    state.questions = buildQuestions();
    state.index = 0;
    state.score = 0;
    state.answers = [];
    state.locked = false;
    state.running = true;
    state.startedAt = Date.now();
    state.elapsed = 0;

    showScreen("quiz");
    updateModeLabel();
    renderQuestion();
  }

  function current() { return state.questions[state.index]; }

  function renderQuestion() {
    var q = current();
    if (!q) { finishQuiz(); return; }

    state.locked = false;

    el.promptWord.textContent = q.prompt;
    el.promptWord.className = q.askKo ? "prompt" : "prompt prompt--latin";
    el.promptRoman.textContent = q.roman || "";
    el.promptRoman.hidden = !q.roman;
    el.askText.textContent = q.askKo ? t("askMeaning") : t("askWord");

    el.speakBtn.hidden = !(q.askKo && supportsSpeech());

    el.options.innerHTML = "";
    el.options.classList.remove("is-locked");
    q.options.forEach(function (label, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option";
      btn.setAttribute("data-index", String(i));

      var badge = document.createElement("span");
      badge.className = "option-key";
      badge.textContent = LETTERS[i] || String(i + 1);

      var text = document.createElement("span");
      text.className = "option-text";
      text.textContent = label;

      btn.appendChild(badge);
      btn.appendChild(text);
      btn.addEventListener("click", function () { answer(i); });
      el.options.appendChild(btn);
    });

    el.feedback.textContent = "";
    el.feedback.className = "feedback";
    el.nextBtn.hidden = true;
    el.nextBtn.textContent = state.index === state.questions.length - 1
      ? t("finish")
      : t("next");

    refreshStatus();
    updateModeLabel();
  }

  function answer(choice) {
    if (state.locked || !state.running) return;
    var q = current();
    if (!q || choice < 0 || choice >= q.options.length) return;

    state.locked = true;
    var isCorrect = choice === q.correctIndex;
    if (isCorrect) state.score += 1;

    state.answers.push({
      question: q,
      chosen: choice,
      chosenText: q.options[choice],
      isCorrect: isCorrect
    });

    var buttons = el.options.querySelectorAll(".option");
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var index = Number(btn.getAttribute("data-index"));
      btn.disabled = true;
      if (index === q.correctIndex) btn.classList.add("option--correct");
      else if (index === choice) btn.classList.add("option--wrong");
    }
    el.options.classList.add("is-locked");

    if (isCorrect) {
      el.feedback.className = "feedback feedback--ok";
      el.feedback.textContent = pick(t("praise")) + " " + t("answerIs", { a: q.correctText });
    } else {
      el.feedback.className = "feedback feedback--bad";
      el.feedback.textContent = pick(t("oops")) + " " + t("answerIs", { a: q.correctText });
    }

    el.nextBtn.hidden = false;
    el.nextBtn.textContent = state.index === state.questions.length - 1
      ? t("finish")
      : t("next");
    el.nextBtn.focus({ preventScroll: true });

    // Di mode Indonesia → Korea, jawaban barunya bisa didengarkan setelah dibuka.
    if (!q.askKo && supportsSpeech()) el.speakBtn.hidden = false;

    refreshStatus();
  }

  function nextQuestion() {
    if (!state.running || !state.locked) return;
    state.index += 1;
    if (state.index >= state.questions.length) finishQuiz();
    else renderQuestion();
  }

  function finishQuiz() {
    state.running = false;
    state.elapsed = Date.now() - state.startedAt;
    showScreen("result");
    renderResult();
  }

  function resultMessage(pct) {
    if (pct >= 90) return t("msgGreat");
    if (pct >= 70) return t("msgGood");
    if (pct >= 50) return t("msgOk");
    return t("msgBad");
  }

  function renderResult() {
    var total = state.questions.length || 1;
    var pct = Math.round((state.score / total) * 100);

    el.resultPercent.textContent = pct + "%";
    el.resultFraction.textContent = state.score + " / " + total;
    el.resultHeadline.textContent = t("resultHeadline");
    el.resultMsg.textContent = resultMessage(pct);
    el.statCorrect.textContent = String(state.score);
    el.statWrong.textContent = String(total - state.score);
    el.statTime.textContent = formatTime(state.elapsed);

    // Rekor
    var best = loadBest();
    var isNewBest = !best || pct > best.pct ||
      (pct === best.pct && state.score > best.score);
    el.newBest.hidden = !isNewBest;
    if (isNewBest && state.questions.length) {
      store(bestKey(), JSON.stringify({
        pct: pct,
        score: state.score,
        total: state.questions.length
      }));
    }

    // Cincin skor
    var circumference = 2 * Math.PI * 52;
    el.ringFill.style.strokeDasharray = String(circumference);
    el.ringFill.style.strokeDashoffset = String(circumference);
    el.ringFill.style.stroke = pct >= 70 ? "var(--ok)" : pct >= 40 ? "var(--accent)" : "var(--bad)";
    window.requestAnimationFrame(function () {
      el.ringFill.style.strokeDashoffset = String(circumference * (1 - state.score / total));
    });

    // Pembahasan jawaban salah
    var wrong = state.answers.filter(function (item) { return !item.isCorrect; });
    el.reviewList.innerHTML = "";
    el.reviewCard.hidden = wrong.length === 0;

    wrong.forEach(function (item) {
      var q = item.question;

      var li = document.createElement("li");
      li.className = "review-item";

      var head = document.createElement("div");
      head.className = "review-head";
      var ko = document.createElement("span");
      ko.className = "review-ko";
      ko.textContent = q.word.ko;
      var rom = document.createElement("span");
      rom.className = "review-rom";
      rom.textContent = q.word.rom;
      head.appendChild(ko);
      head.appendChild(rom);

      var lineWrong = document.createElement("div");
      lineWrong.className = "review-line review-line--bad";
      lineWrong.innerHTML = t("yourAnswer") + ": <b></b>";
      lineWrong.querySelector("b").textContent = item.chosenText || t("noAnswer");

      var lineRight = document.createElement("div");
      lineRight.className = "review-line review-line--ok";
      lineRight.innerHTML = t("correctAnswer") + ": <b></b>";
      lineRight.querySelector("b").textContent = q.correctText;

      li.appendChild(head);
      li.appendChild(lineWrong);
      li.appendChild(lineRight);
      el.reviewList.appendChild(li);
    });
  }

  /* ---------------------------------------------------------------------
     Pelafalan (Web Speech API)
     --------------------------------------------------------------------- */
  function supportsSpeech() {
    return typeof window.speechSynthesis !== "undefined" &&
      typeof window.SpeechSynthesisUtterance !== "undefined";
  }

  function koreanVoice() {
    if (!supportsSpeech()) return null;
    var voices = window.speechSynthesis.getVoices() || [];
    for (var i = 0; i < voices.length; i++) {
      var lang = (voices[i].lang || "").toLowerCase();
      if (lang.indexOf("ko") === 0) return voices[i];
    }
    return null;
  }

  function speak(text) {
    if (!supportsSpeech() || !text) return;
    try {
      window.speechSynthesis.cancel();
      var utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      utterance.rate = 0.9;
      var voice = koreanVoice();
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    } catch (err) { /* diabaikan bila mesin suara tidak tersedia */ }
  }

  /* ---------------------------------------------------------------------
     Mode offline (service worker)
     --------------------------------------------------------------------- */
  function registerServiceWorker() {
    var nav = window.navigator;
    if (!nav || !("serviceWorker" in nav)) return;

    var host = window.location.hostname;
    var secure = window.location.protocol === "https:" ||
      host === "localhost" || host === "127.0.0.1";
    if (!secure) return; // file:// tidak mengizinkan service worker

    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {
        /* Mode offline tidak tersedia; kuis tetap berjalan normal. */
      });
    });
  }

  /* ---------------------------------------------------------------------
     Event
     --------------------------------------------------------------------- */
  function wireEvents() {
    el.themeBtn.addEventListener("click", function () {
      applyTheme(state.theme === "dark" ? "light" : "dark");
    });

    el.langBtn.addEventListener("click", function () {
      if (state.running) return;
      applyLang(state.uiLang === "id" ? "en" : "id");
    });

    el.directionGroup.addEventListener("click", function (event) {
      var btn = event.target.closest(".seg");
      if (!btn) return;
      var segs = el.directionGroup.querySelectorAll(".seg");
      for (var i = 0; i < segs.length; i++) {
        var active = segs[i] === btn;
        segs[i].classList.toggle("is-active", active);
        segs[i].setAttribute("aria-checked", active ? "true" : "false");
      }
      state.settings.direction = btn.getAttribute("data-direction");
      updateModeLabel();
      refreshBestLine();
    });

    el.countGroup.addEventListener("click", function (event) {
      var btn = event.target.closest(".chip");
      if (!btn) return;
      var chips = el.countGroup.querySelectorAll(".chip");
      for (var i = 0; i < chips.length; i++) {
        var active = chips[i] === btn;
        chips[i].classList.toggle("is-active", active);
        chips[i].setAttribute("aria-checked", active ? "true" : "false");
      }
      state.settings.count = Number(btn.getAttribute("data-count")) || 0;
      refreshBestLine();
    });

    el.startBtn.addEventListener("click", startQuiz);
    el.againBtn.addEventListener("click", startQuiz);
    el.settingsBtn.addEventListener("click", function () {
      state.running = false; // kuis ditinggalkan; bahasa boleh diganti lagi
      showScreen("start");
      updateModeLabel();
      refreshBestLine();
    });
    el.nextBtn.addEventListener("click", nextQuestion);

    el.speakBtn.addEventListener("click", function () {
      var q = current();
      if (q) speak(q.word.ko);
    });

    document.addEventListener("keydown", function (event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      var key = (event.key || "").toLowerCase();

      if (!el.screenStart.hidden) {
        if (key === "enter") { event.preventDefault(); startQuiz(); }
        return;
      }

      if (!el.screenResult.hidden) {
        if (key === "enter") { event.preventDefault(); startQuiz(); }
        return;
      }

      if (state.locked) {
        if (key === "enter" || key === " ") { event.preventDefault(); nextQuestion(); }
        return;
      }

      var index = -1;
      if (key >= "1" && key <= String(OPTION_COUNT)) index = Number(key) - 1;
      else if (key.length === 1) index = LETTERS.indexOf(key.toUpperCase());
      if (index >= 0 && current() && index < current().options.length) {
        event.preventDefault();
        answer(index);
      }
    });
  }

  /* ---------------------------------------------------------------------
     Inisialisasi
     --------------------------------------------------------------------- */
  function init() {
    state.theme = store(STORE_KEYS.theme) === "light" ? "light" : "dark";
    applyTheme(state.theme);
    state.uiLang = store(STORE_KEYS.lang) === "en" ? "en" : "id";

    // Bersihkan pilihan jumlah soal bila bank kata lebih kecil dari preset.
    if (WORDS.length < state.settings.count) state.settings.count = 0;

    wireEvents();
    applyLang(state.uiLang);
    showScreen("start");
    refreshBestLine();
    registerServiceWorker();

    if (supportsSpeech()) {
      // Daftar suara kerap baru terisi setelah event ini.
      window.speechSynthesis.onvoiceschanged = function () { koreanVoice(); };
      window.speechSynthesis.getVoices();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
