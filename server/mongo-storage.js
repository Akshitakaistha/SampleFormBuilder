import { connectToDatabase, User, Form, Submission, FileUpload } from './mongodb';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

// MongoDB storage implementation
class MongoStorage {
  constructor() {
    // Initialize connection
    this.initConnection();
    // Initialize default user (super admin)
    this.initializeDefaultUser();
  }

  async initConnection() {
    try {
      await connectToDatabase();
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async initializeDefaultUser() {
    try {
      const existingAdmin = await User.findOne({ role: 'super_admin' });
      
      if (!existingAdmin) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        const superAdmin = new User({
          username: 'admin',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'super_admin'
        });
        
        await superAdmin.save();
        console.log('Default super admin user created');
      }
    } catch (error) {
      console.error('Error creating default user:', error);
    }
  }

  // User operations
  async getUser(id) {
    try {
      return await User.findById(id);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return undefined;
    }
  }

  async getUserByUsername(username) {
    try {
      return await User.findOne({ username });
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email) {
    try {
      return await User.findOne({ email });
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(userData) {
    try {
      // Hash password if not already hashed
      if (!userData.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }
      
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      return await User.find();
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async getSuperAdmins() {
    try {
      return await User.find({ role: 'super_admin' });
    } catch (error) {
      console.error('Error getting super admins:', error);
      return [];
    }
  }

  async getAdminsByCreator(superAdminId) {
    try {
      return await User.find({ role: 'admin' });
    } catch (error) {
      console.error('Error getting admins by creator:', error);
      return [];
    }
  }

  // Form operations
  async createForm(formData) {
    try {
      const form = new Form(formData);
      return await form.save();
    } catch (error) {
      console.error('Error creating form:', error);
      throw error;
    }
  }

  async getForm(id) {
    try {
      return await Form.findById(id);
    } catch (error) {
      console.error('Error getting form by ID:', error);
      return undefined;
    }
  }

  async updateForm(id, updates) {
    try {
      updates.updatedAt = new Date();
      return await Form.findByIdAndUpdate(id, updates, { new: true });
    } catch (error) {
      console.error('Error updating form:', error);
      return undefined;
    }
  }

  async deleteForm(id) {
    try {
      await Form.findByIdAndDelete(id);
      // Also delete all submissions for this form
      await Submission.deleteMany({ formId: id });
      return true;
    } catch (error) {
      console.error('Error deleting form:', error);
      return false;
    }
  }

  async getForms(userId) {
    try {
      return await Form.find({ userId }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting forms by user ID:', error);
      return [];
    }
  }

  async getAllForms() {
    try {
      return await Form.find().sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting all forms:', error);
      return [];
    }
  }

  async searchForms(query) {
    try {
      return await Form.find({ 
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      });
    } catch (error) {
      console.error('Error searching forms:', error);
      return [];
    }
  }

  async publishForm(id) {
    try {
      return await Form.findByIdAndUpdate(
        id, 
        { 
          status: 'published', 
          publishedUrl: `/public-form/${id}`,
          updatedAt: new Date()
        }, 
        { new: true }
      );
    } catch (error) {
      console.error('Error publishing form:', error);
      return undefined;
    }
  }

  // Submission operations
  async createSubmission(submissionData) {
    try {
      const submission = new Submission(submissionData);
      return await submission.save();
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  }

  async getSubmission(id) {
    try {
      return await Submission.findById(id);
    } catch (error) {
      console.error('Error getting submission by ID:', error);
      return undefined;
    }
  }

  async getSubmissionsByForm(formId) {
    try {
      return await Submission.find({ formId }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting submissions by form ID:', error);
      return [];
    }
  }

  async deleteSubmission(id) {
    try {
      await Submission.findByIdAndDelete(id);
      // Also delete any file uploads for this submission
      await FileUpload.deleteMany({ submissionId: id });
      return true;
    } catch (error) {
      console.error('Error deleting submission:', error);
      return false;
    }
  }

  // File upload operations
  async createFileUpload(fileUploadData) {
    try {
      const fileUpload = new FileUpload(fileUploadData);
      return await fileUpload.save();
    } catch (error) {
      console.error('Error creating file upload:', error);
      throw error;
    }
  }

  async getFileUploadsBySubmission(submissionId) {
    try {
      return await FileUpload.find({ submissionId });
    } catch (error) {
      console.error('Error getting file uploads by submission ID:', error);
      return [];
    }
  }
}

// Create and export a singleton instance
export const mongoStorage = new MongoStorage();