import { connectToDatabase, User, Form, Submission, FileUpload } from './mongodb';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

// MongoDB storage implementation
class MongoStorage {
  constructor() {
    // Connection status flags
    this.connectionEstablished = false;
    this.isUsingInMemory = false;
    this.isConnectionAttempted = false;
    
    // Initialize connection promise
    this.connectionPromise = this.initConnection();
  }

  async initConnection() {
    try {
      // Prevent multiple initialization attempts
      if (this.isConnectionAttempted) {
        return this.connectionEstablished;
      }
      
      this.isConnectionAttempted = true;
      
      // Attempt to connect to MongoDB
      const connection = await connectToDatabase();
      
      if (!connection) {
        console.log('MongoDB connection failed, using in-memory storage instead');
        this.isUsingInMemory = true;
        this.connectionEstablished = true;
        return true;
      }
      
      // After connection is established, initialize the default user
      await this.initializeDefaultUser();
      this.connectionEstablished = true;
      return true;
    } catch (error) {
      console.error('Failed to connect to MongoDB, falling back to in-memory storage:', error);
      this.isUsingInMemory = true;
      this.connectionEstablished = true;
      return true; // Still return true so the app can continue with in-memory storage
    }
  }

  async initializeDefaultUser() {
    try {
      if (this.isUsingInMemory) {
        console.log('Using in-memory storage, skipping default user creation');
        return;
      }
      
      const existingAdmin = await User.findOne({ role: 'super_admin' }).exec();
      
      if (!existingAdmin) {
        console.log('No super admin found, creating default user...');
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
      } else {
        console.log('Default super admin user already exists');
      }
    } catch (error) {
      console.error('Error creating default user:', error);
    }
  }
  
  // Ensure connection is established before any operation
  async ensureConnection() {
    if (!this.connectionEstablished) {
      await this.connectionPromise;
    }
    
    return this.connectionEstablished;
  }

  // User operations
  async getUser(id) {
    await this.ensureConnection();
    try {
      return await User.findById(id);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return undefined;
    }
  }

  async getUserByUsername(username) {
    await this.ensureConnection();
    try {
      return await User.findOne({ username });
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email) {
    await this.ensureConnection();
    try {
      return await User.findOne({ email });
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(userData) {
    await this.ensureConnection();
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

  async deleteUser(id) {
    await this.ensureConnection();
    try {
      console.log('Attempting to delete user with ID:', id, 'Type:', typeof id);
      
      // Check if it's a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.error('Invalid MongoDB ObjectId:', id);
        
        // Try to find the user by other means if possible (this is a fallback)
        if (typeof id === 'string' && id.match(/^[0-9]+$/)) {
          // If the ID is a string that looks like a number, try to find by a numeric ID field if you have one
          console.log('Attempting to find user by numeric ID');
          // No direct way to delete by non-ObjectId in Mongoose without a query
          // This would require your schema to have a secondary ID field
          return false;
        }
        return false;
      }
      
      console.log('Valid ObjectId, proceeding with deletion');
      const result = await User.findByIdAndDelete(id);
      console.log('Deletion result:', result ? 'User deleted' : 'User not found');
      return !!result; // Return true if user was found and deleted, false otherwise
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async getAllUsers() {
    await this.ensureConnection();
    try {
      return await User.find();
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async getSuperAdmins() {
    await this.ensureConnection();
    try {
      return await User.find({ role: 'super_admin' });
    } catch (error) {
      console.error('Error getting super admins:', error);
      return [];
    }
  }

  async getAdminsByCreator(superAdminId) {
    await this.ensureConnection();
    try {
      return await User.find({ role: 'admin' });
    } catch (error) {
      console.error('Error getting admins by creator:', error);
      return [];
    }
  }

  // Form operations
  async createForm(formData) {
    await this.ensureConnection();
    try {
      console.log('MongoStorage: Creating form with data:', JSON.stringify(formData));
      
      // Make sure schema is an object, not a string
      if (typeof formData.schema === 'string') {
        try {
          formData.schema = JSON.parse(formData.schema);
          console.log('MongoStorage: Parsed schema from string');
        } catch (e) {
          console.error('MongoStorage: Failed to parse schema string, using as is:', e);
        }
      }
      
      // Ensure userId is properly set
      if (!formData.userId) {
        console.error('MongoStorage: No userId provided in form data');
        throw new Error('User ID is required to create a form');
      }
      
      const form = new Form(formData);
      console.log('MongoStorage: Form model created, saving...');
      const savedForm = await form.save();
      console.log('MongoStorage: Form saved successfully with ID:', savedForm._id);
      return savedForm;
    } catch (error) {
      console.error('MongoStorage: Error creating form:', error);
      throw error;
    }
  }

  async getForm(id) {
    await this.ensureConnection();
    try {
      return await Form.findById(id);
    } catch (error) {
      console.error('Error getting form by ID:', error);
      return undefined;
    }
  }

  async updateForm(id, updates) {
    await this.ensureConnection();
    try {
      updates.updatedAt = new Date();
      return await Form.findByIdAndUpdate(id, updates, { new: true });
    } catch (error) {
      console.error('Error updating form:', error);
      return undefined;
    }
  }

  async deleteForm(id) {
    await this.ensureConnection();
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
    await this.ensureConnection();
    try {
      return await Form.find({ userId }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting forms by user ID:', error);
      return [];
    }
  }

  async getAllForms() {
    await this.ensureConnection();
    try {
      return await Form.find().sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting all forms:', error);
      return [];
    }
  }

  async searchForms(query) {
    await this.ensureConnection();
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
    await this.ensureConnection();
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
    await this.ensureConnection();
    try {
      const submission = new Submission(submissionData);
      return await submission.save();
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  }

  async getSubmission(id) {
    await this.ensureConnection();
    try {
      return await Submission.findById(id);
    } catch (error) {
      console.error('Error getting submission by ID:', error);
      return undefined;
    }
  }

  async getSubmissionsByForm(formId) {
    await this.ensureConnection();
    try {
      return await Submission.find({ formId }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting submissions by form ID:', error);
      return [];
    }
  }

  async deleteSubmission(id) {
    await this.ensureConnection();
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
    await this.ensureConnection();
    try {
      const fileUpload = new FileUpload(fileUploadData);
      return await fileUpload.save();
    } catch (error) {
      console.error('Error creating file upload:', error);
      throw error;
    }
  }

  async getFileUploadsBySubmission(submissionId) {
    await this.ensureConnection();
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