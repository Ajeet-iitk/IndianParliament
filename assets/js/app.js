/* ============================================================
   SANSAD — Application layer
   Navigation, chamber rendering, the simulator engine, scoring.
   ============================================================ */

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const STORE_KEY = "sansad.progress.v1";
  const MUTE_KEY = "sansad.muted.v1";

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

  function updateXP() {
    const el = $("#xpValue");
    if (el) el.textContent = totalXP().toLocaleString("en-IN");
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
  let audioCtx = null;
  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === "1"; } catch (_) {}

  function ensureAudio() {
    if (muted) return null;
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function tone(freq, dur, type, gain, delay) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.035, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  }

  function soundBell() {
    [0, 0.16, 0.32, 0.48].forEach((d, i) => tone(i % 2 ? 720 : 660, 0.11, "triangle", 0.03, d));
  }
  function soundGood() {
    tone(523.25, 0.1, "sine", 0.03, 0);
    tone(659.25, 0.1, "sine", 0.028, 0.09);
    tone(783.99, 0.2, "sine", 0.03, 0.18);
  }
  function soundBad() {
    tone(220, 0.16, "sawtooth", 0.022, 0);
    tone(174.61, 0.22, "sawtooth", 0.02, 0.09);
  }

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
     Navigation
     ---------------------------------------------------------- */
  let currentFilter = "All";

  function navigate(name) {
    $$(".screen").forEach((s) => s.classList.toggle("is-active", s.dataset.screen === name));
    $$(".nav-link, .dock-link").forEach((b) => b.classList.toggle("is-active", b.dataset.nav === name));
    window.scrollTo(0, 0);
    if (name === "select") renderScenarioGrid();
    if (name === "learn") renderLearn();
    if (name === "home") {
      document.title = "Sansad — The Mock Parliament | UPSC Polity Simulator";
      renderFeatured();
      updateStats();
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

  function scenarioCard(s) {
    const rec = progress.records[s.id];
    const stars = rec ? rec.stars : 0;
    const house = s.brief.house.split("(")[0].trim();
    return `<article class="scenario-card" data-start="${s.id}" role="button" tabindex="0"
        aria-label="Start ${escapeHTML(s.title)}" style="--accent:${s.accent}">
      <div class="sc-head">
        <span class="sc-icon">${iconSVG(s.icon)}</span>
        <span class="diff ${s.difficulty.toLowerCase()}">${s.difficulty}</span>
      </div>
      <h3>${s.title}</h3>
      <p class="sc-article">${s.article}</p>
      <p class="sc-summary">${s.summary}</p>
      <div class="sc-meta">
        <span>${escapeHTML(house)}</span>
        <span>${escapeHTML(s.brief.majority.split(";")[0])}</span>
      </div>
      <div class="sc-foot">
        <span class="stars-mini" aria-label="${stars} of 3 stars">${starsMarkup(stars)}</span>
        <span class="sc-action">Simulate
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </span>
      </div>
    </article>`;
  }

  function renderFeatured() {
    const ids = ["money", "ordinary", "president"];
    const grid = $("#featuredGrid");
    if (!grid) return;
    grid.innerHTML = ids.map((id) => scenarioCard(SCENARIOS.find((s) => s.id === id))).join("");
  }

  function renderScenarioGrid() {
    const grid = $("#scenarioGrid");
    if (!grid) return;
    const list = currentFilter === "All" ? SCENARIOS : SCENARIOS.filter((s) => s.category === currentFilter);
    grid.innerHTML = list.map(scenarioCard).join("");
  }

  function renderMajorityStrip() {
    const strip = $("#majorityStrip");
    if (!strip) return;
    strip.innerHTML = MAJORITY_TYPES.map((m) => `<article class="majority-card">
      <div class="mc-num">${m.ordinal}</div>
      <div class="mc-name">${m.name.replace("Special Majority · ", "Special · ")}</div>
      <div class="mc-formula">${m.short}</div>
      <div class="mc-used"><b>${m.used[0]}</b></div>
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
    const info = HOUSE_INFO[key];
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

    const chair = key === "RS" ? "CHAIRMAN'S CHAIR" : key === "JOINT" ? "SPEAKER PRESIDES" : "SPEAKER'S CHAIR";

    const svg = `<svg viewBox="0 0 640 372" role="img" aria-label="Seating plan of the ${info.name}">
      <ellipse cx="320" cy="330" rx="242" ry="24" fill="rgba(232,182,103,.035)"/>
      ${circles}
      <rect class="chamber-desk" x="248" y="340" width="144" height="17" rx="4"/>
      <text class="chamber-label" x="320" y="352" text-anchor="middle">${chair}</text>
    </svg>`;

    $("#chamberSvg").innerHTML = svg;
    $("#chamberBadge").textContent = info.badge;
    $("#chamberCount").textContent = info.total + " seats";
    $("#presidingName").textContent = info.presiding;
    $("#chamberMajority").textContent = opts.majorityLabel || (statuses ? "—" : "To be decided");

    if (statuses) {
      $("#chamberTally").innerHTML = `
        <div class="tally-cell aye"><span>Ayes</span><b data-count="${counts.aye}">${animate ? 0 : counts.aye}</b></div>
        <div class="tally-cell no"><span>Noes</span><b data-count="${counts.no}">${animate ? 0 : counts.no}</b></div>
        <div class="tally-cell abstain"><span>Abstain</span><b data-count="${counts.abstain}">${animate ? 0 : counts.abstain}</b></div>
        <div class="tally-cell absent"><span>Absent</span><b data-count="${counts.absent}">${animate ? 0 : counts.absent}</b></div>`;
      $("#chamberLegend").innerHTML = legendItem("#2fbf71", "Ayes", counts.aye)
        + legendItem("#e2576b", "Noes", counts.no)
        + legendItem("#e0b64e", "Abstain", counts.abstain)
        + legendItem("#3a4763", "Absent", counts.absent);
    } else {
      $("#chamberTally").innerHTML = "";
      $("#chamberLegend").innerHTML = legendItem("#d79a45", "Treasury benches", counts.treasury)
        + legendItem("#4f7fd4", "Opposition benches", counts.opposition)
        + legendItem("#6c7894", "Others", counts.other);
    }

    if (animate) animateTally();
  }

  function legendItem(color, label, n) {
    return `<span class="legend-item"><i style="background:${color}"></i>${label} <b>${n}</b></span>`;
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
        return { need, pass: v.ayes > v.noes, basis: `of ${voting} members present & voting` };
      }
      case "absolute": {
        const need = Math.floor(total / 2) + 1;
        return { need, pass: v.ayes >= need, basis: `of the full strength of ${total}` };
      }
      case "effective": {
        const need = Math.floor(effective / 2) + 1;
        return { need, pass: v.ayes >= need, basis: `of effective strength ${effective}` };
      }
      case "specialPresent": {
        const need = Math.max(Math.floor(total / 2) + 1, Math.ceil(voting * 2 / 3));
        return { need, pass: v.ayes >= need, basis: `majority of ${total} + two-thirds of ${voting} voting` };
      }
      case "specialTotal": {
        const need = Math.ceil(total * 2 / 3);
        return { need, pass: v.ayes >= need, basis: `two-thirds of total strength ${total}` };
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
      finished: false
    };
    document.title = scenario.title + " · Sansad";
    navigate("game");
    setGameHeader();
    renderChamber(game.currentHouse);
    renderBriefing();
  }

  function setGameHeader() {
    if (!game) return;
    $("#gameKicker").textContent = game.scenario.article + " · " + game.scenario.category;
    $("#gameTitle").textContent = game.scenario.title;
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
    const s = game.scenario;
    const stages = s.flow.map((item) => item.type === "vote" ? "Division" : item.stage);
    $("#gamePanel").innerHTML = `<div class="panel-card">
      <span class="stage-chip">Your briefing</span>
      <div style="display:flex;align-items:center;gap:16px;margin:18px 0 10px">
        <span class="sc-icon" style="--accent:${s.accent};color:${s.accent};background:${s.accent}14;border-color:${s.accent}3a;width:52px;height:52px;border-radius:14px;display:grid;place-items:center">${iconSVG(s.icon)}</span>
        <div>
          <h2 style="margin:0">${s.title}</h2>
          <p class="sc-article" style="margin:3px 0 0">${s.article}</p>
        </div>
      </div>
      <p class="q">${s.summary}</p>
      <div class="brief-grid">
        <div><span>House</span><b>${escapeHTML(s.brief.house)}</b></div>
        <div><span>Route</span><b>${escapeHTML(s.brief.route)}</b></div>
        <div><span>Key majority</span><b>${escapeHTML(s.brief.majority)}</b></div>
        <div><span>Anchor</span><b>${escapeHTML(s.brief.article)}</b></div>
      </div>
      <div class="brief-note"><b>Your role:</b> You are the Presiding Officer. You will make the procedural calls, identify the majority the Constitution requires, and put each question to the House. Wrong calls are explained, not punished — but they cost XP.</div>
      <div class="sc-meta" style="margin:-8px 0 22px">${stages.map((x) => `<span>${escapeHTML(x)}</span>`).join("")}</div>
      <button class="btn btn-gold" id="beginBtn">Begin Proceedings
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    </div>`;

    $("#beginBtn").addEventListener("click", () => {
      game.flowIndex = 0;
      game.answered = false;
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
    const item = game.scenario.flow[game.flowIndex];
    game.answered = false;
    game.selectedMajority = null;

    if (item.type === "decision") renderDecision(item);
    else renderVote(item);
  }

  function renderDecision(item) {
    const s = game.scenario;
    const flow = s.flow;
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
      <span class="stage-chip">${escapeHTML(item.stage)} · ${game.flowIndex + 1} of ${flow.length}</span>
      <h2>${escapeHTML(item.stage)}</h2>
      <p class="q">${item.q}</p>
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
    const isCorrect = idx === item.correct;
    game.decisions++;
    if (isCorrect) { game.correct++; game.score += 100; }

    $$("#optionList .option").forEach((btn, i) => {
      btn.classList.add("is-locked");
      if (i === item.correct) btn.classList.add("is-correct");
      else if (i === idx) btn.classList.add("is-wrong");
      else btn.classList.add("is-dim");
    });

    const feedback = $("#decisionFeedback");
    feedback.innerHTML = `<div class="feedback ${isCorrect ? "good" : "bad"}">
      <div class="fb-head"><span class="fb-icon">${isCorrect ? "✓" : "!"}</span>${isCorrect ? "Correct call" : "Not quite"}</div>
      <p>${item.why}</p>
      <span class="article-chip">${escapeHTML(item.article)}</span>
      <div class="fb-footer"><button class="btn btn-gold btn-sm" id="nextStep">Continue
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button></div>
    </div>`;

    if (isCorrect) soundGood(); else soundBad();

    $("#nextStep").addEventListener("click", () => {
      game.flowIndex++;
      renderStep();
    });
  }

  function renderVote(item) {
    game.currentHouse = item.house;
    game.lastVote = null;
    game.selectedMajority = null;
    game.chosenMethod = "division";

    renderChamber(item.house, {});

    const methodChips = VOTING_METHODS.filter((m) => ["voice", "division", "electronic"].includes(m.id)).map((m, i) => {
      return `<button class="method-chip ${i === 1 ? "is-active" : ""}" data-method="${m.id}">${m.name}</button>`;
    }).join("");

    const majorityOpts = MAJORITY_TYPES.filter((m) => m.id !== "specialRatify").map((m) => {
      const info = majorityNeed(m.id, item);
      return `<button class="majority-opt" data-majority="${m.id}">
        <b>${m.name}</b>
        <span>${m.short}</span>
        <em>Floor at these numbers: ${info.need} votes</em>
      </button>`;
    }).join("");

    $("#gamePanel").innerHTML = `<div class="panel-card">
      <span class="stage-chip">Division · ${HOUSE_INFO[item.house].name}</span>
      <h2>${escapeHTML(item.caption)}</h2>
      <p class="q">The House is ready to vote. Choose how the question will be put, then identify the majority the Constitution actually requires.</p>

      <div class="vote-block">
        <h3><span>1</span> Voting method</h3>
        <div class="method-grid" id="methodGrid">${methodChips}</div>
        <p class="method-note" id="methodNote"></p>
      </div>

      <div class="vote-block">
        <h3><span>2</span> Majority required</h3>
        <div class="majority-grid" id="majorityGrid">${majorityOpts}</div>
      </div>

      <div class="vote-actions">
        <p class="vote-hint" id="voteHint">Select a majority to unlock the division.</p>
        <button class="btn btn-gold" id="castVoteBtn" disabled>Ring the Division Bell
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
        const m = MAJORITY_TYPES.find((x) => x.id === game.selectedMajority);
        const info = majorityNeed(m.id, item);
        $("#voteHint").innerHTML = `<b>${m.name}</b> requires <b>${info.need}</b> votes (${info.basis}).`;
        $("#castVoteBtn").disabled = false;
      });
    });

    $("#castVoteBtn").addEventListener("click", () => castVote(item));
  }

  function setMethod(id) {
    game.chosenMethod = id;
    const m = VOTING_METHODS.find((x) => x.id === id);
    $$("#methodGrid .method-chip").forEach((b) => b.classList.toggle("is-active", b.dataset.method === id));
    if (m && $("#methodNote")) $("#methodNote").innerHTML = `<b>${m.name}:</b> ${m.desc} <span style="color:var(--gold)">${m.when}</span>`;
  }

  function castVote(item) {
    if (!game.selectedMajority || game.answered) return;
    game.answered = true;

    const chosen = game.selectedMajority;
    const isRight = chosen === item.majority;
    const info = majorityNeed(item.majority, item);
    const chosenInfo = majorityNeed(chosen, item);

    game.majorityTotal++;
    if (isRight) { game.majorityCorrect++; game.score += 150; }

    $("#castVoteBtn").disabled = true;
    $$("#methodGrid .method-chip, #majorityGrid .majority-opt").forEach((b) => b.classList.add("is-locked"));
    $("#voteHint").textContent = "The division bell is ringing…";

    const statuses = buildVoteStatuses(item);
    const label = MAJORITY_TYPES.find((m) => m.id === item.majority).name;
    game.lastVote = { house: item.house, statuses, label, info, item };

    soundBell();
    $("#voteResult").innerHTML = `<div class="feedback" style="border-color:var(--line)">
      <div class="fb-head" style="color:var(--gold)"><span class="fb-icon">◎</span>Division in progress</div>
      <p>The doors are locked, the bell has rung, and members are taking their places. Counting the Ayes and Noes…</p>
    </div>`;

    const token = ++voteToken;

    setTimeout(() => {
      if (token !== voteToken || !game) return;
      renderChamber(item.house, { statuses, animate: true, method: game.chosenMethod, majorityLabel: label });
    }, 240);

    setTimeout(() => {
      if (token !== voteToken || !game) return;
      showVerdict(item, chosen, isRight, info, chosenInfo);
    }, 3400);
  }

  function showVerdict(item, chosen, isRight, info, chosenInfo) {
    const passed = info.pass;
    const m = MAJORITY_TYPES.find((x) => x.id === item.majority);
    const c = MAJORITY_TYPES.find((x) => x.id === chosen);
    const heads = item.house === "JOINT" ? "The joint sitting is divided" : "The House is divided";

    $("#gamePanel").innerHTML = `<div class="panel-card" id="verdictPanel">
      <span class="stage-chip">Division · ${HOUSE_INFO[item.house].name}</span>
      <h2>${escapeHTML(item.caption)}</h2>
      <div class="verdict ${passed ? "pass" : "fail"}" style="margin-top:14px">
        <div class="verdict-head">
          <h3>${passed ? "The Ayes have it" : "The Noes have it"}</h3>
          <span class="verdict-seal">${passed ? "✓" : "✕"}</span>
        </div>
        <div class="counts">
          <span>Ayes <b>${item.ayes}</b></span>
          <span>Noes <b>${item.noes}</b></span>
          <span>Abstain <b>${item.abstain}</b></span>
          <span>Absent <b>${item.total - item.ayes - item.noes - item.abstain}</b></span>
        </div>
        <p>${item.note}</p>
        <div class="threshold-line">${heads}. Required under <b>${m.name}</b>: <b>${info.need}</b> votes (${info.basis}). Result: <b>${passed ? "carried" : "negatived"}</b>.</div>
        <div class="callout ${isRight ? "good" : "bad"}">${isRight
          ? `Correct. You identified the ${m.name} — the exact test the Constitution applies here.`
          : `You selected ${c.name} (floor ${chosenInfo.need}). The Constitution requires ${m.name}: ${m.short}. ${m.desc}`
        }</div>
        <div class="fb-footer" style="margin-top:14px"><button class="btn btn-gold btn-sm" id="nextStep">Continue
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button></div>
      </div>
    </div>`;

    const panel = $("#verdictPanel");
    if (panel) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });

    if (isRight) { soundGood(); toast("Correct majority · +150 XP"); }
    else soundBad();

    $("#nextStep").addEventListener("click", () => {
      game.flowIndex++;
      game.answered = false;
      renderStep();
    });
  }

  function finishScenario() {
    game.finished = true;
    updateProgress();
    const s = game.scenario;
    const totalCalls = game.decisions + game.majorityTotal;
    const rightCalls = game.correct + game.majorityCorrect;
    const accuracy = totalCalls ? rightCalls / totalCalls : 0;
    const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : accuracy >= 0.5 ? 1 : 0;
    const perfect = totalCalls > 0 && rightCalls === totalCalls;

    game.score += 50;
    if (perfect) game.score += 200;

    const prev = progress.records[s.id];
    const isBest = !prev || game.score > prev.score;
    if (isBest) {
      progress.records[s.id] = { score: game.score, stars, accuracy, best: game.score };
      saveProgress();
    }
    updateXP();
    updateStats();

    if (perfect) { soundGood(); } else { soundBell(); }

    const idx = SCENARIOS.findIndex((x) => x.id === s.id);
    const next = SCENARIOS[(idx + 1) % SCENARIOS.length];
    const prevBest = prev ? prev.score : 0;

    $("#gamePanel").innerHTML = `<div class="panel-card">
      <div class="results">
        <div class="seal"><span>${stars === 3 ? "✦" : stars === 2 ? "◆" : "•"}</span></div>
        <h2>${s.result.title}</h2>
        <p class="result-sub">${s.result.text}</p>
        <div class="star-row" aria-label="${stars} of 3 stars">
          ${[0, 1, 2].map((i) => `<i class="${i < stars ? "on" : ""}">★</i>`).join("")}
        </div>
        <div class="result-stats">
          <div><span>Run score</span><b>${game.score}</b></div>
          <div><span>Procedure</span><b>${game.correct}/${game.decisions}</b></div>
          <div><span>Majority calls</span><b>${game.majorityCorrect}/${game.majorityTotal}</b></div>
        </div>
        <div class="exam-edge">
          <h3>Exam edge · ${escapeHTML(s.title)}</h3>
          <ul>${s.notes.map((n) => `<li>${n}</li>`).join("")}</ul>
        </div>
        ${isBest && prevBest ? `<p style="font-size:.68rem;color:var(--gold);margin:-8px 0 18px">New personal best — previous best was ${prevBest} XP.</p>` : (prev ? `<p style="font-size:.68rem;color:var(--muted-2);margin:-8px 0 18px">Personal best: ${prevBest} XP.</p>` : "")}
        <div class="result-actions">
          <button class="btn btn-gold" data-start="${next.id}">Next: ${next.short}</button>
          <button class="btn btn-ghost" id="replayBtn">Replay</button>
          <button class="btn btn-ghost" data-nav="select">All procedures</button>
        </div>
      </div>
    </div>`;

    $("#replayBtn").addEventListener("click", () => startScenario(s.id));
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
        <div><span class="kicker">The decoder</span><h2>Six ways to count a <em>majority.</em></h2></div>
        <p>Every procedural outcome in Parliament comes down to one of these tests. Learn the formula, then the procedure it unlocks.</p>
      </div>
      <div class="learn-grid">
        ${MAJORITY_TYPES.map((m) => `<article class="learn-card">
          <div class="lc-head"><h3>${m.name}</h3><span class="lc-num">${m.ordinal}</span></div>
          <span class="lc-formula">${m.formula}</span>
          <p>${m.desc}</p>
          <div class="used"><span>Used for</span>${m.used.map((u) => `<em>${u}</em>`).join("")}</div>
        </article>`).join("")}
      </div>
      <article class="learn-card" style="margin-top:14px;border-color:rgba(232,182,103,.28)">
        <h3 style="margin-bottom:8px">The trap to remember</h3>
        <p>A <b>simple majority</b> ignores abstentions and absences. An <b>effective majority</b> subtracts vacancies. A <b>special majority</b> adds a second, higher hurdle. When a House has no vacancies, absolute and effective majorities can produce the same number — but they are not the same test, and UPSC regularly builds a question on that gap.</p>
      </article>`;
    }

    if (currentTab === "journey") {
      body.innerHTML = `<div class="learn-intro">
        <div><span class="kicker">The route</span><h2>How a bill becomes an <em>Act.</em></h2></div>
        <p>The ordinary route has six stations. Money Bills and constitutional amendments take detours — the table under "At a Glance" shows exactly where.</p>
      </div>
      <article class="learn-card">
        <div class="timeline">
          ${LEARN_JOURNEY.map((j) => `<div class="tl-item">
            <span class="tl-tag">${j.tag}</span>
            <h3>${j.title}</h3>
            <p>${j.text}</p>
          </div>`).join("")}
        </div>
      </article>`;
    }

    if (currentTab === "glance") {
      body.innerHTML = `<div class="learn-intro">
        <div><span class="kicker">Comparison</span><h2>Four bills, <em>four routes.</em></h2></div>
        <p>The fastest way to revise bill procedure. Read down the columns, not across the rows.</p>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Bill</th><th>Introduction</th><th>Rajya Sabha</th><th>Joint Sitting</th><th>Majority</th><th>President</th>
          </tr></thead>
          <tbody>
            ${LEARN_GLANCE.map((r) => `<tr>
              <td>${r.bill}</td>
              <td>${r.intro}</td>
              <td>${r.rs}</td>
              <td>${r.joint === "No" ? '<span class="pill red">No</span>' : r.joint === "Yes (Art. 108)" ? '<span class="pill green">Yes</span>' : `<span class="pill gold">${r.joint}</span>`}</td>
              <td>${r.majority}</td>
              <td>${r.president}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <article class="learn-card" style="margin-top:14px">
        <h3 style="margin-bottom:8px">One line to memorise</h3>
        <p><b>Money Bills:</b> Lok Sabha only, 14 days for the Rajya Sabha, no joint sitting. <b>Constitutional amendments:</b> both Houses separately, no joint sitting, half the States for federal provisions. <b>Ordinary Bills:</b> either House, joint sitting available.</p>
      </article>`;
    }

    if (currentTab === "voting") {
      body.innerHTML = `<div class="learn-intro">
        <div><span class="kicker">On the floor</span><h2>How the House <em>votes.</em></h2></div>
        <p>Procedure is not just arithmetic. The method of voting determines whether a result is recorded, challengeable, or secret.</p>
      </div>
      <div class="method-list">
        ${VOTING_METHODS.map((m, i) => `<div class="method-item">
          <span class="method-index">${String(i + 1).padStart(2, "0")}</span>
          <div>
            <h3>${m.name} <span class="pill gold" style="vertical-align:middle">${m.tag}</span></h3>
            <p>${m.desc}</p>
            <p class="when">${m.when}</p>
          </div>
        </div>`).join("")}
      </div>`;
    }

    if (currentTab === "articles") {
      body.innerHTML = `<div class="learn-intro">
        <div><span class="kicker">Quick index</span><h2>The articles that <em>decide.</em></h2></div>
        <p>Fifteen anchors for revision. If you can attach each number to its procedure, most polity questions collapse into recognition.</p>
      </div>
      <div class="article-list">
        ${LEARN_ARTICLES.map((a) => `<div class="article-item">
          <span class="article-no">${a.no}</span>
          <p><b>${a.title}</b>${a.text}</p>
        </div>`).join("")}
      </div>`;
    }
  }

  /* ----------------------------------------------------------
     Events & init
     ---------------------------------------------------------- */
  function init() {
    $$(".chakra").forEach((el) => { el.innerHTML = chakraSVG(); });
    $$("[data-icon]").forEach((el) => { el.innerHTML = iconSVG(el.dataset.icon); });

    renderFeatured();
    renderScenarioGrid();
    renderMajorityStrip();
    renderLearn("majorities");
    updateStats();

    const soundBtn = $("#soundBtn");
    if (soundBtn) {
      soundBtn.classList.toggle("is-muted", muted);
      soundBtn.addEventListener("click", () => {
        muted = !muted;
        try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (_) {}
        soundBtn.classList.toggle("is-muted", muted);
        toast(muted ? "Sound muted" : "Sound on");
        if (!muted) tone(660, 0.09, "sine", 0.03, 0);
      });
    }

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
      document.title = "Sansad — The Mock Parliament | UPSC Polity Simulator";
      navigate("select");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
