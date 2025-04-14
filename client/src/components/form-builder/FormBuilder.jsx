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

    // Cleanup
    return () => {
      // Any cleanup code if needed
    };
  }, [formId, setFormState, toast, resetFormBuilder]);

  const handleSaveDraft = useCallback(async () => {
    try {
      const formData = {
        name: formState.name || 'Untitled Form',
        description: formState.description || '',
        schema: { fields: formState.fields },
        status: 'draft'
      };

      if (formId) {
        // Update existing form
        await apiRequest('PUT', `/api/forms/${formId}`, formData);
        toast({
          title: 'Success',
          description: 'Form saved as draft successfully',
        });
      } else {
        // Create new form
        const response = await apiRequest('POST', '/api/forms', formData);
        const newForm = await response.json();

        // Update state with new form ID
        setFormState(prev => ({
          ...prev,
          id: newForm.id
        }));

        toast({
          title: 'Success',
          description: 'Form created and saved as draft',
        });
      }

      // Invalidate forms cache
      queryClient.invalidateQueries({ queryKey: ['/api/forms'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save form. Please try again.',
        variant: 'destructive'
      });
    }
  }, [formId, formState, setFormState, apiRequest, queryClient, toast]);

  const handlePublish = useCallback(async () => {
    try {
      // First save the form
      const formData = {
        name: formState.name || 'Untitled Form',
        description: formState.description || '',
        schema: { fields: formState.fields }
      };

      let formToPublish = formId;

      if (!formId) {
        // Create new form first
        const response = await apiRequest('POST', '/api/forms', formData);
        const newForm = await response.json();
        formToPublish = newForm.id;

        // Update state with new form ID
        setFormState(prev => ({
          ...prev,
          id: newForm.id
        }));
      } else {
        // Update existing form
        await apiRequest('PUT', `/api/forms/${formId}`, formData);
      }

      // Then publish the form
      const publishResponse = await apiRequest('POST', `/api/forms/${formToPublish}/publish`);
      const publishedForm = await publishResponse.json();

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
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to publish form. Please try again.',
        variant: 'destructive'
      });
    }
  }, [formId, formState, setFormState, apiRequest, queryClient, toast, setShowPublishModal]);

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