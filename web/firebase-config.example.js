// Copy to web/firebase-config.js and fill in from the Firebase console
// (Project settings > Your apps > Web app). These values identify the
// project; they are not secrets, but App Check must be enforced for
// Firebase AI Logic. web/firebase-config.js is git-ignored.
export default {
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: '',
  },
  recaptchaEnterpriseSiteKey: '',
  appCheckDebug: true, // local development only; register the debug token in the console
};
