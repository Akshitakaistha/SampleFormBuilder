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
    required: false,
    gridColumn: 'full' // 'full', 'half'
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
    label: 'Upload Banner',
    helperText: 'PNG, JPG, GIF up to 10MB',
    required: false,
    allowedTypes: 'image/*',
    fileTypeText: 'PNG, JPG, GIF up to 10MB',
    maxFileSize: 10,
    position: 'left',
    bannerUrl: '',
    canUpload: true,
    canDownload: true,
    canView: true
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
  
  // Create Career Drive Registration Form
  const createCareerDriveForm = () => {
    // Generate unique IDs for each field
    const firstNameId = uuidv4();
    const lastNameId = uuidv4();
    const genderMaleId = uuidv4();
    const genderFemaleId = uuidv4();
    const dobId = uuidv4();
    const qualificationCourseId = uuidv4();
    const gradYearId = uuidv4();
    const universityId = uuidv4();
    const locationId = uuidv4();
    const mobileId = uuidv4();
    const whatsappId = uuidv4();
    const emailId = uuidv4();
    const resumeUploadId = uuidv4();
    const jobDescriptionId = uuidv4();
    
    // Create Career Drive form
    setFormState({
      ...initialFormState,
      name: 'Career Drive Registration Form',
      description: 'Registration form for Career Drive applicants',
      fields: [
        // First Name field (half width)
        {
          ...initialFieldStates.textInput,
          id: firstNameId,
          label: 'First Name',
          placeholder: '',
          helperText: '',
          required: true,
          gridColumn: 'half'
        },
        // Last Name field (half width)
        {
          ...initialFieldStates.textInput,
          id: lastNameId,
          label: 'Last Name',
          placeholder: '',
          helperText: '',
          required: true,
          gridColumn: 'half'
        },
        // Gender radio group
        {
          ...initialFieldStates.radio,
          id: genderMaleId,
          label: 'Gender',
          helperText: '',
          required: true,
          layout: 'vertical',
          options: [
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
          ]
        },
        // Date of Birth field
        {
          ...initialFieldStates.date,
          id: dobId,
          label: 'Date of Birth',
          helperText: 'DD / MM / Year',
          required: true,
        },
        // Qualification - Course select
        {
          ...initialFieldStates.select,
          id: qualificationCourseId,
          label: 'Qualification',
          placeholder: 'Select Course',
          helperText: '',
          required: true,
          options: [
            { label: 'Bachelor of Technology', value: 'btech' },
            { label: 'Bachelor of Science', value: 'bsc' },
            { label: 'Master of Technology', value: 'mtech' },
            { label: 'Master of Business Administration', value: 'mba' },
            { label: 'Others', value: 'others' }
          ],
          gridColumn: 'half'
        },
        // Graduation Year select
        {
          ...initialFieldStates.select,
          id: gradYearId,
          label: '',
          placeholder: 'Select Graduation Year',
          helperText: '',
          required: true,
          options: [
            { label: '2023', value: '2023' },
            { label: '2024', value: '2024' },
            { label: '2025', value: '2025' },
            { label: 'Other', value: 'other' }
          ],
          gridColumn: 'half'
        },
        // University/College Name
        {
          ...initialFieldStates.textInput,
          id: universityId,
          label: 'College / University Name',
          placeholder: '',
          helperText: '',
          required: true,
          gridColumn: 'half'
        },
        // Location
        {
          ...initialFieldStates.select,
          id: locationId,
          label: 'Location',
          placeholder: 'Select Location',
          helperText: '',
          required: true,
          options: [
            { label: 'Bangalore', value: 'bangalore' },
            { label: 'Delhi', value: 'delhi' },
            { label: 'Mumbai', value: 'mumbai' },
            { label: 'Hyderabad', value: 'hyderabad' },
            { label: 'Other', value: 'other' }
          ],
          gridColumn: 'half'
        },
        // Mobile Number
        {
          ...initialFieldStates.textInput,
          id: mobileId,
          label: 'Mobile Number',
          placeholder: '',
          helperText: '',
          required: true,
        },
        // Whatsapp checkbox
        {
          ...initialFieldStates.checkbox,
          id: whatsappId,
          label: '',
          helperText: '',
          required: false,
          checkboxLabel: 'Whatsapp Me?',
          checkboxText: ''
        },
        // Email ID
        {
          ...initialFieldStates.email,
          id: emailId,
          label: 'Email ID',
          placeholder: '',
          helperText: '',
          required: true,
        },
        // Resume upload
        {
          ...initialFieldStates.fileUpload,
          id: resumeUploadId,
          label: 'Upload your resume to be considered for jobs that match',
          helperText: 'PDF, DOC, DOCX up to 5MB',
          required: true,
          allowedTypes: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          fileTypeText: 'PDF, DOC, DOCX up to 5MB',
          maxFileSize: 5
        },
        // Share Page Link banner for right side
        {
          ...initialFieldStates.bannerUpload,
          id: uuidv4(),
          label: 'Share Page Link',
          helperText: '',
          position: 'right',
          canUpload: false,
          canDownload: false,
          canShare: true,
          bannerUrl: '',
          bannerStyle: 'compact'
        },
        // Job Description banner for left side
        {
          ...initialFieldStates.bannerUpload,
          id: jobDescriptionId,
          label: 'Download Job Description',
          helperText: '',
          position: 'left',
          canUpload: true,
          canDownload: true,
          uploadLabel: 'Upload Poster (JPEG or PNG)',
          bannerUrl: '',
        },
        // Upload Poster banner with prompt
        {
          ...initialFieldStates.bannerUpload,
          id: uuidv4(),
          label: 'Upload Poster (JPEG or PNG)',
          helperText: 'Don\'t have a Design? Lets Create here...',
          position: 'center',
          canUpload: true,
          canDownload: false,
          uploadLabel: 'Upload Poster',
          bannerUrl: '',
          bannerStyle: 'large'
        }
      ]
    });
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
    resetFormBuilder,
    createCareerDriveForm
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