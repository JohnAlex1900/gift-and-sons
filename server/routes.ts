import type { Express, Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { adminAuth, db } from "./firebase-admin"; // Import Firestore and Firebase Auth
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
  app.get("/api/properties", async (req: AuthenticatedRequest, res) => {
    try {
      const propertiesSnapshot = await db.collection("properties").get();
      const properties = propertiesSnapshot.docs.map((doc) => doc.data());
      res.json(properties);
    } catch (error) {
      console.error("❌ Error fetching properties:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get(
    "/api/properties/featured",
    async (req: AuthenticatedRequest, res) => {
      try {
        const featuredPropertiesSnapshot = await db
          .collection("properties")
          .where("featured", "==", true)
          .get();
        const featuredProperties = featuredPropertiesSnapshot.docs.map((doc) =>
          doc.data()
        );
        res.json(featuredProperties);
      } catch (error) {
        console.error("❌ Error fetching featured properties:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  app.get("/api/properties/:id", async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    try {
      const propertyDoc = await db.collection("properties").doc(id).get();
      if (!propertyDoc.exists) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(propertyDoc.data());
    } catch (error) {
      console.error("❌ Error fetching property:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Admin property management
  app.post(
    "/api/properties",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const propertyData = req.body;
        const propertyRef = await db.collection("properties").add(propertyData);
        res.status(201).json({ id: propertyRef.id, ...propertyData });
      } catch (error) {
        console.error("❌ Error adding property:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  app.patch("/api/properties/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
      const updatedData = req.body;
      await db.collection("properties").doc(id).update(updatedData);
      res.json({ id, ...updatedData });
    } catch (error) {
      console.error("❌ Error updating property:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete(
    "/api/properties/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      const { id } = req.params;
      try {
        await db.collection("properties").doc(id).delete();
        res.status(204).send();
      } catch (error) {
        console.error("❌ Error deleting property:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  // Inquiries
  app.post(
    "/api/inquiries",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const inquiryData = {
          ...req.body,
          userId: req.user?.uid,
          createdAt: new Date().toISOString(),
        };
        const inquiryRef = await db.collection("inquiries").add(inquiryData);
        res.status(201).json({ id: inquiryRef.id, ...inquiryData });
      } catch (error) {
        console.error("❌ Error creating inquiry:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  app.get(
    "/api/inquiries",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const inquiriesSnapshot = await db.collection("inquiries").get();
        const inquiries = inquiriesSnapshot.docs.map((doc) => doc.data());
        res.json(inquiries);
      } catch (error) {
        console.error("❌ Error fetching inquiries:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  app.get(
    "/api/inquiries/property/:propertyId",
    requireAuth,
    async (req, res) => {
      const { propertyId } = req.params;
      try {
        const inquiriesSnapshot = await db
          .collection("inquiries")
          .where("propertyId", "==", propertyId)
          .get();
        const inquiries = inquiriesSnapshot.docs.map((doc) => doc.data());
        res.json(inquiries);
      } catch (error) {
        console.error("❌ Error fetching inquiries by property:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  app.get(
    "/api/inquiries/user/:userId",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      const { userId } = req.params;
      try {
        const inquiriesSnapshot = await db
          .collection("inquiries")
          .where("userId", "==", userId)
          .get();
        const inquiries = inquiriesSnapshot.docs.map((doc) => doc.data());
        res.json(inquiries);
      } catch (error) {
        console.error("❌ Error fetching inquiries by user:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  app.delete(
    "/api/inquiries/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      const { id } = req.params;
      try {
        await db.collection("inquiries").doc(id).delete();
        res.status(204).send();
      } catch (error) {
        console.error("❌ Error deleting inquiry:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

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
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  return httpServer;
}
