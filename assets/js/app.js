/* ============================================================
   SANSAD — Application layer
   Navigation, chamber rendering, the simulator engine, scoring.
   ============================================================ */

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const Audio = typeof SansadAudio !== "undefined" ? SansadAudio : null;
  const Roaches = typeof SansadRoaches !== "undefined" ? SansadRoaches : null;
  const STORE_KEY = "sansad.progress.v1";
  const LANG_KEY = "sansad.lang.v1";
  const THEME_KEY = "sansad.theme.v1";
  const AUDIO_KEY = "sansad.audio.v1";
  const MOTION_KEY = "sansad.motion.v1";

  let lang = "en";
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && I18N[saved]) lang = saved;
    else if ((navigator.language || "").toLowerCase().startsWith("hi")) lang = "hi";
  } catch (_) { /* ignore */ }

  let theme = "night";
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "day" || saved === "night") theme = saved;
  } catch (_) { /* ignore */ }

  let audioPrefs = { music: true, sfx: true, musicVol: 0.42, sfxVol: 0.7, style: "tanpura" };
  try {
    const saved = localStorage.getItem(AUDIO_KEY);
    if (saved) audioPrefs = Object.assign(audioPrefs, JSON.parse(saved));
  } catch (_) { /* ignore */ }

  let reduceMotion = false;
  try {
    const saved = localStorage.getItem(MOTION_KEY);
    if (saved === "1") reduceMotion = true;
    else if (saved !== "0" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) reduceMotion = true;
  } catch (_) { /* ignore */ }

  /* ----------------------------------------------------------
     Progress
     ---------------------------------------------------------- */
  let progress = loadProgress();

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object" && parsed.records) return parsed;
    } catch (_) { /* ignore */ }
    return { records: {} };
  }

  function saveProgress() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (_) { /* ignore */ }
  }

  function totalXP() {
    return Object.values(progress.records).reduce((sum, r) => sum + (r.score || 0), 0);
  }

  function updateXP(bump) {
    const el = $("#xpValue");
    if (el) el.textContent = totalXP().toLocaleString("en-IN");
    if (bump) {
      const pill = $(".xp-pill");
      if (pill && !reduceMotion) {
        pill.classList.remove("bump");
        void pill.offsetWidth;
        pill.classList.add("bump");
      }
    }
  }

  function updateStats() {
    const records = Object.values(progress.records);
    const bills = records.length;
    const accuracy = records.length
      ? Math.round((records.reduce((s, r) => s + (r.accuracy || 0), 0) / records.length) * 100)
      : null;
    if ($("#statBills")) $("#statBills").textContent = bills;
    if ($("#statAccuracy")) $("#statAccuracy").textContent = accuracy === null ? "—" : accuracy + "%";
    updateXP();
  }

  /* ----------------------------------------------------------
     Sound
     ---------------------------------------------------------- */
  function sound(name) {
    if (Audio) Audio.play(name);
  }

  function soundBell() { sound("bell"); }
  function soundGood() { sound("correct"); }
  function soundBad() { sound("wrong"); }

  /* ----------------------------------------------------------
     Small helpers
     ---------------------------------------------------------- */
  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function iconSVG(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || "") + "</svg>";
  }

  function chakraSVG() {
    let spokes = "";
    for (let i = 0; i < 24; i++) {
      const a = (i * 15) * Math.PI / 180;
      const x1 = 24 + Math.cos(a) * 4.5;
      const y1 = 24 + Math.sin(a) * 4.5;
      const x2 = 24 + Math.cos(a) * 18;
      const y2 = 24 + Math.sin(a) * 18;
      spokes += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="currentColor" stroke-width="1" opacity=".8"/>`;
    }
    return `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="21" stroke="currentColor" stroke-width="1.4" opacity=".7"/>
      <circle cx="24" cy="24" r="17.5" stroke="currentColor" stroke-width="1" opacity=".45"/>
      ${spokes}
      <circle cx="24" cy="24" r="4.2" fill="currentColor"/>
      <circle cx="24" cy="24" r="2" fill="#070b17"/>
    </svg>`;
  }

  let toastTimer = null;
  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2300);
  }

  /* ----------------------------------------------------------
     Language helpers
     ---------------------------------------------------------- */
  function t(key, vars) {
    const dict = (I18N[lang] && I18N[lang].ui) || {};
    let out = dict[key];
    if (out == null) out = I18N.en.ui[key] != null ? I18N.en.ui[key] : key;
    if (vars) {
      out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    }
    return out;
  }

  function locScenario(s) {
    if (!s) return s;
    const tr = (I18N[lang].scenarios && I18N[lang].scenarios[s.id]) || null;
    if (!tr) return s;
    return Object.assign({}, s, tr, {
      brief: Object.assign({}, s.brief, tr.brief || {}),
      flow: s.flow.map((item, i) => Object.assign({}, item, (tr.flow && tr.flow[i]) || {})),
      result: Object.assign({}, s.result, tr.result || {}),
      notes: tr.notes || s.notes
    });
  }

  function locMajority(m) {
    const tr = (I18N[lang].majorities && I18N[lang].majorities[m.id]) || null;
    return tr ? Object.assign({}, m, tr) : m;
  }

  function locMajorities() {
    return MAJORITY_TYPES.map(locMajority);
  }

  function locVoting(m) {
    const tr = (I18N[lang].voting && I18N[lang].voting[m.id]) || null;
    return tr ? Object.assign({}, m, tr) : m;
  }

  function locJourney() {
    const tr = I18N[lang].journey;
    if (!tr) return LEARN_JOURNEY;
    return LEARN_JOURNEY.map((j, i) => Object.assign({}, j, tr[i] || {}));
  }

  function locGlance() {
    const tr = I18N[lang].glance;
    if (!tr) return LEARN_GLANCE;
    return LEARN_GLANCE.map((r, i) => Object.assign({}, r, tr[i] || {}));
  }

  function locArticles() {
    const tr = I18N[lang].articles;
    if (!tr) return LEARN_ARTICLES;
    return LEARN_ARTICLES.map((a, i) => Object.assign({}, a, tr[i] || {}));
  }

  function houseInfo(key) {
    const base = HOUSE_INFO[key] || HOUSE_INFO.LS;
    const presiding = key === "RS" ? t("role.vp") : t("role.speaker");
    return Object.assign({}, base, {
      name: t("house." + key),
      badge: t("house." + key + ".badge"),
      presiding
    });
  }

  function categoryLabel(cat) {
    return t("category." + cat);
  }

  function applyStaticI18n() {
    document.documentElement.lang = LANG_META[lang].htmlLang;
    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    $$("[data-i18n-title]").forEach((el) => { el.title = t(el.dataset.i18nTitle); });
    $$("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });

    const code = $("#langCode");
    if (code) code.textContent = LANG_META[lang].code;
    $$(".lang-option").forEach((b) => b.classList.toggle("is-active", b.dataset.lang === lang));
    const langBtn = $("#langBtn");
    if (langBtn) langBtn.setAttribute("aria-label", t("nav.lang"));
  }

  /* ----------------------------------------------------------
     Navigation
     ---------------------------------------------------------- */
  let currentFilter = "All";
  let currentScreen = "home";
  let roachBuffer = "";

  function navigate(name) {
    currentScreen = name;
    document.body.classList.toggle("is-roaching", name === "roaches");
    if (name === "roaches") {
      if (Roaches) {
        Roaches.setT(t);
        Roaches.setReduced(reduceMotion);
        Roaches.enter();
      }
      document.title = t("roach.meta.title");
    } else if (Roaches) {
      Roaches.leave();
    }

    $$(".screen").forEach((s) => s.classList.toggle("is-active", s.dataset.screen === name));
    $$(".nav-link, .dock-link").forEach((b) => b.classList.toggle("is-active", b.dataset.nav === name));
    window.scrollTo(0, 0);
    sound("whoosh");
    if (name === "select") renderScenarioGrid();
    if (name === "learn") renderLearn();
    if (name === "home") {
      document.title = t("meta.title");
      renderFeatured();
      updateStats();
    } else if (name !== "roaches" && name !== "game") {
      document.title = t("meta.title");
    }
  }

  /* ----------------------------------------------------------
     Scenario cards
     ---------------------------------------------------------- */
  function starsMarkup(stars) {
    let out = "";
    for (let i = 0; i < 3; i++) out += `<span class="${i < stars ? "" : "off"}">★</span>`;
    return out;
  }

  function scenarioCard(raw, index) {
    const s = locScenario(raw);
    const rec = progress.records[s.id];
    const stars = rec ? rec.stars : 0;
    const house = s.brief.house.split("(")[0].trim();
    return `<article class="scenario-card" data-start="${s.id}" role="button" tabindex="0" style="--accent:${s.accent};--i:${index || 0}"
        aria-label="${escapeHTML(t("select.card.start", { name: s.title }))}">
      <div class="sc-head">
        <span class="sc-icon">${iconSVG(s.icon)}</span>
        <span class="diff ${s.difficulty.toLowerCase()}">${escapeHTML(t("difficulty." + s.difficulty))}</span>
      </div>
      <h3>${escapeHTML(s.title)}</h3>
      <p class="sc-article">${s.article}</p>
      <p class="sc-summary">${escapeHTML(s.summary)}</p>
      <div class="sc-meta">
        <span>${escapeHTML(house)}</span>
        <span>${escapeHTML(s.brief.majority.split(";")[0])}</span>
      </div>
      <div class="sc-foot">
        <span class="stars-mini" aria-label="${escapeHTML(t("select.card.stars", { n: stars }))}">${starsMarkup(stars)}</span>
        <span class="sc-action">${escapeHTML(t("select.card.simulate"))}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </span>
      </div>
    </article>`;
  }

  function renderFeatured() {
    const ids = ["money", "ordinary", "president"];
    const grid = $("#featuredGrid");
    if (!grid) return;
    grid.innerHTML = ids.map((id, i) => scenarioCard(SCENARIOS.find((s) => s.id === id), i)).join("");
  }

  function renderScenarioGrid() {
    const grid = $("#scenarioGrid");
    if (!grid) return;
    const list = currentFilter === "All" ? SCENARIOS : SCENARIOS.filter((s) => s.category === currentFilter);
    grid.innerHTML = list.map((s, i) => scenarioCard(s, i)).join("");
  }

  function renderMajorityStrip() {
    const strip = $("#majorityStrip");
    if (!strip) return;
    strip.innerHTML = locMajorities().map((m) => `<article class="majority-card">
      <div class="mc-num">${m.ordinal}</div>
      <div class="mc-name">${escapeHTML(m.name)}</div>
      <div class="mc-formula">${escapeHTML(m.short)}</div>
      <div class="mc-used"><b>${escapeHTML(m.used[0])}</b></div>
    </article>`).join("");
  }

  /* ----------------------------------------------------------
     Chamber
     ---------------------------------------------------------- */
  const seatCache = {};

  function getSeats(key) {
    if (seatCache[key]) return seatCache[key];
    const total = HOUSE_INFO[key].total;
    const rows = key === "JOINT" ? 13 : 11;
    const cx = 320, cy = 330;
    const rMin = key === "JOINT" ? 64 : 78;
    const rMax = key === "JOINT" ? 298 : 296;
    const radii = [];
    for (let i = 0; i < rows; i++) radii.push(rMin + (rMax - rMin) * (i / (rows - 1)));

    const weights = radii.map((r) => r * 1.06);
    const wSum = weights.reduce((a, b) => a + b, 0);
    let counts = weights.map((w) => Math.max(5, Math.round(total * w / wSum)));

    let diff = total - counts.reduce((a, b) => a + b, 0);
    let guard = 0;
    while (diff !== 0 && guard < 10000) {
      for (let i = rows - 1; i >= 0 && diff !== 0; i--) {
        if (diff > 0) { counts[i]++; diff--; }
        else if (counts[i] > 5) { counts[i]--; diff++; }
      }
      guard++;
    }

    const seats = [];
    const mid = Math.PI / 2;
    const gap = 0.048;

    counts.forEach((n, row) => {
      const r = radii[row];
      const leftN = Math.ceil(n / 2);
      const rightN = n - leftN;
      const aStart = 0.028 * Math.PI;
      const aEnd = 0.972 * Math.PI;
      const leftEnd = mid - gap;
      const rightStart = mid + gap;

      for (let j = 0; j < leftN; j++) {
        const theta = aStart + (j + 0.5) * (leftEnd - aStart) / leftN;
        seats.push(makeSeat(theta, r, row));
      }
      for (let j = 0; j < rightN; j++) {
        const theta = rightStart + (j + 0.5) * (aEnd - rightStart) / rightN;
        seats.push(makeSeat(theta, r, row));
      }
    });

    function makeSeat(theta, r, row) {
      let party = "opposition";
      if (theta < mid + 0.035) party = "treasury";
      else if (theta < mid + 0.14) party = "other";
      return {
        x: cx + r * Math.cos(theta),
        y: cy - r * Math.sin(theta),
        angle: theta,
        row,
        party
      };
    }

    seatCache[key] = seats;
    return seats;
  }

  function renderChamber(key, opts) {
    opts = opts || {};
    if (!HOUSE_INFO[key]) key = "LS";
    const info = houseInfo(key);
    const seats = getSeats(key);
    const total = seats.length;
    const statuses = opts.statuses || null;
    const animate = !!opts.animate;
    const method = opts.method || "division";

    const counts = { aye: 0, no: 0, abstain: 0, absent: 0, treasury: 0, opposition: 0, other: 0 };
    for (let i = 0; i < total; i++) {
      const c = statuses ? statuses[i] : seats[i].party;
      counts[c] = (counts[c] || 0) + 1;
    }

    const radius = key === "JOINT" ? 3.25 : 4.1;
    const circles = seats.map((s, i) => {
      const cls = statuses ? statuses[i] : s.party;
      let delay = (i * 1.7 / total);
      if (method === "voice") delay = (i * 0.5 / total);
      if (method === "electronic") delay = s.row * 0.11;
      const lit = animate ? " lit" : "";
      const style = animate ? ` style="--d:${delay.toFixed(2)}s"` : "";
      return `<circle class="seat ${cls}${lit}" cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${radius}"${style}/>`;
    }).join("");

    const chair = key === "RS" ? t("chair.rs") : key === "JOINT" ? t("chair.joint") : t("chair.ls");

    const svg = `<svg viewBox="0 0 640 372" role="img" aria-label="${escapeHTML(t("house." + key))}">
      <ellipse cx="320" cy="330" rx="242" ry="24" fill="rgba(232,182,103,.035)"/>
      ${circles}
      <rect class="chamber-desk" x="248" y="340" width="144" height="17" rx="4"/>
      <text class="chamber-label" x="320" y="352" text-anchor="middle">${escapeHTML(chair)}</text>
    </svg>`;

    $("#chamberSvg").innerHTML = svg;
    $("#chamberBadge").textContent = info.badge;
    $("#chamberCount").textContent = t("game.seats", { n: info.total });
    $("#presidingName").textContent = info.presiding;
    $("#chamberMajority").textContent = opts.majorityLabel || (statuses ? "—" : t("game.tbd"));

    if (statuses) {
      $("#chamberTally").innerHTML = `
        <div class="tally-cell aye"><span>${escapeHTML(t("game.vote.countAyes"))}</span><b data-count="${counts.aye}">${animate ? 0 : counts.aye}</b></div>
        <div class="tally-cell no"><span>${escapeHTML(t("game.vote.countNoes"))}</span><b data-count="${counts.no}">${animate ? 0 : counts.no}</b></div>
        <div class="tally-cell abstain"><span>${escapeHTML(t("game.vote.countAbstain"))}</span><b data-count="${counts.abstain}">${animate ? 0 : counts.abstain}</b></div>
        <div class="tally-cell absent"><span>${escapeHTML(t("game.vote.countAbsent"))}</span><b data-count="${counts.absent}">${animate ? 0 : counts.absent}</b></div>`;
      $("#chamberLegend").innerHTML = legendItem("#2fbf71", t("legend.ayes"), counts.aye)
        + legendItem("#e2576b", t("legend.noes"), counts.no)
        + legendItem("#e0b64e", t("legend.abstain"), counts.abstain)
        + legendItem("#3a4763", t("legend.absent"), counts.absent);
    } else {
      $("#chamberTally").innerHTML = "";
      $("#chamberLegend").innerHTML = legendItem("#d79a45", t("legend.treasury"), counts.treasury)
        + legendItem("#4f7fd4", t("legend.opposition"), counts.opposition)
        + legendItem("#6c7894", t("legend.others"), counts.other);
    }

    if (animate) animateTally();
  }

  function legendItem(color, label, n) {
    return `<span class="legend-item"><i style="background:${color}"></i>${escapeHTML(label)} <b>${n}</b></span>`;
  }

  function animateTally() {
    $$("#chamberTally [data-count]").forEach((el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const start = performance.now();
      const duration = 1250;
      function frame(t) {
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(frame);
        else el.textContent = target;
      }
      requestAnimationFrame(frame);
    });
  }

  /* ----------------------------------------------------------
     Majority maths
     ---------------------------------------------------------- */
  function majorityNeed(type, v) {
    const total = v.total;
    const vac = v.vacancies || 0;
    const effective = total - vac;
    const voting = v.ayes + v.noes;

    switch (type) {
      case "simple": {
        const need = Math.floor(voting / 2) + 1;
        return { need, pass: v.ayes > v.noes, basis: t("basis.simple", { n: voting }) };
      }
      case "absolute": {
        const need = Math.floor(total / 2) + 1;
        return { need, pass: v.ayes >= need, basis: t("basis.absolute", { n: total }) };
      }
      case "effective": {
        const need = Math.floor(effective / 2) + 1;
        return { need, pass: v.ayes >= need, basis: t("basis.effective", { n: effective }) };
      }
      case "specialPresent": {
        const need = Math.max(Math.floor(total / 2) + 1, Math.ceil(voting * 2 / 3));
        return { need, pass: v.ayes >= need, basis: t("basis.specialPresent", { total, voting }) };
      }
      case "specialTotal": {
        const need = Math.ceil(total * 2 / 3);
        return { need, pass: v.ayes >= need, basis: t("basis.specialTotal", { n: total }) };
      }
      default:
        return { need: 0, pass: false, basis: "" };
    }
  }

  function buildVoteStatuses(item) {
    const arr = [];
    for (let i = 0; i < item.ayes; i++) arr.push("aye");
    for (let i = 0; i < item.noes; i++) arr.push("no");
    for (let i = 0; i < item.abstain; i++) arr.push("abstain");
    const absent = Math.max(0, item.total - arr.length);
    for (let i = 0; i < absent; i++) arr.push("absent");

    let seed = (item.total * 17 + item.ayes * 31 + item.noes * 7 + 987654) >>> 0;
    function rand() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  /* ----------------------------------------------------------
     Game state
     ---------------------------------------------------------- */
  let game = null;
  let voteToken = 0;

  function startScenario(id) {
    const scenario = SCENARIOS.find((s) => s.id === id);
    if (!scenario) return;
    voteToken++;
    game = {
      scenario,
      flowIndex: -1,
      decisions: 0,
      correct: 0,
      majorityTotal: 0,
      majorityCorrect: 0,
      score: 0,
      currentHouse: id === "vicepresident" ? "RS" : "LS",
      lastVote: null,
      selectedMajority: null,
      chosenMethod: "division",
      answered: false,
      finished: false,
      phase: "brief",
      answer: null,
      verdict: null,
      result: null
    };
    document.title = t("meta.game", { name: locScenario(scenario).title });
    navigate("game");
    setGameHeader();
    renderChamber(game.currentHouse);
    renderBriefing();
  }

  function setGameHeader() {
    if (!game) return;
    const s = locScenario(game.scenario);
    $("#gameKicker").textContent = s.article + " · " + categoryLabel(s.category);
    $("#gameTitle").textContent = s.title;
    updateProgress();
  }

  function updateProgress() {
    if (!game) return;
    const total = game.scenario.flow.length;
    const done = game.finished ? total : Math.max(0, Math.min(total, game.flowIndex + 1));
    $("#gameProgressBar").style.width = ((done / total) * 100) + "%";
    $("#gameProgressText").textContent = game.finished ? total + " / " + total : done + " / " + total;
  }

  function renderBriefing() {
    const s = locScenario(game.scenario);
    const stages = s.flow.map((item) => item.type === "vote" ? t("game.division") : item.stage);
    $("#gamePanel").innerHTML = `<div class="panel-card">
      <span class="stage-chip">${escapeHTML(t("game.briefing.chip"))}</span>
      <div style="display:flex;align-items:center;gap:16px;margin:18px 0 10px">
        <span class="sc-icon" style="--accent:${s.accent};color:${s.accent};background:${s.accent}14;border-color:${s.accent}3a;width:52px;height:52px;border-radius:14px;display:grid;place-items:center">${iconSVG(s.icon)}</span>
        <div>
          <h2 style="margin:0">${escapeHTML(s.title)}</h2>
          <p class="sc-article" style="margin:3px 0 0">${s.article}</p>
        </div>
      </div>
      <p class="q">${escapeHTML(s.summary)}</p>
      <div class="brief-grid">
        <div><span>${escapeHTML(t("game.briefing.house"))}</span><b>${escapeHTML(s.brief.house)}</b></div>
        <div><span>${escapeHTML(t("game.briefing.route"))}</span><b>${escapeHTML(s.brief.route)}</b></div>
        <div><span>${escapeHTML(t("game.briefing.majority"))}</span><b>${escapeHTML(s.brief.majority)}</b></div>
        <div><span>${escapeHTML(t("game.briefing.anchor"))}</span><b>${escapeHTML(s.brief.article)}</b></div>
      </div>
      <div class="brief-note">${t("game.briefing.role")}</div>
      <div class="sc-meta" style="margin:-8px 0 22px">${stages.map((x) => `<span>${escapeHTML(x)}</span>`).join("")}</div>
      <button class="btn btn-gold" id="beginBtn">${escapeHTML(t("game.briefing.begin"))}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    </div>`;

    $("#beginBtn").addEventListener("click", () => {
      game.flowIndex = 0;
      game.answered = false;
      game.phase = "decision";
      sound("gavel");
      updateProgress();
      renderStep();
    });
  }

  function renderStep() {
    if (!game) return;
    if (game.flowIndex >= game.scenario.flow.length) {
      finishScenario();
      return;
    }
    updateProgress();
    const item = locScenario(game.scenario).flow[game.flowIndex];
    game.answered = false;
    game.answer = null;
    game.selectedMajority = null;
    game.phase = item.type === "decision" ? "decision" : "vote";

    if (item.type === "decision") renderDecision(item);
    else renderVote(item);
  }

  function renderDecision(item) {
    const flow = locScenario(game.scenario).flow;
    const hasStatuses = game.lastVote && game.lastVote.house === game.currentHouse;
    renderChamber(game.currentHouse, hasStatuses ? {
      statuses: game.lastVote.statuses,
      majorityLabel: game.lastVote.label
    } : {});

    const options = item.options.map((opt, i) => {
      const letter = String.fromCharCode(65 + i);
      return `<button class="option" data-opt="${i}">
        <span class="letter">${letter}</span>
        <span>${escapeHTML(opt)}</span>
      </button>`;
    }).join("");

    $("#gamePanel").innerHTML = `<div class="panel-card">
      <span class="stage-chip">${escapeHTML(t("game.stageChip", { stage: item.stage, n: game.flowIndex + 1, total: flow.length }))}</span>
      <h2>${escapeHTML(item.stage)}</h2>
      <p class="q">${escapeHTML(item.q)}</p>
      <div class="options" id="optionList">${options}</div>
      <div id="decisionFeedback"></div>
    </div>`;

    $$("#optionList .option").forEach((btn) => {
      btn.addEventListener("click", () => answerDecision(item, parseInt(btn.dataset.opt, 10)));
    });
  }

  function answerDecision(item, idx) {
    if (game.answered) return;
    game.answered = true;
    game.phase = "feedback";
    const isCorrect = idx === item.correct;
    game.answer = { idx, isCorrect };
    game.decisions++;
    if (isCorrect) { game.correct++; game.score += 100; }

    renderDecisionFeedback(item, idx, isCorrect, false);
    if (isCorrect) soundGood(); else soundBad();
  }

  function renderDecisionFeedback(item, idx, isCorrect, silent) {
    $$("#optionList .option").forEach((btn, i) => {
      btn.classList.add("is-locked");
      if (i === item.correct) btn.classList.add("is-correct");
      else if (i === idx) btn.classList.add("is-wrong");
      else btn.classList.add("is-dim");
    });

    const feedback = $("#decisionFeedback");
    feedback.innerHTML = `<div class="feedback ${isCorrect ? "good" : "bad"}">
      <div class="fb-head"><span class="fb-icon">${isCorrect ? "✓" : "!"}</span>${escapeHTML(isCorrect ? t("game.decision.correct") : t("game.decision.wrong"))}</div>
      <p>${escapeHTML(item.why)}</p>
      <span class="article-chip">${escapeHTML(item.article)}</span>
      <div class="fb-footer"><button class="btn btn-gold btn-sm" id="nextStep">${escapeHTML(t("game.continue"))}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button></div>
    </div>`;

    $("#nextStep").addEventListener("click", () => {
      game.flowIndex++;
      game.answered = false;
      game.answer = null;
      renderStep();
    });

    if (!silent) {
      feedback.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    }
  }

  function renderVote(item) {
    game.currentHouse = item.house;
    game.lastVote = null;
    game.selectedMajority = null;
    game.chosenMethod = "division";

    renderChamber(item.house, {});

    const methods = VOTING_METHODS.map(locVoting).filter((m) => ["voice", "division", "electronic"].includes(m.id));
    const methodChips = methods.map((m, i) => {
      return `<button class="method-chip ${i === 1 ? "is-active" : ""}" data-method="${m.id}">${escapeHTML(m.name)}</button>`;
    }).join("");

    const majorities = locMajorities().filter((m) => m.id !== "specialRatify");
    const majorityOpts = majorities.map((m) => {
      const info = majorityNeed(m.id, item);
      return `<button class="majority-opt" data-majority="${m.id}">
        <b>${escapeHTML(m.name)}</b>
        <span>${escapeHTML(m.short)}</span>
        <em>${escapeHTML(t("game.vote.floor", { n: info.need }))}</em>
      </button>`;
    }).join("");

    $("#gamePanel").innerHTML = `<div class="panel-card">
      <span class="stage-chip">${escapeHTML(t("game.voteChip", { house: houseInfo(item.house).name }))}</span>
      <h2>${escapeHTML(item.caption)}</h2>
      <p class="q">${escapeHTML(t("game.vote.q"))}</p>

      <div class="vote-block">
        <h3><span>1</span> ${escapeHTML(t("game.vote.method"))}</h3>
        <div class="method-grid" id="methodGrid">${methodChips}</div>
        <p class="method-note" id="methodNote"></p>
      </div>

      <div class="vote-block">
        <h3><span>2</span> ${escapeHTML(t("game.vote.majority"))}</h3>
        <div class="majority-grid" id="majorityGrid">${majorityOpts}</div>
      </div>

      <div class="vote-actions">
        <p class="vote-hint" id="voteHint">${escapeHTML(t("game.vote.hint"))}</p>
        <button class="btn btn-gold" id="castVoteBtn" disabled>${escapeHTML(t("game.vote.cast"))}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </div>
      <div id="voteResult"></div>
    </div>`;

    setMethod("division");

    $$("#methodGrid .method-chip").forEach((btn) => {
      btn.addEventListener("click", () => setMethod(btn.dataset.method));
    });

    $$("#majorityGrid .majority-opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        game.selectedMajority = btn.dataset.majority;
        $$("#majorityGrid .majority-opt").forEach((b) => b.classList.toggle("is-active", b === btn));
        const m = locMajorities().find((x) => x.id === game.selectedMajority);
        const info = majorityNeed(m.id, item);
        $("#voteHint").innerHTML = t("game.vote.hintSet", { name: escapeHTML(m.name), need: info.need, basis: escapeHTML(info.basis) });
        $("#castVoteBtn").disabled = false;
        sound("click");
      });
    });

    $("#castVoteBtn").addEventListener("click", () => castVote(item));
  }

  function setMethod(id) {
    game.chosenMethod = id;
    const m = locVoting(VOTING_METHODS.find((x) => x.id === id));
    $$("#methodGrid .method-chip").forEach((b) => b.classList.toggle("is-active", b.dataset.method === id));
    if (m && $("#methodNote")) $("#methodNote").innerHTML = `<b>${escapeHTML(m.name)}:</b> ${escapeHTML(m.desc)} <span style="color:var(--gold)">${escapeHTML(m.when)}</span>`;
  }

  function castVote(item) {
    if (!game.selectedMajority || game.answered) return;
    game.answered = true;
    game.phase = "counting";

    const chosen = game.selectedMajority;
    const isRight = chosen === item.majority;
    const info = majorityNeed(item.majority, item);
    const chosenInfo = majorityNeed(chosen, item);

    game.majorityTotal++;
    if (isRight) { game.majorityCorrect++; game.score += 150; }

    $("#castVoteBtn").disabled = true;
    $$("#methodGrid .method-chip, #majorityGrid .majority-opt").forEach((b) => b.classList.add("is-locked"));
    $("#voteHint").textContent = t("game.vote.ringing");

    const statuses = buildVoteStatuses(item);
    const label = locMajorities().find((m) => m.id === item.majority).name;
    game.lastVote = { house: item.house, statuses, label, info, item };
    game.verdict = { item, chosen, isRight, info, chosenInfo };

    soundBell();
    document.body.classList.add("is-dividing");
    setTimeout(() => document.body.classList.remove("is-dividing"), 1400);
    [1, 2, 3, 4, 5, 6].forEach((n) => setTimeout(() => sound("vote"), 500 + n * 340));

    $("#voteResult").innerHTML = `<div class="feedback" style="border-color:var(--line)">
      <div class="fb-head" style="color:var(--gold)"><span class="fb-icon">◎</span>${escapeHTML(t("game.vote.progress.title"))}</div>
      <p>${escapeHTML(t("game.vote.progress.text"))}</p>
    </div>`;

    const token = ++voteToken;

    setTimeout(() => {
      if (token !== voteToken || !game) return;
      renderChamber(item.house, { statuses, animate: true, method: game.chosenMethod, majorityLabel: label });
    }, 240);

    setTimeout(() => {
      if (token !== voteToken || !game) return;
      showVerdict(item, chosen, isRight, info, chosenInfo, false);
    }, 3400);
  }

  function showVerdict(item, chosen, isRight, info, chosenInfo, silent) {
    game.phase = "verdict";
    game.verdict = { item, chosen, isRight, info, chosenInfo };
    const passed = info.pass;
    const m = locMajorities().find((x) => x.id === item.majority);
    const c = locMajorities().find((x) => x.id === chosen);
    const heads = item.house === "JOINT" ? t("game.vote.joint") : t("game.vote.house");

    $("#gamePanel").innerHTML = `<div class="panel-card" id="verdictPanel">
      <span class="stage-chip">${escapeHTML(t("game.voteChip", { house: houseInfo(item.house).name }))}</span>
      <h2>${escapeHTML(item.caption)}</h2>
      <div class="verdict ${passed ? "pass" : "fail"}" style="margin-top:14px">
        <div class="verdict-head">
          <h3>${escapeHTML(passed ? t("verdict.ayes") : t("verdict.noes"))}</h3>
          <span class="verdict-seal">${passed ? "✓" : "✕"}</span>
        </div>
        <div class="counts">
          <span>${escapeHTML(t("game.vote.countAyes"))} <b>${item.ayes}</b></span>
          <span>${escapeHTML(t("game.vote.countNoes"))} <b>${item.noes}</b></span>
          <span>${escapeHTML(t("game.vote.countAbstain"))} <b>${item.abstain}</b></span>
          <span>${escapeHTML(t("game.vote.countAbsent"))} <b>${item.total - item.ayes - item.noes - item.abstain}</b></span>
        </div>
        <p>${escapeHTML(item.note)}</p>
        <div class="threshold-line">${escapeHTML(heads)}. ${t("game.vote.required", { name: escapeHTML(m.name), need: info.need, basis: escapeHTML(info.basis), result: escapeHTML(passed ? t("game.vote.carried") : t("game.vote.negatived")) })}</div>
        <div class="callout ${isRight ? "good" : "bad"}">${isRight
          ? escapeHTML(t("game.vote.correctCall", { name: m.name }))
          : escapeHTML(t("game.vote.wrongCall", { chosen: c.name, chosenNeed: chosenInfo.need, name: m.name, short: m.short, desc: m.desc }))
        }</div>
        <div class="fb-footer" style="margin-top:14px"><button class="btn btn-gold btn-sm" id="nextStep">${escapeHTML(t("game.continue"))}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button></div>
      </div>
    </div>`;

    const panel = $("#verdictPanel");
    if (panel && !silent) panel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });

    if (!silent) {
      if (isRight) { soundGood(); toast(t("toast.correctMajority")); }
      else soundBad();
    }

    $("#nextStep").addEventListener("click", () => {
      game.flowIndex++;
      game.answered = false;
      game.verdict = null;
      renderStep();
    });
  }

  function finishScenario() {
    game.finished = true;
    game.phase = "finished";
    game.answered = false;
    updateProgress();
    const raw = game.scenario;
    const s = locScenario(raw);
    const totalCalls = game.decisions + game.majorityTotal;
    const rightCalls = game.correct + game.majorityCorrect;
    const accuracy = totalCalls ? rightCalls / totalCalls : 0;
    const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : accuracy >= 0.5 ? 1 : 0;
    const perfect = totalCalls > 0 && rightCalls === totalCalls;

    game.score += 50;
    if (perfect) game.score += 200;

    const prev = progress.records[raw.id];
    const isBest = !prev || game.score > prev.score;
    if (isBest) {
      progress.records[raw.id] = { score: game.score, stars, accuracy, best: game.score };
      saveProgress();
      updateXP(true);
    }
    updateStats();

    const result = {
      stars, perfect, isBest,
      prevBest: prev ? prev.score : 0,
      score: game.score,
      correct: game.correct,
      decisions: game.decisions,
      majorityCorrect: game.majorityCorrect,
      majorityTotal: game.majorityTotal
    };
    game.result = result;

    if (perfect) { soundGood(); sound("chime"); } else { soundBell(); }

    renderResults(s, result, true);
  }

  function animateCount(el, target) {
    if (!el) return;
    if (reduceMotion) { el.textContent = target; return; }
    const start = performance.now();
    const dur = 900;
    function frame(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = target;
    }
    requestAnimationFrame(frame);
  }

  function launchConfetti(host) {
    if (!host || reduceMotion) return;
    const colors = ["#e8b667", "#ff9933", "#1f9d55", "#f7d59c", "#5b8def", "#e2576b"];
    for (let i = 0; i < 32; i++) {
      const piece = document.createElement("i");
      piece.className = "confetti";
      piece.style.left = (4 + Math.random() * 92) + "%";
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty("--dur", (2.2 + Math.random() * 1.6).toFixed(2) + "s");
      piece.style.setProperty("--delay", (Math.random() * 0.8).toFixed(2) + "s");
      piece.style.setProperty("--drift", Math.round(-60 + Math.random() * 120) + "px");
      if (i % 3 === 0) piece.style.borderRadius = "50%";
      host.appendChild(piece);
    }
  }

  function renderResults(s, r, celebrate) {
    const idx = SCENARIOS.findIndex((x) => x.id === s.id);
    const next = locScenario(SCENARIOS[(idx + 1) % SCENARIOS.length]);

    $("#gamePanel").innerHTML = `<div class="panel-card">
      <div class="results">
        <div class="seal"><span>${r.stars === 3 ? "✦" : r.stars === 2 ? "◆" : "•"}</span></div>
        <h2>${escapeHTML(s.result.title)}</h2>
        <p class="result-sub">${escapeHTML(s.result.text)}</p>
        <div class="star-row" aria-label="${escapeHTML(t("select.card.stars", { n: r.stars }))}">
          ${[0, 1, 2].map((i) => `<i class="${i < r.stars ? "on" : ""}">★</i>`).join("")}
        </div>
        <div class="result-stats">
          <div><span>${escapeHTML(t("results.score"))}</span><b data-score="${r.score}">${r.score}</b></div>
          <div><span>${escapeHTML(t("results.procedure"))}</span><b>${r.correct}/${r.decisions}</b></div>
          <div><span>${escapeHTML(t("results.majority"))}</span><b>${r.majorityCorrect}/${r.majorityTotal}</b></div>
        </div>
        <div class="exam-edge">
          <h3>${escapeHTML(t("results.examEdge", { name: s.title }))}</h3>
          <ul>${s.notes.map((n) => `<li>${escapeHTML(n)}</li>`).join("")}</ul>
        </div>
        ${r.isBest && r.prevBest ? `<p style="font-size:.68rem;color:var(--gold);margin:-8px 0 18px">${escapeHTML(t("results.newBest", { n: r.prevBest }))}</p>` : (r.prevBest ? `<p style="font-size:.68rem;color:var(--muted-2);margin:-8px 0 18px">${escapeHTML(t("results.best", { n: r.prevBest }))}</p>` : "")}
        <div class="result-actions">
          <button class="btn btn-gold" data-start="${next.id}">${escapeHTML(t("results.next", { name: next.short }))}</button>
          <button class="btn btn-ghost" id="replayBtn">${escapeHTML(t("results.replay"))}</button>
          <button class="btn btn-ghost" data-nav="select">${escapeHTML(t("results.all"))}</button>
        </div>
      </div>
    </div>`;

    $("#replayBtn").addEventListener("click", () => startScenario(s.id));

    if (celebrate) {
      const results = $(".results");
      launchConfetti(results);
      const scoreEl = results.querySelector("[data-score]");
      if (scoreEl) { scoreEl.textContent = "0"; animateCount(scoreEl, r.score); }
      if (r.stars === 3 && !r.perfect) sound("applause");
      else if (r.stars === 3) sound("applause");
    }
  }

  /* ----------------------------------------------------------
     Learn
     ---------------------------------------------------------- */
  let currentTab = "majorities";

  function renderLearn(tab) {
    currentTab = tab || currentTab;
    $$("#learnTabs .tab").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === currentTab));
    const body = $("#learnBody");
    if (!body) return;

    if (currentTab === "majorities") {
      body.innerHTML = `<div class="learn-intro">
        <div><span class="kicker">${escapeHTML(t("learn.majorities.kicker"))}</span><h2>${t("learn.majorities.title")}</h2></div>
        <p>${escapeHTML(t("learn.majorities.text"))}</p>
      </div>
      <div class="learn-grid">
        ${locMajorities().map((m) => `<article class="learn-card">
          <div class="lc-head"><h3>${escapeHTML(m.name)}</h3><span class="lc-num">${m.ordinal}</span></div>
          <span class="lc-formula">${escapeHTML(m.formula)}</span>
          <p>${escapeHTML(m.desc)}</p>
          <div class="used"><span>${escapeHTML(t("learn.usedFor"))}</span>${m.used.map((u) => `<em>${escapeHTML(u)}</em>`).join("")}</div>
        </article>`).join("")}
      </div>
      <article class="learn-card" style="margin-top:14px;border-color:rgba(232,182,103,.28)">
        <h3 style="margin-bottom:8px">${escapeHTML(t("learn.trap.title"))}</h3>
        <p>${t("learn.trap.text")}</p>
      </article>`;
    }

    if (currentTab === "journey") {
      body.innerHTML = `<div class="learn-intro">
        <div><span class="kicker">${escapeHTML(t("learn.journey.kicker"))}</span><h2>${t("learn.journey.title")}</h2></div>
        <p>${escapeHTML(t("learn.journey.text"))}</p>
      </div>
      <article class="learn-card">
        <div class="timeline">
          ${locJourney().map((j) => `<div class="tl-item">
            <span class="tl-tag">${escapeHTML(j.tag)}</span>
            <h3>${escapeHTML(j.title)}</h3>
            <p>${escapeHTML(j.text)}</p>
          </div>`).join("")}
        </div>
      </article>`;
    }

    if (currentTab === "glance") {
      body.innerHTML = `<div class="learn-intro">
        <div><span class="kicker">${escapeHTML(t("learn.glance.kicker"))}</span><h2>${t("learn.glance.title")}</h2></div>
        <p>${escapeHTML(t("learn.glance.text"))}</p>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>${escapeHTML(t("learn.glance.bill"))}</th><th>${escapeHTML(t("learn.glance.intro"))}</th><th>${escapeHTML(t("learn.glance.rs"))}</th><th>${escapeHTML(t("learn.glance.joint"))}</th><th>${escapeHTML(t("learn.glance.majority"))}</th><th>${escapeHTML(t("learn.glance.president"))}</th>
          </tr></thead>
          <tbody>
            ${locGlance().map((r) => `<tr>
              <td>${escapeHTML(r.bill)}</td>
              <td>${escapeHTML(r.intro)}</td>
              <td>${escapeHTML(r.rs)}</td>
              <td>${r.joint === "No" ? `<span class="pill red">${escapeHTML(t("learn.glance.no"))}</span>` : r.joint === "Yes (Art. 108)" ? `<span class="pill green">${escapeHTML(t("learn.glance.yes"))}</span>` : `<span class="pill gold">${escapeHTML(r.joint)}</span>`}</td>
              <td>${escapeHTML(r.majority)}</td>
              <td>${escapeHTML(r.president)}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <article class="learn-card" style="margin-top:14px">
        <h3 style="margin-bottom:8px">${escapeHTML(t("learn.memorise.title"))}</h3>
        <p>${t("learn.memorise.text")}</p>
      </article>`;
    }

    if (currentTab === "voting") {
      body.innerHTML = `<div class="learn-intro">
        <div><span class="kicker">${escapeHTML(t("learn.voting.kicker"))}</span><h2>${t("learn.voting.title")}</h2></div>
        <p>${escapeHTML(t("learn.voting.text"))}</p>
      </div>
      <div class="method-list">
        ${VOTING_METHODS.map(locVoting).map((m, i) => `<div class="method-item">
          <span class="method-index">${String(i + 1).padStart(2, "0")}</span>
          <div>
            <h3>${escapeHTML(m.name)} <span class="pill gold" style="vertical-align:middle">${escapeHTML(m.tag)}</span></h3>
            <p>${escapeHTML(m.desc)}</p>
            <p class="when">${escapeHTML(m.when)}</p>
          </div>
        </div>`).join("")}
      </div>`;
    }

    if (currentTab === "articles") {
      body.innerHTML = `<div class="learn-intro">
        <div><span class="kicker">${escapeHTML(t("learn.articles.kicker"))}</span><h2>${t("learn.articles.title")}</h2></div>
        <p>${escapeHTML(t("learn.articles.text"))}</p>
      </div>
      <div class="article-list">
        ${locArticles().map((a) => `<div class="article-item">
          <span class="article-no">${escapeHTML(a.no)}</span>
          <p><b>${escapeHTML(a.title)}</b>${escapeHTML(a.text)}</p>
        </div>`).join("")}
      </div>`;
    }
  }

  /* ----------------------------------------------------------
     Preferences, language and theme
     ---------------------------------------------------------- */
  function closePopovers() {
    $$(".popover").forEach((p) => p.classList.remove("is-open"));
    $$("[aria-expanded]").forEach((b) => b.setAttribute("aria-expanded", "false"));
  }

  function setTheme(next) {
    theme = next === "day" ? "day" : "night";
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
    const meta = $("#themeColor");
    if (meta) meta.setAttribute("content", theme === "day" ? "#f5efe3" : "#070b17");
    closePopovers();
    toast(t(theme === "day" ? "toast.day" : "toast.night"));
    sound("click");
  }

  function saveAudioPrefs() {
    try { localStorage.setItem(AUDIO_KEY, JSON.stringify(audioPrefs)); } catch (_) {}
  }

  function audioConfigure() {
    if (Audio) Audio.configure(audioPrefs);
    const btn = $("#soundBtn");
    if (btn) btn.classList.toggle("is-muted", !audioPrefs.music && !audioPrefs.sfx);
  }

  function applyAudioUI() {
    const music = $("#musicToggle");
    const sfx = $("#sfxToggle");
    const musicVol = $("#musicVol");
    const sfxVol = $("#sfxVol");
    const style = $("#musicStyle");
    const motion = $("#motionToggle");
    if (music) music.checked = !!audioPrefs.music;
    if (sfx) sfx.checked = !!audioPrefs.sfx;
    if (musicVol) musicVol.value = Math.round((audioPrefs.musicVol ?? 0.42) * 100);
    if (sfxVol) sfxVol.value = Math.round((audioPrefs.sfxVol ?? 0.7) * 100);
    if (style) style.value = audioPrefs.style || "tanpura";
    if (motion) motion.checked = reduceMotion;
    const btn = $("#soundBtn");
    if (btn) btn.classList.toggle("is-muted", !audioPrefs.music && !audioPrefs.sfx);
  }

  function setMotion(next) {
    reduceMotion = !!next;
    document.documentElement.dataset.motion = reduceMotion ? "reduced" : "full";
    try { localStorage.setItem(MOTION_KEY, reduceMotion ? "1" : "0"); } catch (_) {}
    const motion = $("#motionToggle");
    if (motion) motion.checked = reduceMotion;
    if (Roaches) Roaches.setReduced(reduceMotion);
    toast(t(reduceMotion ? "toast.motion" : "toast.motionOff"));
  }

  function rerenderGamePhase() {
    if (!game) return;
    const s = locScenario(game.scenario);
    const item = s.flow[game.flowIndex];

    if (game.phase === "brief") {
      renderChamber(game.currentHouse);
      renderBriefing();
      return;
    }

    if (game.phase === "finished") {
      renderResults(s, game.result, false);
      return;
    }

    if (!item) return;

    if (game.phase === "decision" || game.phase === "feedback") {
      renderDecision(item);
      if (game.phase === "feedback" && game.answer) {
        renderDecisionFeedback(item, game.answer.idx, game.answer.isCorrect, true);
      }
      return;
    }

    if (game.phase === "vote" || game.phase === "counting") {
      const sel = game.selectedMajority;
      renderVote(item);
      if (sel) {
        const btn = $(`#majorityGrid [data-majority="${sel}"]`);
        if (btn) btn.click();
      }
      return;
    }

    if (game.phase === "verdict" && game.verdict) {
      const info = majorityNeed(item.majority, item);
      const chosenInfo = majorityNeed(game.verdict.chosen, item);
      showVerdict(item, game.verdict.chosen, game.verdict.isRight, info, chosenInfo, true);
    }
  }

  function setLanguage(next) {
    if (!I18N[next] || next === lang) return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}

    applyStaticI18n();
    renderFeatured();
    renderScenarioGrid();
    renderMajorityStrip();
    renderLearn(currentTab);
    updateStats();

    if (Roaches) {
      Roaches.setT(t);
      Roaches.setReduced(reduceMotion);
      Roaches.refreshLanguage();
    }

    if (game) {
      document.title = t("meta.game", { name: locScenario(game.scenario).title });
      setGameHeader();
      rerenderGamePhase();
    } else if (currentScreen === "roaches") {
      document.title = t("roach.meta.title");
    } else {
      document.title = t("meta.title");
    }

    applyAudioUI();
    closePopovers();
    toast(t("toast.lang", { name: LANG_META[lang].name }));
    sound("click");
  }

  /* ----------------------------------------------------------
     Events & init
     ---------------------------------------------------------- */
  function init() {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.motion = reduceMotion ? "reduced" : "full";
    const meta = $("#themeColor");
    if (meta) meta.setAttribute("content", theme === "day" ? "#f5efe3" : "#070b17");

    $$(".chakra").forEach((el) => { el.innerHTML = chakraSVG(); });
    $$("[data-icon]").forEach((el) => { el.innerHTML = iconSVG(el.dataset.icon); });

    applyStaticI18n();

    renderFeatured();
    renderScenarioGrid();
    renderMajorityStrip();
    renderLearn("majorities");
    updateStats();

    if (Roaches) {
      Roaches.setT(t);
      Roaches.setReduced(reduceMotion);
      Roaches.init();
    }

    if (Audio) {
      Audio.configure(audioPrefs);
      applyAudioUI();
    }

    /* Language menu */
    const langBtn = $("#langBtn");
    const langMenu = $("#langMenu");
    if (langBtn && langMenu) {
      langBtn.addEventListener("click", () => {
        const open = langMenu.classList.contains("is-open");
        closePopovers();
        if (!open) {
          langMenu.classList.add("is-open");
          langBtn.setAttribute("aria-expanded", "true");
        }
        sound("click");
      });
      $$(".lang-option").forEach((b) => {
        b.addEventListener("click", () => setLanguage(b.dataset.lang));
      });
    }

    /* Theme */
    const themeBtn = $("#themeBtn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => setTheme(theme === "day" ? "night" : "day"));
    }

    /* Audio & comfort panel */
    const soundBtn = $("#soundBtn");
    const audioPanel = $("#audioPanel");
    if (soundBtn && audioPanel) {
      soundBtn.addEventListener("click", () => {
        const open = audioPanel.classList.contains("is-open");
        closePopovers();
        if (!open) {
          audioPanel.classList.add("is-open");
          soundBtn.setAttribute("aria-expanded", "true");
        }
        sound("click");
      });
    }
    const audioClose = $("#audioClose");
    if (audioClose) audioClose.addEventListener("click", closePopovers);

    const musicToggle = $("#musicToggle");
    if (musicToggle) {
      musicToggle.addEventListener("change", () => {
        audioPrefs.music = musicToggle.checked;
        saveAudioPrefs(); audioConfigure();
        toast(t(audioPrefs.music ? "toast.musicOn" : "toast.musicOff"));
      });
    }

    const musicVol = $("#musicVol");
    if (musicVol) {
      musicVol.addEventListener("input", () => {
        audioPrefs.musicVol = Number(musicVol.value) / 100;
        audioConfigure();
      });
      musicVol.addEventListener("change", saveAudioPrefs);
    }

    const sfxToggle = $("#sfxToggle");
    if (sfxToggle) {
      sfxToggle.addEventListener("change", () => {
        audioPrefs.sfx = sfxToggle.checked;
        saveAudioPrefs(); audioConfigure();
        toast(t("toast.sfx", { state: t(audioPrefs.sfx ? "toast.on" : "toast.off") }));
        if (audioPrefs.sfx) sound("click");
      });
    }

    const sfxVol = $("#sfxVol");
    if (sfxVol) {
      sfxVol.addEventListener("input", () => {
        audioPrefs.sfxVol = Number(sfxVol.value) / 100;
        audioConfigure();
      });
      sfxVol.addEventListener("change", saveAudioPrefs);
    }

    const musicStyle = $("#musicStyle");
    if (musicStyle) {
      musicStyle.addEventListener("change", () => {
        audioPrefs.style = musicStyle.value;
        saveAudioPrefs(); audioConfigure();
      });
    }

    const motionToggle = $("#motionToggle");
    if (motionToggle) {
      motionToggle.addEventListener("change", () => setMotion(motionToggle.checked));
    }

    /* Popover dismissal */
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".popover-wrap")) closePopovers();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePopovers();
    });

    /* Easter egg: type "roach" anywhere outside a form field */
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target && e.target.tagName ? e.target.tagName : "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || (e.target && e.target.isContentEditable)) return;
      if (!e.key || e.key.length !== 1) return;
      roachBuffer = (roachBuffer + e.key.toLowerCase()).slice(-5);
      if (roachBuffer === "roach" && currentScreen !== "roaches") {
        roachBuffer = "";
        navigate("roaches");
        toast(t("roach.kicker"));
        if (Audio) Audio.play("buzz");
      }
    });

    document.addEventListener("click", (e) => {
      const nav = e.target.closest("[data-nav]");
      if (nav) {
        e.preventDefault();
        navigate(nav.dataset.nav);
        return;
      }
      const start = e.target.closest("[data-start]");
      if (start) {
        e.preventDefault();
        startScenario(start.dataset.start);
      }
    });

    document.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-start]")) {
        e.preventDefault();
        startScenario(e.target.dataset.start);
      }
    });

    $$("#filterRow .filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentFilter = btn.dataset.filter;
        $$("#filterRow .filter").forEach((b) => b.classList.toggle("is-active", b === btn));
        renderScenarioGrid();
      });
    });

    $$("#learnTabs .tab").forEach((btn) => {
      btn.addEventListener("click", () => renderLearn(btn.dataset.tab));
    });

    const back = $("#backToSelect");
    if (back) back.addEventListener("click", () => {
      voteToken++;
      game = null;
      document.title = t("meta.title");
      navigate("select");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
