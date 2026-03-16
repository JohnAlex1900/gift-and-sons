import "./env";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

type FirebaseServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
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
    const parsedAccount = JSON.parse(rawServiceAccount) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };

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
      privateKey: parsedAccount.private_key.replace(/\\n/g, "\n"),
    };
  }

  return {
    projectId: getRequiredEnv("FIREBASE_PROJECT_ID"),
    clientEmail: getRequiredEnv("FIREBASE_CLIENT_EMAIL"),
    privateKey: getRequiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
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
