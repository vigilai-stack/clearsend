// Finds things that should never travel in a portal message, plus identifiers
// that should never leave the device. Nothing here guesses at names.

function luhn(digits) {
  let sum = 0, alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}

// "Never send" items: removed from the message itself, with the patient's OK.
export const NEVER_SEND = [
  { id: 'ssn', label: 'Social Security or tax ID number', mask: '[SSN removed]',
    pattern: /\b(?!000|666)\d{3}[- ]?(?!00)\d{2}[- ]?(?!0000)\d{4}\b/g,
    accept: (m, text, idx) => /\d{3}-\d{2}-\d{4}|\d{3} \d{2} \d{4}/.test(m) || /\b(ssn|social)\b/i.test(text.slice(Math.max(0, idx - 30), idx)) },
  { id: 'card', label: 'Payment card number', mask: '[card number removed]',
    pattern: /\b(?:\d[ -]?){13,19}\b/g,
    accept: (m) => { const d = m.replace(/\D/g, ''); return d.length >= 13 && d.length <= 19 && luhn(d); } },
  { id: 'password', label: 'Password or PIN', mask: '[password removed]',
    pattern: /\b(password|passcode|pin)\s*(is|:|=)\s*\S+/gi, accept: () => true },
  { id: 'bank', label: 'Bank account or routing number', mask: '[bank number removed]',
    pattern: /\b(account|acct|routing)\s*(number|no\.?|#)?\s*(is|:)?\s*\d{6,17}\b/gi, accept: () => true },
];

// Identifiers that are fine to send to your own clinic but must never reach a
// cloud model. Used only to decide routing and to build the cloud-safe copy.
export const DEVICE_ONLY = [
  { id: 'email', label: 'Email address', mask: '[email]', pattern: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g },
  { id: 'phone', label: 'Phone number', mask: '[phone]', pattern: /(?:\+?1[ .-]?)?\(?\b\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}\b/g },
  { id: 'date', label: 'Date', mask: '[date]', pattern: /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(st|nd|rd|th)?,?\s+\d{4}\b/gi },
  { id: 'mrn', label: 'Record or member number', mask: '[id]', pattern: /\b(mrn|member\s*id|medical record|policy|chart)\s*(number|no\.?|#|id)?\s*[:#]?\s*[A-Z0-9-]{5,}\b/gi },
  { id: 'address', label: 'Street address', mask: '[address]', pattern: /\b\d{1,5}\s+([A-Z][a-z]+\s){1,3}(St|Street|Ave|Avenue|Rd|Road|Blvd|Lane|Ln|Dr|Drive|Ct|Court|Way)\b\.?/g },
];

function apply(text, rules, useAccept) {
  const found = [];
  let out = text;
  for (const r of rules) {
    out = out.replace(r.pattern, (m, ...rest) => {
      const idx = rest[rest.length - 2];
      const whole = rest[rest.length - 1];
      if (useAccept && r.accept && !r.accept(m, whole, idx)) return m;
      found.push({ id: r.id, label: r.label });
      return r.mask;
    });
  }
  return { text: out, found };
}

export function scrubNeverSend(text) {
  return apply(text, NEVER_SEND, true);
}

export function maskForCloud(text) {
  const a = scrubNeverSend(text);
  const b = apply(a.text, DEVICE_ONLY, false);
  return { text: b.text, found: [...a.found, ...b.found] };
}
