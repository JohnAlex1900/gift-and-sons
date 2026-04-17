import { getServerApp } from "./app.js";
const PORT = process.env.PORT || 5000;
const start = async () => {
    try {
        const app = await getServerApp();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};
start();
