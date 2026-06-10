// ─── Date Utilities ───────────────────────────────────────────────────────────

const SHORT_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const LONG_MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

/**
 * Returns a "YYYY-MM-DD" key for the given day offset (0 = today, -1 = yesterday, 1 = tomorrow).
 */
export function getDateKey(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns display info for the tab card and header labels.
 */
export function getTabInfo(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return {
    dayName:   SHORT_DAYS[d.getDay()],                                   // "Thu"
    shortDate: `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`,           // "11 Jun"
    fullDate:  `${d.getDate()} ${LONG_MONTHS[d.getMonth()]} ${d.getFullYear()}`, // "11 June 2026"
  };
}
