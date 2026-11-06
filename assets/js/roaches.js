/* ============================================================
   SANSAD — Cockroaches
   A tiny easter-egg survival game for the public gallery.
   Gen Z roaches swarm the Constitution; spray, crush or reform.
   No dependencies. State is kept separate from scenario XP.
   ============================================================ */

const SansadRoaches = (function () {
  "use strict";

  const STORE_KEY = "sansad.roaches.v1";
  const DURATION = 60;
  const BREACH_DAMAGE = 9;
  const REFORM_KEYS = [
    "roach.reform.1",
    "roach.reform.2",
    "roach.reform.3",
    "roach.reform.4",
    "roach.reform.5",
    "roach.reform.6"
  ];
  const SLANG_COUNT = 10;

  const Audio = typeof SansadAudio !== "undefined" ? SansadAudio : null;

  let t = function (key, vars) {
    const dict = (typeof I18N !== "undefined" && I18N.en && I18N.en.ui) || {};
    let out = dict[key] != null ? dict[key] : key;
    if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    return out;
  };

  const $ = (sel, root) => (root || document).querySelector(sel);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const maxRoaches = () => (els.arena && els.arena.clientWidth < 560 ? 20 : 30);

  let els = {};
  let initialized = false;
  let visible = false;
  let reduced = false;
  let raf = 0;
  let lastTs = 0;
  let tool = "crush";
  let game = null;
  let uid = 0;
  let best = loadBest();

  /* ----------------------------------------------------------
     Persistence — deliberately separate from sansad.progress
     ---------------------------------------------------------- */
  function loadBest() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object") {
        return {
          best: Math.max(0, Number(parsed.best) || 0),
          runs: Math.max(0, Number(parsed.runs) || 0),
          reforms: Math.max(0, Number(parsed.reforms) || 0)
        };
      }
    } catch (_) { /* storage may be unavailable */ }
    return { best: 0, runs: 0, reforms: 0 };
  }

  function saveBest() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(best)); } catch (_) { /* ignore */ }
  }

  function renderBest() {
    if (els.best) els.best.textContent = best.best.toLocaleString("en-IN");
  }

  /* ----------------------------------------------------------
     Setup
     ---------------------------------------------------------- */
  function init() {
    if (initialized) return;
    els = {
      arena: $("#roachArena"),
      floor: $("#roachFloor"),
      fx: $("#roachFx"),
      wave: $("#roachWave"),
      flash: $("#roachFlash"),
      combo: $("#roachCombo"),
      overlay: $("#roachOverlay"),
      scroll: $("#roachScroll"),
      best: $("#roachBest"),
      score: $("#roachScore"),
      time: $("#roachTime"),
      order: $("#roachOrder"),
      integrity: $("#roachIntegrity"),
      orderBar: $("#roachOrderBar"),
      integrityBar: $("#roachIntegrityBar"),
      integrityStat: $(".rstat-integrity"),
      crush: $("#roachCrushBtn"),
      spray: $("#roachSprayBtn"),
      reform: $("#roachReformBtn")
    };
    if (!els.arena || !els.floor || !els.overlay) return;

    initialized = true;
    renderBest();
    bindEvents();
    setTool("crush");
    updateHUD();
  }

  function bindEvents() {
    els.floor.addEventListener("pointerdown", onFloorPointer);

    if (els.crush) els.crush.addEventListener("click", () => setTool("crush"));
    if (els.spray) els.spray.addEventListener("click", () => setTool("spray"));
    if (els.reform) els.reform.addEventListener("click", reform);

    els.overlay.addEventListener("click", (e) => {
      if (e.target.closest("[data-roach-start]") || e.target.closest("[data-roach-replay]")) {
        e.preventDefault();
        startGame();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (!visible) return;
      if (e.target && e.target.matches("input, select, textarea, [contenteditable]")) return;
      if (e.key === "1") { e.preventDefault(); setTool("crush"); }
      else if (e.key === "2") { e.preventDefault(); setTool("spray"); }
      else if (e.key === "r" || e.key === "R") {
        if (game && game.active) { e.preventDefault(); reform(); }
      }
      else if (e.key === "c" || e.key === "C") {
        if (game && game.active) {
          e.preventDefault();
          const nearest = nearestRoach();
          if (nearest) crush(nearest);
        }
      }
      else if (e.key === "s" || e.key === "S") {
        if (game && game.active) {
          e.preventDefault();
          sprayAt((els.arena.clientWidth || 800) / 2, (els.arena.clientHeight || 500) / 2);
        }
      }
    });
  }

  function setTool(next) {
    tool = next === "spray" ? "spray" : "crush";
    if (els.crush) {
      els.crush.classList.toggle("is-active", tool === "crush");
      els.crush.setAttribute("aria-pressed", tool === "crush" ? "true" : "false");
    }
    if (els.spray) {
      els.spray.classList.toggle("is-active", tool === "spray");
      els.spray.setAttribute("aria-pressed", tool === "spray" ? "true" : "false");
    }
    if (els.arena) els.arena.dataset.tool = tool;
  }

  /* ----------------------------------------------------------
     Input
     ---------------------------------------------------------- */
  function onFloorPointer(e) {
    if (!game || !game.active) return;
    if (e.button != null && e.button !== 0) return;

    const rect = els.arena.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "spray") {
      e.preventDefault();
      sprayAt(x, y);
      return;
    }

    const hit = e.target.closest(".roach");
    if (!hit) return;
    const roach = game.roaches.find((r) => r.el === hit && !r.dead);
    if (!roach) return;
    e.preventDefault();
    crush(roach);
  }

  /* ----------------------------------------------------------
     Game lifecycle
     ---------------------------------------------------------- */
  function startGame() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (els.fx) els.fx.innerHTML = "";
    if (els.floor) els.floor.innerHTML = "";
    if (els.combo) { els.combo.textContent = ""; els.combo.classList.remove("is-showing"); }

    game = {
      active: true,
      over: false,
      score: 0,
      time: DURATION,
      integrity: 100,
      order: 0,
      combo: 0,
      comboTimer: 0,
      reforms: 0,
      elapsed: 0,
      spawnTimer: 0.55,
      hudT: 0,
      readyAnnounced: false,
      roaches: [],
      endReason: "",
      isBest: false
    };

    setTool("crush");
    els.overlay.classList.remove("is-active");
    els.overlay.innerHTML = "";
    updateHUD();
    if (Audio) Audio.play("gavel");

    for (let i = 0; i < 3; i++) spawnRoach();
    lastTs = performance.now();
    loop(lastTs);
  }

  function loop(ts) {
    if (!game || !game.active || !visible) return;
    const dt = clamp((ts - lastTs) / 1000, 0, 0.05);
    lastTs = ts;
    step(dt);
    if (game && game.active && visible) raf = requestAnimationFrame(loop);
  }

  function step(dt) {
    game.elapsed += dt;
    game.time -= dt;
    if (game.time <= 0) {
      game.time = 0;
      endGame("time");
      return;
    }

    if (game.comboTimer > 0) {
      game.comboTimer -= dt;
      if (game.comboTimer <= 0) game.combo = 0;
    }

    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      if (game.roaches.length < maxRoaches()) spawnRoach();
      const pressure = Math.min(1, game.elapsed / DURATION);
      game.spawnTimer = Math.max(0.26, 0.95 - pressure * 0.62) * rand(0.75, 1.25);
    }

    const w = els.arena.clientWidth || 800;
    const h = els.arena.clientHeight || 500;
    const tx = w * 0.5;
    const ty = h * 0.56;
    const damp = Math.exp(-3.4 * dt);

    for (let i = 0; i < game.roaches.length; i++) {
      const r = game.roaches[i];
      if (r.dead) continue;

      if (r.stun > 0) {
        r.stun -= dt;
        if (r.stun <= 0 && r.el) r.el.classList.remove("is-stunned");
      }

      const dx = tx - r.x;
      const dy = ty - r.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (dist < 40 + r.size * 0.12) {
        breach(r);
        continue;
      }

      let mx = 0;
      let my = 0;
      if (r.stun <= 0) {
        const ux = dx / dist;
        const uy = dy / dist;
        const wobble = Math.sin(game.elapsed * 2.2 + r.phase) * r.wobble;
        mx = (ux - uy * wobble) * r.speed;
        my = (uy + ux * wobble) * r.speed;
      }

      r.x += (mx + r.kx) * dt;
      r.y += (my + r.ky) * dt;
      r.kx *= damp;
      r.ky *= damp;

      // Keep pushed roaches inside a forgiving margin.
      r.x = clamp(r.x, -90, w + 90);
      r.y = clamp(r.y, -90, h + 90);
      setRoachTransform(r);
    }

    game.hudT += dt;
    if (game.hudT >= 0.08) {
      game.hudT = 0;
      updateHUD();
    }
  }

  function endGame(reason) {
    if (!game || game.over) return;
    game.active = false;
    game.over = true;
    game.endReason = reason;
    cancelAnimationFrame(raf);
    raf = 0;

    const score = game.score;
    best.runs += 1;
    game.isBest = score > best.best;
    if (game.isBest) best.best = score;
    best.reforms = Math.max(best.reforms, game.reforms);
    saveBest();
    renderBest();
    updateHUD();
    renderEnd();
    if (Audio) Audio.play(reason === "collapsed" ? "defeat" : "victory");
  }

  /* ----------------------------------------------------------
     Roaches
     ---------------------------------------------------------- */
  function spawnRoach() {
    if (!game || !game.active) return;
    const w = els.arena.clientWidth || 800;
    const h = els.arena.clientHeight || 500;
    const pad = 34;
    const side = Math.floor(Math.random() * 4);
    let x;
    let y;
    if (side === 0) { x = rand(0, w); y = -pad; }
    else if (side === 1) { x = w + pad; y = rand(0, h); }
    else if (side === 2) { x = rand(0, w); y = h + pad; }
    else { x = -pad; y = rand(0, h); }

    const scale = w < 560 ? 0.84 : 1;
    const r = {
      id: ++uid,
      x,
      y,
      size: rand(34, 50) * scale,
      speed: rand(27, 51) + Math.min(24, (DURATION - game.time) * 0.45),
      phase: rand(0, Math.PI * 2),
      wobble: rand(0.16, 0.5),
      stun: 0,
      kx: 0,
      ky: 0,
      dead: false,
      accessory: pickAccessory(),
      slang: Math.random() < 0.55 ? 1 + Math.floor(Math.random() * SLANG_COUNT) : 0,
      el: null
    };

    const el = document.createElement("div");
    el.className = "roach";
    el.style.setProperty("--size", r.size.toFixed(1) + "px");

    const body = document.createElement("div");
    body.className = "roach-body";
    body.innerHTML = roachSVG(r.accessory);
    if (r.slang) {
      const slang = document.createElement("span");
      slang.className = "roach-slang";
      slang.dataset.slang = String(r.slang);
      slang.textContent = t("roach.slang." + r.slang);
      body.appendChild(slang);
    }

    el.appendChild(body);
    r.el = el;
    els.floor.appendChild(el);
    setRoachTransform(r);
    game.roaches.push(r);

    if (Audio && Math.random() < 0.2) Audio.play("skitter");
  }

  function pickAccessory() {
    const roll = Math.random();
    if (roll < 0.26) return "shades";
    if (roll < 0.43) return "cap";
    if (roll < 0.58) return "phone";
    return "";
  }

  function nearestRoach() {
    if (!game) return null;
    const tx = (els.arena.clientWidth || 800) / 2;
    const ty = (els.arena.clientHeight || 500) * 0.56;
    let chosen = null;
    let bestDist = Infinity;
    for (const r of game.roaches) {
      if (r.dead) continue;
      const d = Math.hypot(r.x - tx, r.y - ty);
      if (d < bestDist) { bestDist = d; chosen = r; }
    }
    return chosen;
  }

  function roachSVG(accessory) {
    let extra = "";
    if (accessory === "shades") {
      extra = '<g><rect class="accessory" x="21" y="11.5" width="22" height="7" rx="3.5"/>' +
        '<rect class="accessory-glass" x="23.5" y="13.5" width="7.5" height="3" rx="1.5"/>' +
        '<rect class="accessory-glass" x="33" y="13.5" width="7.5" height="3" rx="1.5"/></g>';
    } else if (accessory === "cap") {
      extra = '<g><path class="accessory" d="M20 14a12 9 0 0 1 24 0z"/>' +
        '<path class="accessory" d="M19 14h27" stroke-width="3.4" stroke-linecap="round"/></g>';
    } else if (accessory === "phone") {
      extra = '<g><rect class="accessory" x="43" y="27" width="9" height="14" rx="2.4"/>' +
        '<rect class="phone-screen" x="45.2" y="29.4" width="4.6" height="8.4" rx="1.2"/></g>';
    }

    return '<svg viewBox="0 0 64 64" aria-hidden="true">' +
      '<g class="antenna"><path d="M29 13 Q22 7 16 3"/><path d="M35 13 Q42 7 48 3"/></g>' +
      '<g class="leg"><path d="M22 26 L8 19"/><path d="M20 34 L4 34"/><path d="M22 42 L8 50"/>' +
      '<path d="M42 26 L56 19"/><path d="M44 34 L60 34"/><path d="M42 42 L56 50"/></g>' +
      '<ellipse class="shell" cx="32" cy="34" rx="13" ry="19"/>' +
      '<ellipse class="shell-hi" cx="27.5" cy="30" rx="4" ry="10"/>' +
      '<path class="body-dark" d="M32 17v34" stroke="#2a1608" stroke-width="1.2" opacity=".55"/>' +
      '<ellipse class="body-dark" cx="32" cy="16.5" rx="6.2" ry="5"/>' +
      '<circle class="eye" cx="29.4" cy="16" r="1.15"/><circle class="eye" cx="34.6" cy="16" r="1.15"/>' +
      extra + '</svg>';
  }

  function setRoachTransform(r) {
    if (!r.el) return;
    r.el.style.transform = "translate3d(" + r.x.toFixed(1) + "px, " + r.y.toFixed(1) + "px, 0)";
  }

  function removeRoach(r) {
    if (r.el && r.el.parentNode) r.el.parentNode.removeChild(r.el);
    r.el = null;
    if (game && game.roaches) {
      const i = game.roaches.indexOf(r);
      if (i >= 0) game.roaches.splice(i, 1);
    }
  }

  function crush(r) {
    if (!game || !game.active || r.dead) return;
    r.dead = true;
    game.combo = Math.min(9, game.combo + 1);
    game.comboTimer = 1.55;

    const points = 10 * Math.max(1, game.combo);
    game.score += points;
    addOrder(3);

    if (Audio) Audio.play("squish");
    if (game.combo >= 3 && game.combo % 2 === 1 && Audio) Audio.play("combo");

    if (r.el) {
      r.el.classList.remove("is-stunned");
      r.el.classList.add("is-squashed");
    }
    floatText(r.x, r.y, "+" + points, game.combo >= 3 ? "green" : "");
    announce(t("roach.combo", { n: game.combo }));
    setTimeout(() => removeRoach(r), 360);
    updateHUD();
  }

  function sprayAt(x, y) {
    if (!game || !game.active) return;
    const radius = 116;
    let hit = 0;

    const ring = document.createElement("span");
    ring.className = "spray-ring";
    ring.style.setProperty("--x", x + "px");
    ring.style.setProperty("--y", y + "px");
    els.fx.appendChild(ring);
    setTimeout(() => ring.remove(), 650);

    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + rand(-0.2, 0.2);
      const drop = document.createElement("span");
      drop.className = "spray-drop";
      drop.style.setProperty("--x", x + "px");
      drop.style.setProperty("--y", y + "px");
      drop.style.setProperty("--dx", (Math.cos(a) * rand(45, 115)).toFixed(1) + "px");
      drop.style.setProperty("--dy", (Math.sin(a) * rand(45, 115)).toFixed(1) + "px");
      els.fx.appendChild(drop);
      setTimeout(() => drop.remove(), 560);
    }

    for (const r of game.roaches) {
      if (r.dead) continue;
      const dx = r.x - x;
      const dy = r.y - y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > radius + r.size * 0.35) continue;

      hit += 1;
      const force = 430 * (1 - Math.min(1, dist / (radius + r.size)));
      r.kx += (dx / dist) * force + rand(-45, 45);
      r.ky += (dy / dist) * force + rand(-45, 45);
      r.stun = Math.max(r.stun, 1.15);
      if (r.el) r.el.classList.add("is-stunned");
      game.score += 2;
      addOrder(2);
    }

    if (hit) {
      if (Audio) Audio.play("spray");
      floatText(x, y, "+" + hit * 2, "green");
      announce(t("roach.sprayed", { n: hit }));
    } else if (Audio) {
      Audio.play("whoosh");
    }
    updateHUD();
  }

  function breach(r) {
    if (!game || !game.active || r.dead) return;
    r.dead = true;
    game.integrity = Math.max(0, game.integrity - BREACH_DAMAGE);
    game.order = Math.max(0, game.order - 8);
    game.combo = 0;
    game.comboTimer = 0;
    game.readyAnnounced = false;

    if (Audio) Audio.play("breach");
    if (els.scroll) {
      els.scroll.classList.remove("is-hit");
      void els.scroll.offsetWidth;
      els.scroll.classList.add("is-hit");
      setTimeout(() => { if (els.scroll) els.scroll.classList.remove("is-hit"); }, 460);
    }
    if (els.flash) {
      els.flash.classList.remove("is-active");
      void els.flash.offsetWidth;
      els.flash.classList.add("is-active");
    }
    if (!reduced && els.arena) {
      els.arena.classList.remove("is-shaking");
      void els.arena.offsetWidth;
      els.arena.classList.add("is-shaking");
      setTimeout(() => { if (els.arena) els.arena.classList.remove("is-shaking"); }, 430);
    }

    const cx = els.arena.clientWidth * 0.5;
    const cy = els.arena.clientHeight * 0.56;
    floatText(cx, cy - 30, "−" + BREACH_DAMAGE, "red");
    announce(t("roach.breach", { n: BREACH_DAMAGE }));
    removeRoach(r);
    updateHUD();

    if (game.integrity <= 0) endGame("collapsed");
  }

  /* ----------------------------------------------------------
     Order / reforms / score
     ---------------------------------------------------------- */
  function addOrder(n) {
    if (!game) return;
    game.order = clamp(game.order + n, 0, 100);
    if (game.order >= 100 && !game.readyAnnounced) {
      game.readyAnnounced = true;
      announce(t("roach.orderReady"));
      if (Audio) Audio.play("chime");
    }
  }

  function reform() {
    if (!game || !game.active || game.order < 100) return;

    game.reforms += 1;
    const points = 200 + 50 * (game.reforms - 1);
    const name = t(REFORM_KEYS[(game.reforms - 1) % REFORM_KEYS.length]);

    game.score += points;
    game.integrity = Math.min(100, game.integrity + 25);
    game.order = 0;
    game.readyAnnounced = false;

    if (Audio) Audio.play("reform");
    if (els.wave) {
      els.wave.classList.remove("is-active");
      void els.wave.offsetWidth;
      els.wave.classList.add("is-active");
    }

    const cx = els.arena.clientWidth * 0.5;
    const cy = els.arena.clientHeight * 0.56;
    floatText(cx, cy - 40, "+" + points, "green");
    announce(t("roach.reformDone", { name: name }));

    for (const r of game.roaches.slice()) {
      if (r.dead) continue;
      r.dead = true;
      if (r.el) r.el.classList.add("is-reformed");
      setTimeout(() => removeRoach(r), 650);
    }

    updateHUD();
  }

  /* ----------------------------------------------------------
     HUD, effects and overlays
     ---------------------------------------------------------- */
  function updateHUD() {
    if (!els.score) return;
    if (!game) {
      els.score.textContent = "0";
      els.time.textContent = String(DURATION);
      els.order.textContent = "0";
      els.integrity.textContent = "100";
      if (els.orderBar) els.orderBar.style.width = "0%";
      if (els.integrityBar) els.integrityBar.style.width = "100%";
      if (els.integrityStat) els.integrityStat.classList.remove("is-low");
      if (els.reform) {
        els.reform.disabled = true;
        els.reform.classList.remove("is-ready");
      }
      return;
    }

    els.score.textContent = game.score.toLocaleString("en-IN");
    els.time.textContent = String(Math.ceil(game.time));
    els.order.textContent = String(Math.floor(game.order));
    els.integrity.textContent = String(Math.max(0, Math.round(game.integrity)));
    if (els.orderBar) els.orderBar.style.width = game.order + "%";
    if (els.integrityBar) els.integrityBar.style.width = Math.max(0, game.integrity) + "%";
    if (els.integrityStat) els.integrityStat.classList.toggle("is-low", game.integrity <= 30);

    const ready = game.active && game.order >= 100;
    if (els.reform) {
      els.reform.disabled = !ready;
      els.reform.classList.toggle("is-ready", ready);
    }
  }

  function floatText(x, y, text, kind) {
    if (!els.fx) return;
    const el = document.createElement("span");
    el.className = "roach-float" + (kind ? " " + kind : "");
    el.style.setProperty("--x", x + "px");
    el.style.setProperty("--y", y + "px");
    el.textContent = text;
    els.fx.appendChild(el);
    setTimeout(() => el.remove(), 880);
  }

  function announce(text) {
    if (!els.combo) return;
    els.combo.textContent = text;
    els.combo.classList.remove("is-showing");
    void els.combo.offsetWidth;
    els.combo.classList.add("is-showing");
  }

  function renderIdle() {
    if (!els.overlay) return;
    els.overlay.innerHTML = '<div class="roach-card">' +
      '<span class="kicker">' + t("roach.o.kicker") + '</span>' +
      '<h3>' + t("roach.o.title") + '</h3>' +
      '<p>' + t("roach.o.text") + '</p>' +
      '<ul class="roach-rules">' +
        '<li>' + t("roach.o.rule1") + '</li>' +
        '<li>' + t("roach.o.rule2") + '</li>' +
        '<li>' + t("roach.o.rule3") + '</li>' +
      '</ul>' +
      '<div class="roach-actions">' +
        '<button type="button" class="btn btn-gold" data-roach-start>' + t("roach.start") + '</button>' +
      '</div>' +
      '<p class="roach-tiny">' + t("roach.o.tiny") + '</p>' +
      '</div>';
    els.overlay.classList.add("is-active");
  }

  function renderEnd() {
    if (!els.overlay || !game) return;
    const collapsed = game.endReason === "collapsed";
    const title = t(collapsed ? "roach.end.collapsed" : "roach.end.time");
    const bestLine = game.isBest
      ? '<span class="roach-newbest">' + t("roach.end.newBest") + '</span>'
      : '';
    els.overlay.innerHTML = '<div class="roach-card">' +
      '<span class="kicker">' + t("roach.kicker") + '</span>' +
      '<h3>' + title + '</h3>' +
      '<p>' + t("roach.end.text") + '</p>' +
      bestLine +
      '<div class="roach-end-stats">' +
        '<div><span>' + t("roach.end.score") + '</span><b>' + game.score.toLocaleString("en-IN") + '</b></div>' +
        '<div><span>' + t("roach.end.reforms") + '</span><b>' + game.reforms + '</b></div>' +
        '<div><span>' + t("roach.end.best") + '</span><b>' + best.best.toLocaleString("en-IN") + '</b></div>' +
      '</div>' +
      '<div class="roach-actions">' +
        '<button type="button" class="btn btn-gold" data-roach-replay>' + t("roach.end.replay") + '</button>' +
        '<button type="button" class="btn btn-ghost" data-nav="home">' + t("roach.end.home") + '</button>' +
      '</div>' +
      '</div>';
    els.overlay.classList.add("is-active");
  }

  /* ----------------------------------------------------------
     Public API used by app.js
     ---------------------------------------------------------- */
  function setT(fn) {
    if (typeof fn === "function") t = fn;
  }

  function enter() {
    if (!initialized) init();
    if (!initialized) return;
    visible = true;
    if (!game) {
      renderIdle();
    } else if (game.over) {
      renderEnd();
    } else if (game.active) {
      lastTs = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    }
    updateHUD();
  }

  function leave() {
    visible = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function refreshLanguage() {
    if (!initialized) return;
    renderBest();
    updateHUD();
    document.querySelectorAll(".roach-slang").forEach((el) => {
      const n = Number(el.dataset.slang);
      if (n) el.textContent = t("roach.slang." + n);
    });
    if (game && game.over) renderEnd();
    else if (!game) renderIdle();
  }

  function setReduced(next) {
    reduced = !!next;
  }

  return {
    init,
    setT,
    enter,
    leave,
    refreshLanguage,
    setReduced,
    startGame,
    isPlaying: () => !!(game && game.active)
  };
})();
