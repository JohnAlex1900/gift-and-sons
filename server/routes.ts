import type { Express, Request, Response, NextFunction } from "express";
import multer from "multer";
import storage from "./storage";
import { adminAuth } from "./firebase-admin";
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "./uploadthing";
import {
  checkCloudinaryConnection,
  deleteStoredImage,
  isCloudinaryConfigured,
  uploadCloudinaryImage,
} from "./cloudinary-client";
import nodemailer from "nodemailer";
import { AuthenticatedRequest } from "./types/express";

export async function registerRoutes(app: Express) {
  const errorPayload = (error: unknown) => {
    const message =
      typeof error === "object" && error && "message" in error
        ? (error as { message?: unknown }).message
        : undefined;

    const code =
      typeof error === "object" && error && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;

    return {
      message: "Server error",
      code: typeof code === "string" ? code : "INTERNAL",
      detail: typeof message === "string" ? message : undefined,
    };
  };

  // Auth middleware
  const requireAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
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

  const requireAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    const expectedAdminEmail =
      process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL;
    const authenticatedEmail = req.user?.email?.trim().toLowerCase();
    const normalizedAdminEmail = expectedAdminEmail?.trim().toLowerCase();

    if (
      !normalizedAdminEmail ||
      !authenticatedEmail ||
      authenticatedEmail !== normalizedAdminEmail
    ) {
      console.warn("Admin authorization denied:", {
        adminEmailConfigured: Boolean(normalizedAdminEmail),
        authenticatedEmailPresent: Boolean(authenticatedEmail),
        emailMatches: Boolean(
          normalizedAdminEmail &&
            authenticatedEmail === normalizedAdminEmail,
        ),
      });
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    next();
  };

  const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  }).single("image");

  app.post(
    "/api/admin/images/upload",
    requireAuth,
    requireAdmin,
    imageUpload,
    async (req: AuthenticatedRequest, res: Response) => {
      if (!req.file) {
        return res.status(400).json({ message: "Choose an image to upload." });
      }

      if (!isCloudinaryConfigured()) {
        return res.status(503).json({
          message: "Cloudinary credentials are not configured on the server.",
        });
      }

      if (!["image/jpeg", "image/png", "image/webp"].includes(req.file.mimetype)) {
        return res
          .status(400)
          .json({ message: "Only JPEG, PNG, and WebP images are supported." });
      }

      try {
        const url = await uploadCloudinaryImage(req.file);
        return res.status(201).json({ url, provider: "cloudinary" });
      } catch (error) {
        console.error(
          "Cloudinary image upload failed:",
          error instanceof Error ? error.message : "Unknown error",
        );
        return res.status(502).json({ message: "Cloudinary upload failed." });
      }
    },
  );

  app.delete(
    "/api/admin/images",
    requireAuth,
    requireAdmin,
    async (req: AuthenticatedRequest, res: Response) => {
      const urls: unknown = req.body?.urls;
      if (
        !Array.isArray(urls) ||
        urls.length === 0 ||
        urls.length > 20 ||
        urls.some((url) => typeof url !== "string")
      ) {
        return res.status(400).json({
          message: "Provide between 1 and 20 image URLs to delete.",
        });
      }

      const results = await Promise.allSettled(
        [...new Set(urls as string[])].map((url) => deleteStoredImage(url)),
      );
      const failedCount = results.filter(
        (result) => result.status === "rejected",
      ).length;

      results.forEach((result) => {
        if (result.status === "rejected") {
          console.error(
            "Image deletion failed:",
            result.reason instanceof Error
              ? result.reason.message
              : "Unknown error",
          );
        }
      });

      return res.json({
        deletedCount: results.length - failedCount,
        failedCount,
      });
    },
  );

  app.get(
    "/api/admin/cloudinary/health",
    requireAuth,
    requireAdmin,
    async (_req: AuthenticatedRequest, res: Response) => {
      if (!isCloudinaryConfigured()) {
        return res.status(503).json({
          configured: false,
          connected: false,
          message: "Cloudinary credentials are not configured on the server.",
        });
      }

      try {
        const connected = await checkCloudinaryConnection();
        if (!connected) {
          return res.status(502).json({
            configured: true,
            connected: false,
            message: "Cloudinary did not confirm the connection.",
          });
        }

        return res.json({ configured: true, connected: true });
      } catch (error) {
        console.error(
          "Cloudinary connectivity check failed:",
          error instanceof Error ? error.message : "Unknown error",
        );
        return res.status(502).json({
          configured: true,
          connected: false,
          message: "Unable to connect to Cloudinary. Check server credentials.",
        });
      }
    },
  );

  try {
    app.use(
      "/api/uploadthing",
      createRouteHandler({
        router: uploadRouter,
        config: {}, // Optional configuration
      }),
    );

    console.log("✅ UploadThing API registered at /api/uploadthing");
  } catch (error) {
    console.error("❌ UploadThing setup skipped:", error);
  }

  // Properties endpoints
  app.get(
    "/api/properties",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const properties = await storage.getAllProperties();
        res.json(properties);
      } catch (error) {
        console.error("❌ Error fetching properties:", error);
        res.status(500).json(errorPayload(error));
      }
    },
  );

  app.get(
    "/api/properties/featured",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const properties = await storage.getFeaturedProperties();
        res.json(properties);
      } catch (error) {
        console.error("❌ Error fetching featured properties:", error);
        res.status(500).json(errorPayload(error));
      }
    },
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
        res.status(500).json(errorPayload(error));
      }
    },
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
    },
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
    },
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
    },
  );

  // Reviews (Hybrid Public/Authenticated Endpoint)
  app.post("/api/reviews", async (req: Request, res: Response) => {
    try {
      // Safely extract parameters using a typed destructure cast
      const { message, rating, name, username } = (req.body ?? {}) as {
        message?: string;
        rating?: number;
        propertyId?: string;
        carId?: string;
        name?: string;
        username?: string;
      };

      // 1. Validate the review message
      const normalizedMessage =
        typeof message === "string" ? message.trim() : "";
      if (!normalizedMessage) {
        return res.status(400).json({ message: "Review message is required" });
      }

      if (normalizedMessage.length > 2_000) {
        return res.status(400).json({
          message: "Review message must be 2,000 characters or fewer",
        });
      }

      // 2. Validate the rating
      const normalizedRating =
        typeof rating === "number" ? rating : Number(rating);
      if (
        !Number.isInteger(normalizedRating) ||
        normalizedRating < 1 ||
        normalizedRating > 5
      ) {
        return res
          .status(400)
          .json({ message: "Rating must be a whole number from 1 to 5" });
      }

      // 3. Normalize optional property or car associations
      // const normalizedPropertyId =
      //   typeof propertyId === "string" ? propertyId.trim() : undefined;
      // const normalizedCarId =
      //   typeof carId === "string" ? carId.trim() : undefined;

      // 4. Determine Auth status dynamically
      let finalUserId = "guest";
      let resolvedUsername = "";

      const token = req.headers.authorization?.split("Bearer ")[1];
      if (token) {
        try {
          const decodedToken = await adminAuth.verifyIdToken(token);
          finalUserId = decodedToken.uid;

          if (decodedToken.name?.trim()) {
            resolvedUsername = decodedToken.name.trim();
          } else if (decodedToken.email) {
            // Fallback to email username if display name is missing
            resolvedUsername = decodedToken.email.split("@")[0];
          }
        } catch (authError) {
          console.warn(
            "⚠️ Invalid auth token provided, posting review as a guest.",
          );
        }
      }

      // 5. Fallback to form inputs if they aren't logged in
      if (!resolvedUsername) {
        if (typeof name === "string" && name.trim()) {
          resolvedUsername = name.trim();
        } else if (typeof username === "string" && username.trim()) {
          resolvedUsername = username.trim();
        } else {
          resolvedUsername = "Guest User";
        }
      }

      // Prevent "Anonymous" database entries from sneaking through
      if (
        !resolvedUsername ||
        resolvedUsername.toLowerCase() === "anonymous" ||
        resolvedUsername.trim() === ""
      ) {
        resolvedUsername = "Guest User";
      }

      // 6. Create the review
      const review = await storage.createReview({
        message: normalizedMessage,
        rating: normalizedRating,
        userId: finalUserId,
        username: resolvedUsername,
        // propertyId: normalizedPropertyId,
        // carId: normalizedCarId,
      });

      res.status(201).json(review);
    } catch (error) {
      console.error("❌ Error creating review:", error);
      res.status(500).json(errorPayload(error));
    }
  });

  app.patch(
    "/api/reviews/mark_viewed",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { propertyId, carId } = req.body;

        const markedCount = await storage.markReviewsAsViewed({
          propertyId,
          carId,
        });

        res.json({ success: true, markedCount });
      } catch (error) {
        console.error("❌ Error marking reviews as viewed:", error);
        res.status(500).json({ message: "Server error" });
      }
    },
  );

  app.get(
    "/api/reviews/unviewed_count",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const count = await storage.countUnviewedReviews();
        res.json({ count });
      } catch (error) {
        console.error("❌ Error getting unviewed review count:", error);
        res.status(500).json({ message: "Server error" });
      }
    },
  );

  //Replies
  app.post(
    "/api/reviews/reply",
    requireAuth,
    requireAdmin,
    async (req: AuthenticatedRequest, res: Response) => {
      const reviewId =
        typeof req.body?.reviewId === "string" ? req.body.reviewId.trim() : "";
      const replyMessage =
        typeof req.body?.replyMessage === "string"
          ? req.body.replyMessage.trim()
          : "";

      if (!reviewId || !replyMessage) {
        return res
          .status(400)
          .json({ message: "Review ID and reply text are required." });
      }

      if (replyMessage.length > 2000) {
        return res
          .status(400)
          .json({ message: "Reply must be 2,000 characters or fewer." });
      }

      try {
        await storage.addReplyToReview(reviewId, replyMessage);
        res.json({ success: true, message: "Reply added successfully" });
      } catch (error) {
        console.error("❌ Error adding reply:", error);
        if (error instanceof Error && error.message === "Review not found") {
          return res.status(404).json({ message: error.message });
        }

        res.status(500).json({ message: "Could not save reply." });
      }
    },
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
    },
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
    },
  );

  app.delete(
    "/api/reviews/:id",
    requireAuth,
    requireAdmin,
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      try {
        await storage.deleteReview(id);
        res.status(204).send();
      } catch (error) {
        console.error("❌ Error deleting review:", error);
        res.status(500).json({ message: "Server error" });
      }
    },
  );

  app.get("/api/cars", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cars = await storage.getAllCars();
      res.json(cars);
    } catch (error) {
      console.error("❌ Error fetching cars:", error);
      res.status(500).json(errorPayload(error));
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
        res.status(500).json(errorPayload(error));
      }
    },
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
      res.status(500).json(errorPayload(error));
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
    },
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
    },
  );

  //Rentals Routes
  app.get("/api/rentals", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const rentals = await storage.getAllRentals();
      res.json(rentals);
    } catch (error) {
      console.error("❌ Error fetching rentals:", error);
      res.status(500).json(errorPayload(error));
    }
  });

  app.get(
    "/api/rentals/featured",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const rentals = await storage.getFeaturedRentals();
        res.json(rentals);
      } catch (error) {
        console.error("❌ Error fetching featured rentals:", error);
        res.status(500).json(errorPayload(error));
      }
    },
  );

  app.get(
    "/api/rentals/:id",
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      try {
        const rental = await storage.getRentalById(id);
        if (!rental) {
          return res.status(404).json({ message: "Rental not found" });
        }
        res.json(rental);
      } catch (error) {
        console.error("❌ Error fetching rental:", error);
        res.status(500).json(errorPayload(error));
      }
    },
  );

  // Admin rental management
  app.post("/api/rentals", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const rentalData = req.body;
      const rental = await storage.addRental(rentalData);
      res.status(201).json(rental);
    } catch (error) {
      console.error("❌ Error adding rental:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch(
    "/api/rentals/:id",
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      try {
        const updatedData = req.body;
        const rental = await storage.updateRental(id, updatedData);
        res.json(rental);
      } catch (error) {
        console.error("❌ Error updating rental:", error);
        res.status(500).json({ message: "Server error" });
      }
    },
  );

  app.delete(
    "/api/rentals/:id",
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      try {
        await storage.deleteRental(id);
        res.status(204).send();
      } catch (error) {
        console.error("❌ Error deleting rental:", error);
        res.status(500).json({ message: "Server error" });
      }
    },
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
}
