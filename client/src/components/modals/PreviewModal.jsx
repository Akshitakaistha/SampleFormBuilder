import React, { useState, useRef, useEffect } from 'react';
import FormComponents from '@/components/form-builder/FormComponents';
import { Icons } from '@/components/ui/ui-icons';

const PreviewModal = ({ onClose, formFields, formName }) => {
  const [formValues, setFormValues] = useState({});
  const [dragActive, setDragActive] = useState({});
  
  // Create refs for file inputs
  const fileInputRefs = useRef({});
  
  // Function to trigger file input click
  const triggerFileInput = (fieldId) => {
    console.log("Triggering file input for field:", fieldId);
    if (fileInputRefs.current[fieldId]) {
      console.log("File input ref found, clicking...");
      fileInputRefs.current[fieldId].click();
    } else {
      console.error(`File input ref not found for field: ${fieldId}`);
    }
  };
  
  // Handle file drop
  const handleDrop = (e, fieldId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive({...dragActive, [fieldId]: false});
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      console.log("File dropped:", file.name);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const fileData = {
            file: file,
            fileName: file.name,
            fileType: file.type,
            previewUrl: URL.createObjectURL(file),
            dataUrl: event.target.result
          };
          
          console.log("Dropped file successfully processed:", file.name);
          handleFormValueChange(fieldId, fileData);
        }
      };
      
      reader.onerror = () => {
        console.error("Error reading dropped file:", file.name);
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  // Handle drag events
  const handleDrag = (e, fieldId, isDragActive) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDragActive !== undefined) {
      setDragActive({...dragActive, [fieldId]: isDragActive});
    }
  };
  
  const handleFormValueChange = (fieldId, value) => {
    console.log("Value changed for field:", fieldId, value);
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would submit the form data
    alert('Form submitted successfully in preview mode!');
  };
  
  // Check if we have a banner component
  const hasBannerComponent = formFields.some(field => field.type === 'bannerUpload');
  const bannerField = formFields.find(field => field.type === 'bannerUpload');
  const regularFields = formFields.filter(field => field.type !== 'bannerUpload');

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="relative min-h-screen">
        {/* Header bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Form Preview: {formName}</h2>
          <button 
            type="button"
            onClick={onClose}
            className="ml-auto flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Icons.X className="h-5 w-5 mr-1" />
            Close Preview
          </button>
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <form onSubmit={handleSubmit} className="w-full">
              {hasBannerComponent ? (
                <div>
                  {/* Banner section */}
                  <div className={`${bannerField?.position === 'top' ? 'w-full h-64' : 'md:float-left md:w-1/3 h-full min-h-[600px] md:min-h-screen'} relative`}>
                    {(bannerField?.bannerUrl || formValues[bannerField?.id]?.preview) ? (
                      <div className="w-full h-full">
                        <img 
                          src={formValues[bannerField?.id]?.preview || bannerField.bannerUrl} 
                          alt="Form Banner" 
                          className="w-full h-full object-cover"
                        />
                        {bannerField?.canUpload && (
                          <div className="absolute bottom-0 right-0 m-4">
                            <input
                              type="button"
                              value="Change Banner"
                              className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 bg-opacity-90"
                              onClick={(e) => {
                                e.preventDefault();
                                // Direct approach - open file selector
                                const fileInput = document.getElementById(`change-banner-${bannerField.id}`);
                                if (fileInput) {
                                  fileInput.click();
                                } else {
                                  console.error(`Could not find file input with id change-banner-${bannerField.id}`);
                                }
                              }}
                            />
                            <input 
                              id={`change-banner-${bannerField.id}`}
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  console.log("Banner file selected for change:", file.name);
                                  
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (event.target?.result) {
                                      // Create banner file data with both file object and data URL
                                      const fileData = {
                                        file: file,
                                        fileName: file.name,
                                        fileType: file.type,
                                        preview: event.target.result,
                                        dataUrl: event.target.result
                                      };
                                      
                                      // Log success and update form values
                                      console.log("Banner file successfully processed for change:", file.name);
                                      handleFormValueChange(bannerField.id, fileData);
                                    }
                                  };
                                  
                                  // Handle potential errors during file reading
                                  reader.onerror = () => {
                                    console.error("Error reading banner file for change:", file.name);
                                  };
                                  
                                  // Start reading the file as data URL
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border-b md:border-r border-gray-200 h-full p-6 flex flex-col items-center justify-center">
                        <Icons.BannerUpload className="h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">{bannerField?.label || 'Event Banner'}</p>
                        <p className="text-xs text-gray-400 mt-1">{bannerField?.helperText || 'This form includes a banner image'}</p>
                        <div className="mt-4">
                          <input 
                            type="button"
                            value="Upload Banner"
                            className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            onClick={(e) => {
                              e.preventDefault();
                              // Direct approach - open file selector
                              const fileInput = document.getElementById(`upload-banner-${bannerField.id}`);
                              if (fileInput) {
                                fileInput.click();
                              } else {
                                console.error(`Could not find file input with id upload-banner-${bannerField.id}`);
                              }
                            }}
                          />
                          <input 
                            id={`upload-banner-${bannerField.id}`}
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                console.log("Banner file selected:", file.name);
                                
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    // Create banner file data with both file object and data URL
                                    const fileData = {
                                      file: file,
                                      fileName: file.name,
                                      fileType: file.type,
                                      preview: event.target.result,
                                      dataUrl: event.target.result
                                    };
                                    
                                    // Log success and update form values
                                    console.log("Banner file successfully processed:", file.name);
                                    handleFormValueChange(bannerField.id, fileData);
                                  }
                                };
                                
                                // Handle potential errors during file reading
                                reader.onerror = () => {
                                  console.error("Error reading banner file:", file.name);
                                };
                                
                                // Start reading the file as data URL
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Form fields section */}
                  <div className={`${bannerField?.position === 'top' ? 'w-full' : 'md:float-right md:w-2/3'} p-6`}>
                    <div className="space-y-6">
                      {regularFields.map(field => (
                        <div key={field.id} className={`form-field ${field.gridColumn === 'half' ? 'md:w-1/2 md:pr-3 md:inline-block' : 'w-full'}`}>
                          {!field.hideLabel && (
                            <>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label || `Untitled ${field.type}`}</label>
                              {field.helperText && <p className="text-xs text-gray-500 mb-1">{field.helperText}</p>}
                            </>
                          )}
                          <FormComponents 
                            field={{
                              ...field,
                              value: formValues[field.id] !== undefined ? formValues[field.id] : field.defaultValue
                            }} 
                            isPreview={true} 
                            onChange={handleFormValueChange}
                          />
                        </div>
                      ))}
                      
                      {/* Form submit button */}
                      <div className="pt-6">
                        <button
                          type="submit"
                          className="w-full px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Submit Form
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formFields.map(field => (
                      <div key={field.id} className={field.gridColumn === 'half' ? 'col-span-1' : 'col-span-2'}>
                        {!field.hideLabel && (
                          <>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label || `Untitled ${field.type}`}</label>
                            {field.helperText && <p className="text-xs text-gray-500 mb-1">{field.helperText}</p>}
                          </>
                        )}
                        {field.type === 'fileUpload' || field.type === 'mediaUpload' ? (
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center w-full">
                              {formValues[field.id]?.fileName ? (
                                <div className="flex flex-col items-center">
                                  {field.type === 'mediaUpload' && formValues[field.id]?.fileType ? (
                                    <>
                                      {formValues[field.id]?.fileType.startsWith('video/') ? (
                                        <video 
                                          controls 
                                          className="max-w-full h-auto max-h-[200px] mb-2 border rounded"
                                          src={formValues[field.id]?.previewUrl || formValues[field.id]?.dataUrl}
                                        >
                                          Your browser does not support the video tag.
                                        </video>
                                      ) : formValues[field.id]?.fileType.startsWith('audio/') ? (
                                        <audio 
                                          controls 
                                          className="max-w-full mb-2"
                                          src={formValues[field.id]?.previewUrl || formValues[field.id]?.dataUrl}
                                        >
                                          Your browser does not support the audio tag.
                                        </audio>
                                      ) : (
                                        <div className="my-3 p-2 border rounded bg-gray-50 flex items-center max-w-full">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          <span className="text-sm text-gray-700 truncate max-w-[200px]">
                                            {formValues[field.id]?.fileName || 'Uploaded media'}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="my-3 p-2 border rounded bg-gray-50 flex items-center max-w-full">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <span className="text-sm text-gray-700 truncate max-w-[200px]">
                                        {formValues[field.id]?.fileName || 'Uploaded file'}
                                      </span>
                                    </div>
                                  )}
                                  
                                  <button
                                    type="button"
                                    onClick={() => handleFormValueChange(field.id, null)}
                                    className="text-xs text-red-600 hover:text-red-800 underline"
                                  >
                                    Remove {field.type === 'mediaUpload' ? 'media' : 'file'}
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                  <div className="flex flex-col text-sm text-gray-600 justify-center">
                                    <button 
                                      type="button"
                                      className="cursor-pointer mx-auto mb-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                      onClick={() => triggerFileInput(field.id)}
                                    >
                                      {field.type === 'mediaUpload' ? 'Select media file' : 'Select a file'}
                                    </button>
                                    <input 
                                      ref={el => fileInputRefs.current[field.id] = el}
                                      type="file" 
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          console.log("File selected in preview modal:", file.name);
                                          
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            if (event.target?.result) {
                                              const fileData = {
                                                file: file,
                                                fileName: file.name,
                                                fileType: file.type,
                                                previewUrl: URL.createObjectURL(file),
                                                dataUrl: event.target.result
                                              };
                                              
                                              console.log("File successfully processed in modal:", file.name);
                                              handleFormValueChange(field.id, fileData);
                                            }
                                          };
                                          
                                          reader.onerror = () => {
                                            console.error("Error reading file in modal:", file.name);
                                          };
                                          
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                      accept={field.allowedTypes || (field.type === 'mediaUpload' ? "audio/*,video/*" : "image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
                                    />
                                    <p className="text-sm text-center text-gray-500">or drag and drop your file here</p>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {field.fileTypeText || field.mediaTypeText || (field.type === 'mediaUpload' ? 'MP3, WAV, MP4, MOV up to 10MB' : 'PNG, JPG, PDF, DOC up to 10MB')}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <FormComponents 
                            field={{
                              ...field,
                              value: formValues[field.id] !== undefined ? formValues[field.id] : field.defaultValue
                            }} 
                            isPreview={true} 
                            onChange={handleFormValueChange}
                          />
                        )}
                      </div>
                    ))}
                    
                    {/* Form submit button */}
                    <div className="pt-6 col-span-2">
                      <button
                        type="submit"
                        className="w-full px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Submit Form
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
