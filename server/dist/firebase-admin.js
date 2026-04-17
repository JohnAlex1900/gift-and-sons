import "./env.js";
import { createPrivateKey } from "crypto";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
const normalizePrivateKey = (privateKey) => {
    const trimmed = privateKey.trim();
    const unwrapped = trimmed.startsWith("\"") && trimmed.endsWith("\"")
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
    const candidateStrings = new Set([normalized]);
    const compact = normalized.replace(/\s+/g, "");
    if (compact !== normalized) {
        candidateStrings.add(compact);
    }
    try {
        const decoded = Buffer.from(normalized, "base64").toString("utf8");
        if (decoded.trim().length > 0) {
            candidateStrings.add(decoded
                .replace(/\\+r\\+n/g, "\n")
                .replace(/\\+n/g, "\n")
                .replace(/\r\n/g, "\n")
                .trim());
        }
    }
    catch {
        // Ignore invalid base64 candidates.
    }
    const tryCanonicalize = (value) => {
        const formats = [
            { format: "pem" },
            { format: "der", type: "pkcs8" },
            { format: "der", type: "pkcs1" },
        ];
        for (const options of formats) {
            try {
                const keyObject = createPrivateKey({
                    key: value,
                    ...options,
                });
                return keyObject.export({ format: "pem", type: "pkcs8" });
            }
            catch {
                // Try the next representation.
            }
        }
        return null;
    };
    for (const candidate of candidateStrings) {
        const canonical = tryCanonicalize(candidate);
        if (canonical) {
            return canonical.replace(/\r\n/g, "\n").trim();
        }
        if (candidate.includes("-----BEGIN PRIVATE KEY-----")) {
            const bodyMatch = candidate.match(/-----BEGIN PRIVATE KEY-----\s*([A-Za-z0-9+/=\s]+)\s*-----END PRIVATE KEY-----/);
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
    throw new Error("Unable to parse Firebase private key. Provide a PKCS8 PEM private key (BEGIN PRIVATE KEY) or base64-encoded service account JSON.");
};
const parseServiceAccountJson = (rawValue) => {
    const candidateValues = [rawValue];
    // Allow base64-encoded JSON for easier deployment secret handling.
    try {
        candidateValues.push(Buffer.from(rawValue, "base64").toString("utf8"));
    }
    catch {
        // Ignore invalid base64 candidate.
    }
    for (const candidate of candidateValues) {
        try {
            return JSON.parse(candidate);
        }
        catch {
            // Try next candidate.
        }
    }
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON (plain or base64-encoded)");
};
const getRequiredEnv = (key) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required server environment variable: ${key}`);
    }
    return value;
};
const getServiceAccountFromEnv = () => {
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (rawServiceAccount) {
        const parsedAccount = parseServiceAccountJson(rawServiceAccount);
        if (!parsedAccount.project_id ||
            !parsedAccount.client_email ||
            !parsedAccount.private_key) {
            throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must include project_id, client_email, and private_key");
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
const app = getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert(serviceAccount),
    });
export const adminAuth = getAuth(app);
export const db = getFirestore(app);
