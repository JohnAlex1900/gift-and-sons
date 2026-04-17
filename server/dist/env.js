import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "server/.env"),
    path.resolve(__dirname, ".env"),
];
for (const envPath of envPaths) {
    dotenv.config({ path: envPath, override: false });
}
