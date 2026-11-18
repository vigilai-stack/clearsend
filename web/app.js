import { precheck } from '../src/precheck.js';
import { cloudGate, modeForQuestion } from '../src/route.js';

const $ = (id) => document.getElementById(id);
const LABELS = { refill: 'Prescription refills', appointment: 'Scheduling', billing: 'Billing office', results: 'Test results', symptom: 'Nurse line (symptoms)', forms: 'Forms and letters', other: 'Front desk' };

let client = null;

async function start() {
  try {
    const cfg = (await import('./firebase-config.js')).default;
    const { createAiClient } = await import('./ai-client.js');
    client = await createAiClient(cfg);
    const status = await client.onDeviceStatus();
    $('mode').textContent = status === 'available'
      ? 'On-device model ready. Your message is checked on this computer.'
      : `On-device model ${status}. Messages are checked with fixed rules only, and nothing is sent to a cloud model.`;
  } catch {
    $('mode').textContent = 'Demo mode: fixed rules only. Nothing leaves this page.';
  }
  const samples = await (await fetch('../data/synthetic-messages.json')).json();
  for (const s of samples.slice(0, 12)) {
    const o = document.createElement('option');
    o.value = s.text; o.textContent = s.text.slice(0, 60) + (s.text.length > 60 ? '…' : '');
    $('samples').append(o);
  }
}

function list(el, items) {
  el.replaceChildren(...items.map((t) => { const li = document.createElement('li'); li.textContent = t; return li; }));
}

$('samples').addEventListener('change', (e) => { if (e.target.value) $('msg').value = e.target.value; });

$('check').addEventListener('click', async () => {
  const r = await precheck($('msg').value, { model: client });
  const alert = $('alert');
  alert.hidden = r.level === 'none';
  alert.className = 'alert' + (r.level === 'crisis' ? ' crisis' : '');
  alert.textContent = r.guidance + (r.redFlags.length ? ` (${r.redFlags.map((f) => f.label).join(', ')})` : '');
  $('result').hidden = false;
  $('category').textContent = LABELS[r.category] || r.category;
  $('summary').textContent = r.summary || 'Summary needs the on-device model. The first line of your message will be shown instead.';
  $('removed-box').hidden = r.removed.length === 0;
  list($('removed'), r.removed.map((f) => f.label));
  $('missing-box').hidden = r.missing.length === 0;
  list($('missing'), r.missing);
  $('send').textContent = r.sendText;
  $('route').textContent = r.route === 'on-device' ? 'Checked by the on-device model plus fixed rules.' : (r.note || 'Checked by fixed rules.');
});

$('ask').addEventListener('click', async () => {
  const q = $('q').value.trim();
  if (!q) return;
  const gate = cloudGate(q);
  if (!client) { $('answer').textContent = 'Answers need the Firebase setup (see docs/FIREBASE_SETUP.md).'; return; }
  if (!gate.cloudAllowed || !client.cloudQuestionsEnabled) {
    const status = await client.onDeviceStatus();
    if (status !== 'available') { $('answer').textContent = gate.cloudAllowed ? 'Cloud answers are switched off by the clinic, and the on-device model isn\'t ready.' : `Kept on this computer because it includes: ${gate.reasons.join(', ')}. The on-device model isn't ready, so there's no answer yet.`; return; }
  }
  try {
    const mode = client.cloudQuestionsEnabled ? modeForQuestion(q) : 'only_on_device';
    const text = await client.generate(`Answer this general question about clinics or health insurance in plain words, in under 80 words. Do not give personal medical advice.\n\n${q}`, { mode });
    $('answer').textContent = text;
  } catch (e) {
    $('answer').textContent = `No answer (${e.message}).`;
  }
});

start();
