import React, { useEffect, useCallback } from 'react';
import { useFormBuilder } from '@/contexts/FormBuilderContext';
import FormHeader from './FormHeader';
import ComponentsPanel from './ComponentsPanel';
import FormCanvas from './FormCanvas';
import PropertyEditor from './PropertyEditor';
import PreviewModal from '@/components/modals/PreviewModal';
import PublishModal from '@/components/modals/PublishModal';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

const FormBuilder = ({ formId }) => {
  const { 
    formState,
    setFormState,
    showPreviewModal,
    setShowPreviewModal,
    showPublishModal,
    setShowPublishModal,
    resetFormBuilder
  } = useFormBuilder();

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Load form data if editing existing form
  useEffect(() => {
    const loadForm = async () => {
      if (formId) {
        try {
          const response = await fetch(`/api/forms/${formId}`, {
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error('Failed to load form');
          }

          const formData = await response.json();
          setFormState(prevState => ({
            ...prevState,
            id: formData.id,
            name: formData.name,
            description: formData.description,
            fields: formData.schema.fields || [],
            status: formData.status
          }));
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to load form. Please try again.',
            variant: 'destructive'
          });
        }
      }
    };

    if (formId) {
      loadForm();
    } else {
      resetFormBuilder();
    }
  }, [formId]); // Only depend on formId changes

  const handleSaveDraft = useCallback(async () => {
    console.log("Save draft started");
    try {
      // Validate that form has at least one field
      if (!formState.fields || formState.fields.length === 0) {
        console.log("Form has no fields, showing warning");
        toast({
          title: 'Warning',
          description: 'Please add at least one field to your form before saving.',
          variant: 'warning'
        });
        return;
      }

      console.log("Getting current user data");
      // Get current user to ensure we're authenticated and have user data
      try {
        const userData = await apiRequest({
          method: 'GET',
          url: '/api/auth/me'
        });
        
        console.log("User data received:", userData);
        
        if (!userData) {
          console.error("No user data returned");
          throw new Error("Not authenticated");
        }
        
        // Include userId explicitly in form data
        const formData = {
          name: formState.name || 'Untitled Form',
          description: formState.description || '',
          schema: { fields: formState.fields },
          status: 'draft',
          userId: userData._id || userData.id
        };

        console.log("Prepared form data:", JSON.stringify(formData));
        console.log("userId:", formData.userId);
        console.log("User data type:", userData._id ? 'MongoDB' : 'Other storage');

        if (formId) {
          // Update existing form
          console.log("Updating existing form with ID:", formId);
          try {
            console.log("Sending PUT request to update form");
            const response = await apiRequest({
              url: `/api/forms/${formId}`,
              method: 'PUT',
              data: formData
            });
            
            console.log("Form update response:", response);
            
            toast({
              title: 'Success',
              description: 'Form saved as draft successfully',
            });
          } catch (apiError) {
            console.error("API error updating form:", apiError);
            throw new Error(`Failed to update form: ${apiError.message || 'Unknown error'}`);
          }
        } else {
          // Create new form
          console.log("Creating new form - no formId present");
          try {
            console.log("Sending POST request to create form");
            const response = await apiRequest({
              url: '/api/forms',
              method: 'POST',
              data: formData
            });
            
            console.log("New form created response:", response);
            
            if (!response || !response.id) {
              console.error("API returned success but no form ID. Response:", response);
              throw new Error("Server didn't return a valid form ID");
            }
            
            console.log("Setting form state with new ID:", response.id);
            // Update state with new form ID
            setFormState(prev => ({
              ...prev,
              id: response.id
            }));
            
            toast({
              title: 'Success',
              description: 'Form created and saved as draft',
            });
          } catch (apiError) {
            console.error("API error creating form:", apiError);
            throw new Error(`Failed to create form: ${apiError.message || 'Unknown error'}`);
          }
        }
        
        console.log("Invalidating form queries cache");
        // Invalidate forms cache
        queryClient.invalidateQueries({ queryKey: ['/api/forms'] });
      } catch (authError) {
        console.error("Error getting user data:", authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
    } catch (error) {
      console.error("Error saving form:", error);
      toast({
        title: 'Error',
        description: `Failed to save form: ${error.message}`,
        variant: 'destructive'
      });
    }
  }, [formId, formState, setFormState, toast, queryClient]);

  const handlePublish = useCallback(async () => {
    try {
      // Validate that form has at least one field
      if (!formState.fields || formState.fields.length === 0) {
        toast({
          title: 'Warning',
          description: 'Please add at least one field to your form before publishing.',
          variant: 'warning'
        });
        return;
      }

      // Get current user to ensure we're authenticated and have user data
      const userData = await apiRequest({
        method: 'GET',
        url: '/api/auth/me'
      });
      
      if (!userData) {
        throw new Error("Not authenticated");
      }
      
      // First save the form - include userId explicitly
      const formData = {
        name: formState.name || 'Untitled Form',
        description: formState.description || '',
        schema: { fields: formState.fields },
        status: 'draft',
        userId: userData._id || userData.id
      };

      console.log("Publishing form data:", JSON.stringify(formData));
      
      let formToPublish = formId;

      if (!formId) {
        // Create new form first
        console.log("Creating new form before publishing");
        try {
          const newForm = await apiRequest({
            url: '/api/forms',
            method: 'POST',
            data: formData
          });
          
          console.log("New form created before publishing:", newForm);
          
          formToPublish = newForm.id;
  
          // Update state with new form ID
          setFormState(prev => ({
            ...prev,
            id: newForm.id
          }));
        } catch (apiError) {
          console.error("API error creating form:", apiError);
          throw new Error(`Failed to create form: ${apiError.message || 'Unknown error'}`);
        }
      } else {
        // Update existing form
        console.log("Updating existing form with ID:", formId);
        try {
          await apiRequest({
            url: `/api/forms/${formId}`,
            method: 'PUT',
            data: formData
          });
        } catch (apiError) {
          console.error("API error updating form:", apiError);
          throw new Error(`Failed to update form: ${apiError.message || 'Unknown error'}`);
        }
      }

      // Then publish the form
      console.log("Publishing form with ID:", formToPublish);
      try {
        const publishedForm = await apiRequest({
          url: `/api/forms/${formToPublish}/publish`,
          method: 'POST'
        });
        
        console.log("Form published successfully:", publishedForm);

        // Update form state with published status and URL
        setFormState(prev => ({
          ...prev,
          status: 'published',
          publishedUrl: publishedForm.publishedUrl
        }));

        // Invalidate forms cache
        queryClient.invalidateQueries({ queryKey: ['/api/forms'] });

        // Show publish success modal
        setShowPublishModal(true);
      } catch (apiError) {
        console.error("API error publishing form:", apiError);
        throw new Error(`Failed to publish form: ${apiError.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error publishing form:", error);
      toast({
        title: 'Error',
        description: `Failed to publish form: ${error.message}`,
        variant: 'destructive'
      });
    }
  }, [formId, formState, setFormState, queryClient, toast, setShowPublishModal]);

  const handlePreview = () => {
    setShowPreviewModal(true);
  };

  return (
    <div id="formBuilder" className="h-full flex flex-col">
      <FormHeader 
        onPreview={handlePreview}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
      />

      <div className="flex flex-1 overflow-hidden">
        <ComponentsPanel />
        <FormCanvas />
        <PropertyEditor />
      </div>

      {showPreviewModal && (
        <PreviewModal 
          onClose={() => setShowPreviewModal(false)}
          formFields={formState.fields}
          formName={formState.name || 'Untitled Form'}
        />
      )}

      {showPublishModal && (
        <PublishModal
          onClose={() => setShowPublishModal(false)}
          formId={formState.id}
          publishedUrl={formState.publishedUrl}
        />
      )}
    </div>
  );
};

export default FormBuilder;