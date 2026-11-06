/* ============================================================
   SANSAD — Redline Editor
   The 42nd Amendment's changes appear as red edits in the
   Constitution. The player plays the Janata Parliament of
   1977–78 and strikes the ones that were actually reversed.
   No dependencies. Lives inside the Emergency screen.
   ============================================================ */

const SansadRedline = (function () {
  "use strict";

  const STORE_KEY = "sansad.redline.v1";
  const Audio = typeof SansadAudio !== "undefined" ? SansadAudio : null;

  let t = function (key, vars) {
    const dict = (typeof I18N !== "undefined" && I18N.en && I18N.en.ui) || {};
    let out = dict[key] != null ? dict[key] : key;
    if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    return out;
  };

  /* fate: "struck" = reversed by Janata Parliament,
           "kept"   = survived the 44th (fate says why / what happened later) */
  const CLAUSES = [
    {
      ref: "Preamble",
      parts: [
        "WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN ",
        { id: "pre-ss", old: "", neu: "SOCIALIST SECULAR" },
        " DEMOCRATIC REPUBLIC … and to promote among them all FRATERNITY assuring the dignity of the individual and the ",
        { id: "pre-int", old: "unity of the Nation", neu: "unity and integrity of the Nation" },
        " …"
      ]
    },
    {
      ref: "Article 74(1)",
      parts: [
        "There shall be a Council of Ministers with the Prime Minister at the head to aid and advise the President",
        { id: "a74", old: "", neu: ", who shall, in the exercise of his functions, act in accordance with such advice" },
        "."
      ]
    },
    {
      ref: "Article 83(2)",
      parts: [
        "The House of the People, unless sooner dissolved, shall continue for ",
        { id: "a83", old: "five years", neu: "six years" },
        " from the date appointed for its first meeting and no longer …"
      ]
    },
    {
      ref: "Article 32A",
      parts: [
        { id: "a32a", block: true, old: "", neu: "32A. Constitutional validity of State laws not to be considered in proceedings under article 32. — The Supreme Court shall not consider the constitutional validity of any State law in any proceedings under article 32 unless the constitutional validity of a Central law is also in issue." }
      ]
    },
    {
      ref: "Article 144A",
      parts: [
        { id: "a144a", block: true, old: "", neu: "144A. Special provisions as to disposal of questions relating to constitutional validity of laws. — The minimum number of Judges to sit for determining any question as to the constitutional validity of any Central or State law shall be seven, and no law shall be declared invalid except by a majority of not less than two-thirds of the Judges sitting." }
      ]
    },
    {
      ref: "Article 226(1)",
      parts: [
        "Every High Court shall have power … to issue to any person or authority … directions, orders or writs … for the enforcement of any of the rights conferred by Part III",
        { id: "a226", old: " and for any other purpose", neu: "" },
        "."
      ]
    },
    {
      ref: "Article 352(1)",
      parts: [
        "If the President is satisfied that a grave emergency exists whereby the security of India is threatened … he may, by Proclamation, make a declaration to that effect in respect of ",
        { id: "a352", old: "the whole of India", neu: "the whole of India or of such part of the territory thereof as may be specified" },
        " …"
      ]
    },
    {
      ref: "Article 356(4)",
      parts: [
        "A Proclamation so approved shall, unless revoked, cease to operate on the expiration of ",
        { id: "a356", old: "six months", neu: "one year" },
        " from the date of passing of the second resolution approving the Proclamation …"
      ]
    },
    {
      ref: "Article 31C",
      parts: [
        "Notwithstanding anything in article 13, no law giving effect to the policy of the State towards securing ",
        { id: "a31c", old: "the principles specified in clause (b) or clause (c) of article 39", neu: "all or any of the principles laid down in Part IV" },
        " shall be deemed to be void on the ground that it takes away or abridges any of the rights conferred by article 14 or article 19."
      ]
    },
    {
      ref: "Article 368",
      parts: [
        { id: "a368", block: true, old: "", neu: "(4) No amendment of this Constitution … shall be called in question in any court on any ground.\n(5) For the removal of doubts, it is hereby declared that there shall be no limitation whatever on the constituent power of Parliament to amend by way of addition, variation or repeal the provisions of this Constitution." }
      ]
    },
    {
      ref: "Part IVA · Article 51A",
      parts: [
        { id: "a51a", block: true, old: "", neu: "51A. Fundamental Duties. — It shall be the duty of every citizen of India (a) to abide by the Constitution and respect its ideals and institutions, the National Flag and the National Anthem; (b) to cherish and follow the noble ideals which inspired our national struggle for freedom; (c) to uphold and protect the sovereignty, unity and integrity of India …" }
      ]
    }
  ];

  /* Everything the player learns, keyed by change id */
  const FACTS = {
    "pre-ss": {
      tag: "Preamble", sec: "42nd Amendment, 1976", fate: "kept",
      what: "Adds “Socialist” and “Secular” to the description of the Republic.",
      why: "Janata left these words in. They are still in the Preamble today — the secular and socialist vision was not the problem with the Emergency. The correction targeted unchecked power, not the Republic’s stated ideals.",
      end: "Still in the Constitution"
    },
    "pre-int": {
      tag: "Preamble", sec: "42nd Amendment, 1976", fate: "kept",
      what: "Changes “unity of the Nation” to “unity and integrity of the Nation”.",
      why: "A harmless-sounding edit that Janata did not touch. “Integrity” remains in the Preamble.",
      end: "Still in the Constitution"
    },
    "a74": {
      tag: "Executive power", sec: "42nd Amendment, 1976", fate: "kept",
      what: "Makes the President bound to act on the Council of Ministers’ advice.",
      why: "Janata did not undo the binding rule. The 44th added a proviso instead: the President may send advice back once for reconsideration, but must act on the advice that comes back. A cooling-off safeguard, not a reversal.",
      end: "Kept, with a 44th Amendment proviso"
    },
    "a83": {
      tag: "Parliament’s term", sec: "42nd Amendment, 1976", fate: "struck",
      what: "Lengthens the Lok Sabha’s life from five years to six.",
      why: "Struck. The 44th Amendment restored the five-year term: no House should be able to lengthen its own mandate. During the Emergency the fifth Lok Sabha had already been extended past 1976 without an election.",
      by: "44th Amendment, 1978", end: "Reversed — five years again"
    },
    "a32a": {
      tag: "Judicial review", sec: "42nd Amendment, 1976", fate: "struck",
      what: "Bars the Supreme Court from testing State laws under Article 32 unless a Central law is also challenged.",
      why: "Struck. This was among Janata’s earliest targets: the 43rd Amendment (1977) repealed Article 32A and restored the citizen’s right to walk into the Supreme Court. Janata’s Parliament did its repair in two stages — the 43rd, then the 44th.",
      by: "43rd Amendment, 1977", end: "Repealed"
    },
    "a144a": {
      tag: "Judicial review", sec: "42nd Amendment, 1976", fate: "struck",
      what: "Demands a seven-judge bench and a two-thirds majority before any law is declared invalid.",
      why: "Struck. A near-impossible threshold: a bare majority of a seven-judge bench would no longer have been enough. The 43rd Amendment (1977) repealed 144A — ordinary majorities could strike down unconstitutional laws again.",
      by: "43rd Amendment, 1977", end: "Repealed"
    },
    "a226": {
      tag: "Judicial review", sec: "42nd Amendment, 1976", fate: "struck",
      what: "Cuts the High Courts’ writ power down to the enforcement of fundamental rights only.",
      why: "Struck. Without “any other purpose”, a High Court could not correct plain illegality by officials. The 43rd Amendment (1977) restored the wording and with it the High Courts’ full power of review.",
      by: "43rd Amendment, 1977", end: "Restored"
    },
    "a352": {
      tag: "Emergency power", sec: "42nd Amendment, 1976", fate: "kept",
      what: "Lets the President proclaim an Emergency in any part of the country, not just the whole.",
      why: "Kept — a regional Emergency remains possible today. What the 44th changed was the trigger: “internal disturbance” became “armed rebellion”, a Cabinet’s advice must be in writing, and Parliament must approve within one month by a special majority.",
      end: "Kept, but with new safeguards on the trigger"
    },
    "a356": {
      tag: "President’s Rule", sec: "42nd Amendment, 1976", fate: "struck",
      what: "Doubles the usual run of President’s Rule in a State from six months to a year.",
      why: "Struck. The 44th Amendment brought back six months at a time, and tightened extension beyond one year (an Election Commission certificate is now needed).",
      by: "44th Amendment, 1978", end: "Back to six months"
    },
    "a31c": {
      tag: "Rights vs. Directives", sec: "42nd Amendment, 1976", fate: "kept",
      what: "Lets every Directive Principle override the rights to equality and freedom (Articles 14 and 19).",
      why: "Janata did not repeal it — the Supreme Court did. In Minerva Mills (1980) the Court struck the expanded Article 31C down: fundamental rights and directive principles must be balanced, not ranked.",
      end: "Struck by the Supreme Court, 1980"
    },
    "a368": {
      tag: "Amending power", sec: "42nd Amendment, 1976", fate: "kept",
      what: "Declares that no amendment can be questioned in any court and that Parliament’s power to amend has no limits.",
      why: "Janata let it stand — it was the Supreme Court that finished it. In Minerva Mills (1980) the Court struck down clauses (4) and (5): a limited amending power is part of the Constitution’s basic structure.",
      end: "Struck by the Supreme Court, 1980"
    },
    "a51a": {
      tag: "Citizens’ duties", sec: "42nd Amendment, 1976", fate: "kept",
      what: "Adds a new Part IVA listing ten Fundamental Duties for every citizen.",
      why: "Nobody tried to undo this. The duties are still in the Constitution (an eleventh, on education, was added in 2002). A reminder that the 42nd Amendment was not all bad — the sweeping changes were mixed in with useful ones.",
      end: "Still in the Constitution"
    }
  };

  const ORDER = [];
  CLAUSES.forEach((c) => c.parts.forEach((p) => { if (typeof p === "object") ORDER.push(p.id); }));
  const TOTAL = ORDER.length;

  let root = null;
  let marked = new Set();
  let active = null;
  let submitted = false;
  let best = 0;

  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) best = Math.max(0, parseInt(JSON.parse(raw).best, 10) || 0);
  } catch (_) { /* ignore */ }

  function saveBest() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ best })); } catch (_) { /* ignore */ }
  }

  function play(name) { if (Audio && Audio.play) Audio.play(name); }

  function esc(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function changeFor(id) {
    for (const c of CLAUSES) for (const p of c.parts) if (typeof p === "object" && p.id === id) return p;
    return null;
  }

  function score() {
    let right = 0;
    ORDER.forEach((id) => {
      const shouldStrike = FACTS[id].fate === "struck";
      if (marked.has(id) === shouldStrike) right++;
    });
    return right;
  }

  /* ---------------- rendering ---------------- */
  function tokenHTML(p) {
    const f = FACTS[p.id];
    const on = marked.has(p.id);
    let cls = "rl-chg" + (p.block ? " is-block" : "") + (on ? " is-struck" : "");
    let badge = "";
    if (submitted) {
      const ok = on === (f.fate === "struck");
      cls += ok ? " is-ok" : " is-miss";
      badge = `<span class="rl-badge" aria-hidden="true">${ok ? "✓" : "✗"}</span>`;
    }
    if (active === p.id) cls += " is-active";
    const oldHTML = p.old ? `<del class="rl-old">${esc(p.old)}</del>` : "";
    const neuHTML = p.neu ? `<ins class="rl-new">${esc(p.neu).replace(/\n/g, "<br>")}</ins>` : "";
    const label = `${f.tag}: ${on ? t("redline.aria.marked") : t("redline.aria.unmarked")}`;
    return `<button type="button" class="${cls}" data-id="${p.id}" aria-pressed="${on}" aria-label="${esc(label)}"${submitted ? " disabled" : ""}>${oldHTML}${neuHTML}${badge}</button>`;
  }

  function noteHTML(id) {
    const f = FACTS[id];
    const open = submitted || active === id;
    if (!open) return "";
    let h = `<div class="rl-note${submitted ? (marked.has(id) === (f.fate === "struck") ? " is-ok" : " is-miss") : ""}" data-note="${id}">`;
    h += `<span class="rl-note-tag">${esc(f.tag)} · ${esc(f.sec)}</span>`;
    h += `<p class="rl-note-what">${esc(f.what)}</p>`;
    if (submitted) {
      const struck = f.fate === "struck";
      const ok = marked.has(id) === struck;
      h += `<p class="rl-note-verdict"><b>${ok ? t("redline.v.right") : t("redline.v.wrong")}</b> ${esc(struck ? t("redline.v.struck", { by: f.by }) : t("redline.v.kept"))}</p>`;
      h += `<p class="rl-note-why">${esc(f.why)}</p>`;
      h += `<span class="rl-note-end">${esc(f.end)}</span>`;
    } else {
      h += `<p class="rl-note-hint">${t("redline.note.hint")}</p>`;
    }
    h += "</div>";
    return h;
  }

  function render() {
    if (!root) return;
    const count = marked.size;
    let h = "";

    h += `<div class="rl-bar">
      <div class="rl-lamp ${submitted ? "is-done" : ""}" role="status">
        <i aria-hidden="true"></i>
        <span>${submitted ? t("redline.status.after") : t("redline.status.force")}</span>
      </div>
      <div class="rl-counter"><b>${count}</b> / ${TOTAL} <span>${t("redline.marked")}</span></div>
      <div class="rl-legend" aria-hidden="true">
        <span><i class="lg-new"></i>${t("redline.legend.new")}</span>
        <span><i class="lg-old"></i>${t("redline.legend.old")}</span>
        <span><i class="lg-back"></i>${t("redline.legend.back")}</span>
      </div>
    </div>`;

    h += `<div class="rl-paper" lang="en">`;
    h += `<div class="rl-paper-head"><span>The Constitution of India</span><span>${t("redline.paper.rev")}</span></div>`;
    CLAUSES.forEach((c) => {
      h += `<div class="rl-clause"><h4>${esc(c.ref)}</h4><div class="rl-text">`;
      const ids = [];
      c.parts.forEach((p) => {
        if (typeof p === "string") h += esc(p);
        else { h += tokenHTML(p); ids.push(p.id); }
      });
      h += `</div>`;
      ids.forEach((id) => { h += noteHTML(id); });
      h += `</div>`;
    });
    h += `</div>`;

    if (!submitted) {
      h += `<div class="rl-actions">
        <button type="button" class="btn em-btn-solid" data-act="pass">${t("redline.pass")}</button>
        <button type="button" class="btn em-btn-ghost" data-act="reset"${count ? "" : " disabled"}>${t("redline.reset")}</button>
        <span class="rl-actions-hint">${t("redline.pass.hint")}</span>
      </div>`;
    } else {
      const s = score();
      const tier = s >= TOTAL - 1 ? "a" : s >= 9 ? "b" : s >= 6 ? "c" : "d";
      h += `<div class="rl-result tier-${tier}" role="status">
        <div class="rl-stamp">${t("redline.result.stamp")}</div>
        <div class="rl-result-body">
          <span class="em-label">${t("redline.result.kicker")}</span>
          <h3>${t("redline.result." + tier + ".title")}</h3>
          <p>${t("redline.result." + tier + ".text")}</p>
          <div class="rl-score"><b>${s}</b><span>/ ${TOTAL} ${t("redline.score")}</span>
            <em>${t("redline.best")}: ${best} / ${TOTAL}</em></div>
          <div class="rl-takeaway">${t("redline.takeaway")}</div>
          <button type="button" class="btn em-btn-solid" data-act="again">${t("redline.again")}</button>
        </div>
      </div>`;
    }
    root.innerHTML = h;
  }

  /* ---------------- interaction ---------------- */
  function onClick(e) {
    const chg = e.target.closest(".rl-chg");
    if (chg && !submitted) {
      const id = chg.dataset.id;
      if (marked.has(id)) marked.delete(id); else marked.add(id);
      active = id;
      play("click");
      render();
      const again = root.querySelector(`.rl-chg[data-id="${id}"]`);
      if (again) again.focus({ preventScroll: true });
      return;
    }
    const act = e.target.closest("[data-act]");
    if (!act || act.disabled) return;
    if (act.dataset.act === "reset") {
      marked.clear(); active = null; play("click"); render();
    } else if (act.dataset.act === "pass") {
      submitted = true; active = null;
      const s = score();
      if (s > best) { best = s; saveBest(); }
      play("gavel");
      setTimeout(() => play(s >= 9 ? "correct" : "wrong"), 260);
      render();
      const res = root.querySelector(".rl-result");
      if (res) res.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (act.dataset.act === "again") {
      marked.clear(); active = null; submitted = false; play("click"); render();
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return {
    setT(fn) { if (typeof fn === "function") t = fn; },
    init() {
      root = document.getElementById("rlApp");
      if (!root) return;
      root.addEventListener("click", onClick);
      render();
    },
    refreshLanguage() { render(); }
  };
})();
