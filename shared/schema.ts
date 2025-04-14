import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("admin"), // 'super_admin' or 'admin'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

// Forms schema
export const forms = pgTable("forms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  schema: jsonb("schema").notNull(), // JSON structure of the form
  userId: integer("user_id").notNull(), // Creator of the form
  status: text("status").notNull().default("draft"), // 'draft' or 'published'
  publishedUrl: text("published_url"), // URL when published
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFormSchema = createInsertSchema(forms).pick({
  name: true,
  description: true,
  schema: true,
  userId: true,
  status: true,
  publishedUrl: true,
});

// Form submissions schema
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").notNull(),
  data: jsonb("data").notNull(), // Submitted form data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubmissionSchema = createInsertSchema(submissions).pick({
  formId: true,
  data: true,
});

// File uploads schema
export const fileUploads = pgTable("file_uploads", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").notNull(),
  fieldId: text("field_id").notNull(), // ID of the form field
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFileUploadSchema = createInsertSchema(fileUploads).pick({
  submissionId: true,
  fieldId: true,
  fileName: true,
  fileType: true,
  filePath: true,
  fileSize: true,
});

// Export all types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Form = typeof forms.$inferSelect;
export type InsertForm = z.infer<typeof insertFormSchema>;

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;

export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;
