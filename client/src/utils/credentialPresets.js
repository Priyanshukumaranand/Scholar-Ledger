const COMMON_TITLES = [
  "Bachelor of Science",
  "Bachelor of Arts",
  "Bachelor of Engineering",
  "Bachelor of Technology",
  "Bachelor of Commerce",
  "Bachelor of Business Administration",
  "Bachelor of Computer Applications",
  "Master of Science",
  "Master of Arts",
  "Master of Engineering",
  "Master of Technology",
  "Master of Business Administration",
  "Master of Computer Applications",
  "Doctor of Philosophy",
  "Diploma in Engineering",
  "Postgraduate Diploma",
  "High School Diploma",
  "Higher Secondary Certificate",
  "Senior Secondary Certificate",
  "Course Completion Certificate",
  "Internship Completion Certificate",
  "Workshop Participation Certificate",
  "Letter of Recommendation",
  "Transcript of Records",
];

const COMMON_FIELDS = [
  "Computer Science",
  "Computer Engineering",
  "Information Technology",
  "Electronics Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Finance",
  "Marketing",
  "Data Science",
  "Artificial Intelligence",
  "Cybersecurity",
];

const RECENT_KEY_PREFIX = "scholar-ledger:title-recents";
const RECENT_LIMIT = 8;

const recentKey = (issuerAddr) =>
  `${RECENT_KEY_PREFIX}:${(issuerAddr || "anon").toLowerCase()}`;

export const loadRecentTitles = (issuerAddr) => {
  try {
    const raw = window.localStorage.getItem(recentKey(issuerAddr));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
};

export const rememberTitle = (issuerAddr, title) => {
  const trimmed = (title || "").trim();
  if (!trimmed) return;
  try {
    const current = loadRecentTitles(issuerAddr);
    const next = [trimmed, ...current.filter((t) => t !== trimmed)].slice(0, RECENT_LIMIT);
    window.localStorage.setItem(recentKey(issuerAddr), JSON.stringify(next));
  } catch {
    // ignore quota / disabled storage
  }
};

export const buildSuggestions = (issuerAddr, query) => {
  const q = (query || "").trim().toLowerCase();
  const recents = loadRecentTitles(issuerAddr);

  if (!q) {
    const seen = new Set();
    const out = [];
    recents.forEach((t) => {
      if (!seen.has(t.toLowerCase())) {
        seen.add(t.toLowerCase());
        out.push({ label: t, kind: "recent" });
      }
    });
    COMMON_TITLES.forEach((t) => {
      if (!seen.has(t.toLowerCase())) {
        seen.add(t.toLowerCase());
        out.push({ label: t, kind: "common" });
      }
    });
    return out.slice(0, 10);
  }

  const matches = (s) => s.toLowerCase().includes(q);
  const out = [];
  const seen = new Set();
  const push = (label, kind) => {
    if (seen.has(label.toLowerCase())) return;
    seen.add(label.toLowerCase());
    out.push({ label, kind });
  };

  recents.filter(matches).forEach((t) => push(t, "recent"));
  COMMON_TITLES.filter(matches).forEach((t) => push(t, "common"));

  // "Bachelor of X in Field" combinations when the user types a degree word
  if (q.length >= 3) {
    COMMON_TITLES.filter(matches).slice(0, 3).forEach((degree) => {
      COMMON_FIELDS.slice(0, 6).forEach((field) => {
        push(`${degree} in ${field}`, "combination");
      });
    });
  }

  return out.slice(0, 12);
};

export { COMMON_TITLES, COMMON_FIELDS };
