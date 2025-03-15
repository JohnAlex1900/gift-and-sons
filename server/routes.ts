import "./types/custom";

import type { Express, Request, Response, NextFunction } from "express";
import { createServer } from "http";
import storage from "./storage";
import { insertPropertySchema, insertInquirySchema } from "@shared/schema";
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
  app.get("/api/properties", async (req: AuthenticatedRequest, res) => {
    const properties = await storage.getAllProperties();
    res.json(properties);
  });

  app.get(
    "/api/properties/featured",
    async (req: AuthenticatedRequest, res) => {
      console.log("GET /api/properties/featured");
      const properties = await storage.getFeaturedProperties();
      res.json(properties);
    }
  );

  app.get("/api/properties/:id", async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    console.log("🔍 Incoming request for property ID:", id);

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
  });

  // Admin property management
  app.post(
    "/api/properties",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      const result = insertPropertySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ errors: result.error.errors });
      }

      const propertyData = {
        ...result.data,
        imageUrls: result.data.imageUrls ?? undefined, // Ensures imageUrls is never null
      };

      const property = await storage.addProperty(propertyData);

      res.status(201).json(property);
    }
  );

  app.patch(
    "/api/properties/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      const updatedData = {
        ...req.body,
        imageUrls: req.body.imageUrls ?? undefined, // Ensures imageUrls is never null
      };

      const property = await storage.updateProperty(req.params.id, updatedData);

      res.json(property);
    }
  );

  app.delete(
    "/api/properties/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      await storage.deleteProperty(req.params.id);
      res.status(204).send();
    }
  );

  // Inquiries
  app.post(
    "/api/inquiries",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      console.log("📥 Incoming Inquiry Data:", req.body);
      console.log("🔑 Authenticated User:", req?.user);

      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const inquiryData = { ...req.body, userId: req.user?.uid };

      console.log("📤 Final Inquiry Data Before Save:", inquiryData);

      const result = insertInquirySchema.safeParse(inquiryData);
      if (!result.success) {
        console.error("❌ Validation Errors:", result.error.errors);
        return res.status(400).json({ errors: result.error.errors });
      }

      const inquiry = await storage.createInquiry(result.data);
      console.log("✅ Saved Inquiry:", inquiry);

      res.status(201).json(inquiry);
    }
  );

  app.get(
    "/api/inquiries",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      const inquiries = await storage.getAllInquiries();
      res.json(inquiries);
    }
  );

  app.get(
    "/api/inquiries/property/:propertyId",
    requireAuth,
    async (req, res) => {
      const inquiries = await storage.getInquiriesByProperty(
        req.params.propertyId
      );
      res.json(inquiries);
    }
  );

  app.get(
    "/api/inquiries/user/:userId",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      const inquiries = await storage.getInquiriesByUser(req.params.userId);
      res.json(inquiries);
    }
  );

  app.delete(
    "/api/inquiries/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      await storage.deleteInquiry(req.params.id);
      res.status(204).send();
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
