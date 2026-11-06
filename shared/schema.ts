import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseId: text("firebase_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  type: text("type").notNull(), // sale, rent, lease
  category: text("category").notNull(), // house, apartment, land
  location: text("location").notNull(),
  bedrooms: integer("bedrooms").array().notNull(),
  bathrooms: integer("bathrooms"),
  area: integer("area"),
  imageUrls: text("image_urls").array(),
  featured: boolean("featured").default(false),
  status: text("status").notNull().default("available"),
});

export const inquiries = pgTable("inquiries", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  propertyId: text("property_id").notNull(),
  userEmail: text("user_email").notNull(),
  propertyName: text("property_name").notNull(),
  message: text("message").notNull(),
  number: text("number").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Authentication schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
});
export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;

export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
