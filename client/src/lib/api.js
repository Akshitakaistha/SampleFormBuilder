import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

/**
 * API utilities for the FormCraft application
 */

// Auth API calls
export const loginUser = async (username, password) => {
  try {
    const response = await apiRequest('POST', '/api/auth/login', {
      username,
      password
    });
    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Login failed');
  }
};

export const registerUser = async (username, email, password) => {
  try {
    const response = await apiRequest('POST', '/api/auth/register', {
      username,
      email,
      password
    });
    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Registration failed');
  }
};

// Form API calls
export const createForm = async (formData) => {
  try {
    const response = await apiRequest('POST', '/api/forms', formData);
    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Failed to create form');
  }
};

export const updateForm = async (formId, formData) => {
  try {
    const response = await apiRequest('PUT', `/api/forms/${formId}`, formData);
    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Failed to update form');
  }
};

export const publishForm = async (formId) => {
  try {
    const response = await apiRequest('POST', `/api/forms/${formId}/publish`);
    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Failed to publish form');
  }
};

export const deleteForm = async (formId) => {
  try {
    await apiRequest('DELETE', `/api/forms/${formId}`);
    return true;
  } catch (error) {
    throw new Error(error.message || 'Failed to delete form');
  }
};

// Form submission API calls
export const submitForm = async (formId, formData) => {
  try {
    const response = await apiRequest('POST', `/api/forms/${formId}/submit`, formData);
    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Failed to submit form');
  }
};

export const deleteSubmission = async (submissionId) => {
  try {
    await apiRequest('DELETE', `/api/submissions/${submissionId}`);
    return true;
  } catch (error) {
    throw new Error(error.message || 'Failed to delete submission');
  }
};

// User management API calls
export const createAdminUser = async (userData) => {
  try {
    const response = await apiRequest('POST', '/api/users/admin', userData);
    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Failed to create admin user');
  }
};

export const deleteUser = async (userId) => {
  try {
    await apiRequest('DELETE', `/api/users/${userId}`);
    return true;
  } catch (error) {
    throw new Error(error.message || 'Failed to delete user');
  }
};

// File upload API call
export const uploadFile = async (file, submissionId, fieldId) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('submissionId', submissionId);
    formData.append('fieldId', fieldId);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Failed to upload file');
  }
};

// Helper hook for API operations with toast feedback
export const useApiWithToast = () => {
  const { toast } = useToast();
  
  const callApiWithToast = async (
    apiFunc, 
    params = [], 
    successMessage = 'Operation successful', 
    errorMessage = 'Operation failed'
  ) => {
    try {
      const result = await apiFunc(...params);
      toast({
        title: 'Success',
        description: successMessage
      });
      return result;
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || errorMessage,
        variant: 'destructive'
      });
      throw error;
    }
  };
  
  return { callApiWithToast };
};
