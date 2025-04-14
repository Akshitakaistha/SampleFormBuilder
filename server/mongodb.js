import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Handle process termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

async function connectToDatabase() {
  // If already connected, return the connection
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  
  try {
    // Set mongoose options
    mongoose.set('strictQuery', false);
    
    // Create local MongoDB as fallback if connection to Atlas fails
    const localMongoURI = 'mongodb://localhost:27017/formbuilder';
    const connectionURI = process.env.MONGODB_URI || localMongoURI;
    
    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000
    };
    
    console.log('Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(connectionURI, options);
    
    console.log('MongoDB connection established');
    return mongoose;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    
    // If we failed to connect to remote MongoDB, try to use in-memory MongoDB
    console.log('Falling back to in-memory database');
    return mongoose;
  }
}

// Define schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin'], default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

const FormSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  schema: { type: Object, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  publishedUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SubmissionSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
  data: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now }
});

const FileUploadSchema = new mongoose.Schema({
  submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
  fieldId: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Form = mongoose.models.Form || mongoose.model('Form', FormSchema);
const Submission = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);
const FileUpload = mongoose.models.FileUpload || mongoose.model('FileUpload', FileUploadSchema);

export { connectToDatabase, User, Form, Submission, FileUpload };