import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertUserSchema, 
  insertFormSchema, 
  insertSubmissionSchema, 
  insertFileUploadSchema
} from "@shared/schema";
import { ZodError } from "zod-validation-error";
import { mongoStorage } from "./mongo-storage";

// Use MongoDB storage instead of memory storage
const storage = mongoStorage;

// Setup JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "formbuilder-secret-key";

// Utility function to create directory if it doesn't exist
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
ensureDirectoryExists(uploadDir);

const storage_multer = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only specific file types
  const allowedTypes = [
    'image/png', 'image/jpeg', 'image/jpg', 'image/gif',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
    'video/mp4', 'video/quicktime', 'video/x-msvideo'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported'));
  }
};

const upload = multer({
  storage: storage_multer,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max file size
});

// Authentication middleware
const authenticate = async (req: Request, res: Response, next: Function) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    // Get user by ID (could be MongoDB ObjectId or number in MemStorage)
    const user = await storage.getUser(decoded.id);
    
    if (!user) {
      console.error(`User not found for ID: ${decoded.id}`);
      return res.status(401).json({ message: "User not found" });
    }
    
    // Add user to request object
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Role-based authorization middleware
const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validate request body
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Create and return JWT token - use _id for MongoDB or id for MemStorage
      const userId = user._id || user.id;
      const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "30d" });
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return res.status(201).json({ 
        user: userWithoutPassword,
        token 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(400).json({ message: "Invalid username or password" });
      }
      
      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid username or password" });
      }
      
      // Create and return JWT token - use _id for MongoDB or id for MemStorage
      const userId = user._id || user.id;
      const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "30d" });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return res.json({ 
        user: userWithoutPassword,
        token 
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: "Login failed" });
    }
  });
  
  // Get current authenticated user
  app.get("/api/auth/me", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get me error:', error);
      return res.status(500).json({ message: "Failed to get user profile" });
    }
  });

  // User management routes
  app.get("/api/users", authenticate, authorize(["super_admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const sanitizedUsers = users.map(({ password, ...rest }) => rest);
      return res.json(sanitizedUsers);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users/admin", authenticate, authorize(["super_admin"]), async (req, res) => {
    try {
      // Only super admins can create admin users
      const userData = insertUserSchema.parse({
        ...req.body,
        role: "admin" // Force role to be admin
      });
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create admin user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create admin user" });
    }
  });

  // Form routes
  app.post("/api/forms", authenticate, async (req, res) => {
    try {
      console.log("Received form create request with body:", JSON.stringify(req.body));
      const user = (req as any).user;
      console.log("Authenticated user:", user);
      
      // Make sure we're using the MongoDB ObjectId if available
      let userId;
      
      // If it's a MongoDB document with _id
      if (user._id) {
        userId = user._id.toString(); // Convert ObjectId to string if needed
        console.log("Using MongoDB _id:", userId);
      } else if (user.id) {
        userId = user.id;
        console.log("Using regular id:", userId);
      } else {
        console.error("No valid user ID found in user object:", user);
        return res.status(400).json({ message: "Invalid user data. Please login again." });
      }
      
      // Create a cleaned version of the form data
      const formDataRaw = {
        ...req.body,
        userId: userId
      };
      
      // Ensure schema is properly formatted if it's a string
      if (typeof formDataRaw.schema === 'string') {
        try {
          formDataRaw.schema = JSON.parse(formDataRaw.schema);
        } catch (e) {
          console.error("Error parsing schema string:", e);
        }
      }
      
      console.log("Raw form data before validation:", formDataRaw);
      
      // Disable validation temporarily if there are issues
      let formData;
      try {
        formData = insertFormSchema.parse(formDataRaw);
        console.log("Form data validated successfully");
      } catch (validationErr) {
        console.error("Validation error:", validationErr);
        // Fallback to using the raw data
        formData = formDataRaw;
        console.log("Using raw form data due to validation error");
      }
      
      console.log("Final form data being saved:", JSON.stringify(formData));
      const form = await storage.createForm(formData);
      
      if (!form) {
        console.error("Storage returned null when creating form");
        return res.status(500).json({ message: "Failed to create form - storage error" });
      }
      
      console.log("Form created successfully:", JSON.stringify(form));
      return res.status(201).json(form);
    } catch (error) {
      console.error("Error creating form:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors,
          details: "Form data validation failed. Please check your form data."
        });
      }
      
      return res.status(500).json({ 
        message: "Failed to create form",
        error: error.message || "Unknown server error"
      });
    }
  });

  app.get("/api/forms", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      let forms;
      
      // Super admins can see all forms, regular admins only see their own
      if (user.role === "super_admin") {
        forms = await storage.getAllForms();
      } else {
        forms = await storage.getForms(user.id);
      }
      
      return res.json(forms);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch forms" });
    }
  });

  app.get("/api/forms/search", authenticate, async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const forms = await storage.searchForms(query);
      
      // Filter forms based on user role
      const user = (req as any).user;
      let filteredForms = forms;
      
      if (user.role !== "super_admin") {
        filteredForms = forms.filter(form => form.userId === user.id);
      }
      
      return res.json(filteredForms);
    } catch (error) {
      return res.status(500).json({ message: "Failed to search forms" });
    }
  });

  app.get("/api/forms/:id", authenticate, async (req, res) => {
    try {
      const formId = req.params.id;
      const form = await storage.getForm(formId);
      
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      // Check if user has access to this form
      const user = (req as any).user;
      if (user.role !== "super_admin" && String(form.userId) !== String(user._id)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      return res.json(form);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch form" });
    }
  });

  app.put("/api/forms/:id", authenticate, async (req, res) => {
    try {
      const formId = req.params.id;
      const form = await storage.getForm(formId);
      
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      // Check if user has access to update this form
      const user = (req as any).user;
      if (user.role !== "super_admin" && String(form.userId) !== String(user._id)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate update data
      const formData = insertFormSchema.partial().parse(req.body);
      
      const updatedForm = await storage.updateForm(formId, formData);
      return res.json(updatedForm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to update form" });
    }
  });

  app.delete("/api/forms/:id", authenticate, async (req, res) => {
    try {
      const formId = req.params.id;
      const form = await storage.getForm(formId);
      
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      // Check if user has access to delete this form
      const user = (req as any).user;
      if (user.role !== "super_admin" && String(form.userId) !== String(user._id)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteForm(formId);
      return res.json({ message: "Form deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete form" });
    }
  });

  app.post("/api/forms/:id/publish", authenticate, async (req, res) => {
    try {
      const formId = req.params.id;
      const form = await storage.getForm(formId);
      
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      // Check if user has access to publish this form
      const user = (req as any).user;
      if (user.role !== "super_admin" && String(form.userId) !== String(user._id)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const publishedForm = await storage.publishForm(formId);
      return res.json(publishedForm);
    } catch (error) {
      return res.status(500).json({ message: "Failed to publish form" });
    }
  });

  // Public form route (no authentication required)
  app.get("/api/public-forms/:id", async (req, res) => {
    try {
      const formId = req.params.id;
      const form = await storage.getForm(formId);
      
      if (!form || form.status !== "published") {
        return res.status(404).json({ message: "Form not found or not published" });
      }
      
      return res.json(form);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch form" });
    }
  });

  // Form submission routes with file upload support
  app.post("/api/forms/:id/submit", upload.any(), async (req, res) => {
    try {
      const formId = req.params.id;
      const form = await storage.getForm(formId);
      
      if (!form || form.status !== "published") {
        return res.status(404).json({ message: "Form not found or not published" });
      }
      
      // Process form data
      let formData = {};
      
      // Process regular form fields
      if (req.body.data) {
        // Parse each data field since they're sent as JSON strings
        Object.keys(req.body.data || {}).forEach(key => {
          try {
            formData[key] = JSON.parse(req.body.data[key]);
          } catch (e) {
            formData[key] = req.body.data[key];
          }
        });
      }
      
      // Create submission record first
      const submissionData = insertSubmissionSchema.parse({
        formId,
        data: formData
      });
      
      const submission = await storage.createSubmission(submissionData);
      
      // Process files if any
      const files = req.files as Express.Multer.File[];
      const fileMetadata = req.body.fileData || {};
      
      if (files && files.length > 0) {
        console.log("Processing uploaded files:", files.length);
        
        for (const file of files) {
          // Extract field ID from the field name (files[fieldId])
          const fieldMatch = file.fieldname.match(/files\[(.*?)\]/);
          if (fieldMatch && fieldMatch[1]) {
            const fieldId = fieldMatch[1];
            let metadata = {};
            
            try {
              if (fileMetadata[fieldId]) {
                metadata = JSON.parse(fileMetadata[fieldId]);
              }
            } catch (e) {
              console.error("Error parsing file metadata:", e);
            }
            
            // Create file upload record
            const fileUploadData = {
              submissionId: submission.id,
              fieldId,
              fileName: file.originalname,
              fileType: file.mimetype,
              filePath: file.path,
              fileSize: file.size,
              metadata: metadata
            };
            
            await storage.createFileUpload(fileUploadData);
          }
        }
      }
      
      return res.status(201).json(submission);
    } catch (error) {
      console.error("Form submission error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to submit form" });
    }
  });

  app.get("/api/forms/:id/submissions", authenticate, async (req, res) => {
    try {
      const formId = req.params.id;
      const form = await storage.getForm(formId);
      
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      // Check if user has access to view submissions
      const user = (req as any).user;
      if (user.role !== "super_admin" && String(form.userId) !== String(user._id)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const submissions = await storage.getSubmissionsByForm(formId);
      return res.json(submissions);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  // File upload route
  app.post("/api/upload", authenticate, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const file = req.file;
      const submissionId = req.body.submissionId;
      const fieldId = req.body.fieldId;
      
      const fileUploadData = insertFileUploadSchema.parse({
        submissionId,
        fieldId,
        fileName: file.originalname,
        fileType: file.mimetype,
        filePath: file.path,
        fileSize: file.size
      });
      
      const fileUpload = await storage.createFileUpload(fileUploadData);
      return res.status(201).json(fileUpload);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Return the HTTP server
  return httpServer;
}
