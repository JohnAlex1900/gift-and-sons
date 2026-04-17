import "./env.js";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
const normalizePrivateKey = (privateKey) => {
    const trimmed = privateKey.trim();
    const unwrapped = trimmed.startsWith("\"") && trimmed.endsWith("\"")
        ? trimmed.slice(1, -1)
        : trimmed;
    const normalized = unwrapped.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
    if (normalized.includes("-----BEGIN PRIVATE KEY-----")) {
        return normalized;
    }
    try {
        const decoded = Buffer.from(normalized, "base64").toString("utf8");
        if (decoded.includes("-----BEGIN PRIVATE KEY-----")) {
            return decoded.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
        }
    }
    catch {
        // Fall through to the normalized value below.
    }
    const compact = normalized.replace(/\s+/g, "");
    if (/^[A-Za-z0-9+/=]+$/.test(compact) && compact.length > 100) {
        const wrappedBody = compact.match(/.{1,64}/g)?.join("\n") ?? compact;
        return `-----BEGIN PRIVATE KEY-----\n${wrappedBody}\n-----END PRIVATE KEY-----`;
    }
    return normalized;
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
