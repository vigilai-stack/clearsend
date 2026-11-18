import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrubNeverSend, maskForCloud } from '../src/scrub.js';

test('removes a dashed SSN', () => {
  const r = scrubNeverSend('my ssn is 123-45-6789 ok');
  assert.equal(r.text, 'my ssn is [SSN removed] ok');
  assert.equal(r.found[0].id, 'ssn');
});
test('removes an unformatted SSN only when context says so', () => {
  assert.match(scrubNeverSend('social security 123456789').text, /SSN removed/);
  assert.doesNotMatch(scrubNeverSend('order number 123456789').text, /SSN removed/);
});
test('removes Luhn-valid card numbers and leaves other long numbers', () => {
  assert.match(scrubNeverSend('card 4111 1111 1111 1111').text, /card number removed/);
  assert.doesNotMatch(scrubNeverSend('ref 1234 5678 9012 3456').text, /card number removed/);
});
test('removes passwords and PINs', () => {
  assert.match(scrubNeverSend('password: hunter2').text, /password removed/);
  assert.match(scrubNeverSend('My PIN is 4471').text, /password removed/);
});
test('removes bank account numbers', () => {
  assert.match(scrubNeverSend('account number 004512345678').text, /bank number removed/);
});
test('leaves ordinary clinical text alone', () => {
  const t = 'Lisinopril 10 mg, 30 tablets, seen on Monday.';
  assert.equal(scrubNeverSend(t).text, t);
});
test('cloud mask also hides email, phone, dates, ids and addresses', () => {
  const r = maskForCloud('Email jo@example.com, call 512-555-0134, DOB 04/12/1980, MRN 88231-A, 12 Oak Street.');
  for (const m of ['[email]', '[phone]', '[date]', '[id]', '[address]']) assert.ok(r.text.includes(m), m);
});
