
const { initializeApp, getApps, cert } = require("firebase-admin/app");

function credentialFromEnv() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (json) {
    const serviceAccount = JSON.parse(json);

    if (serviceAccount.private_key) {
      serviceAccount.private_key =
        serviceAccount.private_key.replace(/\\n/g, "\n");
    }

    return cert(serviceAccount);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials missing. Check backend/.env"
    );
  }

  return cert({
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n").trim(),
  });
}

function getAdmin() {
  const existingApps = getApps();

  if (existingApps.length > 0) {
    return existingApps[0];
  }

  try {
    return initializeApp({
      credential: credentialFromEnv(),
      storageBucket:
        process.env.FIREBASE_STORAGE_BUCKET ||
        "shelter-of-hope-464e5.firebasestorage.app",
    });
  } catch (err) {
    console.error("Firebase initialization failed:", err.stack || err);
    throw err;
  }
}

module.exports = { getAdmin };
