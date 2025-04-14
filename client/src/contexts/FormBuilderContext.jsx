import React, { createContext, useState, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Create the context
const FormBuilderContext = createContext(null);

// Initial state for a new form
const initialFormState = {
  id: null,
  name: '',
  description: '',
  fields: [],
  activeField: null,
  status: 'draft',
  publishedUrl: null
};

// Initial state for each field type
const initialFieldStates = {
  textInput: {
    type: 'textInput',
    label: 'Text Input',
    helperText: 'Enter text here',
    placeholder: 'Type here...',
    required: false
  },
  textArea: {
    type: 'textArea',
    label: 'Text Area',
    helperText: 'Enter longer text here',
    placeholder: 'Type here...',
    required: false,
    rows: 3
  },
  checkbox: {
    type: 'checkbox',
    label: 'Checkbox',
    helperText: 'Select options',
    required: false,
    checkboxLabel: 'I agree',
    checkboxText: 'By checking this box, you agree to our terms and conditions.'
  },
  select: {
    type: 'select',
    label: 'Select List',
    helperText: 'Choose from options',
    placeholder: 'Please select an option',
    required: false,
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' }
    ]
  },
  radio: {
    type: 'radio',
    label: 'Radio Button',
    helperText: 'Select one option',
    required: false,
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' }
    ]
  },
  date: {
    type: 'date',
    label: 'Date/Time Picker',
    helperText: 'Select a date',
    required: false
  },
  toggle: {
    type: 'toggle',
    label: 'Toggle Switch',
    helperText: 'Toggle this option',
    required: false,
    toggleLabel: 'Enable',
    defaultChecked: false
  },
  fileUpload: {
    type: 'fileUpload',
    label: 'File Upload',
    helperText: 'Upload your documents',
    required: false,
    allowedTypes: 'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileTypeText: 'PNG, JPG, PDF, DOC up to 10MB',
    maxFileSize: 10
  },
  number: {
    type: 'number',
    label: 'Number Input',
    helperText: 'Enter a number',
    placeholder: '0',
    required: false,
    min: null,
    max: null,
    step: 1
  },
  email: {
    type: 'email',
    label: 'Email Input',
    helperText: 'Enter your email address',
    placeholder: 'email@example.com',
    required: false,
    pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
  },
  mediaUpload: {
    type: 'mediaUpload',
    label: 'Audio/Video Upload',
    helperText: 'Upload audio or video files',
    required: false,
    allowedTypes: 'audio/*,video/*',
    mediaTypeText: 'MP3, WAV, MP4, MOV up to 10MB',
    maxFileSize: 10
  },
  bannerUpload: {
    type: 'bannerUpload',
    label: 'Banner Upload',
    helperText: 'Upload a banner image for your form',
    required: false,
    allowedTypes: 'image/*',
    fileTypeText: 'PNG, JPG, GIF up to 10MB',
    maxFileSize: 10
  }
};

// Form builder provider
export const FormBuilderProvider = ({ children }) => {
  const [formState, setFormState] = useState({ ...initialFormState });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  
  // Check if the form has a banner component
  const hasBannerComponent = formState.fields.some(field => field.type === 'bannerUpload');
  
  // Add new field to the form
  const addField = (fieldType) => {
    if (!initialFieldStates[fieldType]) return;
    
    // Create new field with default values
    const newField = {
      ...initialFieldStates[fieldType],
      id: uuidv4()
    };
    
    // Special handling for bannerUpload - only allow one per form
    if (fieldType === 'bannerUpload' && hasBannerComponent) {
      return;
    }
    
    // Update form state with new field
    setFormState(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
      activeField: newField.id
    }));
  };
  
  // Get active field
  const getActiveField = () => {
    return formState.fields.find(field => field.id === formState.activeField);
  };
  
  // Set active field
  const setActiveField = (fieldId) => {
    setFormState(prev => ({
      ...prev,
      activeField: fieldId
    }));
  };
  
  // Update field properties
  const updateFieldProperties = (fieldId, properties) => {
    setFormState(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId 
          ? { ...field, ...properties } 
          : field
      )
    }));
  };
  
  // Move field up in order
  const moveFieldUp = (index) => {
    if (index === 0) return;
    
    setFormState(prev => {
      const newFields = [...prev.fields];
      [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
      return {
        ...prev,
        fields: newFields
      };
    });
  };
  
  // Move field down in order
  const moveFieldDown = (index) => {
    if (index === formState.fields.length - 1) return;
    
    setFormState(prev => {
      const newFields = [...prev.fields];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      return {
        ...prev,
        fields: newFields
      };
    });
  };
  
  // Delete field
  const deleteField = (fieldId) => {
    setFormState(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId),
      activeField: prev.activeField === fieldId ? null : prev.activeField
    }));
  };
  
  // Reset form builder to initial state
  const resetFormBuilder = () => {
    setFormState({ ...initialFormState });
    setShowPreviewModal(false);
    setShowPublishModal(false);
  };
  
  const value = {
    formState,
    setFormState,
    hasBannerComponent,
    addField,
    getActiveField,
    setActiveField,
    updateFieldProperties,
    moveFieldUp,
    moveFieldDown,
    deleteField,
    showPreviewModal,
    setShowPreviewModal,
    showPublishModal,
    setShowPublishModal,
    resetFormBuilder
  };
  
  return (
    <FormBuilderContext.Provider value={value}>
      {children}
    </FormBuilderContext.Provider>
  );
};

// Custom hook to use the form builder context
export const useFormBuilder = () => {
  const context = useContext(FormBuilderContext);
  if (!context) {
    throw new Error('useFormBuilder must be used within a FormBuilderProvider');
  }
  return context;
};
