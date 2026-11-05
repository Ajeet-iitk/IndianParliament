/* ============================================================
   SANSAD — Hinglish content overlay
   Roman-Hindi delivery with English constitutional terms.
   English remains the canonical source in data.js.
   ============================================================ */

(function () {
  "use strict";

  const scenarios = {
    /* ---------------- 1. ORDINARY BILL ---------------- */
    ordinary: {
      title: "Ordinary Bill",
      short: "Ordinary Bill",
      summary: "Parliament ka workhorse. Aisa bill jo na money bill hai na constitutional — aur sirf yahi joint sitting tak pahunch sakta hai.",
      brief: {
        house: "Koi bhi House (yahan: Lok Sabha)",
        route: "LS → RS → Joint Sitting → President",
        majority: "Har stage par simple majority"
      },
      flow: [
        {
          stage: "Introduction",
          q: "Road-safety ke uniform standards par ek bill taiyaar hai. Ordinary Bill kahan introduce ho sakta hai?",
          options: [
            "Sirf Lok Sabha mein",
            "Sirf Rajya Sabha mein",
            "Parliament ke kisi bhi House mein",
            "Sirf President ki prior recommendation se"
          ],
          why: "Article 107 Ordinary Bill ko kisi bhi House mein originate karne deta hai. President ki prior recommendation Money Bills aur kuch doosri categories ke liye special requirement hai — ordinary legislation ke liye nahi."
        },
        {
          caption: "Third Reading · Lok Sabha",
          note: "Ordinary Bill ko us House mein sirf simple majority chahiye jahan woh pass ho raha hai. Present aur voting members mein Ayes Noes se zyada hone chahiye."
        },
        {
          caption: "Third Reading · Rajya Sabha",
          note: "Rajya Sabha ne bill reject kar diya. Yeh end nahi hai: Article 108 deadlock se nikalne ka raasta deta hai."
        },
        {
          stage: "Deadlock",
          q: "Rajya Sabha ne bill reject kar diya. Constitutional raasta kya hai?",
          options: [
            "Bill automatically lapse ho jaata hai",
            "Article 108 ke under dono Houses ki joint sitting",
            "President ko fresh general election karana hoga",
            "Lok Sabha two-thirds majority se Rajya Sabha ko override kar sakti hai"
          ],
          why: "Article 108: agar doosra House bill reject karta hai, amendments par disagree karta hai, ya chhe mahine mein pass nahi karta, toh President joint sitting bula sakte hain. Iski adhyakshta Speaker karte hain — Vice-President nahi. Money Bills ya Constitutional Amendment Bills ke liye joint sitting nahi hoti."
        },
        {
          caption: "Joint Sitting · Article 108",
          note: "Joint sitting mein Lok Sabha ke 543 members Rajya Sabha ke 245 se zyada hain. Present aur voting members ke simple majority se bill pass hota hai."
        },
        {
          stage: "Presidential Assent",
          q: "Bill dono Houses se pass ho gaya. President ko ek clause par doubt hai. Woh kya kar sakte hain?",
          options: [
            "Permanently assent roak dein, Parliament ke paas koi option na ho",
            "Reconsideration ke liye Parliament ko wapas bhejein; agar Parliament dobara pass kare toh assent mandatory hai",
            "Advisory opinion ke liye Supreme Court bhejein",
            "Union Council of Ministers ke two-thirds vote se reject karein"
          ],
          why: "Article 111: Money Bill ke alawa kisi bill par President assent de sakte hain, roak sakte hain, ya reconsideration ke liye wapas bhej sakte hain. Agar Parliament bill ko amendment ke saath ya bina dobara pass kar de, toh President assent nahi roak sakte. Article 143 ke under Supreme Court ki advisory jurisdiction is process ka hissa nahi hai."
        }
      ],
      notes: [
        "Article 108 ke under joint sitting President bulate hain aur iski adhyakshta Speaker karte hain. Lok Sabha ke 543 members Rajya Sabha ke 245 se zyada hain.",
        "Money Bills aur Constitutional Amendment Bills kabhi joint sitting mein nahi ja sakte.",
        "Agar President ordinary bill wapas bhejein aur Parliament use dobara pass kar de, toh Article 111 ke under assent mandatory ho jaata hai."
      ],
      result: {
        title: "Bill Act ban gaya",
        text: "Joint sitting mein deadlock toota, jahan Lok Sabha ki numerical strength decisive rahi. Dobara pass hone se President ki objections ka jawab mila — aur assent mil gaya."
      }
    },

    /* ---------------- 2. MONEY BILL ---------------- */
    money: {
      title: "Money Bill",
      short: "Money Bill",
      summary: "Tax, borrowing aur Consolidated Fund. Ise sirf Lok Sabha originate kar sakti hai, aur Rajya Sabha ko bolne ke liye sirf 14 din milte hain.",
      brief: {
        house: "Sirf Lok Sabha",
        route: "LS (President ki recommendation) → RS (14 din) → President",
        majority: "Lok Sabha mein simple majority"
      },
      flow: [
        {
          stage: "Introduction",
          q: "Digital services par naya tax lagane wala bill introduce ho raha hai. Kaunsa statement sahi hai?",
          options: [
            "Kisi bhi House mein introduce ho sakta hai",
            "Sirf Lok Sabha mein, President ki recommendation par",
            "Sirf Rajya Sabha mein",
            "Dono Houses mein special majority chahiye"
          ],
          why: "Article 110: Money Bill sirf Lok Sabha mein, aur sirf President ki recommendation par introduce ho sakta hai. Rajya Sabha ko ise originate karne ka power nahi hai."
        },
        {
          stage: "Certification",
          q: "Koi bill Money Bill hai ya nahi, finally kaun decide karta hai?",
          options: [
            "President",
            "Speaker of the Lok Sabha",
            "Rajya Sabha ke Chairman ke roop mein Vice-President",
            "Supreme Court"
          ],
          why: "Article 110(3): agar sawaal uthe ki bill Money Bill hai ya nahi, toh Speaker of the Lok Sabha ka decision final hota hai. Yahi certificate Rajya Sabha ki limited role ko trigger karta hai."
        },
        {
          caption: "Passage · Lok Sabha",
          note: "Money Bill ko Lok Sabha mein simple majority chahiye. Asli contest aksar political hota hai, numerical nahi."
        },
        {
          stage: "Rajya Sabha",
          q: "Rajya Sabha Day 13 par teen recommendations ke saath bill wapas karti hai. Lok Sabha kya kar sakti hai?",
          options: [
            "Saari recommendations accept karni hongi",
            "Koi bhi recommendation accept ya reject kar sakti hai, aur bill dono tarah se passed maana jayega",
            "Recommendations reject hone par bill lapse ho jaayega",
            "Joint sitting bulani hogi"
          ],
          why: "Article 109: Rajya Sabha ko Money Bill 14 din mein wapas karna hota hai. Woh amendments recommend kar sakti hai par bill amend ya reject nahi kar sakti. Lok Sabha saari ya koi bhi recommendations accept/reject kar sakti hai, aur bill usi form mein dono Houses se passed maana jaata hai jise Lok Sabha approve kare. Money Bill ke liye joint sitting nahi hoti."
        },
        {
          stage: "Presidential Assent",
          q: "Bill assent ke liye present hai. President ke options kya hain?",
          options: [
            "Assent dein, roakein, ya reconsideration ke liye wapas bhejein",
            "Assent dein ya roakein, par wapas nahi bhej sakte",
            "President ko har case mein assent dena hoga",
            "Supreme Court ko refer karein"
          ],
          why: "Article 111 ka proviso President ko sirf aisa bill wapas bhejne ki permission deta hai jo Money Bill na ho. Kyunki Money Bill President ki khud ki recommendation par introduce hota hai, choice assent ya withhold hai — return nahi."
        }
      ],
      notes: [
        "Bill Money Bill hone ka Speaker ka certificate Article 110(3) ke under final hai.",
        "Rajya Sabha Money Bill amend ya reject nahi kar sakti. Uske paas recommendations ke saath 14 din mein wapas karne ka time hai; silence ka matlab deemed passage.",
        "Money Bill kabhi joint sitting mein nahi ja sakta."
      ],
      result: {
        title: "Money Bill kanoon ban gaya",
        text: "Lok Sabha ki will prevail hui. Rajya Sabha ki recommendations par vichaar kiya gaya aur unhe reject kar diya gaya, par bill usi form mein dono Houses se passed maana gaya jise Lok Sabha ne approve kiya."
      }
    },

    /* ---------------- 3. FINANCE BILL ---------------- */
    finance: {
      title: "Finance Bill",
      short: "Finance Bill",
      summary: "Har Finance Bill Money Bill nahi hota. Yeh difference — aur Speaker ka certificate — decide karta hai ki kaunse House ko real say milega.",
      brief: {
        house: "Certification par depend",
        route: "LS → RS (ordinary ho toh full powers) → President",
        majority: "Simple majority, par classification route decide karti hai"
      },
      flow: [
        {
          stage: "Classification",
          q: "Ek Finance Bill income-tax slabs badalta hai, par saath hi RBI Act ke governance provisions bhi amend karta hai. Ise kaise classify kiya jayega?",
          options: [
            "Money Bill, kyunki har Finance Bill Money Bill hota hai",
            "Ordinary Bill, kyunki isme Article 110 ke bahar ke matters hain",
            "Constitutional Amendment Bill",
            "Ise introduce hi nahi kiya ja sakta"
          ],
          why: "Bill sirf tab Money Bill hai jab woh Article 110(1) ke listed matters se exclusively deal kare. Aisa Finance Bill jo unrelated law bhi amend karta hai, ordinary bill hai — Rajya Sabha ki full powers aur joint sitting ki possibility ke saath."
        },
        {
          stage: "The Other Kind",
          q: "Inme se kaun hamesha Money Bill hota hai?",
          options: [
            "Finance Bill",
            "Appropriation Bill",
            "Ordinary Bill",
            "Constitutional Amendment Bill"
          ],
          why: "Appropriation Bill, jo Consolidated Fund of India se expenditure authorise karta hai, hamesha Money Bill hota hai. Ise amount badhane ya kisi expenditure ka destination badalne ke liye amend nahi kiya ja sakta (Article 114). Finance Bill Money Bill ho bhi sakta hai aur nahi bhi."
        },
        {
          caption: "Passage · Lok Sabha",
          note: "Ordinary bill ke roop mein ise Lok Sabha mein simple majority chahiye — par Money Bill ke unlike, ab Rajya Sabha ke paas full amending aur rejecting powers hain."
        },
        {
          caption: "Passage · Rajya Sabha",
          note: "Rajya Sabha ordinary bill ko amend ya reject kar sakti hai. Yahan woh agree karti hai, isliye bill bina deadlock ke Lok Sabha wapas aata hai."
        },
        {
          stage: "Presidential Assent",
          q: "Kyunki yeh ordinary bill hai, President kya kar sakte hain?",
          options: [
            "Sirf assent",
            "Assent, withhold, ya reconsideration ke liye wapas bhejna",
            "Sirf tab wapas bhejein jab Rajya Sabha agree kare",
            "Agar budget estimate se zyada ho toh reject karein"
          ],
          why: "Article 111 ki ordinary-bill procedure lagti hai: assent, withholding, ya reconsideration ke liye return. Agar Parliament dobara pass kar de, toh assent withhold nahi kiya ja sakta. Yahi bill agar Money Bill certified hota, toh wapas nahi bheja ja sakta tha."
        }
      ],
      notes: [
        "Finance Bill sirf tab Money Bill hai jab woh Article 110(1) ke matters se exclusively deal kare aur Speaker certify kare.",
        "Appropriation Bill hamesha Money Bill hota hai aur ise amount badhane ya expenditure ka destination badalne ke liye amend nahi kiya ja sakta (Article 114).",
        "Tax measures ko doosre laws ke amendments ke saath milane wala bill ordinary bill hai — Rajya Sabha ki full powers bani rehti hain."
      ],
      result: {
        title: "Finance Bill kanoon ban gaya",
        text: "Classification ne route decide kiya. Kyunki bill Article 110 se aage gaya tha, Rajya Sabha ko full powers mile — aur uski concurrence se passage uncontroversial ho gaya."
      }
    }
  };

  Object.assign(I18N.hinglish, { scenarios });

  Object.assign(I18N.hinglish.scenarios, {
    /* ---------------- 4. CONSTITUTIONAL AMENDMENT ---------------- */
    amendment: {
      title: "Constitutional Amendment",
      short: "Amendment Bill",
      summary: "Article 368 do taalon wala qila hai: har House mein special majority, aur federal provisions ke liye aadhe States.",
      brief: {
        house: "Koi bhi House",
        route: "LS + RS alag-alag → aadhe States (agar federal) → President",
        majority: "Special majority: total membership ka majority + present & voting ka two-thirds"
      },
      flow: [
        {
          stage: "Introduction",
          q: "Constitution amend karne wala bill taiyaar hai. Ise kahan introduce kiya ja sakta hai?",
          options: [
            "Sirf Lok Sabha mein",
            "Sirf Rajya Sabha mein",
            "Parliament ke kisi bhi House mein",
            "Sirf joint sitting ke baad"
          ],
          why: "Constitutional Amendment Bill kisi bhi House mein introduce ho sakta hai. Ise private member bhi introduce kar sakta hai, aur iske liye President ki prior recommendation zaroori nahi hai."
        },
        {
          stage: "The Majority",
          q: "Har House mein amendment pass karne ke liye kaunsa majority chahiye?",
          options: [
            "Present aur voting members ka simple majority",
            "Sirf absolute majority",
            "Total membership ka majority AUR present aur voting members ka two-thirds",
            "Sirf total membership ka two-thirds"
          ],
          why: "Article 368 har House mein special majority maangta hai: us House ki total membership ka majority AUR present aur voting members ka kam se kam two-thirds. Dono conditions poori honi chahiye."
        },
        {
          caption: "Passage · Lok Sabha",
          note: "Yahan floor do numbers mein se ooncha hai: full House ka majority (272) aur present & voting ka two-thirds (334)."
        },
        {
          caption: "Passage · Rajya Sabha",
          note: "Rajya Sabha ko bill usi special majority se alag pass karna hota hai. Constitutional amendment ke liye joint sitting nahi hoti."
        },
        {
          stage: "Federal Provisions",
          q: "Amendment Seventh Schedule badalta hai, jisse Union-State legislative powers badalti hain. Kaunsi additional requirement lagti hai?",
          options: [
            "Kam se kam aadhe State Legislatures ka ratification",
            "Joint sitting mein approval",
            "National referendum",
            "Supreme Court ki approval"
          ],
          why: "Article 368(2) ka proviso federal features ko affect karne wale amendments ke liye kam se kam aadhe States ke Legislatures ka ratification maangta hai — Seventh Schedule, States ka representation, President ka election, ya khud Article 368."
        },
        {
          stage: "Presidential Assent",
          q: "Parliament aur States ki approval ke baad President ki kya role hai?",
          options: [
            "President assent withhold kar sakte hain",
            "President ek baar reconsideration ke liye wapas bhej sakte hain",
            "President ko assent dena hi hoga; withhold ya return karne ka power nahi",
            "President ise Supreme Court bhej sakte hain"
          ],
          why: "24th Constitutional Amendment Act, 1971 ne President ke liye Constitutional Amendment Bill par assent dena obligatory kar diya. Assent withhold karne ya bill wapas bhejne ka power nahi hai."
        }
      ],
      notes: [
        "Article 368 ke special majority ke do limbs hain: total membership ka aadhe se zyada, aur present & voting members ka kam se kam two-thirds.",
        "Har House ko bill alag pass karna hota hai. Constitutional Amendment Bill ke liye joint sitting nahi hoti.",
        "Kam se kam aadhe State Legislatures ka ratification sirf federal provisions ke liye chahiye — Seventh Schedule, States ka representation, ya khud Article 368."
      ],
      result: {
        title: "Constitution amend ho gaya",
        text: "Dono Houses ne twin threshold clear kiya, States ne federal change ratify kiya, aur President ka assent constitutionally obligatory tha. Article 368 poora satisfy ho gaya."
      }
    },

    /* ---------------- 5. NO-CONFIDENCE ---------------- */
    noconfidence: {
      title: "No-Confidence Motion",
      short: "No-Confidence",
      summary: "Collective responsibility ka ultimate test. Ise sirf Lok Sabha pass kar sakti hai — aur simple majority government khatam kar deta hai.",
      brief: {
        house: "Sirf Lok Sabha",
        route: "LS → President",
        majority: "Simple majority"
      },
      flow: [
        {
          stage: "The House",
          q: "Opposition Council of Ministers ke against no-confidence motion laana chahta hai. Ise kahan laaya ja sakta hai?",
          options: [
            "Sirf Lok Sabha mein",
            "Sirf Rajya Sabha mein",
            "Kisi bhi House mein",
            "Joint sitting mein"
          ],
          why: "Article 75(3): Council of Ministers House of the People — Lok Sabha — ke liye collectively responsible hai. Rajya Sabha no-confidence motion pass nahi kar sakti aur na hi government gira sakti hai."
        },
        {
          stage: "The Majority",
          q: "No-confidence motion pass karne ke liye kaunsa majority chahiye?",
          options: [
            "Present aur voting members ka simple majority",
            "Effective majority",
            "Present aur voting members ka two-thirds",
            "Total membership ka two-thirds"
          ],
          why: "No-confidence motion simple majority se decide hota hai: present aur voting members mein Ayes Noes se zyada. Abstentions government ki madad nahi karte — woh us threshold ko effectively kam kar dete hain jise cross karna hai."
        },
        {
          caption: "Division · No-Confidence Motion",
          note: "Motion carried. No-confidence motion haarne wali government se resignation expected hota hai; President phir dekhte hain ki koi alternative government House ka confidence paa sakti hai ya nahi."
        },
        {
          stage: "The Consequence",
          q: "Motion carried. Constitutionally aage kya hota hai?",
          options: [
            "Prime Minister aur Council of Ministers ko resign karna hoga",
            "President automatically Lok Sabha dissolve kar dete hain",
            "Prime Minister agle general election tak pad par rahte hain",
            "Saat din mein fresh election hona chahiye"
          ],
          why: "Collective responsibility ka matlab hai ki no-confidence vote haarne ke baad Council of Ministers ko resign karna hota hai. President phir aise leader ko invite kar sakte hain jo majority command kar sake, ya House dissolve karke elections bula sakte hain. Dissolution automatic nahi hota."
        }
      ],
      notes: [
        "No-confidence motion sirf Lok Sabha mein laaya ja sakta hai; Rajya Sabha Council of Ministers ko remove nahi kar sakti.",
        "Iske liye simple majority chahiye — present aur voting members mein Ayes Noes se zyada.",
        "Carried hone par Prime Minister aur poora Council of Ministers resign karta hai. House ka dissolution automatic nahi hota."
      ],
      result: {
        title: "Government gir gayi",
        text: "Motion simple majority se carried hua. Collective responsibility test hui aur haar gayi; Council of Ministers ne President ko resignation diya."
      }
    },

    /* ---------------- 6. PRESIDENT IMPEACHMENT ---------------- */
    president: {
      title: "Impeachment of the President",
      short: "President's Impeachment",
      summary: "Constitution ki sabse grave procedure. Constitution ke violation ka charge total membership ke two-thirds ko do baar clear karna hota hai.",
      brief: {
        house: "Koi bhi House (yahan: Lok Sabha initiate karti hai)",
        route: "LS charge → RS investigation → removal",
        majority: "Har House mein total membership ka two-thirds"
      },
      flow: [
        {
          stage: "The Charge",
          q: "President ke against Constitution ke violation ka charge propose hua hai. Notice ki kya condition hai?",
          options: [
            "House ke total members ke kam se kam one-fourth ke signature ke saath 14 din ka notice",
            "Members ke one-tenth ke signature ke saath 10 din ka notice",
            "Koi notice zaroori nahi",
            "Aadhe members ke signature ke saath 30 din ka notice"
          ],
          why: "Article 61(2)(a): resolution tabhi move kiya ja sakta hai jab initiating House ke total members ke kam se kam one-fourth ke signature ke saath kam se kam 14 din ka written notice diya gaya ho."
        },
        {
          caption: "Charge Preferred · Lok Sabha",
          note: "Charge House ki TOTAL membership ke two-thirds se pass hona chahiye — 543 mein se 362 — sirf present members ke two-thirds se nahi."
        },
        {
          stage: "Investigation",
          q: "Lok Sabha ne charge prefer kar diya. Aage kya hota hai?",
          options: [
            "President turant remove ho jaate hain",
            "Rajya Sabha charge investigate karti hai; President appear aur represent kar sakte hain",
            "Supreme Court trial karta hai",
            "National referendum hota hai"
          ],
          why: "Article 61(3): ek House dwara charge prefer hone ke baad doosra House uski investigation karta hai (ya karwata hai). President ko investigation mein appear hone aur represent karne ka right hai. Yeh quasi-judicial process hai."
        },
        {
          caption: "Charge Sustained · Rajya Sabha",
          note: "Investigating House ko bhi resolution apni total membership ke two-thirds se pass karna hota hai — 245 mein se 164. Tabhi President remove hote hain."
        },
        {
          stage: "Who Votes",
          q: "Presidential impeachment mein kaun participate kar sakta hai?",
          options: [
            "Sirf dono Houses ke elected MPs",
            "Dono Houses ke elected aur nominated MPs, par State MLAs nahi",
            "MPs aur State MLAs saath mein",
            "Sirf Rajya Sabha"
          ],
          why: "Kisi bhi House ke nominated members President ke impeachment mein participate kar sakte hain, bhale hi woh President ke election mein vote nahi kar sakte. State MLAs, jo election mein vote karte hain, impeachment mein koi role nahi rakhte."
        }
      ],
      notes: [
        "Notice initiating House ke total members ke kam se kam one-fourth ke signature ke saath aur kam se kam 14 din pehle diya jaana chahiye.",
        "Dono Houses ke nominated MPs impeachment mein participate kar sakte hain; State MLAs nahi, bhale hi woh President ke election mein vote karte hon.",
        "Investigation ke dauraan President ko appear hone aur represent karne ka right hai."
      ],
      result: {
        title: "President pad se remove ho gaye",
        text: "Dono Houses ne independently apni total membership ke two-thirds threshold ko cross kiya. Charge sustain hua, aur doosra resolution pass hone ki date se President office se remove ho gaye."
      }
    },

    /* ---------------- 7. VICE-PRESIDENT REMOVAL ---------------- */
    vicepresident: {
      title: "Removal of the Vice-President",
      short: "Vice-President's Removal",
      summary: "Yeh impeachment nahi hai. Rajya Sabha move karti hai, Lok Sabha agree karti hai, aur President ka koi role nahi.",
      brief: {
        house: "Rajya Sabha initiate karti hai",
        route: "RS resolution → LS agreement → removal",
        majority: "RS mein effective majority + LS mein simple majority"
      },
      flow: [
        {
          stage: "The House",
          q: "Vice-President ko remove karne ka resolution move ho raha hai. Ise kis House mein originate hona chahiye?",
          options: [
            "Sirf Rajya Sabha mein",
            "Sirf Lok Sabha mein",
            "Kisi bhi House mein",
            "Joint sitting mein"
          ],
          why: "Article 67(b): Vice-President ko remove karne ka resolution sirf Rajya Sabha mein move kiya ja sakta hai. Phir Lok Sabha ko isse agree karna hota hai. Yeh Vice-President ki Rajya Sabha ke ex-officio Chairman ke roop mein role ko reflect karta hai."
        },
        {
          stage: "The Majority",
          q: "Rajya Sabha ko kaunsa majority chahiye?",
          options: [
            "Present aur voting members ka simple majority",
            "Rajya Sabha ke all the then members ka majority",
            "Total membership ka two-thirds",
            "Present aur voting members ka two-thirds"
          ],
          why: "Article 67(b) Rajya Sabha ke all the then members ke majority se pass resolution maangta hai — effective majority. 245 seats aur chaar vacancies hone par effective strength 241 hai aur floor 121."
        },
        {
          caption: "Resolution · Rajya Sabha",
          note: "Rajya Sabha ne resolution carry kar liya. Ab yeh Lok Sabha ke paas jaata hai, jise simple majority se agree karna hoga."
        },
        {
          caption: "Agreement · Lok Sabha",
          note: "Lok Sabha ka agreement simple majority se hota hai. Kisi presidential assent ki zaroorat nahi; Lok Sabha ke agreement ke saath removal effective ho jaata hai."
        },
        {
          stage: "Who Votes",
          q: "Vice-President ke removal mein kaunse members participate kar sakte hain?",
          options: [
            "Sirf Parliament ke elected members",
            "Dono Houses ke saare members, nominated members sahit",
            "Sirf Rajya Sabha ke members",
            "MPs aur State MLAs saath mein"
          ],
          why: "Parliament ke nominated members Vice-President ke removal mein participate kar sakte hain. Yeh President ke election se sharp contrast hai, jahan nominated members ka vote nahi hota."
        }
      ],
      notes: [
        "Rajya Sabha ko apne all the then members ka majority chahiye — effective majority, present members ka simple majority nahi.",
        "Lok Sabha ka agreement simple majority se hota hai. Removal mein President ka koi role nahi.",
        "Parliament ke nominated members Vice-President ke removal mein participate kar sakte hain."
      ],
      result: {
        title: "Vice-President remove ho gaye",
        text: "Rajya Sabha ne effective majority se resolution pass kiya aur Lok Sabha ne simple majority se agree kiya. Presidential assent ki zaroorat nahi thi; Lok Sabha ke agreement par office vacant ho gaya."
      }
    },

    /* ---------------- 8. SPEAKER REMOVAL ---------------- */
    speaker: {
      title: "Removal of the Speaker",
      short: "Speaker's Removal",
      summary: "Speaker ka apna House decide karta hai. Effective majority, 14 din ka notice, aur Deputy Speaker Chair par.",
      brief: {
        house: "Sirf Lok Sabha",
        route: "LS resolution → removal",
        majority: "Lok Sabha ka effective majority"
      },
      flow: [
        {
          stage: "The House",
          q: "Speaker ko remove karne ka resolution move ho raha hai. Kaunsa House decide karta hai?",
          options: [
            "Sirf Lok Sabha",
            "Sirf Rajya Sabha",
            "Koi bhi House",
            "Joint sitting"
          ],
          why: "Article 94: Speaker aur Deputy Speaker ko Lok Sabha dwara pass resolution se remove kiya ja sakta hai. Speaker ko remove karne mein Rajya Sabha ka koi role nahi hai."
        },
        {
          stage: "The Majority",
          q: "Kaunsa majority required hai?",
          options: [
            "Present aur voting members ka simple majority",
            "Lok Sabha ke all the then members ka majority",
            "Total membership ka two-thirds",
            "Present aur voting members ka two-thirds"
          ],
          why: "Article 94 Lok Sabha ke all the then members ke majority ki maang karta hai — effective majority. 543 seats aur paanch vacancies hone par effective strength 538 hai aur floor 270."
        },
        {
          stage: "The Chair",
          q: "Speaker ke apne removal par vichaar ke dauraan House ki adhyakshta kaun karta hai?",
          options: [
            "Speaker khud adhyakshta karte rehte hain",
            "Deputy Speaker",
            "Vice-President",
            "House ke senior-most member"
          ],
          why: "Article 96: Speaker apne removal par vichaar ke dauraan adhyakshta nahi kar sakte. Deputy Speaker adhyakshta karte hain. Speaker phir bhi bol sakte hain aur proceedings mein part le sakte hain."
        },
        {
          caption: "Resolution · Lok Sabha",
          note: "Resolution carried. Effective majority 538 members (543 minus 5 vacancies) par calculate hota hai, isliye floor 270 tha."
        },
        {
          stage: "The Speaker's Rights",
          q: "Kya Speaker apne removal ki debate mein bol aur vote kar sakte hain?",
          options: [
            "Nahi, Speaker proceedings se completely excluded hain",
            "Haan, Speaker bol sakte hain aur first instance mein vote kar sakte hain, par votes tied hone par vote nahi kar sakte",
            "Haan, par Speaker vote bilkul nahi kar sakte — sirf casting vote",
            "Sirf lawyer ke through"
          ],
          why: "Article 96(2): Speaker bol sakte hain aur proceedings mein part le sakte hain, aur removal resolution ya un proceedings ke dauraan kisi doosre matter par first instance mein vote ke haqdaar hain. Par votes equal hone par Speaker casting vote nahi de sakte. Yeh Article 100 ke normal rule ko reverse karta hai, jahan Speaker sirf tie break karne ke liye vote dete hain."
        }
      ],
      notes: [
        "Resolution ke liye kam se kam 14 din ka notice aur Lok Sabha ke all the then members ka majority (effective majority) zaroori hai.",
        "Speaker apne removal ki debate ki adhyakshta nahi kar sakte; Deputy Speaker karte hain.",
        "Speaker bol aur part le sakte hain, aur removal resolution par first instance mein vote kar sakte hain — par casting vote nahi."
      ],
      result: {
        title: "Speaker remove ho gaye",
        text: "Lok Sabha ne effective majority se resolution pass kiya. Speaker ne apne defence mein bola aur first instance mein vote diya, par casting vote nahi tha; Deputy Speaker ne resolution carried declare kiya."
      }
    },

    /* ---------------- 9. JUDGE REMOVAL ---------------- */
    judge: {
      title: "Removal of a Judge",
      short: "Judge's Removal",
      summary: "Judges impeach nahi hote. Parliament President ko address karti hai, aur address ko same session mein dono Houses mein special majority chahiye.",
      brief: {
        house: "Koi bhi House",
        route: "LS + RS (same session) → President ka order",
        majority: "Har House mein special majority"
      },
      flow: [
        {
          stage: "The Grounds",
          q: "Supreme Court judge ko kin grounds par remove kiya ja sakta hai?",
          options: [
            "Proved misbehaviour ya incapacity",
            "Constitution ka violation",
            "Government ka confidence khona",
            "65 saal ki age poori hona"
          ],
          why: "Article 124(4): judge ko sirf proved misbehaviour ya incapacity ke grounds par remove kiya ja sakta hai. Constitution ka violation President ke impeachment ka ground hai, judge ko remove karne ka nahi."
        },
        {
          stage: "The Procedure",
          q: "Constitutionally kaunsi procedure required hai?",
          options: [
            "Same session mein dono Houses ka special majority se pass address, phir President ka order",
            "Union Cabinet ka resolution",
            "Sirf Supreme Court ka verdict",
            "Parliament ki joint sitting"
          ],
          why: "Article 124(4): removal ke liye same session mein Parliament ke dono Houses ka special majority se supported address zaroori hai, proved misbehaviour ya incapacity ke liye. Phir President removal order issue karte hain. Article 124(5) Parliament ko law dwara procedure regulate karne ki permission deta hai (Judges Inquiry Act, 1968)."
        },
        {
          caption: "Address · Lok Sabha",
          note: "Yahan special majority ka matlab hai total membership ka majority (272) AUR present & voting members ka two-thirds (334). Oonchi figure effective floor hai."
        },
        {
          caption: "Address · Rajya Sabha",
          note: "Rajya Sabha ko address usi session mein pass karna hota hai. Alag session ka matlab hai process dobara shuru karni hogi."
        },
        {
          stage: "The President",
          q: "Dono Houses dwara address pass hone ke baad President ki kya role hai?",
          options: [
            "President judge ko remove karne se mana kar sakte hain",
            "President address reconsideration ke liye wapas bhej sakte hain",
            "President removal order issue karte hain; koi independent discretion nahi",
            "President matter Supreme Court bhej sakte hain"
          ],
          why: "Same session mein dono Houses dwara address pass hone ke baad President ka order formal hota hai. Mana karne ya wapas bhejne ka power nahi hai. Supreme Court ne kaha hai ki process judicial review ke subject hai, par President merits par dobara decide nahi karte."
        },
        {
          stage: "Ratification",
          q: "Kya States ka ratification zaroori hai?",
          options: [
            "Haan, kam se kam aadhe States ka",
            "Haan, saare States ka",
            "Nahi, States ka ratification zaroori nahi",
            "Sirf High Court judges ke liye"
          ],
          why: "Article 124(4) ke under judges ka removal dono Houses mein special majority maangta hai, par State Legislatures ka ratification nahi. States ka ratification Article 368 ki federal amendment procedure ki feature hai, judicial removal ki nahi."
        }
      ],
      notes: [
        "Grounds sirf proved misbehaviour ya incapacity tak limited hain — Constitution ka violation nahi.",
        "Address har House mein same session mein special majority se pass hona chahiye: total membership ka majority plus present & voting ka two-thirds.",
        "States ke ratification ki zaroorat nahi. President ki role formal hai; address ke baad removal order aata hai."
      ],
      result: {
        title: "Judge remove ho gaye",
        text: "Dono Houses ne same session mein special majority se address pass kiya. President ne formal order issue kiya, aur judge office par nahi rahe."
      }
    }
  });

  /* ---------------- Majority types ---------------- */
  Object.assign(I18N.hinglish, {
    majorities: {
      simple: {
        name: "Simple Majority",
        short: "Present aur voting members ka 50% se zyada",
        formula: "Ayes > Noes (present aur voting members mein)",
        desc: "Rozmarra ka test. Abstentions aur absentees calculation se bahar rehte hain. Ayes ko sirf Noes se zyada hona hai.",
        used: ["Ordinary Bills", "Money Bills", "No-Confidence Motion", "Confidence Motion"]
      },
      absolute: {
        name: "Absolute Majority",
        short: "Total membership ka 50% se zyada",
        formula: "Ayes > House ki full strength ka aadha",
        desc: "Total membership ka aadhe se zyada, vacancies sahit. Yahan ki procedures mein yeh standalone test nahi hai, par Article 368 aur 124(4) ke special majority ka pehla limb hai.",
        used: ["Special majority ka component", "UPSC ka common distractor"]
      },
      effective: {
        name: "Effective Majority",
        short: "Effective strength ka 50% se zyada",
        formula: "Ayes > (total membership − vacancies) ka aadha",
        desc: "House ke all the then members ka aadhe se zyada — matlab total membership mein se current vacancies ghataakar. Presiding officers ko remove karne mein use hota hai.",
        used: ["Removal of Speaker", "Removal of Vice-President", "Removal of Deputy Chairman, RS"]
      },
      specialPresent: {
        name: "Special Majority · Dual Test",
        short: "Total membership ka majority + present & voting ka two-thirds",
        formula: "Dono conditions ek saath poori honi chahiye",
        desc: "Ayes total membership ke aadhe se zyada hon AUR present aur voting members ke kam se kam two-thirds hon. Constitutional amendments (Article 368) aur judges ke removal (Article 124(4)) mein use hota hai.",
        used: ["Constitutional Amendment Bills", "Removal of Judges"]
      },
      specialTotal: {
        name: "Special Majority · 2/3 of total",
        short: "Total membership ka two-thirds",
        formula: "Ayes ≥ House ki full strength ka two-thirds",
        desc: "Ayes House ki total membership ke two-thirds tak pahunchne chahiye — sirf present members ke two-thirds nahi. Constitution ka sabse tough floor vote.",
        used: ["Impeachment of the President"]
      },
      specialRatify: {
        name: "Special Majority + States",
        short: "Special majority + aadhe States",
        formula: "Parliament mein Article 368 majority + kam se kam 50% States ka ratification",
        desc: "Federal provisions ke liye Parliament ka special majority sirf pehla step hai. Kam se kam aadhe State Legislatures ko bhi amendment ratify karna hota hai.",
        used: ["Seventh Schedule", "Representation of States", "Article 368 itself"]
      }
    },

    /* ---------------- Voting methods ---------------- */
    voting: {
      voice: {
        name: "Voice Vote",
        tag: "Default",
        desc: "Presiding officer question rakhte hain aur members Aye ya No kehte hain. Chair decide karta hai ki kis side ki awaaz zyada thi. Kisi individual vote ka record nahi hota.",
        when: "Routine questions aur bill ke zyadatar stages."
      },
      division: {
        name: "Division",
        tag: "Recorded vote",
        desc: "Members physically Ayes ya Noes lobby mein jaate hain aur unke naam record hote hain. Koi bhi member division demand kar sakta hai, isliye jab numbers matter karte hain tab yahi method use hota hai.",
        when: "Jab vote challenge ho ya result uncertain ho."
      },
      electronic: {
        name: "Electronic Division",
        tag: "Modern Houses",
        desc: "Electronic voting system se recorded division. Votes automatically count hote hain aur board par dikhte hain, jisse lobby walk ke bina exact tally milti hai.",
        when: "Rajya Sabha mein aur badhti hui matra mein Lok Sabha mein recorded divisions."
      },
      secret: {
        name: "Secret Ballot",
        tag: "Protected choice",
        desc: "Members privately vote karte hain, isliye party whips individual choices verify nahi kar sakte. Aise elections mein use hota hai jahan independence essential ho, jaise President aur Vice-President ka election.",
        when: "Presidential aur Vice-Presidential elections."
      },
      ballot: {
        name: "Ballot",
        tag: "Elections",
        desc: "Formal paper ballot. President ke election mein single transferable vote system use hota hai, jisme Article 55 ke formula ke under har MP ke vote ki value alag hoti hai.",
        when: "Proportional representation dwara elections."
      },
      casting: {
        name: "Casting Vote",
        tag: "Tie todna",
        desc: "Speaker ya Chairman first instance mein vote nahi dete. Agar votes tied hon, toh presiding officer deadlock todne ke liye casting vote de sakte hain.",
        when: "Sirf jab Ayes aur Noes exactly equal hon."
      }
    },

    /* ---------------- Bill journey ---------------- */
    journey: [
      {
        tag: "Stage 1 · Lok Sabha",
        title: "Introduction & First Reading",
        text: "Bill House ki leave se introduce hota hai. Money Bill ke liye President ki recommendation mandatory hai aur ise sirf Lok Sabha originate kar sakti hai. Ordinary bill kisi bhi House se shuru ho sakta hai."
      },
      {
        tag: "Stage 2 · Committee",
        title: "Second Reading",
        text: "House bill ke principles par discuss karta hai. Ise standing ya select committee ko refer kiya ja sakta hai, clause-by-clause liya ja sakta hai, ya public opinion ke liye circulate kiya ja sakta hai. Zyadatar amendments yahin shape lete hain."
      },
      {
        tag: "Stage 3 · First House",
        title: "Third Reading & Passage",
        text: "Bill par originating House mein vote hota hai. Ordinary ya money bill ko simple majority chahiye; constitutional amendment ko Article 368 ka special majority."
      },
      {
        tag: "Stage 4 · Second House",
        title: "The Other House",
        text: "Ordinary bill pass, reject, amend ya chhe mahine tak hold kiya ja sakta hai. Money Bill 14 din mein wapas karna hota hai, sirf recommendations ke saath. Constitutional amendment usi special majority se alag pass hona chahiye."
      },
      {
        tag: "Stage 5 · Deadlock",
        title: "Joint Sitting (ordinary bills only)",
        text: "Agar ordinary bill par Houses deadlock ho jaayein, toh President Article 108 ke under joint sitting bula sakte hain. Speaker adhyakshta karte hain aur aam taur par Lok Sabha ke numbers outcome decide karte hain. Money Bills aur constitutional amendments excluded hain."
      },
      {
        tag: "Stage 6 · President",
        title: "Assent",
        text: "Article 111 ke under President non-Money Bill par assent de sakte hain, withhold kar sakte hain, ya wapas bhej sakte hain. Agar Parliament dobara pass kar de, toh assent mandatory hai. Money Bill wapas nahi kiya ja sakta. Constitutional Amendment Bill par assent dena hi hota hai."
      }
    ],

    /* ---------------- At a glance ---------------- */
    glance: [
      {
        bill: "Ordinary Bill",
        intro: "Koi bhi House",
        rs: "Full powers: pass, amend, reject, ya 6 mahine tak delay",
        joint: "Yes (Art. 108)",
        majority: "Simple majority",
        president: "Assent, withhold, ya ek baar return; dobara pass hone par assent mandatory"
      },
      {
        bill: "Money Bill",
        intro: "Sirf Lok Sabha, President ki recommendation se",
        rs: "14 din; sirf recommendations; amend ya reject nahi",
        joint: "No",
        majority: "Lok Sabha mein simple majority",
        president: "Assent ya withhold; return nahi kar sakte"
      },
      {
        bill: "Finance Bill",
        intro: "Certification par depend; Money Bill sirf agar Article 110 hi apply ho",
        rs: "Ordinary ho toh full powers; Money Bill certified ho toh 14 din",
        joint: "Sirf ordinary ho toh",
        majority: "Simple majority",
        president: "Applicable route ke hisaab se"
      },
      {
        bill: "Constitutional Amendment",
        intro: "Koi bhi House",
        rs: "Special majority se alag pass hona chahiye; joint sitting nahi",
        joint: "No",
        majority: "Total membership ka majority + present & voting ka two-thirds; federal provisions ke liye aadhe States",
        president: "Assent mandatory (24th Amendment)"
      }
    ],

    /* ---------------- Article index ---------------- */
    articles: [
      { title: "Impeachment of the President", text: "Kisi bhi House dwara charge; members ke one-fourth dwara 14 din ka notice; har House mein total membership ka two-thirds." },
      { title: "Removal of the Vice-President", text: "Rajya Sabha ka effective majority se resolution; Lok Sabha ki simple majority se agreement." },
      { title: "Collective Responsibility", text: "Council of Ministers Lok Sabha ke liye collectively responsible hai — no-confidence motion ka basis." },
      { title: "Removal of Speaker / Deputy Speaker", text: "Lok Sabha ke all the then members ke majority se resolution (effective majority)." },
      { title: "Speaker's Conduct During Removal", text: "Speaker adhyakshta nahi kar sakte, par bol sakte hain, part le sakte hain aur first instance mein vote kar sakte hain; tie par casting vote nahi." },
      { title: "Ordinary Bills", text: "Kisi bhi House mein originate ho sakta hai; ordinary legislative procedure lagti hai." },
      { title: "Joint Sitting", text: "Ordinary bills ke deadlocks resolve karti hai; Speaker adhyakshta karte hain; Money Bills ya constitutional amendments ke liye nahi." },
      { title: "Money Bills — Procedure", text: "RS 14 din mein wapas kare; sirf amendments recommend kar sakti hai; LS unhe accept ya reject kar sakti hai." },
      { title: "Definition of Money Bill", text: "Matters ki exclusive list; Article 110(3) ke under Speaker ka certificate final hai." },
      { title: "Assent to Bills", text: "Non-Money Bills par assent, withhold, ya return; Parliament dobara pass kare toh assent mandatory." },
      { title: "Annual Financial Statement", text: "Budget; expenditure Parliament ke saamne present hota hai aur Appropriation Bill se authorise hota hai." },
      { title: "Appropriation Bills", text: "Hamesha Money Bills; amount badhane ya expenditure ka destination badalne ke liye amend nahi kiye ja sakte." },
      { title: "Removal of Supreme Court Judges", text: "Proved misbehaviour ya incapacity par same session mein dono Houses ka special majority se address." },
      { title: "High Court Judges", text: "Article 124(4) ki removal procedure High Court judges par bhi lagti hai." },
      { title: "Amendment of the Constitution", text: "Har House mein special majority; federal provisions ke liye aadhe States ka ratification." }
    ]
  });
})();

