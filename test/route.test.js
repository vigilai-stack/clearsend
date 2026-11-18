import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cloudGate, modeForMessage, modeForQuestion, MODE } from '../src/route.js';

test('the patient message is always device-only', () => {
  assert.equal(modeForMessage(), MODE.ONLY_ON_DEVICE);
});
test('a general question may use the cloud', () => {
  assert.equal(modeForQuestion('What does prior authorization mean?'), MODE.PREFER_ON_DEVICE);
  assert.ok(cloudGate('What is a deductible?').cloudAllowed);
});
test('a question about your own health stays on the device', () => {
  const g = cloudGate('I have diabetes, what does A1C mean for my results?');
  assert.equal(g.cloudAllowed, false);
  assert.ok(g.reasons.includes('Describes your own health'));
});
test('identifiers block the cloud', () => {
  assert.equal(cloudGate('What is a copay? my email is a@b.co').cloudAllowed, false);
  assert.equal(cloudGate('What is MRN 12345-B for?').cloudAllowed, false);
});
test('red-flag words block the cloud', () => {
  assert.equal(modeForQuestion('What does chest pain usually mean?'), MODE.ONLY_ON_DEVICE);
});
