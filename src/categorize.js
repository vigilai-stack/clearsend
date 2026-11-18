// Keyword fallback for sorting a message when no on-device model is available.

export const CATEGORIES = ['refill', 'appointment', 'billing', 'results', 'symptom', 'forms', 'other'];

const WORDS = {
  refill: /\b(refill|renew|ran out|running out|out of my|prescription|pharmacy|rx)\b/i,
  appointment: /\b(appointment|reschedule|cancel my|book|schedule|visit on|move my)\b/i,
  billing: /\b(bill|billing|charge|charged|invoice|statement|copay|co-pay|insurance claim|refund|balance)\b/i,
  results: /\b(result|results|lab|labs|blood work|bloodwork|x-?ray|mri|ct scan|biopsy|report)\b/i,
  forms: /\b(form|letter|note for (work|school)|disability|fmla|paperwork|records request)\b/i,
  symptom: /\b(pain|hurts?|fever|cough|rash|dizzy|nausea|vomit|swelling|bleeding|headache|symptom|sick|worse)\b/i,
};

const ORDER = ['refill', 'billing', 'appointment', 'results', 'forms', 'symptom'];

export function categorize(text) {
  for (const c of ORDER) if (WORDS[c].test(text)) return c;
  return 'other';
}

// What the care team usually needs before they can act, by category.
const NEEDS = {
  refill: [
    { id: 'med-name', ask: 'Which medicine (name and strength)?', present: /\b[a-z]+(in|ol|ide|one|pril|sartan|statin|mab|cin|zole|pam|lam|tine|ate)\b|\b\d+\s?(mg|mcg|ml|units?)\b/i },
    { id: 'pharmacy', ask: 'Which pharmacy should it go to?', present: /\b(pharmacy|cvs|walgreens|walmart|costco|kroger|h-?e-?b|mail order)\b/i },
  ],
  appointment: [
    { id: 'times', ask: 'Which days or times work for you?', present: /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b|\b(morning|afternoon|evening|am|pm)\b|\b\d{1,2}(:\d{2})?\s?(am|pm)\b/i },
  ],
  billing: [
    { id: 'statement', ask: 'Which bill (statement date or visit date)?', present: /\b(statement|invoice|visit on|dated|from (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|\d{1,2}\/\d{1,2})\b/i },
  ],
  symptom: [
    { id: 'since', ask: 'When did it start?', present: /\b(since|started|for (the past|about|\d+)|yesterday|today|last (night|week)|days?|weeks?|hours?)\b/i },
  ],
};

export function missingInfo(category, text) {
  return (NEEDS[category] || []).filter((n) => !n.present.test(text)).map((n) => n.ask);
}
