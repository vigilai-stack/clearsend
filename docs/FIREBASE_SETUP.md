# Firebase setup (free Spark plan)

Everything here is on the no-cost Spark plan. If the console ever asks for a card or an upgrade to Blaze, stop. Nothing in ClearSend needs it.

1. **Create the project.** At console.firebase.google.com, click Add project and name it `clearsend`. Google Analytics isn't needed.
2. **Add a web app.** In Project settings > Your apps, click the Web icon and name it `clearsend-web`. Copy the config values into `web/firebase-config.js` (start from `web/firebase-config.example.js`). That file is git-ignored.
3. **Turn on Firebase AI Logic.** In Build > AI Logic, click Get started and choose the **Gemini Developer API** (it has a free tier). The guided setup turns on App Check enforcement for AI Logic.
4. **App Check.**
   - For local testing, set `appCheckDebug: true`, open the page once, copy the debug token from the browser console, and register it under App Check > Apps > your web app > Manage debug tokens.
   - For the hosted demo the judges use, register a reCAPTCHA Enterprise key and put the site key in `recaptchaEnterpriseSiteKey`.
5. **Remote Config.** Add a boolean parameter `cloud_questions_enabled`, set it to `true` and publish. Setting it to `false` keeps every general question on the device.
6. **Chrome on-device model.** In desktop Chrome 139 or later, enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`, restart, then open the page and wait for the "On-device model ready" banner. The first download can take several minutes.
7. **Hosting (needs Sangeeta's go-ahead).** Run `firebase deploy --only hosting` with `public` set to the repo root and the start page at `/web/`. It's free on Spark, but it publishes a public URL, so only do it after she says yes.

The first real run should confirm that structured output on the device (`onDeviceParams.promptOptions.responseConstraint`) is accepted by the SDK version in `web/ai-client.js`. If it isn't, the strict answer check falls back to rules safely. Fix the option name, then re-record.
