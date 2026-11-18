# ClearSend

A private pre-check for patient portal messages. Before a message goes to the clinic, ClearSend does three things:

1. **Spots red-flag symptoms.** If someone types "chest pain since this morning, should I come in tomorrow?" into a portal message, they may wait a day or more for a reply. ClearSend tells them to call 911 now. These checks are fixed rules that always run, and no model can switch them off.
2. **Takes out things a clinic never needs in a message:** Social Security numbers, full card numbers, passwords and PINs, bank account numbers. Patients send these more often than you'd think.
3. **Gets the message ready for the person who reads it:** which desk it should go to (refills, billing, scheduling, nurse line), a one-line summary for the front desk, and the questions the care team will probably ask ("Which pharmacy?").

Built for #BuildHybridAI 2026. **All test messages are made up. This is not medical advice and not a medical device.**

## Where the AI runs

| What | Where | Why |
|---|---|---|
| The patient's message | **On the device only** (Chrome's built-in model through Firebase AI Logic, `ONLY_ON_DEVICE`) | It's health information. If the on-device model isn't ready, ClearSend uses the fixed rules and sends nothing anywhere. |
| A general question ("What does prior authorization mean?") | On the device first, cloud allowed (`PREFER_ON_DEVICE`) | Only after `cloudGate()` finds no identifiers, nothing about the person's own health and no red-flag words. A Remote Config switch can turn cloud answers off for everyone. |
| Red flags and removals | Plain code, in the browser | Safety checks shouldn't depend on a model. |

The model's answer must match a fixed JSON shape (`src/model-output.js`). Anything else is thrown away and the rules-only result stands. The model can raise a message to urgent but can never lower a red flag, and the message is fenced in the prompt as data, not instructions.

## Run it

Needs Node 20 or later. There's nothing to install.

```
npm test          # 39 unit tests
npm run eval      # synthetic set: red flags caught, items removed (writes docs/EVAL.md)
npm run serve     # then open http://localhost:8080/web/ in Chrome
```

With no Firebase config, the page runs in demo mode (fixed rules only). To turn on the on-device model and the Firebase pieces, follow [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md).

## Results on the synthetic set

See [docs/EVAL.md](docs/EVAL.md). On 40 made-up messages: 16 of 16 red-flag messages caught, 0 false alarms on 24 calm messages, and 8 of 8 planted "never send" items removed. I wrote these messages myself while building the rules, so they show the rules do what they claim. They don't prove how ClearSend would do on real patient messages. A held-out set written by someone else is the next step.

## Layout

```
src/redflags.js      fixed red-flag rules with simple negation ("no chest pain")
src/scrub.js         never-send removal; cloud masking for identifiers
src/route.js         where AI may run (device-only vs cloud allowed)
src/model-output.js  prompt, JSON schema, strict answer checking
src/precheck.js      puts it together; falls back to rules on any model problem
web/                 the page, plus the Firebase AI Logic client
data/                40 synthetic messages with expected labels
test/                node:test unit tests
```

## Limits

- The red-flag rules are a short, fixed list in English. They will miss phrasings nobody thought of, which is why the guidance always says to call when in doubt.
- Name detection isn't attempted. Names are fine in a message to your own clinic, and they never go to the cloud model because the message itself never does.
- On-device inference needs desktop Chrome 139 or later with the built-in model downloaded.

## License

MIT, Sangeeta Sinha | VigilAI Solutions LLC.
