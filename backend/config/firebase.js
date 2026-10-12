
const {
  initializeApp,
  getApps,
  cert,
} = require("firebase-admin/app");

function normalizePrivateKey(value) {
  if (!value || typeof value !== "string") {
    return value;
  }

  // Convert escaped newline characters from environment variables
  // into real newline characters.
  return value.replace(/\\n/g, "\n").trim();
}

function credentialFromEnv() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (json) {
    let serviceAccount;

    try {
      serviceAccount = JSON.parse(json);
    } catch (error) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON."
      );
    }

    if (!serviceAccount.project_id || !serviceAccount.client_email) {
      throw new Error(
        "Firebase service account JSON is missing project_id or client_email."
      );
    }

    if (serviceAccount.private_key) {
      serviceAccount.private_key = normalizePrivateKey(
        serviceAccount.private_key
      );
    }

    return cert(serviceAccount);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = normalizePrivateKey(
    process.env.FIREBASE_PRIVATE_KEY
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials missing. Check backend/.env."
    );
  }

  return cert({
    projectId,
    clientEmail,
    privateKey,
  });
}

function getAdmin() {
  const existingApps = getApps();

  if (existingApps.length > 0) {
    return existingApps[0];
  }

  const credential = credentialFromEnv();

  return initializeApp({
    credential,
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      "shelter-of-hope-464e5.firebasestorage.app",
  });
}

module.exports = { getAdmin };
