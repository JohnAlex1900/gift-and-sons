import storage from "./storage.js";
import { adminAuth } from "./firebase-admin.js";
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "./uploadthing.js";
import nodemailer from "nodemailer";
export async function registerRoutes(app) {
    // Auth middleware
    const requireAuth = async (req, res, next) => {
        try {
            const token = req.headers.authorization?.split("Bearer ")[1];
            if (!token)
                throw new Error("No token provided");
            const decodedToken = await adminAuth.verifyIdToken(token);
            req.user = decodedToken; // Add the user property to the Request object
            next();
        }
        catch (error) {
            res.status(401).json({ message: "Unauthorized" });
        }
    };
    try {
        app.use("/api/uploadthing", createRouteHandler({
            router: uploadRouter,
            config: {}, // Optional configuration
        }));
        console.log("\u2705 UploadThing API registered at /api/uploadthing");
    }
    catch (error) {
        console.error("\u274C UploadThing setup skipped:", error);
    }
    // Properties endpoints
    app.get("/api/properties", async (req, res) => {
        try {
            const properties = await storage.getAllProperties();
            res.json(properties);
        }
        catch (error) {
            console.error("\u274C Error fetching properties:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    app.get("/api/properties/featured", async (req, res) => {
        try {
            const properties = await storage.getFeaturedProperties();
            res.json(properties);
        }
        catch (error) {
            console.error("\u274C Error fetching featured properties:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    app.get("/api/properties/:id", async (req, res) => {
        const { id } = req.params;
        try {
            const property = await storage.getPropertyById(id);
            if (!property) {
                return res.status(404).json({ message: "Property not found" });
            }
            res.json(property);
        }
        catch (error) {
            console.error("\u274C Error fetching property:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    // Admin property management
    app.post("/api/properties", async (req, res) => {
        try {
            const propertyData = req.body;
            const property = await storage.addProperty(propertyData);
            res.status(201).json(property);
        }
        catch (error) {
            console.error("\u274C Error adding property:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    app.patch("/api/properties/:id", async (req, res) => {
        const { id } = req.params;
        try {
            const updatedData = req.body;
            const property = await storage.updateProperty(id, updatedData);
            res.json(property);
        }
        catch (error) {
            console.error("\u274C Error updating property:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    app.delete("/api/properties/:id", async (req, res) => {
        const { id } = req.params;
        try {
            await storage.deleteProperty(id);
            res.status(204).send();
        }
        catch (error) {
            console.error("\u274C Error deleting property:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    // Reviews
    app.post("/api/reviews", async (req, res) => {
        try {
            console.log("\uD83D\uDCDD Incoming review request:", req.body);
            const reviewData = {
                ...req.body,
                createdAt: new Date().toISOString(),
            };
            const review = await storage.createReview(reviewData);
            res.status(201).json(review);
        }
        catch (error) {
            console.error("\u274C Error creating review:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    app.patch("/api/reviews/mark_viewed", async (req, res) => {
        try {
            const { propertyId, carId } = req.body;
            if (!propertyId && !carId) {
                return res
                    .status(400)
                    .json({ message: "propertyId or carId required" });
            }
            const markedCount = await storage.markReviewsAsViewed({
                propertyId,
                carId,
            });
            res.json({ success: true, markedCount });
        }
        catch (error) {
            console.error("\u274C Error marking reviews as viewed:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    app.get("/api/reviews/unviewed_count", async (req, res) => {
        try {
            const count = await storage.countUnviewedReviews();
            res.json({ count });
        }
        catch (error) {
            console.error("\u274C Error getting unviewed review count:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    //Replies
    app.post("/api/reviews/reply", async (req, res) => {
        try {
            const { reviewId, replyMessage, adminEmail } = req.body;
            if (!reviewId || !replyMessage || !adminEmail) {
                return res.status(400).json({ error: "Missing required fields" });
            }
            // Verify that the request is from the admin.
            // Prefer ADMIN_EMAIL on the server; keep VITE_ADMIN_EMAIL as fallback.
            const expectedAdminEmail = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL;
            if (!expectedAdminEmail || adminEmail !== expectedAdminEmail) {
                return res.status(403).json({ error: "Unauthorized" });
            }
            // Call storage function to add the reply
            await storage.addReplyToReview(reviewId, replyMessage);
            res.json({ success: true, message: "Reply added successfully" });
        }
        catch (error) {
            console.error("\u274C Error adding reply:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });
    app.get("/api/reviews", async (req, res) => {
        try {
            const reviews = await storage.getAllReviews();
            res.json(reviews);
        }
        catch (error) {
            console.error("\u274C Error fetching reviews:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    app.get("/api/reviews/property/:propertyId", async (req, res) => {
        const { propertyId } = req.params;
        try {
            const reviews = await storage.getReviewsByProperty(propertyId);
            res.json(reviews);
        }
        catch (error) {
            console.error("\u274C Error fetching reviews by property:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    app.get("/api/reviews/car/:carId", async (req, res) => {
        const { carId } = req.params;
        try {
            const reviews = await storage.getReviewsByCar(carId);
            res.json(reviews);
        }
        catch (error) {
            console.error("\u274C Error fetching reviews by car:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    app.delete("/api/reviews/:id", async (req, res) => {
        const { id } = req.params;
        try {
            await storage.deleteReview(id);
            res.status(204).send();
        }
        catch (error) {
            console.error("\u274C Error deleting review:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    app.get("/api/cars", async (req, res) => {
        try {
            const cars = await storage.getAllCars();
            res.json(cars);
        }
        catch (error) {
            console.error("\u274C Error fetching cars:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    app.get("/api/cars/featured", async (req, res) => {
        try {
            const cars = await storage.getFeaturedCars();
            res.json(cars);
        }
        catch (error) {
            console.error("\u274C Error fetching featured cars:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    app.get("/api/cars/:id", async (req, res) => {
        const { id } = req.params;
        try {
            const car = await storage.getCarById(id);
            if (!car) {
                return res.status(404).json({ message: "car not found" });
            }
            res.json(car);
        }
        catch (error) {
            console.error("\u274C Error fetching car:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    // Admin property management
    app.post("/api/cars", async (req, res) => {
        try {
            const carData = req.body;
            const car = await storage.addCar(carData);
            res.status(201).json(car);
        }
        catch (error) {
            console.error("\u274C Error adding car:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    app.patch("/api/cars/:id", async (req, res) => {
        const { id } = req.params;
        try {
            const updatedData = req.body;
            const car = await storage.updateCar(id, updatedData);
            res.json(car);
        }
        catch (error) {
            console.error("\u274C Error updating car:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    app.delete("/api/cars/:id", async (req, res) => {
        const { id } = req.params;
        try {
            await storage.deleteCar(id);
            res.status(204).send();
        }
        catch (error) {
            console.error("\u274C Error deleting car:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    // Contact form email sending
    app.post("/api/contact", async (req, res) => {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT),
                secure: true, // SSL
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
            await transporter.sendMail({
                from: `"${name}" <${process.env.SMTP_USER}>`,
                to: "info@giftandsonsinternational.com",
                subject: "New Inquiry Received",
                text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            });
            res.status(200).json({ message: "Email sent successfully" });
        }
        catch (error) {
            console.error("Error sending email:", error);
            res.status(500).json({ error: "Failed to send email" });
        }
    });
}
