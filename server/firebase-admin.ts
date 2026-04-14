import "./env";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

type FirebaseServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

const normalizePrivateKey = (privateKey: string) => {
  const trimmed = privateKey.trim();
  const unwrapped =
    trimmed.startsWith('"') && trimmed.endsWith('"')
      ? trimmed.slice(1, -1)
      : trimmed;

  return unwrapped.replace(/\\n/g, "\n");
};

const parseServiceAccountJson = (rawValue: string) => {
  const candidateValues = [rawValue];

  // Allow base64-encoded JSON for easier deployment secret handling.
  try {
    candidateValues.push(Buffer.from(rawValue, "base64").toString("utf8"));
  } catch {
    // Ignore invalid base64 candidate.
  }

  for (const candidate of candidateValues) {
    try {
      return JSON.parse(candidate) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
    } catch {
      // Try next candidate.
    }
  }

  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON (plain or base64-encoded)"
  );
};

const getRequiredEnv = (key: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required server environment variable: ${key}`);
  }

  return value;
};

const getServiceAccountFromEnv = (): FirebaseServiceAccount => {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (rawServiceAccount) {
    const parsedAccount = parseServiceAccountJson(rawServiceAccount);

    if (
      !parsedAccount.project_id ||
      !parsedAccount.client_email ||
      !parsedAccount.private_key
    ) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON must include project_id, client_email, and private_key"
      );
    }

    return {
      projectId: parsedAccount.project_id,
      clientEmail: parsedAccount.client_email,
      privateKey: normalizePrivateKey(parsedAccount.private_key),
    };
  }

  return {
    projectId: getRequiredEnv("FIREBASE_PROJECT_ID"),
    clientEmail: getRequiredEnv("FIREBASE_CLIENT_EMAIL"),
    privateKey: normalizePrivateKey(getRequiredEnv("FIREBASE_PRIVATE_KEY")),
  };
};

const serviceAccount = getServiceAccountFromEnv();

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert(serviceAccount),
      });

export const adminAuth = getAuth(app);
export const db = getFirestore(app);
