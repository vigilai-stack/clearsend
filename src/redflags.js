// Fixed red-flag rules. These always run, and nothing a model says can lower
// the level they set. The wording of each rule is kept plain on purpose so a
// clinic can read and change it.

const NEGATION = /\b(no|not|without|denies|deny|never|haven't|havent|hasn't|hasnt|isn't|isnt|don't|dont|didn't|didnt)\b[^.!?\n]{0,25}$/i;

export const RULES = [
  { id: 'chest-pain', level: 'emergency', label: 'Chest pain or pressure',
    pattern: /\bchest\s+(pain|pressure|tightness|hurts?|hurting)\b|\bpain\s+in\s+(my\s+)?chest\b|\bcrushing\b[^.]{0,20}\bchest\b/i },
  { id: 'breathing', level: 'emergency', label: 'Trouble breathing',
    pattern: /\b(can'?t|cannot|can not|hard to|trouble|struggling to|unable to)\s+(breathe|breathing|catch my breath)\b|\bshort(ness)?\s+of\s+breath\b|\bgasping\b/i },
  { id: 'stroke', level: 'emergency', label: 'Possible stroke signs',
    pattern: /\b(face|mouth)\s+(is\s+)?(droop|drooping|droopy)\b|\bslurr(ed|ing)\s+(speech|words)\b|\b(numb|weak|weakness)\b[^.]{0,30}\b(one|left|right)\s+side\b/i },
  { id: 'self-harm', level: 'crisis', label: 'Thoughts of self-harm',
    pattern: /\b(kill|killing|hurt|hurting|harm|harming)\s+(myself|me)\b|\bsuicid(e|al)\b|\bend\s+(my\s+life|it\s+all)\b|\bdon'?t\s+want\s+to\s+(live|be alive)\b/i },
  { id: 'allergic', level: 'emergency', label: 'Severe allergic reaction',
    pattern: /\b(throat|tongue|lips?)\s+(is\s+|are\s+)?(swelling|swollen|closing)\b|\banaphyla/i },
  { id: 'bleeding', level: 'emergency', label: 'Heavy bleeding',
    pattern: /\b(won'?t|will not|can'?t)\s+stop\s+bleeding\b|\bbleeding\s+(heavily|a lot|won'?t stop)\b|\bsoaking\s+through\b/i },
  { id: 'unresponsive', level: 'emergency', label: 'Fainting, seizure or unresponsive',
    pattern: /\b(passed out|fainted|unconscious|unresponsive|seizure|seizing)\b/i },
  { id: 'overdose', level: 'emergency', label: 'Possible overdose',
    pattern: /\b(overdose|overdosed|took too many|took the whole bottle)\b/i },
  { id: 'infant-fever', level: 'urgent', label: 'Fever in a young baby',
    pattern: /\b(newborn|infant|\d{1,2}[- ](week|month)[- ]old)\b[^.]{0,60}\bfever\b|\bfever\b[^.]{0,60}\b(newborn|infant|\d{1,2}[- ](week|month)[- ]old)\b/i },
  { id: 'high-fever', level: 'urgent', label: 'Very high fever',
    pattern: /\b(10[4-9]|11\d)(\.\d)?\s*(°|degrees?)?\s*f?\b[^.]{0,20}\b(fever|temp|temperature)\b|\b(fever|temp|temperature)\b[^.]{0,20}\b(10[4-9]|11\d)(\.\d)?\b/i },
];

const ORDER = { none: 0, urgent: 1, emergency: 2, crisis: 3 };

export function maxLevel(a, b) {
  return (ORDER[a] ?? 0) >= (ORDER[b] ?? 0) ? a : b;
}

function negated(text, index) {
  const start = Math.max(0, text.lastIndexOf('.', index - 1) + 1, text.lastIndexOf('\n', index - 1) + 1);
  return NEGATION.test(text.slice(start, index));
}

export function checkRedFlags(text) {
  const matches = [];
  let level = 'none';
  for (const rule of RULES) {
    const re = new RegExp(rule.pattern.source, rule.pattern.flags.includes('g') ? rule.pattern.flags : rule.pattern.flags + 'g');
    let m;
    while ((m = re.exec(text)) !== null) {
      if (!negated(text, m.index)) {
        matches.push({ id: rule.id, label: rule.label, level: rule.level, text: m[0] });
        level = maxLevel(level, rule.level);
        break;
      }
      if (m[0].length === 0) re.lastIndex++;
    }
  }
  return { level, matches };
}

export const GUIDANCE = {
  crisis: 'Please don\'t wait for a message reply. Call or text 988 (Suicide & Crisis Lifeline) now, or call 911 if you are in danger.',
  emergency: 'This may be an emergency. Please call 911 now. Portal messages can take a day or more to be read.',
  urgent: 'Please call the clinic now instead of sending a message, or go to urgent care if the clinic is closed.',
  none: '',
};
