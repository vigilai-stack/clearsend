import { checkRedFlags, maxLevel, GUIDANCE } from './redflags.js';
import { scrubNeverSend } from './scrub.js';
import { categorize, missingInfo } from './categorize.js';
import { buildPrompt, parseModelOutput, RESPONSE_SCHEMA } from './model-output.js';
import { modeForMessage } from './route.js';

// model: optional { onDeviceStatus(): Promise<string>, generate(prompt, { mode, schema }): Promise<string> }
export async function precheck(text, { model } = {}) {
  const message = String(text ?? '');
  const flags = checkRedFlags(message);
  const scrub = scrubNeverSend(message);

  const result = {
    level: flags.level,
    redFlags: flags.matches,
    guidance: GUIDANCE[flags.level],
    removed: scrub.found,
    sendText: scrub.text,
    category: categorize(message),
    summary: null,
    missing: [],
    route: 'rules-only',
    note: null,
  };
  result.missing = missingInfo(result.category, message);

  if (!model) {
    result.note = 'No on-device model. Rules only.';
    return result;
  }
  const status = await model.onDeviceStatus().catch(() => 'unavailable');
  if (status !== 'available') {
    result.note = `On-device model ${status}. Rules only; the message was not sent to any cloud model.`;
    return result;
  }
  let raw;
  try {
    raw = await model.generate(buildPrompt(scrub.text), { mode: modeForMessage(), schema: RESPONSE_SCHEMA });
  } catch (err) {
    result.note = `On-device model error (${err?.message || 'unknown'}). Rules only.`;
    return result;
  }
  const parsed = parseModelOutput(raw);
  if (!parsed.ok) {
    result.note = `Model answer rejected (${parsed.reason}). Rules only.`;
    return result;
  }
  const v = parsed.value;
  result.route = 'on-device';
  result.category = v.category;
  result.summary = v.summary;
  const ruleAsks = missingInfo(v.category, message);
  result.missing = [...new Set([...ruleAsks, ...v.missing])].slice(0, 4);
  // The model may raise the level to urgent. It can never lower it.
  if (v.urgent) {
    const raised = maxLevel(result.level, 'urgent');
    if (raised !== result.level) {
      result.level = raised;
      result.guidance = GUIDANCE[raised];
      result.note = 'Raised to urgent by the on-device model.';
    }
  }
  return result;
}
