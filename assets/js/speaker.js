/* ============================================================
   SANSAD — The Speaker's Chair
   A Three.js survival game. You are the Speaker on the dias.
   MPs swarm the Well, hurl chairs and paper, wave placards.
   Calm them (Baith jaiye), suspend the unruly, adjourn the
   House — all while holding quorum.
   Self-contained; state is kept separately from scenario XP.
   ============================================================ */

const SansadSpeaker = (function () {
  "use strict";

  const STORE_KEY = "sansad.speaker.v1";
  const DURATION = 120;
  const QUORUM_MIN = 55;
  const QUORUM_FAIL = 40;
  const ORDER_ADJOURN = 100;
  const START_QUORUM = 50;
  const MAX_VISIBLE = 42;
  const DIAS_LINE = 5.2;          // z below this = MP storms the dias
  const WELL_TZ = [2.4, 3.8];     // well targets
  const WELL_TX = 4.6;
  const SPAWN_Z = -9.5;
  const LEAVE_Z = -10.5;

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

  /* ---- visual palettes ---- */
  const SKINS = [0xd29a6a, 0xb97f52, 0x9c6b42, 0xe0aa7c, 0xc0885c];
  const SUITS = [0x1e2a45, 0x333a4d, 0x23262e, 0x4a3b2c, 0x2f4a4a];
  const KURTAS = [0xf3ead6, 0xe8dcc0, 0xcfc4a8, 0xf7f2e6];
  const SARIS = [0xe8842c, 0x2e7d4f, 0xd45d79, 0x2a7f8f, 0x8e2f3f, 0xc96a2b];
  const TURBANS = [0xe8842c, 0xc96a2b, 0xb0352f];

  let els = {};
  let initialized = false;
  let noThree = false;
  let visible = false;
  let reduced = false;
  let raf = 0;
  let lastTs = 0;
  let tool = "calm";
  let game = null;
  let uid = 0;
  let best = loadBest();

  /* Three.js */
  let renderer = null;
  let scene = null;
  let camera = null;
  let raycaster = null;
  let pointer = null;
  let mpGroup = null;
  let propGroup = null;
  let mps = [];
  let projectiles = [];
  let pickables = [];
  let shake = 0;
  let flashT = 0;
  let chantT = 0;
  let ambientLight, keyLight;

  const TYPE_DEFS = {
    protester: { points: 10, order: 4, speed: 1.15, weight: 5, thrower: false, placard: false },
    thrower:   { points: 15, order: 5, speed: 1.55, weight: 2, thrower: true,  placard: false },
    placard:   { points: 20, order: 7, speed: 1.0,  weight: 2, thrower: false, placard: true },
    leader:    { points: 40, order: 9, speed: 1.35, weight: 1, thrower: true,  placard: false }
  };
  const TYPE_KEYS = Object.keys(TYPE_DEFS);

  /* ----------------------------------------------------------
     Persistence
     ---------------------------------------------------------- */
  function loadBest() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object") {
        return {
          best: Math.max(0, Number(parsed.best) || 0),
          runs: Math.max(0, Number(parsed.runs) || 0),
          adjourns: Math.max(0, Number(parsed.adjourns) || 0)
        };
      }
    } catch (_) { /* storage may be unavailable */ }
    return { best: 0, runs: 0, adjourns: 0 };
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
      arena: $("#speakerArena"),
      floor: $("#speakerFloor"),
      fx: $("#speakerFx"),
      flash: $("#speakerFlash"),
      combo: $("#speakerCombo"),
      overlay: $("#speakerOverlay"),
      best: $("#speakerBest"),
      score: $("#speakerScore"),
      time: $("#speakerTime"),
      quorum: $("#speakerQuorum"),
      order: $("#speakerOrder"),
      suspended: $("#speakerSuspended"),
      quorumBar: $("#speakerQuorumBar"),
      orderBar: $("#speakerOrderBar"),
      calm: $("#speakerCalmBtn"),
      suspend: $("#speakerSuspendBtn"),
      adjourn: $("#speakerAdjournBtn")
    };
    if (!els.arena || !els.overlay) return;

    if (typeof THREE === "undefined") {
      noThree = true;
      renderNoThree();
      initialized = true;
      return;
    }

    try {
      buildScene();
    } catch (_) {
      noThree = true;
      renderNoThree();
      initialized = true;
      return;
    }

    bindEvents();
    setTool("calm");
    updateHUD();
    initialized = true;
    renderBest();
  }

  function renderNoThree() {
    if (!els.overlay) return;
    els.overlay.innerHTML = '<div class="roach-card">' +
      '<span class="kicker">Three.js</span>' +
      '<h3>Could not load 3D</h3>' +
      '<p>The Speaker\'s Chair needs the Three.js library from the CDN. Check your connection and refresh.</p>' +
      '<div class="roach-actions"><button type="button" class="btn btn-ghost" data-nav="home">Home</button></div>' +
      '</div>';
    els.overlay.classList.add("is-active");
  }

  /* ----------------------------------------------------------
     Three.js scene
     ---------------------------------------------------------- */
  function buildScene() {
    const w = els.arena.clientWidth || 800;
    const h = els.arena.clientHeight || 500;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);
    scene.fog = new THREE.Fog(0x0b1020, 26, 46);

    camera = new THREE.PerspectiveCamera(58, w / h, 0.1, 80);
    camera.position.set(0, 2.5, 8.6);
    camera.lookAt(0, 1.15, -1.2);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = false;
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.zIndex = "2";
    els.arena.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2(0, 0);

    /* lights */
    ambientLight = new THREE.AmbientLight(0xcfd8ef, 0.75);
    scene.add(ambientLight);
    keyLight = new THREE.DirectionalLight(0xfff2d8, 1.1);
    keyLight.position.set(3, 6, 4);
    scene.add(keyLight);
    const warm = new THREE.PointLight(0xe8b667, 0.8, 22);
    warm.position.set(-3, 2.4, 6.5);
    scene.add(warm);
    const cool = new THREE.PointLight(0x5b8def, 0.5, 26);
    cool.position.set(0, 4, -6);
    scene.add(cool);

    /* floor */
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x12301f });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(34, 24), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -1);
    scene.add(floor);

    /* carpet circle in the well */
    const carpetMat = new THREE.MeshLambertMaterial({ color: 0x0d6b3a });
    const carpet = new THREE.Mesh(new THREE.CircleGeometry(6.4, 40), carpetMat);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.005, 1.4);
    scene.add(carpet);

    /* golden ring around the well */
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xe8b667, transparent: true, opacity: 0.35 });
    const ring = new THREE.Mesh(new THREE.RingGeometry(6.5, 6.62, 48), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.008, 1.4);
    scene.add(ring);

    /* benches — three arcs on the far side */
    const benchMat = new THREE.MeshLambertMaterial({ color: 0x23304d });
    const benchTopMat = new THREE.MeshLambertMaterial({ color: 0x3a4a6b });
    const rows = [
      { z: -2.4, x: 0, n: 7 },
      { z: -4.6, x: 0, n: 9 },
      { z: -6.8, x: 0, n: 9 }
    ];
    rows.forEach((row) => {
      for (let i = 0; i < row.n; i++) {
        const off = (i - (row.n - 1) / 2) * 1.15;
        /* leave a central aisle in the nearest row so MPs can march through */
        if (row.z > -3 && Math.abs(off) < 0.9) continue;
        const bench = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.5, 0.5), benchMat);
        bench.position.set(off, 0.25, row.z);
        scene.add(bench);
        const top = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.09, 0.5), benchTopMat);
        top.position.set(off, 0.55, row.z);
        scene.add(top);
      }
    });

    /* side walls / colonnade hints */
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x1a2440 });
    [-7.6, 7.6].forEach((x) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.4, 16), wallMat);
      wall.position.set(x, 1.7, -1);
      scene.add(wall);
    });

    /* dias platform */
    const diasGroup = new THREE.Group();
    const diasMat = new THREE.MeshLambertMaterial({ color: 0x8f6a3c });
    const diasBox = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.55, 2.2), diasMat);
    diasBox.position.set(0, 0.27, 6.6);
    diasGroup.add(diasBox);
    const diasTrim = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 2.4), new THREE.MeshLambertMaterial({ color: 0xe8b667 }));
    diasTrim.position.set(0, 0.6, 6.6);
    diasGroup.add(diasTrim);
    scene.add(diasGroup);

    /* the Speaker's chair + figure */
    const chairMat = new THREE.MeshLambertMaterial({ color: 0x5c3a16 });
    const chair = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 1.1), chairMat);
    chair.position.set(0, 1.28, 6.7);
    scene.add(chair);
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.0, 0.22), chairMat);
    chairBack.position.set(0, 1.85, 6.12);
    scene.add(chairBack);
    const chairCushion = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.8), new THREE.MeshLambertMaterial({ color: 0xc0392b }));
    chairCushion.position.set(0, 1.52, 6.7);
    scene.add(chairCushion);

    /* a small presiding figure (the player, third person) */
    const fig = new THREE.Group();
    const figSkin = new THREE.MeshLambertMaterial({ color: 0xc0885c });
    const figBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.28), new THREE.MeshLambertMaterial({ color: 0xf3ead6 }));
    figBody.position.y = 1.02;
    fig.add(figBody);
    const figHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), figSkin);
    figHead.position.y = 1.48;
    fig.add(figHead);
    const figLegs = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.2), new THREE.MeshLambertMaterial({ color: 0x22252e }));
    figLegs.position.y = 0.42;
    fig.add(figLegs);
    fig.position.set(0, 1.05, 6.9);
    fig.scale.set(1, 0.92, 1);
    scene.add(fig);

    /* mace */
    const mace = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), new THREE.MeshLambertMaterial({ color: 0xe8b667 }));
    mace.position.set(1.6, 1.05, 6.5);
    scene.add(mace);
    const maceTop = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshLambertMaterial({ color: 0xf7d59c }));
    maceTop.position.set(1.6, 1.55, 6.5);
    scene.add(maceTop);

    mpGroup = new THREE.Group();
    scene.add(mpGroup);
    propGroup = new THREE.Group();
    scene.add(propGroup);
  }

  /* ----------------------------------------------------------
     MP factory
     ---------------------------------------------------------- */
  function pickType(weighted) {
    /* `weighted` already contains repeated entries; pick uniformly from it */
    return weighted[Math.floor(Math.random() * weighted.length)];
  }

  function makeMP(type) {
    const gender = Math.random() < 0.5 ? "m" : "f";
    const g = new THREE.Group();
    const skinMat = new THREE.MeshLambertMaterial({ color: pick(SKINS) });

    /* legs */
    const legMat = new THREE.MeshLambertMaterial({ color: gender === "f" ? 0x3b2f3f : 0x22252e });
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.64, 0.2), legMat);
    legs.position.y = 0.32;
    g.add(legs);

    /* torso */
    let torsoColor;
    if (gender === "f") torsoColor = pick(SARIS);
    else if (type === "leader") torsoColor = 0xf3ead6;
    else if (Math.random() < 0.45) torsoColor = pick(KURTAS);
    else torsoColor = pick(SUITS);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.54, 0.26), new THREE.MeshLambertMaterial({ color: torsoColor }));
    torso.position.y = 0.92;
    g.add(torso);

    /* arms */
    const armMat = new THREE.MeshLambertMaterial({ color: torsoColor });
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.5, 0.13), armMat);
    armL.position.set(-0.27, 0.94, 0);
    g.add(armL);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.5, 0.13), armMat);
    armR.position.set(0.27, 0.94, 0);
    g.add(armR);
    g.userData.arms = [armL, armR];

    /* head */
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), skinMat);
    head.position.y = 1.38;
    g.add(head);

    /* gender / role accessories */
    if (gender === "f") {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), new THREE.MeshLambertMaterial({ color: 0x241a16 }));
      hair.position.y = 1.42;
      hair.scale.set(1.06, 1.02, 1.06);
      g.add(hair);
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshLambertMaterial({ color: 0x241a16 }));
      bun.position.set(0.12, 1.5, -0.02);
      g.add(bun);
    } else if (type === "leader") {
      const turban = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshLambertMaterial({ color: pick(TURBANS) }));
      turban.position.y = 1.52;
      turban.scale.set(1.1, 0.85, 1.1);
      g.add(turban);
    } else {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshLambertMaterial({ color: 0x1c1a18 }));
      hair.position.y = 1.4;
      hair.scale.set(1.04, 0.9, 1.04);
      g.add(hair);
    }

    /* placard */
    if (type === "placard") {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 96;
      const ctx2 = canvas.getContext("2d");
      ctx2.fillStyle = "#f7f2e6";
      ctx2.fillRect(0, 0, 128, 96);
      ctx2.strokeStyle = "#b07a36";
      ctx2.lineWidth = 4;
      ctx2.strokeRect(3, 3, 122, 90);
      ctx2.fillStyle = "#a32c2c";
      ctx2.font = "bold 20px sans-serif";
      ctx2.textAlign = "center";
      ctx2.textBaseline = "middle";
      const slogan = t("speaker.placard." + (1 + Math.floor(Math.random() * 8)));
      wrapText(ctx2, slogan, 64, 48, 112, 20);
      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      const placard = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.46), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
      placard.position.set(0.36, 1.3, 0.1);
      g.add(placard);
      g.userData.placardMesh = placard;
    }

    /* thrower mark: red armband */
    if (type === "thrower") {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 8), new THREE.MeshLambertMaterial({ color: 0xc0392b }));
      band.position.set(-0.27, 1.12, 0);
      band.rotation.z = Math.PI / 2;
      g.add(band);
    }

    g.userData.arms = g.userData.arms || [];
    return g;
  }

  function wrapText(ctx2, text, cx, cy, maxW, lineH) {
    const words = String(text).split(" ");
    let line = "";
    let y = cy - lineH * 0.4;
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + " ";
      if (ctx2.measureText(test).width > maxW && line) {
        ctx2.fillText(line.trim(), cx, y);
        line = words[i] + " ";
        y += lineH;
      } else {
        line = test;
      }
    }
    ctx2.fillText(line.trim(), cx, y);
  }

  /* ----------------------------------------------------------
     Projectiles — chairs and paper
     ---------------------------------------------------------- */
  function makeChair() {
    const g = new THREE.Group();
    const m = new THREE.MeshLambertMaterial({ color: 0x6d4a24 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.42), m);
    seat.position.y = 0.35;
    g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.06), m);
    back.position.set(0, 0.55, -0.19);
    g.add(back);
    for (const [lx, lz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.06), m);
      leg.position.set(lx, 0.17, lz);
      g.add(leg);
    }
    return g;
  }

  function makePaper() {
    const m = new THREE.MeshLambertMaterial({ color: 0xf5f0e2, side: THREE.DoubleSide });
    return new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), m);
  }

  function throwProjectile(mp) {
    const chair = Math.random() < 0.55;
    const mesh = chair ? makeChair() : makePaper();
    const start = mp.mesh.position.clone();
    start.y = 1.35;
    mesh.position.copy(start);
    const target = new THREE.Vector3(rand(-1.2, 1.2), rand(1.6, 2.3), 6.6);
    const vel = target.clone().sub(start).multiplyScalar(1 / rand(1.05, 1.5));
    vel.y += 0.4;
    propGroup.add(mesh);
    const proj = {
      mesh,
      vel,
      spin: new THREE.Vector3(rand(-9, 9), rand(-9, 9), rand(-9, 9)),
      paper: !chair,
      dead: false
    };
    projectiles.push(proj);
    pickables.push({ mesh, kind: "proj", ref: proj });
    if (Audio) Audio.play("throw");
  }

  /* ----------------------------------------------------------
     MP spawning / lifecycle
     ---------------------------------------------------------- */
  function spawnMP() {
    if (!game || !game.active) return;
    const count = mps.length;
    if (count >= MAX_VISIBLE) return;

    const pressure = Math.min(1, game.elapsed / (DURATION * 0.7));
    const weighted = ["protester", "protester", "protester", "placard", "thrower", "leader"];
    if (pressure > 0.35) weighted.push("thrower", "thrower");
    if (pressure > 0.6) weighted.push("leader", "placard");
    if (pressure > 0.8) weighted.push("thrower");

    const type = pickType(weighted);
    const mesh = makeMP(type);
    const x = rand(-6.5, 6.5);
    mesh.position.set(x, 0, SPAWN_Z);
    mpGroup.add(mesh);

    const def = TYPE_DEFS[type];
    const mp = {
      id: ++uid,
      type,
      gender: Math.random() < 0.5 ? "m" : "f",
      mesh,
      state: "marching",
      target: new THREE.Vector3(rand(-WELL_TX, WELL_TX), 0, rand(WELL_TZ[0], WELL_TZ[1])),
      speed: def.speed * rand(0.85, 1.2),
      phase: rand(0, Math.PI * 2),
      bob: 0,
      surgeT: rand(6, 12),
      seatedT: 0,
      throwT: rand(2, 5),
      chantT: rand(1, 3),
      points: def.points,
      order: def.order,
      dead: false
    };
    mps.push(mp);
    pickables.push({ mesh, kind: "mp", ref: mp });
    game.quorum = Math.min(90, game.quorum + 1);
  }

  function removeMP(mp, instantly) {
    if (mp.dead) return;
    mp.dead = true;
    const i = mps.indexOf(mp);
    if (i >= 0) mps.splice(i, 1);
    pickables = pickables.filter((p) => p.ref !== mp);
    if (mp.mesh && mp.mesh.parent) mp.mesh.parent.remove(mp.mesh);
  }

  /* ----------------------------------------------------------
     Actions
     ---------------------------------------------------------- */
  function calmMP(mp) {
    if (!game || !game.active || mp.dead || mp.state === "seated" || mp.state === "leaving") return;
    mp.state = "seated";
    mp.seatedT = 0;
    game.score += mp.points;
    game.order = clamp(game.order + mp.order, 0, ORDER_ADJOURN + 20);
    if (Audio) Audio.play("calm");
    if (mp.type === "placard") floatText3D(mp.mesh.position, "+" + mp.points, "green");
    else floatText3D(mp.mesh.position, "+" + mp.points, "");
    updateHUD();
  }

  function suspendMP(mp) {
    if (!game || !game.active || mp.dead || mp.state === "leaving") return;
    game.score += 50;
    game.order = clamp(game.order + 12, 0, ORDER_ADJOURN + 20);
    game.suspended++;
    game.quorum = Math.max(0, game.quorum - 1);
    mp.state = "leaving";
    mp.target.set(rand(-6, 6), 0, LEAVE_Z);
    mp.speed = 2.4;
    if (Audio) Audio.play("suspend");
    flashT = 0.35;
    floatText3D(mp.mesh.position, t("speaker.float.suspend"), "red");
    announce(t("speaker.float.suspend"));
    updateHUD();
  }

  function deflectProjectile(proj) {
    if (proj.dead) return;
    proj.dead = true;
    if (proj.mesh && proj.mesh.parent) proj.mesh.parent.remove(proj.mesh);
    pickables = pickables.filter((p) => p.ref !== proj);
    game.score += 5;
    if (Audio) Audio.play("deflect");
    floatText3D(proj.mesh ? proj.mesh.position : new THREE.Vector3(0, 1.5, 5), t("speaker.float.deflect"), "green");
    updateHUD();
  }

  function hitChair() {
    if (!game || !game.active) return;
    game.order = Math.max(0, game.order - 12);
    shake = Math.max(shake, 0.6);
    flashT = 0.4;
    if (Audio) Audio.play("hit");
    announce(t("speaker.float.hit"));
    if (!reduced && els.arena) {
      els.arena.classList.remove("is-shaking");
      void els.arena.offsetWidth;
      els.arena.classList.add("is-shaking");
      setTimeout(() => { if (els.arena) els.arena.classList.remove("is-shaking"); }, 430);
    }
    updateHUD();
  }

  function breach(mp) {
    if (mp.dead) return;
    game.order = Math.max(0, game.order - 20);
    game.quorum = Math.max(0, game.quorum - 2);
    shake = Math.max(shake, 1.0);
    flashT = 0.55;
    if (Audio) Audio.play("hit");
    announce(t("speaker.float.hit"));
    if (!reduced && els.arena) {
      els.arena.classList.remove("is-shaking");
      void els.arena.offsetWidth;
      els.arena.classList.add("is-shaking");
      setTimeout(() => { if (els.arena) els.arena.classList.remove("is-shaking"); }, 480);
    }
    mp.state = "leaving";
    mp.target.set(rand(-6, 6), 0, LEAVE_Z);
    mp.speed = 2.6;
    updateHUD();
  }

  function tryAdjourn() {
    if (!game || !game.active) return;
    if (game.order < ORDER_ADJOURN || game.quorum < QUORUM_MIN) {
      announce(t("speaker.tool.adjournHint"));
      if (Audio) Audio.play("wrong");
      return;
    }
    game.score += 500;
    best.adjourns += 1;
    if (Audio) Audio.play("adjourn");
    endGame("adjourn");
  }

  /* ----------------------------------------------------------
     Game lifecycle
     ---------------------------------------------------------- */
  function startGame() {
    cancelAnimationFrame(raf);
    raf = 0;
    clearEntities();
    if (els.fx) els.fx.innerHTML = "";
    if (els.combo) { els.combo.textContent = ""; els.combo.classList.remove("is-showing"); }

    shake = 0;
    flashT = 0;
    game = {
      active: true,
      over: false,
      score: 0,
      time: DURATION,
      quorum: START_QUORUM,
      order: 20,
      suspended: 0,
      elapsed: 0,
      spawnTimer: 1.9,
      hudT: 0,
      chantT: 0,
      quorumWarned: false,
      endReason: "",
      isBest: false
    };

    setTool("calm");
    els.overlay.classList.remove("is-active");
    els.overlay.innerHTML = "";
    updateHUD();
    if (Audio) Audio.play("gavelDouble");

    for (let i = 0; i < 14; i++) spawnMP();
    lastTs = performance.now();
    loop(lastTs);
  }

  function clearEntities() {
    mps.forEach((mp) => { if (mp.mesh && mp.mesh.parent) mp.mesh.parent.remove(mp.mesh); });
    projectiles.forEach((p) => { if (p.mesh && p.mesh.parent) p.mesh.parent.remove(p.mesh); });
    mps = [];
    projectiles = [];
    pickables = [];
  }

  function loop(ts) {
    if (!game || !game.active || !visible) return;
    const dt = clamp((ts - lastTs) / 1000, 0, 0.05);
    lastTs = ts;
    step(dt);
    renderFrame();
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

    /* spawn */
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      spawnMP();
      const pressure = Math.min(1, game.elapsed / (DURATION * 0.7));
      game.spawnTimer = Math.max(0.85, 2.0 - pressure * 1.1) * rand(0.8, 1.25);
    }

    /* ruckus drains order from placards & throwers */
    let ruckus = 0;
    for (const mp of mps) {
      if (mp.dead || mp.state !== "active") continue;
      if (mp.type === "placard") ruckus += 1.6;
      else if (mp.type === "thrower") ruckus += 0.9;
      else ruckus += 0.25;
    }
    ruckus = Math.min(ruckus, 9);
    game.order = Math.max(0, game.order - ruckus * dt);

    /* MPs */
    for (let i = mps.length - 1; i >= 0; i--) {
      const mp = mps[i];
      if (mp.dead) continue;

      if (mp.state === "marching") {
        moveToward(mp, mp.target, mp.speed * dt);
        walkCycle(mp, dt);
        if (mp.mesh.position.distanceTo(mp.target) < 0.22) {
          mp.state = "active";
        }
      } else if (mp.state === "active") {
        /* milling + bob */
        mp.bob += dt * 4.2;
        mp.mesh.position.y = Math.abs(Math.sin(mp.bob)) * 0.09;
        mp.mesh.position.x += Math.sin(game.elapsed * 0.7 + mp.phase) * 0.004;
        mp.mesh.position.z += Math.cos(game.elapsed * 0.6 + mp.phase) * 0.003;
        mp.mesh.position.x = clamp(mp.mesh.position.x, -WELL_TX - 1, WELL_TX + 1);
        mp.mesh.position.z = clamp(mp.mesh.position.z, WELL_TZ[0] - 0.4, 4.6);
        /* wave arms */
        const w = Math.sin(mp.bob * 1.4) * 0.5 + 0.5;
        if (mp.mesh.userData.arms && mp.mesh.userData.arms.length) {
          mp.mesh.userData.arms.forEach((arm, ai) => {
            arm.rotation.x = (ai === 0 ? -1 : 1) * (0.3 + w * 0.7);
          });
        }
        /* placard wave */
        if (mp.mesh.userData.placardMesh) {
          mp.mesh.userData.placardMesh.rotation.x = Math.sin(mp.bob * 0.9) * 0.35;
          mp.mesh.userData.placardMesh.position.y = 1.3 + Math.abs(Math.sin(mp.bob * 0.7)) * 0.12;
        }
        /* occasional chant */
        mp.chantT -= dt;
        if (mp.chantT <= 0) {
          mp.chantT = rand(2, 5);
          if (Audio && Math.random() < 0.5) Audio.play("chant");
        }
        /* thrower throws */
        if (TYPE_DEFS[mp.type].thrower) {
          mp.throwT -= dt;
          if (mp.throwT <= 0) {
            mp.throwT = rand(2.4, 4.2);
            throwProjectile(mp);
          }
        }
        /* surge toward the dias */
        mp.surgeT -= dt;
        if (mp.surgeT <= 0) {
          mp.surgeT = rand(7, 14);
          mp.state = "charging";
          const menacer = mp.type === "leader" || mp.type === "thrower";
          mp.target.set(rand(-2.5, 2.5), 0, menacer ? rand(4.55, 4.95) : DIAS_LINE + 0.4);
          mp.speed = TYPE_DEFS[mp.type].speed * 2.1;
        }
      } else if (mp.state === "charging") {
        moveToward(mp, mp.target, mp.speed * dt);
        walkCycle(mp, dt);
        if (mp.mesh.position.z > DIAS_LINE) {
          breach(mp);
        } else if (mp.mesh.position.distanceTo(mp.target) < 0.25) {
          mp.state = "active";
        }
      } else if (mp.state === "seated") {
        mp.seatedT += dt;
        const s = 0.58 + Math.sin(game.elapsed * 2 + mp.phase) * 0.02;
        mp.mesh.scale.y = s;
        mp.mesh.position.y = 0;
        if (mp.mesh.userData.arms) mp.mesh.userData.arms.forEach((arm) => { arm.rotation.x = 0; });
        if (mp.seatedT > 14) {
          mp.state = "leaving";
          mp.target.set(rand(-6, 6), 0, LEAVE_Z);
          mp.speed = 1.8;
          mp.mesh.scale.y = 1;
          mp.mesh.position.y = 0;
        }
      } else if (mp.state === "leaving") {
        moveToward(mp, mp.target, mp.speed * dt);
        walkCycle(mp, dt);
        if (mp.mesh.position.z <= LEAVE_Z + 0.05) {
          game.quorum = Math.max(0, game.quorum - 1);
          removeMP(mp);
        }
      }
    }

    /* projectiles */
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      if (p.dead) { projectiles.splice(i, 1); continue; }
      p.mesh.position.add(p.vel.clone().multiplyScalar(dt));
      if (p.paper) {
        p.mesh.rotation.x += dt * 6;
        p.mesh.rotation.y += dt * 4;
        p.mesh.position.y = Math.max(0.3, p.mesh.position.y);
      } else {
        p.mesh.rotation.x += p.spin.x * dt;
        p.mesh.rotation.y += p.spin.y * dt;
        p.mesh.rotation.z += p.spin.z * dt;
      }
      const pos = p.mesh.position;
      if (pos.z > 6.4 && Math.abs(pos.x) < 2.4 && pos.y < 3.2) {
        p.dead = true;
        if (p.mesh && p.mesh.parent) p.mesh.parent.remove(p.mesh);
        pickables = pickables.filter((x) => x.ref !== p);
        hitChair();
      } else if (pos.y < -1 || pos.z > 9 || Math.abs(pos.x) > 9) {
        p.dead = true;
        if (p.mesh && p.mesh.parent) p.mesh.parent.remove(p.mesh);
        pickables = pickables.filter((x) => x.ref !== p);
      }
    }

    /* quorum warning */
    if (game.quorum < QUORUM_MIN && !game.quorumWarned) {
      game.quorumWarned = true;
      if (Audio) Audio.play("quorum");
      announce(t("speaker.float.quorum"));
    } else if (game.quorum >= QUORUM_MIN) {
      game.quorumWarned = false;
    }
    if (game.quorum <= QUORUM_FAIL) {
      endGame("quorum");
      return;
    }

    /* ambient chant ambience */
    game.chantT -= dt;
    if (game.chantT <= 0) {
      game.chantT = 1.1;
      const activeCount = mps.filter((m) => m.state === "active" || m.state === "charging").length;
      if (activeCount >= 3 && Audio && Math.random() < 0.6) Audio.play("chant");
    }

    game.hudT += dt;
    if (game.hudT >= 0.1) {
      game.hudT = 0;
      updateHUD();
    }

    shake = Math.max(0, shake - dt * 2.2);
    flashT = Math.max(0, flashT - dt);
  }

  function moveToward(mp, target, step) {
    const dx = target.x - mp.mesh.position.x;
    const dz = target.z - mp.mesh.position.z;
    const dist = Math.hypot(dx, dz) || 1;
    if (dist < step) {
      mp.mesh.position.x = target.x;
      mp.mesh.position.z = target.z;
    } else {
      mp.mesh.position.x += (dx / dist) * step;
      mp.mesh.position.z += (dz / dist) * step;
    }
    mp.mesh.rotation.y = Math.atan2(dx, dz);
  }

  function walkCycle(mp, dt) {
    mp.bob += dt * 9;
    mp.mesh.position.y = Math.abs(Math.sin(mp.bob)) * 0.06;
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
    saveBest();
    renderBest();
    updateHUD();
    renderEnd();
    if (Audio) Audio.play(reason === "quorum" ? "defeat" : "victory");
  }

  /* ----------------------------------------------------------
     HUD, effects, overlays
     ---------------------------------------------------------- */
  function updateHUD() {
    if (!els.score) return;
    if (!game) {
      els.score.textContent = "0";
      els.time.textContent = String(DURATION);
      els.quorum.textContent = String(START_QUORUM);
      els.order.textContent = "20";
      els.suspended.textContent = "0";
      if (els.quorumBar) els.quorumBar.style.width = Math.min(100, (START_QUORUM / 90) * 100) + "%";
      if (els.orderBar) els.orderBar.style.width = "20%";
      if (els.adjourn) {
        els.adjourn.disabled = true;
        els.adjourn.classList.remove("is-ready");
      }
      return;
    }

    els.score.textContent = game.score.toLocaleString("en-IN");
    els.time.textContent = String(Math.ceil(game.time));
    els.quorum.textContent = String(Math.max(0, Math.round(game.quorum)));
    els.order.textContent = String(Math.max(0, Math.round(game.order)));
    els.suspended.textContent = String(game.suspended);
    if (els.quorumBar) els.quorumBar.style.width = clamp((game.quorum / 90) * 100, 0, 100) + "%";
    if (els.orderBar) els.orderBar.style.width = clamp((game.order / ORDER_ADJOURN) * 100, 0, 100) + "%";

    const canAdjourn = game.active && game.order >= ORDER_ADJOURN && game.quorum >= QUORUM_MIN;
    if (els.adjourn) {
      els.adjourn.disabled = !canAdjourn;
      els.adjourn.classList.toggle("is-ready", canAdjourn);
    }
  }

  function renderFrame() {
    if (!renderer || !scene || !camera) return;
    if (shake > 0) {
      camera.position.x = rand(-0.12, 0.12) * shake;
      camera.position.y = 2.5 + rand(-0.1, 0.1) * shake;
    } else {
      camera.position.x = 0;
      camera.position.y = 2.5;
    }
    camera.lookAt(0, 1.15, -1.2);
    renderer.render(scene, camera);
    if (flashT > 0 && els.flash) {
      els.flash.classList.add("is-active");
    } else if (els.flash) {
      els.flash.classList.remove("is-active");
    }
  }

  function floatText3D(v3, text, kind) {
    if (!els.fx || !camera) return;
    const vec = v3.clone().project(camera);
    const w = els.arena.clientWidth || 800;
    const h = els.arena.clientHeight || 500;
    const x = (vec.x * 0.5 + 0.5) * w;
    const y = (-vec.y * 0.5 + 0.5) * h;
    const el = document.createElement("span");
    el.className = "roach-float" + (kind ? " " + kind : "");
    el.style.setProperty("--x", x + "px");
    el.style.setProperty("--y", y + "px");
    el.textContent = text;
    els.fx.appendChild(el);
    setTimeout(() => el.remove(), 900);
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
      '<span class="kicker">' + t("speaker.o.kicker") + '</span>' +
      '<h3>' + t("speaker.o.title") + '</h3>' +
      '<p>' + t("speaker.o.text") + '</p>' +
      '<ul class="roach-rules">' +
        '<li>' + t("speaker.o.rule1") + '</li>' +
        '<li>' + t("speaker.o.rule2") + '</li>' +
        '<li>' + t("speaker.o.rule3") + '</li>' +
      '</ul>' +
      '<div class="roach-actions">' +
        '<button type="button" class="btn btn-gold" data-speaker-start>' + t("speaker.start") + '</button>' +
      '</div>' +
      '<p class="roach-tiny">' + t("speaker.o.tiny") + '</p>' +
      '</div>';
    els.overlay.classList.add("is-active");
  }

  function renderEnd() {
    if (!els.overlay || !game) return;
    const reason = game.endReason;
    const title = reason === "quorum" ? t("speaker.end.quorum") : reason === "adjourn" ? t("speaker.end.adjourn") : t("speaker.end.time");
    const text = reason === "quorum" ? t("speaker.end.quorum.text") : reason === "adjourn" ? t("speaker.end.adjourn.text") : t("speaker.end.time.text");
    const bestLine = game.isBest
      ? '<span class="roach-newbest">' + t("speaker.end.newBest") + '</span>'
      : '';
    els.overlay.innerHTML = '<div class="roach-card">' +
      '<span class="kicker">' + t("speaker.kicker") + '</span>' +
      '<h3>' + title + '</h3>' +
      '<p>' + text + '</p>' +
      bestLine +
      '<div class="roach-end-stats">' +
        '<div><span>' + t("speaker.end.score") + '</span><b>' + game.score.toLocaleString("en-IN") + '</b></div>' +
        '<div><span>' + t("speaker.end.suspended") + '</span><b>' + game.suspended + '</b></div>' +
        '<div><span>' + t("speaker.end.best") + '</span><b>' + best.best.toLocaleString("en-IN") + '</b></div>' +
      '</div>' +
      '<div class="roach-actions">' +
        '<button type="button" class="btn btn-gold" data-speaker-replay>' + t("speaker.end.replay") + '</button>' +
        '<button type="button" class="btn btn-ghost" data-nav="home">' + t("speaker.end.home") + '</button>' +
      '</div>' +
      '</div>';
    els.overlay.classList.add("is-active");
  }

  /* ----------------------------------------------------------
     Input
     ---------------------------------------------------------- */
  function setTool(next) {
    tool = next === "suspend" ? "suspend" : "calm";
    if (els.calm) {
      els.calm.classList.toggle("is-active", tool === "calm");
      els.calm.setAttribute("aria-pressed", tool === "calm" ? "true" : "false");
    }
    if (els.suspend) {
      els.suspend.classList.toggle("is-active", tool === "suspend");
      els.suspend.setAttribute("aria-pressed", tool === "suspend" ? "true" : "false");
    }
    if (els.arena) els.arena.dataset.tool = tool;
  }

  function onPointerDown(e) {
    if (!game || !game.active) return;
    if (e.button != null && e.button !== 0) return;
    if (e.target && e.target !== renderer.domElement && !renderer.domElement.contains(e.target)) return;

    const rect = els.arena.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const targets = mpGroup.children.concat(propGroup.children);
    const hits = raycaster.intersectObjects(targets, true);
    if (!hits.length) return;

    /* walk up from the hit child to its top-level MP group / projectile */
    const hitObj = hits[0].object;
    let node = hitObj;
    while (node.parent && node.parent !== mpGroup && node.parent !== propGroup) node = node.parent;
    const pick = pickables.find((p) => p.mesh === node);
    if (!pick) return;

    e.preventDefault();
    if (pick.kind === "proj") {
      deflectProjectile(pick.ref);
      return;
    }
    const mp = pick.ref;
    if (mp.dead) return;
    if (tool === "suspend") suspendMP(mp);
    else calmMP(mp);
  }

  function nearestActive() {
    if (!game) return null;
    let chosen = null;
    let bestDist = Infinity;
    const ref = new THREE.Vector3(0, 0, 3.1);
    for (const mp of mps) {
      if (mp.dead || mp.state === "seated" || mp.state === "leaving") continue;
      const d = mp.mesh.position.distanceTo(ref);
      if (d < bestDist) { bestDist = d; chosen = mp; }
    }
    return chosen;
  }

  function bindEvents() {
    els.arena.addEventListener("pointerdown", onPointerDown);

    if (els.calm) els.calm.addEventListener("click", () => setTool("calm"));
    if (els.suspend) els.suspend.addEventListener("click", () => setTool("suspend"));
    if (els.adjourn) els.adjourn.addEventListener("click", tryAdjourn);

    els.overlay.addEventListener("click", (e) => {
      if (e.target.closest("[data-speaker-start]") || e.target.closest("[data-speaker-replay]")) {
        e.preventDefault();
        startGame();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (!visible) return;
      if (e.target && e.target.matches("input, select, textarea, [contenteditable]")) return;
      if (e.key === "1") { e.preventDefault(); setTool("calm"); }
      else if (e.key === "2") { e.preventDefault(); setTool("suspend"); }
      else if (e.key === "a" || e.key === "A") {
        if (game && game.active) { e.preventDefault(); tryAdjourn(); }
      }
      else if (e.key === "c" || e.key === "C") {
        if (game && game.active) {
          e.preventDefault();
          const mp = nearestActive();
          if (mp) calmMP(mp);
        }
      }
      else if (e.key === "s" || e.key === "S") {
        if (game && game.active) {
          e.preventDefault();
          const mp = nearestActive();
          if (mp) suspendMP(mp);
        }
      }
    });

    window.addEventListener("resize", onResize);
  }

  function onResize() {
    if (!renderer || !els.arena) return;
    const w = els.arena.clientWidth || 800;
    const h = els.arena.clientHeight || 500;
    if (w < 2 || h < 2) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /* ----------------------------------------------------------
     Public API
     ---------------------------------------------------------- */
  function setT(fn) {
    if (typeof fn === "function") t = fn;
  }

  function enter() {
    if (!initialized) init();
    if (!initialized || noThree) return;
    visible = true;
    onResize();
    /* the screen becomes visible right after navigate() returns, so
       re-measure on the next frame to pick up the true arena size */
    requestAnimationFrame(onResize);
    if (!game) {
      renderIdle();
      renderFrame();
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
    if (!initialized || noThree) return;
    renderBest();
    updateHUD();
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
