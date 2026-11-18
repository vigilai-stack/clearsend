// Decides where AI may run. The patient's message itself is always
// device-only. The cloud model can only see a general question, and only
// after this gate finds nothing personal in it.

import { NEVER_SEND, DEVICE_ONLY } from './scrub.js';
import { checkRedFlags } from './redflags.js';

const FIRST_PERSON_HEALTH = /\b(i|i'm|im|i've|ive|my|me|mine|we|our|my (son|daughter|wife|husband|mom|dad|child|baby))\b[^.?!]{0,60}\b(have|had|taking|take|diagnos\w*|pain|hurts?|medicine|medication|meds|results?|pregnan\w*|symptoms?|feel\w*|sick|dose|prescri\w*|condition)\b/i;

export function cloudGate(text) {
  const reasons = [];
  for (const r of [...NEVER_SEND, ...DEVICE_ONLY]) {
    const re = new RegExp(r.pattern.source, r.pattern.flags.replace('g', ''));
    const m = re.exec(text);
    if (m && (!r.accept || r.accept(m[0], text, m.index))) reasons.push(r.label);
  }
  if (FIRST_PERSON_HEALTH.test(text)) reasons.push('Describes your own health');
  if (checkRedFlags(text).level !== 'none') reasons.push('Mentions a red-flag symptom');
  return { cloudAllowed: reasons.length === 0, reasons };
}

// Firebase AI Logic inference modes, as plain strings so this file has no
// Firebase dependency and can be unit tested.
export const MODE = {
  ONLY_ON_DEVICE: 'only_on_device',
  PREFER_ON_DEVICE: 'prefer_on_device',
};

export function modeForMessage() {
  return MODE.ONLY_ON_DEVICE;
}

export function modeForQuestion(text) {
  return cloudGate(text).cloudAllowed ? MODE.PREFER_ON_DEVICE : MODE.ONLY_ON_DEVICE;
}
