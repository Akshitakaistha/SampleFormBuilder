import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import FormComponents from '@/components/form-builder/FormComponents';
import { Icons } from '@/components/ui/ui-icons';

const PublicForm = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [formValues, setFormValues] = useState({});
  
  // Load form data
  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/public-forms/${id}`);
        
        if (!response.ok) {
          throw new Error('Form not found or not published');
        }
        
        const data = await response.json();
        setForm(data);
      } catch (error) {
        setError(error.message || 'Failed to load form');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchForm();
    }
  }, [id]);
  
  // Handle form value changes
  const handleFormValueChange = (fieldId, value) => {
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Check required fields
      const requiredFieldsMissing = form.schema.fields
        .filter(field => field.required)
        .some(field => !formValues[field.id] && formValues[field.id] !== false);
      
      if (requiredFieldsMissing) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }
      
      // Prepare form data for submission with file uploads
      const formData = new FormData();
      
      // Add submission metadata
      formData.append('formId', id);
      
      // Process each form value
      Object.entries(formValues).forEach(([fieldId, value]) => {
        // Check if this is a file upload
        if (value && value.file instanceof File) {
          // For file uploads, append the file
          formData.append(`files[${fieldId}]`, value.file);
          // Also include file metadata as JSON
          formData.append(`fileData[${fieldId}]`, JSON.stringify({
            fieldId,
            fileName: value.fileName
          }));
        } else {
          // For normal form values, append as JSON string
          formData.append(`data[${fieldId}]`, JSON.stringify(value));
        }
      });
      
      // Submit the form with multipart/form-data
      const response = await fetch(`/api/forms/${id}/submit`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type, let the browser set it with boundary
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit form');
      }
      
      // Show success message
      setSubmissionSuccess(true);
      toast({
        title: 'Success',
        description: 'Form submitted successfully',
      });
      
      // Reset form values
      setFormValues({});
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit form',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-500">Loading form...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (submissionSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <Icons.Success />
            </div>
            <CardTitle className="text-center">Form Submitted</CardTitle>
            <CardDescription className="text-center">
              Thank you for your submission!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500">
              Your response has been recorded successfully.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => window.location.reload()}>Submit Another Response</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Check if we have a banner component
  const hasBannerComponent = form?.schema.fields.some(field => field.type === 'bannerUpload');
  const bannerField = form?.schema.fields.find(field => field.type === 'bannerUpload');
  const regularFields = form?.schema.fields.filter(field => field.type !== 'bannerUpload') || [];
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{form?.name || 'Untitled Form'}</CardTitle>
            {form?.description && (
              <CardDescription>{form.description}</CardDescription>
            )}
          </CardHeader>
        </Card>
        
        <form onSubmit={handleSubmit}>
          {hasBannerComponent ? (
            // Banner-enabled form layout (2-column)
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="flex flex-col md:flex-row">
                {/* Banner Upload Area (Left side) */}
                <div className="md:w-1/3 p-4 border-b md:border-b-0 md:border-r border-gray-200">
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center h-full">
                    {formValues[bannerField?.id]?.preview ? (
                      <div className="w-full h-full">
                        <img 
                          src={formValues[bannerField.id].preview} 
                          alt="Banner Preview" 
                          className="w-full h-full object-contain max-h-64"
                        />
                        <div className="mt-4 flex justify-center">
                          <label className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            Change Banner
                            <input 
                              type="file" 
                              className="sr-only" 
                              accept="image/*" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  console.log("Banner upload changed:", file.name);
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (event.target?.result) {
                                      // Set banner in form values
                                      setFormValues(prev => ({
                                        ...prev,
                                        [bannerField.id]: {
                                          file: file,
                                          fileName: file.name,
                                          preview: event.target.result
                                        }
                                      }));
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Icons.BannerUpload />
                        <p className="mt-2 text-sm text-gray-500">{bannerField?.label || 'Upload event banner'}</p>
                        <p className="text-xs text-gray-400 mt-1">{bannerField?.helperText || 'PNG, JPG, GIF up to 10MB'}</p>
                        <label className="mt-4 cursor-pointer px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                          Upload Banner
                          <input 
                            type="file" 
                            className="sr-only" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                console.log("Banner upload selected:", file.name);
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    // Set banner in form values
                                    setFormValues(prev => ({
                                      ...prev,
                                      [bannerField.id]: {
                                        file: file,
                                        fileName: file.name,
                                        preview: event.target.result
                                      }
                                    }));
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Form Fields (Right side) */}
                <div className="md:w-2/3 p-4">
                  <div className="space-y-6">
                    {regularFields.map(field => (
                      <div key={field.id} className="form-field">
                        {!field.hideLabel && (
                          <>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {field.helperText && <p className="text-xs text-gray-500 mb-2">{field.helperText}</p>}
                          </>
                        )}
                        <FormComponents 
                          field={field} 
                          isPreview={true} 
                          onChange={handleFormValueChange}
                        />
                      </div>
                    ))}
                    
                    <div className="pt-6">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={submitting}
                      >
                        {submitting ? 'Submitting...' : 'Submit Form'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Standard form layout (single column)
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {regularFields.map(field => (
                    <div key={field.id} className="form-field">
                      {!field.hideLabel && (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {field.helperText && <p className="text-xs text-gray-500 mb-2">{field.helperText}</p>}
                        </>
                      )}
                      <FormComponents 
                        field={field} 
                        isPreview={true} 
                        onChange={handleFormValueChange}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Form'}
                </Button>
              </CardFooter>
            </Card>
          )}
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by FormCraft</p>
        </div>
      </div>
    </div>
  );
};

export default PublicForm;
