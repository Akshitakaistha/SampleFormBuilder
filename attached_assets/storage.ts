import { 
  users, type User, type InsertUser,
  forms, type Form, type InsertForm,
  submissions, type Submission, type InsertSubmission,
  fileUploads, type FileUpload, type InsertFileUpload
} from "@shared/schema";
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getSuperAdmins(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;  // Added this line
  getAdminsByCreator(superAdminId: number): Promise<User[]>;
  
  // Form operations
  createForm(form: InsertForm): Promise<Form>;
  getForm(id: number): Promise<Form | undefined>;
  updateForm(id: number, form: Partial<InsertForm>): Promise<Form | undefined>;
  deleteForm(id: number): Promise<boolean>;
  getForms(userId: number): Promise<Form[]>;
  getAllForms(): Promise<Form[]>;
  searchForms(query: string): Promise<Form[]>;
  publishForm(id: number): Promise<Form | undefined>;
  
  // Submission operations
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmission(id: number): Promise<Submission | undefined>;
  getSubmissionsByForm(formId: number): Promise<Submission[]>;
  deleteSubmission(id: number): Promise<boolean>;
  
  // File upload operations
  createFileUpload(fileUpload: InsertFileUpload): Promise<FileUpload>;
  getFileUploadsBySubmission(submissionId: number): Promise<FileUpload[]>;
}

export class MemStorage implements IStorage {
  private userMap: Map<number, User>;
  private formMap: Map<number, Form>;
  private submissionMap: Map<number, Submission>;
  private fileUploadMap: Map<number, FileUpload>;
  private userId: number;
  private formId: number;
  private submissionId: number;
  private fileUploadId: number;

  constructor() {
    this.userMap = new Map();
    this.formMap = new Map();
    this.submissionMap = new Map();
    this.fileUploadMap = new Map();
    this.userId = 1;
    this.formId = 1;
    this.submissionId = 1;
    this.fileUploadId = 1;

    // Create a default super admin user
    this.initializeDefaultUser();
  }

  private async initializeDefaultUser(): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('superadmin123', salt);

    const superAdmin: InsertUser = {
      username: 'superadmin',
      password: hashedPassword,
      email: 'superadmin@example.com',
      role: 'super_admin'
    };

    await this.createUser(superAdmin);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.userMap.get(id);
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.userMap.delete(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.userMap.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.userMap.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now
    };
    this.userMap.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.userMap.values());
  }

  async getSuperAdmins(): Promise<User[]> {
    return Array.from(this.userMap.values()).filter(
      (user) => user.role === 'super_admin'
    );
  }

  async getAdminsByCreator(superAdminId: number): Promise<User[]> {
    // In a real database, we would have a createdBy field to track this
    // For this implementation, we'll return all admins (not super admins)
    return Array.from(this.userMap.values()).filter(
      (user) => user.role === 'admin'
    );
  }

  // Form operations
  async createForm(insertForm: InsertForm): Promise<Form> {
    const id = this.formId++;
    const now = new Date();
    const form: Form = {
      ...insertForm,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.formMap.set(id, form);
    return form;
  }

  async getForm(id: number): Promise<Form | undefined> {
    return this.formMap.get(id);
  }

  async updateForm(id: number, updates: Partial<InsertForm>): Promise<Form | undefined> {
    const form = this.formMap.get(id);
    if (!form) return undefined;

    const updatedForm: Form = {
      ...form,
      ...updates,
      updatedAt: new Date()
    };
    this.formMap.set(id, updatedForm);
    return updatedForm;
  }

  async deleteForm(id: number): Promise<boolean> {
    return this.formMap.delete(id);
  }

  async getForms(userId: number): Promise<Form[]> {
    return Array.from(this.formMap.values()).filter(
      (form) => form.userId === userId
    );
  }

  async getAllForms(): Promise<Form[]> {
    return Array.from(this.formMap.values());
  }

  async searchForms(query: string): Promise<Form[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.formMap.values()).filter(
      (form) => 
        form.name.toLowerCase().includes(lowerQuery) || 
        (form.description && form.description.toLowerCase().includes(lowerQuery))
    );
  }

  async publishForm(id: number): Promise<Form | undefined> {
    const form = this.formMap.get(id);
    if (!form) return undefined;

    const randomStr = crypto.randomBytes(8).toString('hex');
    const publishedUrl = `/forms/${randomStr}`;
    
    const updatedForm: Form = {
      ...form,
      status: 'published',
      publishedUrl,
      updatedAt: new Date()
    };
    this.formMap.set(id, updatedForm);
    return updatedForm;
  }

  // Submission operations
  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = this.submissionId++;
    const now = new Date();
    const submission: Submission = {
      ...insertSubmission,
      id,
      createdAt: now
    };
    this.submissionMap.set(id, submission);
    return submission;
  }

  async getSubmission(id: number): Promise<Submission | undefined> {
    return this.submissionMap.get(id);
  }

  async getSubmissionsByForm(formId: number): Promise<Submission[]> {
    return Array.from(this.submissionMap.values()).filter(
      (submission) => submission.formId === formId
    );
  }

  async deleteSubmission(id: number): Promise<boolean> {
    return this.submissionMap.delete(id);
  }

  // File upload operations
  async createFileUpload(insertFileUpload: InsertFileUpload): Promise<FileUpload> {
    const id = this.fileUploadId++;
    const now = new Date();
    const fileUpload: FileUpload = {
      ...insertFileUpload,
      id,
      createdAt: now
    };
    this.fileUploadMap.set(id, fileUpload);
    return fileUpload;
  }

  async getFileUploadsBySubmission(submissionId: number): Promise<FileUpload[]> {
    return Array.from(this.fileUploadMap.values()).filter(
      (fileUpload) => fileUpload.submissionId === submissionId
    );
  }
}

import { db } from './db';
import { eq, and, like, desc } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash password if not already hashed
    if (!insertUser.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      insertUser.password = await bcrypt.hash(insertUser.password, salt);
    }

    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getSuperAdmins(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'super_admin'));
  }

  async getAdminsByCreator(superAdminId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'admin'));
  }

  // Form operations
  async createForm(insertForm: InsertForm): Promise<Form> {
    const [form] = await db.insert(forms).values(insertForm).returning();
    return form;
  }

  async getForm(id: number): Promise<Form | undefined> {
    const [form] = await db.select().from(forms).where(eq(forms.id, id));
    return form;
  }

  async updateForm(id: number, updates: Partial<InsertForm>): Promise<Form | undefined> {
    const [updatedForm] = await db
      .update(forms)
      .set(updates)
      .where(eq(forms.id, id))
      .returning();
    return updatedForm;
  }

  async deleteForm(id: number): Promise<boolean> {
    const result = await db.delete(forms).where(eq(forms.id, id));
    return true; // Assuming delete operation succeeded
  }

  async getForms(userId: number): Promise<Form[]> {
    return await db.select().from(forms).where(eq(forms.userId, userId));
  }

  async getAllForms(): Promise<Form[]> {
    return await db.select().from(forms).orderBy(desc(forms.createdAt));
  }

  async searchForms(query: string): Promise<Form[]> {
    return await db
      .select()
      .from(forms)
      .where(
        like(forms.name, `%${query}%`)
      );
  }

  async publishForm(id: number): Promise<Form | undefined> {
    const [form] = await db
      .update(forms)
      .set({
        status: 'published',
        publishedUrl: `/public-form/${id}`
      })
      .where(eq(forms.id, id))
      .returning();
    return form;
  }

  // Submission operations
  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const [submission] = await db
      .insert(submissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async getSubmission(id: number): Promise<Submission | undefined> {
    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, id));
    return submission;
  }

  async getSubmissionsByForm(formId: number): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .where(eq(submissions.formId, formId))
      .orderBy(desc(submissions.createdAt));
  }

  async deleteSubmission(id: number): Promise<boolean> {
    await db.delete(submissions).where(eq(submissions.id, id));
    return true;
  }

  // File upload operations
  async createFileUpload(insertFileUpload: InsertFileUpload): Promise<FileUpload> {
    const [fileUpload] = await db
      .insert(fileUploads)
      .values(insertFileUpload)
      .returning();
    return fileUpload;
  }

  async getFileUploadsBySubmission(submissionId: number): Promise<FileUpload[]> {
    return await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.submissionId, submissionId));
  }
}

// Initialize the database storage
export const storage = new DatabaseStorage();