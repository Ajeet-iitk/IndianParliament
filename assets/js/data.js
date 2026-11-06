/* ============================================================
   SANSAD — Data layer
   Constitutional content, scenarios and reference material.
   Vote counts are illustrative, but every threshold is computed
   from the real constitutional requirement.
   ============================================================ */

const HOUSE_INFO = {
  LS:    { key: "LS",    name: "Lok Sabha",   total: 543, badge: "LOK SABHA",   presiding: "Speaker",           label: "Lok Sabha · 543" },
  RS:    { key: "RS",    name: "Rajya Sabha", total: 245, badge: "RAJYA SABHA", presiding: "Vice-President",   label: "Rajya Sabha · 245" },
  JOINT: { key: "JOINT", name: "Joint Sitting", total: 788, badge: "JOINT SITTING", presiding: "Speaker",       label: "Joint Sitting · 788" }
};

const MAJORITY_TYPES = [
  {
    id: "simple",
    name: "Simple Majority",
    short: "> 50% of members present and voting",
    formula: "Ayes > Noes (among members present and voting)",
    desc: "The everyday test. Abstentions and absentees are simply left out of the calculation. Ayes need only be more than Noes.",
    used: ["Ordinary Bills", "Money Bills", "No-Confidence Motion", "Confidence Motion"],
    ordinal: "01"
  },
  {
    id: "absolute",
    name: "Absolute Majority",
    short: "> 50% of total membership",
    formula: "Ayes > half of the House's full strength",
    desc: "More than half of the total membership, vacancies included. It is not a standalone test for the procedures here, but it is the first limb of the special majority under Articles 368 and 124(4).",
    used: ["A component of special majority", "Common UPSC distractor"],
    ordinal: "02"
  },
  {
    id: "effective",
    name: "Effective Majority",
    short: "> 50% of the effective strength",
    formula: "Ayes > half of (total membership − vacancies)",
    desc: "More than half of all the then members of the House — that is, total membership minus existing vacancies. Used for removing presiding officers.",
    used: ["Removal of Speaker", "Removal of Vice-President", "Removal of Deputy Chairman, RS"],
    ordinal: "03"
  },
  {
    id: "specialPresent",
    name: "Special Majority · Dual Test",
    short: "Majority of total membership + 2/3 present & voting",
    formula: "Two conditions must both be met",
    desc: "Ayes must be more than half of the total membership AND at least two-thirds of members present and voting. Used for constitutional amendments (Article 368) and the removal of judges (Article 124(4)).",
    used: ["Constitutional Amendment Bills", "Removal of Judges"],
    ordinal: "04"
  },
  {
    id: "specialTotal",
    name: "Special Majority · 2/3 of total",
    short: "2/3 of the total membership",
    formula: "Ayes ≥ two-thirds of full House strength",
    desc: "Ayes must reach two-thirds of the total membership of the House — not merely two-thirds of those present. The toughest floor vote in the Constitution.",
    used: ["Impeachment of the President"],
    ordinal: "05"
  },
  {
    id: "specialRatify",
    name: "Special Majority + States",
    short: "Special majority + half the States",
    formula: "Art. 368 majority in Parliament + ratification by ≥ 50% of States",
    desc: "For federal provisions, Parliament's special majority is only the first step. At least half of the State Legislatures must also ratify the amendment.",
    used: ["Seventh Schedule", "Representation of States", "Article 368 itself"],
    ordinal: "06"
  }
];

const VOTING_METHODS = [
  {
    id: "voice",
    name: "Voice Vote",
    tag: "The default",
    desc: "The presiding officer puts the question and members shout 'Aye' or 'No'. The Chair decides which side had the greater volume. No individual vote is recorded.",
    when: "Routine questions and most bill stages."
  },
  {
    id: "division",
    name: "Division",
    tag: "Recorded vote",
    desc: "Members physically move into the Ayes or Noes lobby and their names are recorded. Any member may demand a division, which is why it is the method used when numbers matter.",
    when: "When a vote is challenged or the result is uncertain."
  },
  {
    id: "electronic",
    name: "Electronic Division",
    tag: "Modern Houses",
    desc: "A recorded division using the electronic voting system. Votes are counted automatically and displayed on the board, giving an exact tally without the lobby walk.",
    when: "Recorded divisions in the Rajya Sabha and, increasingly, the Lok Sabha."
  },
  {
    id: "secret",
    name: "Secret Ballot",
    tag: "Protected choice",
    desc: "Members vote privately, so party whips cannot verify individual choices. Used for elections where independence is essential, such as the election of the President and Vice-President.",
    when: "Presidential and Vice-Presidential elections."
  },
  {
    id: "ballot",
    name: "Ballot",
    tag: "Elections",
    desc: "A formal paper ballot. In the President's election, the single transferable vote system is used, with each MP's vote carrying a different value under the formula in Article 55.",
    when: "Elections by proportional representation."
  },
  {
    id: "casting",
    name: "Casting Vote",
    tag: "Breaking a tie",
    desc: "The Speaker or Chairman does not vote in the first instance. If the votes are tied, the presiding officer may exercise a casting vote to break the deadlock.",
    when: "Only when Ayes and Noes are exactly equal."
  }
];

const ICONS = {
  scroll: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h4"/><path d="M9 12h7M9 16h7"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M9 12h6M12 9v6"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
  gavel: '<path d="m14 3 7 7-3 3-7-7z"/><path d="m11 6-8 8 3 3 8-8"/><path d="M3 21h9"/>',
  scales: '<path d="M12 3v18M5 7h14"/><path d="M5 7 2 14h6zM19 7l-3 7h6z"/><path d="M8 21h8"/>',
  speaker: '<path d="M12 3v18M8 7h8M6 3h12v4H6z"/><path d="M4 21h16"/>',
  judge: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  vote: '<path d="M4 13h16v8H4z"/><path d="m8 9 4-6 4 6"/><path d="M9 17h6"/>',
  houses: '<path d="M3 21V9l6-5 6 5v12"/><path d="M15 21V12l6-4v13"/><path d="M7 21v-5h4v5"/>',
  seats: '<path d="M4 12a8 8 0 0 1 16 0"/><path d="M4 12v4M20 12v4"/><circle cx="8" cy="9" r="1"/><circle cx="12" cy="6" r="1"/><circle cx="16" cy="9" r="1"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>',
  shield: '<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  spray: '<path d="M9 8h6v13H9z"/><path d="M11 8V5h4v3"/><path d="M18 4h2M18 8h2M18 12h2M18 16h2"/>'
};

/* ------------------------------------------------------------
   SCENARIOS
   ------------------------------------------------------------ */

const SCENARIOS = [
  /* ---------------- 1. ORDINARY BILL ---------------- */
  {
    id: "ordinary",
    title: "Ordinary Bill",
    short: "Ordinary Bill",
    article: "Articles 107 – 108",
    category: "Bills",
    difficulty: "Foundation",
    icon: "scroll",
    accent: "#e8b667",
    summary: "The workhorse of Parliament. A bill that is neither money nor constitutional — and the only one that can end in a joint sitting.",
    brief: {
      house: "Either House (here: Lok Sabha)",
      route: "LS → RS → Joint Sitting → President",
      majority: "Simple majority at every stage",
      article: "Art. 107, 108, 111"
    },
    flow: [
      {
        type: "decision",
        stage: "Introduction",
        article: "Art. 107",
        q: "A bill on uniform road-safety standards is ready. Where can an Ordinary Bill be introduced?",
        options: [
          "Only in the Lok Sabha",
          "Only in the Rajya Sabha",
          "In either House of Parliament",
          "Only with the President's prior recommendation"
        ],
        correct: 2,
        why: "Article 107 allows an Ordinary Bill to originate in either House. The President's prior recommendation is a special requirement for Money Bills and a few other categories — not for ordinary legislation."
      },
      {
        type: "vote",
        house: "LS",
        caption: "Third Reading · Lok Sabha",
        total: 543, vacancies: 3, present: 507,
        ayes: 321, noes: 174, abstain: 12,
        majority: "simple",
        note: "An Ordinary Bill needs only a simple majority in the House where it is being passed. Ayes must exceed Noes among members present and voting."
      },
      {
        type: "vote",
        house: "RS",
        caption: "Third Reading · Rajya Sabha",
        total: 245, vacancies: 2, present: 229,
        ayes: 106, noes: 118, abstain: 5,
        majority: "simple",
        note: "The Rajya Sabha has rejected the bill. This is not the end: Article 108 provides a way out of the deadlock."
      },
      {
        type: "decision",
        stage: "Deadlock",
        article: "Art. 108",
        q: "The Rajya Sabha has rejected the bill. What is the constitutional way forward?",
        options: [
          "The bill lapses automatically",
          "A joint sitting of both Houses under Article 108",
          "The President must call a fresh general election",
          "The Lok Sabha can override the Rajya Sabha by a two-thirds majority"
        ],
        correct: 1,
        why: "Article 108: if the other House rejects the bill, disagrees on amendments, or does not pass it within six months, the President may summon a joint sitting. It is presided over by the Speaker — not the Vice-President. A joint sitting is not available for Money Bills or Constitutional Amendment Bills."
      },
      {
        type: "vote",
        house: "JOINT",
        caption: "Joint Sitting · Article 108",
        total: 788, vacancies: 5, present: 776,
        ayes: 512, noes: 244, abstain: 20,
        majority: "simple",
        note: "In a joint sitting the Lok Sabha's 543 members outnumber the Rajya Sabha's 245. A simple majority of those present and voting carries the bill."
      },
      {
        type: "decision",
        stage: "Presidential Assent",
        article: "Art. 111",
        q: "The bill has passed both Houses. The President has doubts about one clause. What can the President do?",
        options: [
          "Withhold assent permanently, with no way for Parliament to respond",
          "Return it to Parliament for reconsideration; if Parliament passes it again, assent is mandatory",
          "Send it to the Supreme Court for an advisory opinion",
          "Reject it by a two-thirds vote of the Union Council of Ministers"
        ],
        correct: 1,
        why: "Article 111: for a bill other than a Money Bill, the President may assent, withhold assent, or return it for reconsideration. If Parliament passes the bill again, with or without amendment, the President shall not withhold assent. The Supreme Court's advisory jurisdiction under Article 143 is not part of this process."
      }
    ],
    notes: [
      "A joint sitting under Article 108 is summoned by the President and presided over by the Speaker. The Lok Sabha's 543 members outnumber the Rajya Sabha's 245.",
      "Money Bills and Constitutional Amendment Bills can never go to a joint sitting.",
      "If the President returns an ordinary bill and Parliament passes it again, assent becomes mandatory under Article 111."
    ],
    result: {
      title: "The bill becomes an Act",
      text: "The deadlock was broken in a joint sitting, where the Lok Sabha's numerical strength carried the day. The President's objections were answered by a second passage — and assent followed."
    }
  },

  /* ---------------- 2. MONEY BILL ---------------- */
  {
    id: "money",
    title: "Money Bill",
    short: "Money Bill",
    article: "Articles 109 – 110",
    category: "Bills",
    difficulty: "Foundation",
    icon: "coin",
    accent: "#f0b45c",
    summary: "Taxes, borrowing and the Consolidated Fund. Only the Lok Sabha can originate it, and the Rajya Sabha gets just 14 days to speak.",
    brief: {
      house: "Lok Sabha only",
      route: "LS (President's recommendation) → RS (14 days) → President",
      majority: "Simple majority in the Lok Sabha",
      article: "Art. 110, 109, 111"
    },
    flow: [
      {
        type: "decision",
        stage: "Introduction",
        article: "Art. 110",
        q: "A bill to levy a new digital-services tax is being introduced. Which statement is correct?",
        options: [
          "It may be introduced in either House",
          "It may be introduced only in the Lok Sabha, on the President's recommendation",
          "It may be introduced only in the Rajya Sabha",
          "It requires a special majority in both Houses"
        ],
        correct: 1,
        why: "Article 110: a Money Bill can be introduced only in the Lok Sabha, and only on the recommendation of the President. The Rajya Sabha has no power to originate it."
      },
      {
        type: "decision",
        stage: "Certification",
        article: "Art. 110(3)",
        q: "Who decides, finally, whether a bill is a Money Bill?",
        options: [
          "The President",
          "The Speaker of the Lok Sabha",
          "The Vice-President, as Chairman of the Rajya Sabha",
          "The Supreme Court"
        ],
        correct: 1,
        why: "Article 110(3): if any question arises whether a bill is a Money Bill, the decision of the Speaker of the Lok Sabha is final. This certificate is what triggers the Rajya Sabha's limited role."
      },
      {
        type: "vote",
        house: "LS",
        caption: "Passage · Lok Sabha",
        total: 543, vacancies: 4, present: 465,
        ayes: 305, noes: 148, abstain: 12,
        majority: "simple",
        note: "A Money Bill needs a simple majority in the Lok Sabha. The real contest is usually political, not numerical."
      },
      {
        type: "decision",
        stage: "Rajya Sabha",
        article: "Art. 109",
        q: "The Rajya Sabha returns the bill on Day 13 with three recommendations. What can the Lok Sabha do?",
        options: [
          "It must accept all the recommendations",
          "It may accept or reject any recommendation, and the bill is deemed passed either way",
          "The bill lapses if the recommendations are rejected",
          "A joint sitting must be convened"
        ],
        correct: 1,
        why: "Article 109: the Rajya Sabha must return a Money Bill within 14 days. It may recommend amendments but cannot amend or reject the bill. The Lok Sabha may accept or reject all or any recommendations, and the bill is deemed passed by both Houses in the form the Lok Sabha approves. There is no joint sitting for a Money Bill."
      },
      {
        type: "decision",
        stage: "Presidential Assent",
        article: "Art. 111",
        q: "The bill is presented for assent. What are the President's options?",
        options: [
          "Assent, withhold assent, or return it for reconsideration",
          "Assent or withhold assent, but cannot return it",
          "The President must assent in every case",
          "Refer it to the Supreme Court"
        ],
        correct: 1,
        why: "Article 111's proviso allows the President to return only a bill that is not a Money Bill. Because a Money Bill is introduced with the President's own recommendation, the choice is assent or withhold — not return."
      }
    ],
    notes: [
      "The Speaker's certificate that a bill is a Money Bill is final under Article 110(3).",
      "The Rajya Sabha cannot amend or reject a Money Bill. It has 14 days to return it with recommendations; silence means deemed passage.",
      "A Money Bill can never go to a joint sitting."
    ],
    result: {
      title: "The Money Bill is law",
      text: "The Lok Sabha's will prevailed. The Rajya Sabha's recommendations were considered and rejected, but the bill was deemed passed by both Houses in the form the Lok Sabha approved."
    }
  },

  /* ---------------- 3. FINANCE BILL ---------------- */
  {
    id: "finance",
    title: "Finance Bill",
    short: "Finance Bill",
    article: "Articles 110, 112 – 114",
    category: "Bills",
    difficulty: "Intermediate",
    icon: "chart",
    accent: "#9fc47a",
    summary: "Every Finance Bill is not a Money Bill. The difference — and the Speaker's certificate — decides which House gets a real say.",
    brief: {
      house: "Depends on certification",
      route: "LS → RS (full powers if ordinary) → President",
      majority: "Simple majority, but classification decides the route",
      article: "Art. 110, 112–114"
    },
    flow: [
      {
        type: "decision",
        stage: "Classification",
        article: "Art. 110",
        q: "A Finance Bill changes income-tax slabs but also amends the governance provisions of the RBI Act. How is it classified?",
        options: [
          "A Money Bill, because every Finance Bill is a Money Bill",
          "An Ordinary Bill, because it contains matters outside Article 110",
          "A Constitutional Amendment Bill",
          "It cannot be introduced at all"
        ],
        correct: 1,
        why: "A bill is a Money Bill only if it deals exclusively with the matters listed in Article 110(1). A Finance Bill that also amends unrelated law is an ordinary bill, with full Rajya Sabha powers and the possibility of a joint sitting."
      },
      {
        type: "decision",
        stage: "The Other Kind",
        article: "Art. 114",
        q: "Which of these is always a Money Bill?",
        options: [
          "The Finance Bill",
          "The Appropriation Bill",
          "An Ordinary Bill",
          "A Constitutional Amendment Bill"
        ],
        correct: 1,
        why: "The Appropriation Bill, which authorises expenditure from the Consolidated Fund of India, is always a Money Bill. It cannot be amended to increase the amount or alter the destination of any expenditure (Article 114). A Finance Bill may or may not be a Money Bill."
      },
      {
        type: "vote",
        house: "LS",
        caption: "Passage · Lok Sabha",
        total: 543, vacancies: 4, present: 464,
        ayes: 298, noes: 156, abstain: 10,
        majority: "simple",
        note: "As an ordinary bill, it needs a simple majority in the Lok Sabha — but unlike a Money Bill, the Rajya Sabha now has full amending and rejecting powers."
      },
      {
        type: "vote",
        house: "RS",
        caption: "Passage · Rajya Sabha",
        total: 245, vacancies: 2, present: 223,
        ayes: 121, noes: 96, abstain: 6,
        majority: "simple",
        note: "The Rajya Sabha can amend or reject an ordinary bill. Here it agrees, so the bill returns to the Lok Sabha without a deadlock."
      },
      {
        type: "decision",
        stage: "Presidential Assent",
        article: "Art. 111",
        q: "Because this is an ordinary bill, what can the President do?",
        options: [
          "Only assent",
          "Assent, withhold, or return it for reconsideration",
          "Return it only if the Rajya Sabha agrees",
          "Reject it if it exceeds the budget estimate"
        ],
        correct: 1,
        why: "The ordinary-bill procedure under Article 111 applies: assent, withholding, or return for reconsideration. If Parliament passes it again, assent cannot be withheld. The same bill, had it been certified as a Money Bill, could not have been returned."
      }
    ],
    notes: [
      "A Finance Bill is a Money Bill only if it deals exclusively with Article 110(1) matters and is certified by the Speaker.",
      "The Appropriation Bill is always a Money Bill and cannot be amended to increase the amount or change the destination of expenditure (Article 114).",
      "A bill that mixes tax measures with amendments to other laws is an ordinary bill — the Rajya Sabha keeps full powers."
    ],
    result: {
      title: "The Finance Bill is law",
      text: "Classification decided the route. Because the bill strayed beyond Article 110, the Rajya Sabha had full powers — and its concurrence made the passage uncontroversial."
    }
  },

  /* ---------------- 4. CONSTITUTIONAL AMENDMENT ---------------- */
  {
    id: "amendment",
    title: "Constitutional Amendment",
    short: "Amendment Bill",
    article: "Article 368",
    category: "Bills",
    difficulty: "Advanced",
    icon: "book",
    accent: "#c9a2e0",
    summary: "Article 368 is a fortress with two locks: a special majority in each House, and — for federal provisions — half the States.",
    brief: {
      house: "Either House",
      route: "LS + RS separately → half the States (if federal) → President",
      majority: "Special majority: majority of total membership + 2/3 present & voting",
      article: "Art. 368"
    },
    flow: [
      {
        type: "decision",
        stage: "Introduction",
        article: "Art. 368",
        q: "A bill to amend the Constitution is ready. Where can it be introduced?",
        options: [
          "Only in the Lok Sabha",
          "Only in the Rajya Sabha",
          "In either House of Parliament",
          "Only after a joint sitting"
        ],
        correct: 2,
        why: "A Constitutional Amendment Bill may be introduced in either House. It can even be introduced by a private member, and it does not require the President's prior recommendation."
      },
      {
        type: "decision",
        stage: "The Majority",
        article: "Art. 368(2)",
        q: "What majority is required to pass the amendment in each House?",
        options: [
          "A simple majority of members present and voting",
          "An absolute majority only",
          "A majority of the total membership AND two-thirds of members present and voting",
          "Two-thirds of the total membership only"
        ],
        correct: 2,
        why: "Article 368 requires a special majority in each House: a majority of the total membership of that House AND a majority of not less than two-thirds of the members present and voting. Both conditions must be satisfied."
      },
      {
        type: "vote",
        house: "LS",
        caption: "Passage · Lok Sabha",
        total: 543, vacancies: 2, present: 515,
        ayes: 380, noes: 120, abstain: 15,
        majority: "specialPresent",
        note: "The floor here is the higher of two numbers: a majority of the full House (272) and two-thirds of those present and voting (334)."
      },
      {
        type: "vote",
        house: "RS",
        caption: "Passage · Rajya Sabha",
        total: 245, vacancies: 1, present: 228,
        ayes: 168, noes: 55, abstain: 5,
        majority: "specialPresent",
        note: "The Rajya Sabha must pass the bill separately by the same special majority. There is no joint sitting for a constitutional amendment."
      },
      {
        type: "decision",
        stage: "Federal Provisions",
        article: "Art. 368(2) proviso",
        q: "The amendment alters the Seventh Schedule, changing Union–State legislative powers. What additional requirement applies?",
        options: [
          "Ratification by at least half of the State Legislatures",
          "Approval in a joint sitting",
          "A national referendum",
          "Approval by the Supreme Court"
        ],
        correct: 0,
        why: "The proviso to Article 368(2) requires ratification by the Legislatures of not less than half of the States for amendments affecting federal features — the Seventh Schedule, representation of States, the election of the President, or Article 368 itself."
      },
      {
        type: "decision",
        stage: "Presidential Assent",
        article: "Art. 368, 24th Amendment",
        q: "After Parliament and the States have approved, what is the President's role?",
        options: [
          "The President may withhold assent",
          "The President may return it once for reconsideration",
          "The President must give assent; there is no power to withhold or return",
          "The President may refer it to the Supreme Court"
        ],
        correct: 2,
        why: "The 24th Constitutional Amendment Act, 1971 made it obligatory for the President to give assent to a Constitutional Amendment Bill. There is no power to withhold assent or return the bill."
      }
    ],
    notes: [
      "The Article 368 special majority has two limbs: more than half of the total membership, and at least two-thirds of members present and voting.",
      "Each House must pass the bill separately. There is no joint sitting for a Constitutional Amendment Bill.",
      "Ratification by at least half of the State Legislatures is needed only for federal provisions — the Seventh Schedule, representation of States, or Article 368 itself."
    ],
    result: {
      title: "The Constitution is amended",
      text: "Both Houses cleared the twin threshold, the States ratified the federal change, and the President's assent was constitutionally obligatory. Article 368 had been satisfied in full."
    }
  },

  /* ---------------- 5. NO-CONFIDENCE ---------------- */
  {
    id: "noconfidence",
    title: "No-Confidence Motion",
    short: "No-Confidence",
    article: "Article 75(3)",
    category: "Motions",
    difficulty: "Foundation",
    icon: "gavel",
    accent: "#e28b8b",
    summary: "The ultimate test of collective responsibility. Only the Lok Sabha can pass it — and a simple majority ends a government.",
    brief: {
      house: "Lok Sabha only",
      route: "LS → President",
      majority: "Simple majority",
      article: "Art. 75(3)"
    },
    flow: [
      {
        type: "decision",
        stage: "The House",
        article: "Art. 75(3)",
        q: "The Opposition wants to move a no-confidence motion against the Council of Ministers. Where can it be moved?",
        options: [
          "Only in the Lok Sabha",
          "Only in the Rajya Sabha",
          "In either House",
          "In a joint sitting"
        ],
        correct: 0,
        why: "Article 75(3): the Council of Ministers is collectively responsible to the House of the People — the Lok Sabha. The Rajya Sabha cannot pass a no-confidence motion or remove the government."
      },
      {
        type: "decision",
        stage: "The Majority",
        article: "Art. 75(3)",
        q: "What majority is needed to carry a no-confidence motion?",
        options: [
          "A simple majority of members present and voting",
          "An effective majority",
          "Two-thirds of members present and voting",
          "Two-thirds of the total membership"
        ],
        correct: 0,
        why: "A no-confidence motion is decided by a simple majority: more Ayes than Noes among members present and voting. Abstentions do not help the government — they effectively reduce the threshold it must cross."
      },
      {
        type: "vote",
        house: "LS",
        caption: "Division · No-Confidence Motion",
        total: 543, vacancies: 0, present: 520,
        ayes: 280, noes: 230, abstain: 10,
        majority: "simple",
        note: "The motion is carried. A government that loses a no-confidence motion is expected to resign; the President then explores whether an alternative government can command the House."
      },
      {
        type: "decision",
        stage: "The Consequence",
        article: "Art. 75(3)",
        q: "The motion is carried. What follows constitutionally?",
        options: [
          "The Prime Minister and the Council of Ministers must resign",
          "The President automatically dissolves the Lok Sabha",
          "The Prime Minister continues until the next general election",
          "A fresh election must be held within seven days"
        ],
        correct: 0,
        why: "Collective responsibility means the Council of Ministers must resign after losing a no-confidence vote. The President may then invite another leader who can command a majority, or dissolve the House and call elections. Dissolution is not automatic."
      }
    ],
    notes: [
      "A no-confidence motion can be moved only in the Lok Sabha; the Rajya Sabha cannot remove the Council of Ministers.",
      "It requires a simple majority — more Ayes than Noes among members present and voting.",
      "If carried, the Prime Minister and the entire Council of Ministers must resign. Dissolution of the House is not automatic."
    ],
    result: {
      title: "The Government falls",
      text: "The motion carried on a simple majority. Collective responsibility had been tested and lost; the Council of Ministers tendered its resignation to the President."
    }
  },

  /* ---------------- 6. PRESIDENT IMPEACHMENT ---------------- */
  {
    id: "president",
    title: "Impeachment of the President",
    short: "President's Impeachment",
    article: "Article 61",
    category: "Removals",
    difficulty: "Advanced",
    icon: "shield",
    accent: "#e0a2a2",
    summary: "The gravest procedure in the Constitution. A charge of violating the Constitution must clear two-thirds of total membership — twice.",
    brief: {
      house: "Either House (here: Lok Sabha initiates)",
      route: "LS charge → RS investigation → removal",
      majority: "2/3 of total membership in each House",
      article: "Art. 61"
    },
    flow: [
      {
        type: "decision",
        stage: "The Charge",
        article: "Art. 61(2)",
        q: "A charge of violation of the Constitution is proposed against the President. What is the notice requirement?",
        options: [
          "14 days' notice signed by at least one-fourth of the total members of the House",
          "10 days' notice signed by one-tenth of the members",
          "No notice is required",
          "30 days' notice signed by half the members"
        ],
        correct: 0,
        why: "Article 61(2)(a): the resolution must be moved after at least 14 days' written notice signed by not less than one-fourth of the total number of members of the initiating House."
      },
      {
        type: "vote",
        house: "LS",
        caption: "Charge Preferred · Lok Sabha",
        total: 543, vacancies: 0, present: 520,
        ayes: 380, noes: 130, abstain: 10,
        majority: "specialTotal",
        note: "The charge must be passed by two-thirds of the TOTAL membership of the House — 362 of 543 — not merely two-thirds of those present."
      },
      {
        type: "decision",
        stage: "Investigation",
        article: "Art. 61(3)",
        q: "The Lok Sabha has preferred the charge. What happens next?",
        options: [
          "The President is removed immediately",
          "The Rajya Sabha investigates the charge; the President may appear and be represented",
          "The Supreme Court conducts the trial",
          "A national referendum is held"
        ],
        correct: 1,
        why: "Article 61(3): once a charge is preferred by one House, the other House investigates it (or causes it to be investigated). The President has the right to appear and to be represented at the investigation. It is a quasi-judicial process."
      },
      {
        type: "vote",
        house: "RS",
        caption: "Charge Sustained · Rajya Sabha",
        total: 245, vacancies: 0, present: 235,
        ayes: 170, noes: 60, abstain: 5,
        majority: "specialTotal",
        note: "The investigating House must also pass the resolution by two-thirds of its total membership — 164 of 245. Only then is the President removed."
      },
      {
        type: "decision",
        stage: "Who Votes",
        article: "Art. 61",
        q: "Who can participate in a presidential impeachment?",
        options: [
          "Only elected MPs of both Houses",
          "Elected and nominated MPs of both Houses, but not State MLAs",
          "MPs and State MLAs together",
          "Only the Rajya Sabha"
        ],
        correct: 1,
        why: "Nominated members of either House can participate in the impeachment of the President, even though they cannot vote in the President's election. State MLAs, who do vote in the election, have no role in the impeachment."
      }
    ],
    notes: [
      "The notice must be signed by at least one-fourth of the total members of the initiating House and given at least 14 days in advance.",
      "Nominated MPs of both Houses can participate in the impeachment; State MLAs cannot, even though they vote in the President's election.",
      "The President has the right to appear and be represented during the investigation by the other House."
    ],
    result: {
      title: "The President stands removed",
      text: "Both Houses independently crossed the two-thirds threshold of their total membership. The charge was sustained, and the President stood removed from office on the date the second resolution was passed."
    }
  },

  /* ---------------- 7. VICE-PRESIDENT REMOVAL ---------------- */
  {
    id: "vicepresident",
    title: "Removal of the Vice-President",
    short: "Vice-President's Removal",
    article: "Article 67(b)",
    category: "Removals",
    difficulty: "Intermediate",
    icon: "speaker",
    accent: "#a2c4e0",
    summary: "Not an impeachment. The Rajya Sabha moves it, the Lok Sabha agrees, and the President plays no part.",
    brief: {
      house: "Rajya Sabha initiates",
      route: "RS resolution → LS agreement → removal",
      majority: "Effective majority in RS + simple majority in LS",
      article: "Art. 67(b)"
    },
    flow: [
      {
        type: "decision",
        stage: "The House",
        article: "Art. 67(b)",
        q: "A resolution to remove the Vice-President is being moved. In which House must it originate?",
        options: [
          "Only in the Rajya Sabha",
          "Only in the Lok Sabha",
          "In either House",
          "In a joint sitting"
        ],
        correct: 0,
        why: "Article 67(b): the resolution for removing the Vice-President can be moved only in the Rajya Sabha. It must then be agreed to by the Lok Sabha. This reflects the Vice-President's role as ex-officio Chairman of the Rajya Sabha."
      },
      {
        type: "decision",
        stage: "The Majority",
        article: "Art. 67(b)",
        q: "What majority does the Rajya Sabha need?",
        options: [
          "A simple majority of members present and voting",
          "A majority of all the then members of the Rajya Sabha",
          "Two-thirds of the total membership",
          "Two-thirds of members present and voting"
        ],
        correct: 1,
        why: "Article 67(b) requires a resolution passed by a majority of all the then members of the Rajya Sabha — an effective majority. With 245 seats and four vacancies, the effective strength is 241 and the floor is 121."
      },
      {
        type: "vote",
        house: "RS",
        caption: "Resolution · Rajya Sabha",
        total: 245, vacancies: 4, present: 232,
        ayes: 130, noes: 100, abstain: 2,
        majority: "effective",
        note: "The Rajya Sabha has carried the resolution. It now travels to the Lok Sabha, which must agree by a simple majority."
      },
      {
        type: "vote",
        house: "LS",
        caption: "Agreement · Lok Sabha",
        total: 543, vacancies: 0, present: 500,
        ayes: 300, noes: 190, abstain: 10,
        majority: "simple",
        note: "The Lok Sabha's agreement is by simple majority. No presidential assent is required; the removal takes effect when the Lok Sabha agrees."
      },
      {
        type: "decision",
        stage: "Who Votes",
        article: "Art. 67(b)",
        q: "Which members can participate in the removal of the Vice-President?",
        options: [
          "Only elected members of Parliament",
          "All members of both Houses, including nominated members",
          "Only members of the Rajya Sabha",
          "MPs and State MLAs together"
        ],
        correct: 1,
        why: "Nominated members of Parliament can participate in the removal of the Vice-President. This is one of the sharp contrasts with the President's election, where nominated members have no vote."
      }
    ],
    notes: [
      "The Rajya Sabha needs a majority of all its then members — an effective majority, not a simple majority of those present.",
      "The Lok Sabha's agreement is by simple majority. The President has no role in the removal.",
      "Nominated members of Parliament can participate in the removal of the Vice-President."
    ],
    result: {
      title: "The Vice-President is removed",
      text: "The Rajya Sabha carried the resolution by an effective majority and the Lok Sabha agreed by simple majority. No presidential assent was needed; the office fell vacant on the Lok Sabha's agreement."
    }
  },

  /* ---------------- 8. SPEAKER REMOVAL ---------------- */
  {
    id: "speaker",
    title: "Removal of the Speaker",
    short: "Speaker's Removal",
    article: "Articles 94, 96",
    category: "Removals",
    difficulty: "Intermediate",
    icon: "judge",
    accent: "#d6c48a",
    summary: "The Speaker's own House decides. An effective majority, a 14-day notice, and the Deputy Speaker in the Chair.",
    brief: {
      house: "Lok Sabha only",
      route: "LS resolution → removal",
      majority: "Effective majority of the Lok Sabha",
      article: "Art. 94, 96"
    },
    flow: [
      {
        type: "decision",
        stage: "The House",
        article: "Art. 94",
        q: "A resolution to remove the Speaker is being moved. Which House decides?",
        options: [
          "Only the Lok Sabha",
          "Only the Rajya Sabha",
          "Either House",
          "A joint sitting"
        ],
        correct: 0,
        why: "Article 94: the Speaker and Deputy Speaker may be removed by a resolution passed by the Lok Sabha. The Rajya Sabha has no role in removing the Speaker."
      },
      {
        type: "decision",
        stage: "The Majority",
        article: "Art. 94",
        q: "What majority is required?",
        options: [
          "A simple majority of members present and voting",
          "A majority of all the then members of the Lok Sabha",
          "Two-thirds of the total membership",
          "Two-thirds of members present and voting"
        ],
        correct: 1,
        why: "Article 94 requires a majority of all the then members of the Lok Sabha — an effective majority. With 543 seats and five vacancies, the effective strength is 538 and the floor is 270."
      },
      {
        type: "decision",
        stage: "The Chair",
        article: "Art. 96",
        q: "Who presides over the House while the Speaker's own removal is being considered?",
        options: [
          "The Speaker continues to preside",
          "The Deputy Speaker",
          "The Vice-President",
          "The senior-most member of the House"
        ],
        correct: 1,
        why: "Article 96: the Speaker cannot preside while a resolution for their removal is under consideration. The Deputy Speaker presides. The Speaker may still speak and take part in the proceedings."
      },
      {
        type: "decision",
        stage: "The Speaker's Rights",
        article: "Art. 96(2)",
        q: "Can the Speaker speak and vote during the debate on their own removal?",
        options: [
          "No, the Speaker is completely excluded from the proceedings",
          "Yes, the Speaker may speak and vote in the first instance, but cannot vote if the votes are tied",
          "Yes, but the Speaker cannot vote at all — only a casting vote",
          "Only through a lawyer"
        ],
        correct: 1,
        why: "Article 96(2): the Speaker may speak and take part in the proceedings, and is entitled to vote in the first instance on the removal resolution or on any other matter during those proceedings. But the Speaker cannot exercise a casting vote if the votes are equal. This reverses the normal rule under Article 100, where the Speaker votes only to break a tie."},
      {
        type: "vote",
        house: "LS",
        caption: "Resolution · Lok Sabha",
        total: 543, vacancies: 5, present: 510,
        ayes: 290, noes: 210, abstain: 10,
        majority: "effective",
        note: "The resolution is carried. The effective majority is calculated on 538 members (543 minus 5 vacancies), so the floor was 270."
      
      }
    ],
    notes: [
      "The resolution needs at least 14 days' notice and a majority of all the then members of the Lok Sabha (effective majority).",
      "The Speaker cannot preside over the debate on their own removal; the Deputy Speaker does.",
      "The Speaker may speak and take part, and may vote in the first instance on the removal resolution — but cannot exercise a casting vote."
    ],
    result: {
      title: "The Speaker is removed",
      text: "The Lok Sabha carried the resolution by an effective majority. The Speaker spoke in their own defence and voted in the first instance, but had no casting vote; the Deputy Speaker declared the resolution carried."
    }
  },

  /* ---------------- 9. JUDGE REMOVAL ---------------- */
  {
    id: "judge",
    title: "Removal of a Judge",
    short: "Judge's Removal",
    article: "Articles 124(4), 218",
    category: "Removals",
    difficulty: "Advanced",
    icon: "scales",
    accent: "#b7c9e8",
    summary: "Judges are not impeached. Parliament addresses the President, and the address must carry a special majority in both Houses in the same session.",
    brief: {
      house: "Either House",
      route: "LS + RS (same session) → President's order",
      majority: "Special majority in each House",
      article: "Art. 124(4), 124(5), 218"
    },
    flow: [
      {
        type: "decision",
        stage: "The Grounds",
        article: "Art. 124(4)",
        q: "On what grounds can a Supreme Court judge be removed?",
        options: [
          "Proved misbehaviour or incapacity",
          "Violation of the Constitution",
          "Loss of confidence of the Government",
          "Attaining the age of 65"
        ],
        correct: 0,
        why: "Article 124(4): a judge may be removed only on the grounds of proved misbehaviour or incapacity. 'Violation of the Constitution' is the ground for impeaching the President, not for removing a judge."
      },
      {
        type: "decision",
        stage: "The Procedure",
        article: "Art. 124(4)",
        q: "Which procedure is constitutionally required?",
        options: [
          "An address by both Houses in the same session, passed by a special majority, followed by the President's order",
          "A resolution of the Union Cabinet",
          "A Supreme Court verdict alone",
          "A joint sitting of Parliament"
        ],
        correct: 0,
        why: "Article 124(4): removal requires an address by both Houses of Parliament in the same session, supported by a special majority, for proved misbehaviour or incapacity. The President then issues the removal order. Article 124(5) allows Parliament to regulate the procedure by law (the Judges Inquiry Act, 1968)."
      },
      {
        type: "vote",
        house: "LS",
        caption: "Address · Lok Sabha",
        total: 543, vacancies: 0, present: 520,
        ayes: 400, noes: 100, abstain: 20,
        majority: "specialPresent",
        note: "The special majority here means a majority of the total membership (272) AND two-thirds of members present and voting (334). The higher figure is the effective floor."
      },
      {
        type: "vote",
        house: "RS",
        caption: "Address · Rajya Sabha",
        total: 245, vacancies: 0, present: 230,
        ayes: 160, noes: 60, abstain: 10,
        majority: "specialPresent",
        note: "The Rajya Sabha must pass the address in the same session. A different session means the process must begin again."
      },
      {
        type: "decision",
        stage: "The President",
        article: "Art. 124(4)",
        q: "What is the President's role after both Houses pass the address?",
        options: [
          "The President may refuse to remove the judge",
          "The President may return the address for reconsideration",
          "The President issues the removal order; there is no independent discretion",
          "The President refers the matter to the Supreme Court"
        ],
        correct: 2,
        why: "Once the address is passed by both Houses in the same session, the President's order is formal. There is no power to refuse or return the address. The Supreme Court has held that the process is subject to judicial review, but the President does not re-decide the merits."
      },
      {
        type: "decision",
        stage: "Ratification",
        article: "Art. 124(4)",
        q: "Is ratification by the States required?",
        options: [
          "Yes, by at least half the States",
          "Yes, by all the States",
          "No, State ratification is not required",
          "Only for High Court judges"
        ],
        correct: 2,
        why: "Removal of judges under Article 124(4) requires a special majority in both Houses, but no ratification by State Legislatures. State ratification is a feature of the Article 368 procedure for federal amendments, not judicial removal."
      }
    ],
    notes: [
      "Grounds are limited to proved misbehaviour or incapacity — not 'violation of the Constitution'.",
      "The address must be passed by each House in the same session by a special majority: majority of total membership plus two-thirds present and voting.",
      "No ratification by States is required. The President's role is formal; the removal order follows the address."
    ],
    result: {
      title: "The judge is removed",
      text: "Both Houses passed the address in the same session by the special majority. The President issued the formal order, and the judge ceased to hold office."
    }
  }
];

/* ------------------------------------------------------------
   LEARN CONTENT
   ------------------------------------------------------------ */

const LEARN_JOURNEY = [
  {
    tag: "Stage 1 · Lok Sabha",
    title: "Introduction & First Reading",
    text: "The bill is introduced with the leave of the House. For a Money Bill, the President's recommendation is mandatory and only the Lok Sabha can originate it. For an ordinary bill, either House may begin."
  },
  {
    tag: "Stage 2 · Committee",
    title: "Second Reading",
    text: "The House discusses the principles of the bill. It may be referred to a standing or select committee, taken up clause by clause, or circulated for public opinion. This is where most amendments are actually shaped."
  },
  {
    tag: "Stage 3 · First House",
    title: "Third Reading & Passage",
    text: "The bill is voted upon in the originating House. An ordinary or money bill needs a simple majority; a constitutional amendment needs the Article 368 special majority."
  },
  {
    tag: "Stage 4 · Second House",
    title: "The Other House",
    text: "An ordinary bill can be passed, rejected, amended, or held for up to six months. A Money Bill must be returned within 14 days, with recommendations only. A constitutional amendment must be passed separately by the same special majority."
  },
  {
    tag: "Stage 5 · Deadlock",
    title: "Joint Sitting (ordinary bills only)",
    text: "If the Houses deadlock on an ordinary bill, the President may summon a joint sitting under Article 108. The Speaker presides and the Lok Sabha's numbers usually decide the outcome. Money Bills and constitutional amendments are excluded."
  },
  {
    tag: "Stage 6 · President",
    title: "Assent",
    text: "Under Article 111 the President may assent, withhold, or return a non-Money Bill. If Parliament passes it again, assent is mandatory. A Money Bill cannot be returned. A Constitutional Amendment Bill must be assented to."
  }
];

const LEARN_GLANCE = [
  {
    bill: "Ordinary Bill",
    intro: "Either House",
    rs: "Full powers: pass, amend, reject, or delay up to 6 months",
    joint: "Yes (Art. 108)",
    majority: "Simple majority",
    president: "Assent, withhold, or return once; assent mandatory if repassed"
  },
  {
    bill: "Money Bill",
    intro: "Lok Sabha only, with President's recommendation",
    rs: "14 days; recommendations only; cannot amend or reject",
    joint: "No",
    majority: "Simple majority in LS",
    president: "Assent or withhold; cannot return"
  },
  {
    bill: "Finance Bill",
    intro: "Depends on certification; Money Bill only if exclusively Art. 110 matters",
    rs: "Full powers if ordinary; 14 days if certified as Money Bill",
    joint: "Only if ordinary",
    majority: "Simple majority",
    president: "As per the applicable route"
  },
  {
    bill: "Constitutional Amendment",
    intro: "Either House",
    rs: "Must pass separately by special majority; no joint sitting",
    joint: "No",
    majority: "Majority of total membership + 2/3 present & voting; half the States for federal provisions",
    president: "Assent mandatory (24th Amendment)"
  }
];

const LEARN_ARTICLES = [
  { no: "Art. 61", title: "Impeachment of the President", text: "Charge by either House; 14 days' notice by 1/4 of members; 2/3 of total membership in each House." },
  { no: "Art. 67(b)", title: "Removal of the Vice-President", text: "Rajya Sabha resolution by effective majority; agreed to by the Lok Sabha by simple majority." },
  { no: "Art. 75(3)", title: "Collective Responsibility", text: "The Council of Ministers is collectively responsible to the Lok Sabha — the basis of the no-confidence motion." },
  { no: "Art. 94", title: "Removal of Speaker / Deputy Speaker", text: "Resolution by a majority of all the then members of the Lok Sabha (effective majority)." },
  { no: "Art. 96", title: "Speaker's Conduct During Removal", text: "The Speaker cannot preside, but may speak, take part and vote in the first instance; no casting vote if the House is tied." },
  { no: "Art. 107", title: "Ordinary Bills", text: "May originate in either House; the ordinary legislative procedure applies." },
  { no: "Art. 108", title: "Joint Sitting", text: "Resolves deadlocks on ordinary bills; presided over by the Speaker; not for Money Bills or constitutional amendments." },
  { no: "Art. 109", title: "Money Bills — Procedure", text: "RS must return within 14 days; may recommend amendments only; LS may accept or reject them." },
  { no: "Art. 110", title: "Definition of Money Bill", text: "Exclusive list of matters; the Speaker's certificate is final under Article 110(3)." },
  { no: "Art. 111", title: "Assent to Bills", text: "Assent, withhold, or return non-Money Bills; assent mandatory if Parliament passes again." },
  { no: "Art. 112", title: "Annual Financial Statement", text: "The budget; expenditure is presented to Parliament and authorised through the Appropriation Bill." },
  { no: "Art. 114", title: "Appropriation Bills", text: "Always Money Bills; cannot be amended to increase the amount or alter the destination of expenditure." },
  { no: "Art. 124(4)", title: "Removal of Supreme Court Judges", text: "Address by both Houses in the same session by special majority, on proved misbehaviour or incapacity." },
  { no: "Art. 218", title: "High Court Judges", text: "The Article 124(4) removal procedure applies to High Court judges as well." },
  { no: "Art. 368", title: "Amendment of the Constitution", text: "Special majority in each House; ratification by half the States for federal provisions." }
];
