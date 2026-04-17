import "./env";

import { createPrivateKey } from "crypto";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

type FirebaseServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

type FirebaseCredentialSource =
  | "FIREBASE_SERVICE_ACCOUNT_JSON"
  | "FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY";

const isPublicOrCertificateKey = (value: string) =>
  value.includes("-----BEGIN CERTIFICATE-----") ||
  value.includes("-----BEGIN PUBLIC KEY-----") ||
  value.includes("-----BEGIN RSA PUBLIC KEY-----");

const assertPrivateKeyShape = (value: string, source: string) => {
  if (isPublicOrCertificateKey(value)) {
    throw new Error(
      `${source} contains a certificate/public key, not a Firebase service-account private key. Use the PEM value from the service account JSON private_key field.`
    );
  }

  if (!value.includes("-----BEGIN PRIVATE KEY-----") && !value.includes("-----BEGIN RSA PRIVATE KEY-----")) {
    throw new Error(
      `${source} does not look like a Firebase service-account private key. Provide the private_key from the service account JSON or the full FIREBASE_SERVICE_ACCOUNT_JSON secret.`
    );
  }
};

const normalizePrivateKey = (privateKey: string) => {
  const trimmed = privateKey.trim();
  const unwrapped =
    trimmed.startsWith('"') && trimmed.endsWith('"')
      ? trimmed.slice(1, -1)
      : trimmed;
  const decodedUri = unwrapped.includes("%")
    ? decodeURIComponent(unwrapped)
    : unwrapped;
  const normalized = decodedUri
    .replace(/\\+r\\+n/g, "\n")
    .replace(/\\+n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();

  const candidateStrings = new Set<string>([normalized]);

  const compact = normalized.replace(/\s+/g, "");
  if (compact !== normalized) {
    candidateStrings.add(compact);
  }

  try {
    const decoded = Buffer.from(normalized, "base64").toString("utf8");
    if (decoded.trim().length > 0) {
      candidateStrings.add(
        decoded
          .replace(/\\+r\\+n/g, "\n")
          .replace(/\\+n/g, "\n")
          .replace(/\r\n/g, "\n")
          .trim()
      );
    }
  } catch {
    // Ignore invalid base64 candidates.
  }

  const tryCanonicalize = (value: string) => {
    const formats = [
      { format: "pem" as const },
      { format: "der" as const, type: "pkcs8" as const },
      { format: "der" as const, type: "pkcs1" as const },
    ];

    for (const options of formats) {
      try {
        const keyObject = createPrivateKey({
          key: value,
          ...options,
        });

        return keyObject.export({ format: "pem", type: "pkcs8" }) as string;
      } catch {
        // Try the next representation.
      }
    }

    return null;
  };

  for (const candidate of candidateStrings) {
    if (isPublicOrCertificateKey(candidate)) {
      throw new Error(
        "Firebase private key parsing failed because the value appears to be a certificate/public key. Replace it with the service-account private_key PEM."
      );
    }

    const canonical = tryCanonicalize(candidate);
    if (canonical) {
      return canonical.replace(/\r\n/g, "\n").trim();
    }

    if (candidate.includes("-----BEGIN PRIVATE KEY-----")) {
      const bodyMatch = candidate.match(
        /-----BEGIN PRIVATE KEY-----\s*([A-Za-z0-9+/=\s]+)\s*-----END PRIVATE KEY-----/
      );

      if (bodyMatch?.[1]) {
        const wrappedBody = bodyMatch[1].replace(/\s+/g, "");
        const reconstructed = `-----BEGIN PRIVATE KEY-----\n${wrappedBody}\n-----END PRIVATE KEY-----`;
        const reconstructedCanonical = tryCanonicalize(reconstructed);
        if (reconstructedCanonical) {
          return reconstructedCanonical.replace(/\r\n/g, "\n").trim();
        }
      }
    }
  }

  throw new Error(
    "Unable to parse Firebase private key. Provide a PKCS8 PEM private key (BEGIN PRIVATE KEY) or base64-encoded service account JSON."
  );
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

const getServiceAccountFromEnv = (): {
  serviceAccount: FirebaseServiceAccount;
  source: FirebaseCredentialSource;
} => {
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
      serviceAccount: {
        projectId: parsedAccount.project_id,
        clientEmail: parsedAccount.client_email,
        privateKey: (() => {
          const normalized = normalizePrivateKey(parsedAccount.private_key);
          assertPrivateKeyShape(normalized, "FIREBASE_SERVICE_ACCOUNT_JSON.private_key");
          return normalized;
        })(),
      },
      source: "FIREBASE_SERVICE_ACCOUNT_JSON",
    };
  }

  const rawPrivateKey = getRequiredEnv("FIREBASE_PRIVATE_KEY");
  const normalizedPrivateKey = normalizePrivateKey(rawPrivateKey);
  assertPrivateKeyShape(normalizedPrivateKey, "FIREBASE_PRIVATE_KEY");

  return {
    serviceAccount: {
      projectId: getRequiredEnv("FIREBASE_PROJECT_ID"),
      clientEmail: getRequiredEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: normalizedPrivateKey,
    },
    source: "FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY",
  };
};

const { serviceAccount, source: credentialSource } = getServiceAccountFromEnv();

const serviceAccountDomain = serviceAccount.clientEmail.split("@")[1] || "";
if (!serviceAccountDomain.endsWith(".iam.gserviceaccount.com")) {
  console.warn(
    `[firebase-admin] clientEmail does not look like a service account email: ${serviceAccount.clientEmail}`
  );
}

if (
  serviceAccountDomain.includes(".iam.gserviceaccount.com") &&
  !serviceAccountDomain.includes(serviceAccount.projectId)
) {
  console.warn(
    `[firebase-admin] projectId (${serviceAccount.projectId}) and clientEmail (${serviceAccount.clientEmail}) appear to be from different projects.`
  );
}

console.info(
  `[firebase-admin] Initializing with source=${credentialSource}, projectId=${serviceAccount.projectId}, clientEmail=${serviceAccount.clientEmail}`
);

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert(serviceAccount),
      });

export const adminAuth = getAuth(app);
export const db = getFirestore(app);

let firebaseCredentialVerificationPromise: Promise<void> | null = null;

export const verifyFirebaseAdminCredentials = async () => {
  if (!firebaseCredentialVerificationPromise) {
    firebaseCredentialVerificationPromise = (async () => {
      try {
        // A tiny read verifies credential exchange/token generation against Firestore.
        await db.collection("properties").limit(1).get();
        console.info("[firebase-admin] Firestore credential verification succeeded.");
      } catch (error) {
        const code =
          typeof error === "object" && error && "code" in error
            ? (error as { code?: unknown }).code
            : undefined;
        const message =
          typeof error === "object" && error && "message" in error
            ? (error as { message?: unknown }).message
            : undefined;

        const isUnauthenticated =
          code === 16 ||
          code === "16" ||
          code === "UNAUTHENTICATED" ||
          (typeof message === "string" &&
            message.toUpperCase().includes("UNAUTHENTICATED"));

        if (isUnauthenticated) {
          throw new Error(
            `Firebase Admin authentication failed (code 16 UNAUTHENTICATED). Verify that FIREBASE_SERVICE_ACCOUNT_JSON is a valid, active service-account key for project ${serviceAccount.projectId}, and that the client_email/private_key are from the same key file.`
          );
        }

        throw error;
      }
    })();

    firebaseCredentialVerificationPromise.catch(() => {
      firebaseCredentialVerificationPromise = null;
    });
  }

  return firebaseCredentialVerificationPromise;
};
