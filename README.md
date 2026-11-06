# Sansad — The Mock Parliament

An interactive UPSC Polity simulator where you take the Chair and run the Indian Parliament. Move bills, call divisions, and discover exactly which majority the Constitution demands — from a Money Bill to the impeachment of a President.

**Live site:** https://ajeet-iitk.github.io/IndianParliament/

![Sansad home screen](assets/img/preview.jpg)

## What you can do

- **Nine parliamentary scenarios**
  - Ordinary Bill
  - Money Bill
  - Finance Bill
  - Constitutional Amendment
  - No-Confidence Motion
  - Impeachment of the President
  - Removal of the Vice-President
  - Removal of the Speaker
  - Removal of a Judge
- **Play as the Presiding Officer** — every scenario runs as a sequence of procedural decisions, each with a constitutional citation and an explanation.
- **Choose the voting method** — voice vote, division, electronic voting, secret ballot, or ballot, with the correct method taught in context.
- **Pick the majority** — simple, effective, absolute, special majority (with and without state ratification), and the special majority · dual test used for judge removal.
- **Watch the House vote** — an animated 543-seat Lok Sabha, 245-seat Rajya Sabha, or 788-seat joint sitting hemicycle counts the ayes and noes live.
- **Historical Parliament simulator** — travel through all 18 Lok Sabhas from 1952 to 2024. The chamber resizes to that year's real seat totals, you choose the Treasury, Opposition or crossbench, pick a motion that is admissible in that House, and see whether the Constitution's arithmetic would have carried it. Ten motions cover ordinary, Money and Finance Bills, confidence and no-confidence, constitutional amendment, impeachment, and the removal of the Vice-President, Speaker or a judge.
- **Score and progress** — 3-star accuracy tiers, XP, streaks, best scores and completed scenarios saved in `localStorage`.
- **Polity Lab** — a built-in reference for the two Houses, majority types, voting methods, and the legislative route of each bill type.
- **Three languages, switchable mid-session** — English, हिन्दी and Hinglish. Every scenario, option, explanation, verdict and reference table is translated; changing language in the middle of a run keeps your score and current step intact.
- **Day and night themes** — a warm sandstone daylight palette and the original dark navy chamber, with the choice remembered on your next visit.
- **Living motion** — the hero tricolour ripples through an SVG displacement filter, a public-gallery band sways with citizens, hand-held flags and walking figures, and silhouettes pace inside the chamber.
- **Secret Cockroaches game** — type `roach` anywhere, tap the little scuttling bug, or use the footer link. Survive a sixty-second Gen Z infestation by crushing roaches, spraying them back, and passing reforms to clear the floor. Scores and best runs are stored separately from scenario XP.
- **Sound, music and motion** — four original Web Audio scores (tanpura drone, cinematic pad, a Desh march and an instrumental Vande Mataram), gavel, division bell, vote ticks, chimes and applause, plus whoosh, spray, squish, skitter, breach, buzz, combo, reform, conch, dhol, victory and defeat effects. Music, effects, volume and reduced motion are all configurable, and reduced motion is also honoured from the operating system.
- **Responsive and cinematic** — custom SVG Parliament artwork, serif display type, ambient dust, card entrances, vote-count animations and confetti, with a mobile bottom dock.

## Controls

| Control | What it does |
| --- | --- |
| Language button (`EN` / `हिं` / `HG`) | Switches interface and content between English, Hindi and Hinglish |
| Sun / moon button | Toggles day and night themes |
| Speaker button | Opens music, effects, volume, score-style and reduced-motion settings |
| `XP` pill | Shown on wide screens; tracks experience across all simulations |
| Type `roach` | Opens the secret Cockroaches game from anywhere outside a form field |
| Footer 🪳 / floating bug | Also opens the Cockroaches game |
| `1` / `2` (in game) | Select the crush or spray tool |
| `C` / `S` / `R` (in game) | Crush the nearest roach, spray the centre, or pass a reform |

Preferences are stored in `localStorage`, so language, theme and audio settings survive a reload. On a first visit, music starts only after an interaction, as browsers require.

## Run locally

No build step and no dependencies. Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## Deploy

The site is plain static HTML/CSS/JS and is published with GitHub Pages from the `main` branch root.

To publish your own copy:

1. Push the folder to a GitHub repository.
2. Go to **Settings → Pages**.
3. Set **Source** to *Deploy from a branch*, branch `main`, folder `/ (root)`.
4. Open `https://<username>.github.io/<repository>/`.

## Project structure

```
IndianParliament/
├── index.html                  # Page shell, screens, hero SVG, controls, mobile dock
├── assets/
│   ├── css/style.css           # Themes, layout, animations, responsive rules
│   ├── img/preview.jpg         # README preview
│   └── js/
│       ├── data.js             # Canonical English scenarios, majorities, voting, Polity Lab
│       ├── history.js          # 1952–2024 seat totals, floor motions, historical sources
│       ├── i18n.js             # UI dictionaries for English, Hindi and Hinglish
│       ├── i18n-hi.js          # Hindi content overlay
│       ├── i18n-hinglish.js    # Hinglish content overlay
│       ├── audio.js            # Web Audio music and sound-effect engine
│       ├── roaches.js          # Secret Cockroaches easter-egg game
│       └── app.js              # Navigation, localisation, chamber rendering, game engine
└── shots/                      # Development screenshots (not required to run)
```

## Notes on accuracy

The simulator is written for exam revision and follows the constitutional provisions it cites, including:

- Money Bills: introduced only in the Lok Sabha, with the Rajya Sabha limited to 14 days and recommendations only (Art. 109–110).
- Ordinary Bills: deadlock resolved by a joint sitting under Art. 108.
- Constitutional Amendments: the Art. 368 route, including state ratification where required.
- President's impeachment: charge by one House, investigation by the other, two-thirds of the total membership of the investigating House (Art. 61).
- Vice-President's removal: Rajya Sabha initiates, Lok Sabha concurs, effective majority (Art. 67(b)).
- Speaker's removal: Lok Sabha only, effective majority; the Speaker may speak and vote in the first instance but cannot exercise a casting vote on their own removal (Art. 94, 96).
- Judge removal: special majority of each House plus the addresses procedure (Art. 124(4)–(5)).

### Historical data

The History simulator covers the 1st to 18th Lok Sabha (1952–2024). Chamber sizes and seat totals come from the Election Commission of India's statistical reports and the Rajya Sabha Secretariat's *Statistical Information 1952–2018*. Party-bloc strengths are rounded and illustrative, and the interface says so: the teaching point is the majority arithmetic, not an exact historical party tally. Both sources are linked from the simulator footer.

This is an educational simulation, not an official source. For the authoritative text, consult the Constitution of India and the Rules of Procedure of the two Houses.

## Accessibility

- Keyboard-reachable controls with visible focus states and ARIA labels.
- Day mode raises text contrast for bright rooms; night mode keeps the original chamber palette.
- A **Reduce motion** switch disables ambient, entrance and celebration animations, and `prefers-reduced-motion` is respected automatically.
- The Cockroaches game is playable with the pointer or with `1` / `2` / `C` / `S` / `R`.
- Audio is opt-out: music and effects can each be muted, and volume is adjustable.
- All navigation works without sound or animation.

## Credits

All artwork is hand-built SVG and CSS. Music and sound effects are synthesised at runtime with the Web Audio API — no third-party samples, no external audio requests, and no licensing dependencies.

## License

Free for personal study and classroom use.
