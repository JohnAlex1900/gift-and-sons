import type { Express, Response, NextFunction } from "express";
import { createServer } from "http";
import storage from "./storage";
import { adminAuth } from "./firebase-admin";
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "./uploadthing";
import nodemailer from "nodemailer";
import { AuthenticatedRequest } from "./types/express";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Auth middleware
  const requireAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const token = req.headers.authorization?.split("Bearer ")[1];
      if (!token) throw new Error("No token provided");

      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = decodedToken; // Add the user property to the Request object
      next();
    } catch (error) {
      res.status(401).json({ message: "Unauthorized" });
    }
  };

  app.use(
    "/api/uploadthing",
    createRouteHandler({
      router: uploadRouter,
      config: {}, // Optional configuration
    })
  );

  console.log("✅ UploadThing API registered at /api/uploadthing");

  // Properties endpoints
  app.get(
    "/api/properties",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const properties = await storage.getAllProperties();
        res.json(properties);
      } catch (error) {
        console.error("❌ Error fetching properties:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  app.get(
    "/api/properties/featured",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const properties = await storage.getFeaturedProperties();
        res.json(properties);
      } catch (error) {
        console.error("❌ Error fetching featured properties:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  app.get(
    "/api/properties/:id",
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      try {
        const property = await storage.getPropertyById(id);
        if (!property) {
          return res.status(404).json({ message: "Property not found" });
        }
        res.json(property);
      } catch (error) {
        console.error("❌ Error fetching property:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  // Admin property management
  app.post(
    "/api/properties",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const propertyData = req.body;
        const property = await storage.addProperty(propertyData);
        res.status(201).json(property);
      } catch (error) {
        console.error("❌ Error adding property:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  app.patch(
    "/api/properties/:id",
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      try {
        const updatedData = req.body;
        const property = await storage.updateProperty(id, updatedData);
        res.json(property);
      } catch (error) {
        console.error("❌ Error updating property:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  app.delete(
    "/api/properties/:id",
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      try {
        await storage.deleteProperty(id);
        res.status(204).send();
      } catch (error) {
        console.error("❌ Error deleting property:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  // Reviews
  app.post("/api/reviews", async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("📝 Incoming review request:", req.body);

      const reviewData = {
        ...req.body,
        createdAt: new Date().toISOString(),
      };
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("❌ Error creating review:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  //Replies
  app.post(
    "/api/reviews/reply",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { reviewId, replyMessage, adminEmail } = req.body;

        if (!reviewId || !replyMessage || !adminEmail) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Verify that the request is from the admin
        if (adminEmail !== process.env.VITE_ADMIN_EMAIL) {
          return res.status(403).json({ error: "Unauthorized" });
        }

        // Call storage function to add the reply
        await storage.addReplyToReview(reviewId, replyMessage);

        res.json({ success: true, message: "Reply added successfully" });
      } catch (error) {
        console.error("❌ Error adding reply:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  app.get("/api/reviews", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const reviews = await storage.getAllReviews();
      res.json(reviews);
    } catch (error) {
      console.error("❌ Error fetching reviews:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get(
    "/api/reviews/property/:propertyId",
    async (req: AuthenticatedRequest, res: Response) => {
      const { propertyId } = req.params;
      try {
        const reviews = await storage.getReviewsByProperty(propertyId);
        res.json(reviews);
      } catch (error) {
        console.error("❌ Error fetching reviews by property:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  app.get(
    "/api/reviews/car/:carId",
    async (req: AuthenticatedRequest, res: Response) => {
      const { carId } = req.params;
      try {
        const reviews = await storage.getReviewsByCar(carId);
        res.json(reviews);
      } catch (error) {
        console.error("❌ Error fetching reviews by car:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  app.get(
    "/api/reviews/user/:userId",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      const { userId } = req.params;
      try {
        const reviews = await storage.getReviewsByUser(userId);
        res.json(reviews);
      } catch (error) {
        console.error("❌ Error fetching reviews by user:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  app.delete(
    "/api/reviews/:id",
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      try {
        await storage.deleteReview(id);
        res.status(204).send();
      } catch (error) {
        console.error("❌ Error deleting review:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  app.get("/api/cars", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cars = await storage.getAllCars();
      res.json(cars);
    } catch (error) {
      console.error("❌ Error fetching cars:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get(
    "/api/cars/featured",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const cars = await storage.getFeaturedCars();
        res.json(cars);
      } catch (error) {
        console.error("❌ Error fetching featured cars:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  app.get("/api/cars/:id", async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      const car = await storage.getCarById(id);
      if (!car) {
        return res.status(404).json({ message: "car not found" });
      }
      res.json(car);
    } catch (error) {
      console.error("❌ Error fetching car:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Admin property management
  app.post("/api/cars", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const carData = req.body;
      const car = await storage.addCar(carData);
      res.status(201).json(car);
    } catch (error) {
      console.error("❌ Error adding car:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch(
    "/api/cars/:id",
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      try {
        const updatedData = req.body;
        const car = await storage.updateCar(id, updatedData);
        res.json(car);
      } catch (error) {
        console.error("❌ Error updating car:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  app.delete(
    "/api/cars/:id",
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      try {
        await storage.deleteCar(id);
        res.status(204).send();
      } catch (error) {
        console.error("❌ Error deleting car:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  // Contact form email sending
  app.post("/api/contact", async (req: AuthenticatedRequest, res: Response) => {
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
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  return httpServer;
}
