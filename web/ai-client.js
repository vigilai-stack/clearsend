// Firebase AI Logic hybrid client. Loaded only when web/firebase-config.js
// exists. Without it the app runs on the fixed rules alone.
//
// Routing:
//   - The patient's message: ONLY_ON_DEVICE (Chrome's built-in model). If the
//     on-device model isn't ready, no AI runs and nothing leaves the browser.
//   - A general question that passes cloudGate(): PREFER_ON_DEVICE, which may
//     fall back to the cloud model.

const SDK = '12.5.0'; // Firebase JS SDK. Hybrid inference needs 12.5.0 or later.
const CLOUD_MODEL = 'gemini-3.5-flash-lite';

export async function createAiClient(config) {
  const base = `https://www.gstatic.com/firebasejs/${SDK}`;
  const { initializeApp } = await import(`${base}/firebase-app.js`);
  const { initializeAppCheck, ReCaptchaEnterpriseProvider } = await import(`${base}/firebase-app-check.js`);
  const { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } = await import(`${base}/firebase-ai.js`);
  const { getRemoteConfig, fetchAndActivate, getValue } = await import(`${base}/firebase-remote-config.js`);

  const app = initializeApp(config.firebase);
  if (config.appCheckDebug) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  if (config.recaptchaEnterpriseSiteKey) {
    initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(config.recaptchaEnterpriseSiteKey), isTokenAutoRefreshEnabled: true });
  }
  const ai = getAI(app, { backend: new GoogleAIBackend() });

  // Remote Config kill switch: the clinic can turn cloud answers off for
  // everyone without shipping a new build. Defaults to off until fetched.
  const rc = getRemoteConfig(app);
  rc.defaultConfig = { cloud_questions_enabled: false };
  await fetchAndActivate(rc).catch(() => false);
  const cloudQuestionsEnabled = getValue(rc, 'cloud_questions_enabled').asBoolean();
  const modes = {
    only_on_device: InferenceMode.ONLY_ON_DEVICE,
    prefer_on_device: InferenceMode.PREFER_ON_DEVICE,
  };

  function model(mode, schema) {
    return getGenerativeModel(ai, {
      mode: modes[mode],
      inCloudParams: { model: CLOUD_MODEL, generationConfig: schema ? { responseMimeType: 'application/json' } : undefined },
      onDeviceParams: schema ? { promptOptions: { responseConstraint: schema } } : undefined,
    });
  }

  return {
    cloudQuestionsEnabled,
    async onDeviceStatus() {
      if (!('LanguageModel' in self)) return 'unavailable';
      try { return await self.LanguageModel.availability(); } catch { return 'unavailable'; }
    },
    async generate(prompt, { mode, schema } = {}) {
      const res = await model(mode, schema).generateContent(prompt);
      return res.response.text();
    },
  };
}
