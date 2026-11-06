/* ============================================================
   SANSAD — Historical Parliament data
   Lok Sabha and Rajya Sabha strength across 18 general elections
   (1952–2024), plus the floor motions the simulator can test.

   Seat TOTALS are sourced from the Election Commission of India
   statistical reports and the Rajya Sabha Secretariat's
   "Rajya Sabha Statistical Information 1952–2018" (Table 8).
   BLOC STRENGTHS are approximate, rounded for teaching, and
   labelled illustrative in the interface.
   ============================================================ */

const PARLIAMENT_TERMS = [
  {
    year: 1952,
    lsNo: 1,
    pm: "Jawaharlal Nehru",
    government: "INC",
    oppositionParty: "CPI",
    ls: { total: 489, treasury: 364, opposition: 16, other: 109 },
    rs: { total: 216, treasury: 146, opposition: 9, other: 61 }
  },
  {
    year: 1957,
    lsNo: 2,
    pm: "Jawaharlal Nehru",
    government: "INC",
    oppositionParty: "CPI",
    ls: { total: 494, treasury: 371, opposition: 27, other: 96 },
    rs: { total: 232, treasury: 160, opposition: 12, other: 60 }
  },
  {
    year: 1962,
    lsNo: 3,
    pm: "Jawaharlal Nehru",
    government: "INC",
    oppositionParty: "CPI",
    ls: { total: 494, treasury: 361, opposition: 29, other: 104 },
    rs: { total: 236, treasury: 158, opposition: 12, other: 66 }
  },
  {
    year: 1967,
    lsNo: 4,
    pm: "Indira Gandhi",
    government: "INC",
    oppositionParty: "Swatantra",
    ls: { total: 520, treasury: 283, opposition: 44, other: 193 },
    rs: { total: 240, treasury: 142, opposition: 12, other: 86 }
  },
  {
    year: 1971,
    lsNo: 5,
    pm: "Indira Gandhi",
    government: "INC",
    oppositionParty: "CPI(M)",
    ls: { total: 518, treasury: 352, opposition: 25, other: 141 },
    rs: { total: 243, treasury: 130, opposition: 10, other: 103 }
  },
  {
    year: 1977,
    lsNo: 6,
    pm: "Morarji Desai",
    government: "Janata",
    oppositionParty: "INC",
    ls: { total: 542, treasury: 345, opposition: 154, other: 43 },
    rs: { total: 244, treasury: 106, opposition: 72, other: 66 }
  },
  {
    year: 1980,
    lsNo: 7,
    pm: "Indira Gandhi",
    government: "INC(I)",
    oppositionParty: "Janata(S)",
    ls: { total: 542, treasury: 353, opposition: 41, other: 148 },
    rs: { total: 244, treasury: 121, opposition: 43, other: 80 }
  },
  {
    year: 1984,
    lsNo: 8,
    pm: "Rajiv Gandhi",
    government: "INC",
    oppositionParty: "TDP",
    ls: { total: 543, treasury: 414, opposition: 30, other: 99 },
    rs: { total: 244, treasury: 159, opposition: 12, other: 73 }
  },
  {
    year: 1989,
    lsNo: 9,
    pm: "V. P. Singh",
    government: "Janata Dal",
    oppositionParty: "INC",
    ls: { total: 543, treasury: 143, opposition: 197, other: 203 },
    rs: { total: 245, treasury: 108, opposition: 55, other: 82 }
  },
  {
    year: 1991,
    lsNo: 10,
    pm: "P. V. Narasimha Rao",
    government: "INC",
    oppositionParty: "BJP",
    ls: { total: 543, treasury: 244, opposition: 120, other: 179 },
    rs: { total: 245, treasury: 99, opposition: 30, other: 116 }
  },
  {
    year: 1996,
    lsNo: 11,
    pm: "H. D. Deve Gowda",
    government: "United Front",
    oppositionParty: "BJP",
    ls: { total: 543, treasury: 192, opposition: 161, other: 190 },
    rs: { total: 245, treasury: 80, opposition: 47, other: 118 }
  },
  {
    year: 1998,
    lsNo: 12,
    pm: "Atal Bihari Vajpayee",
    government: "NDA",
    oppositionParty: "INC",
    ls: { total: 543, treasury: 252, opposition: 141, other: 150 },
    rs: { total: 245, treasury: 68, opposition: 60, other: 117 }
  },
  {
    year: 1999,
    lsNo: 13,
    pm: "Atal Bihari Vajpayee",
    government: "NDA",
    oppositionParty: "INC",
    ls: { total: 543, treasury: 302, opposition: 114, other: 127 },
    rs: { total: 245, treasury: 75, opposition: 58, other: 112 }
  },
  {
    year: 2004,
    lsNo: 14,
    pm: "Manmohan Singh",
    government: "UPA",
    oppositionParty: "BJP",
    ls: { total: 543, treasury: 219, opposition: 138, other: 186 },
    rs: { total: 245, treasury: 80, opposition: 60, other: 105 }
  },
  {
    year: 2009,
    lsNo: 15,
    pm: "Manmohan Singh",
    government: "UPA",
    oppositionParty: "BJP",
    ls: { total: 543, treasury: 262, opposition: 116, other: 165 },
    rs: { total: 245, treasury: 85, opposition: 62, other: 98 }
  },
  {
    year: 2014,
    lsNo: 16,
    pm: "Narendra Modi",
    government: "NDA",
    oppositionParty: "INC",
    ls: { total: 543, treasury: 336, opposition: 44, other: 163 },
    rs: { total: 245, treasury: 65, opposition: 60, other: 120 }
  },
  {
    year: 2019,
    lsNo: 17,
    pm: "Narendra Modi",
    government: "NDA",
    oppositionParty: "INC",
    ls: { total: 543, treasury: 353, opposition: 52, other: 138 },
    rs: { total: 245, treasury: 90, opposition: 65, other: 90 }
  },
  {
    year: 2024,
    lsNo: 18,
    pm: "Narendra Modi",
    government: "NDA",
    oppositionParty: "INDIA",
    ls: { total: 543, treasury: 293, opposition: 234, other: 16 },
    rs: { total: 245, treasury: 117, opposition: 87, other: 41 }
  }
];

/* Motions the Chair can put to the House.
   houses   — where the motion is admissible
   majority — key into MAJORITY_TYPES
   mover    — "any" | "treasury" | "opposition"
   article  — constitutional anchor shown alongside the result */
const FLOOR_MOTIONS = [
  { id: "ordinary", houses: ["LS", "RS"], majority: "simple", mover: "any", article: "Art. 107" },
  { id: "money", houses: ["LS"], majority: "simple", mover: "treasury", article: "Art. 110" },
  { id: "finance", houses: ["LS"], majority: "simple", mover: "treasury", article: "Art. 112" },
  { id: "confidence", houses: ["LS"], majority: "simple", mover: "treasury", article: "Art. 75(3)" },
  { id: "noconfidence", houses: ["LS"], majority: "simple", mover: "opposition", article: "Art. 75(3)" },
  { id: "amendment", houses: ["LS", "RS"], majority: "specialPresent", mover: "any", article: "Art. 368" },
  { id: "impeachment", houses: ["LS", "RS"], majority: "specialTotal", mover: "any", article: "Art. 61" },
  { id: "vp", houses: ["RS"], majority: "effective", mover: "any", article: "Art. 67(b)" },
  { id: "speaker", houses: ["LS"], majority: "effective", mover: "any", article: "Art. 94" },
  { id: "judge", houses: ["LS", "RS"], majority: "specialPresent", mover: "any", article: "Art. 124(4)" }
];

const PARLIAMENT_SOURCES = [
  {
    title: "Election Commission of India — Statistical Reports",
    url: "https://www.eci.gov.in/statistical-reports"
  },
  {
    title: "Rajya Sabha Secretariat — Statistical Information 1952–2018",
    url: "https://cms.rajyasabha.nic.in/UploadedFiles/ElectronicPublications/rsstatis_inf_1952_2018.pdf"
  }
];
