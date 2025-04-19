import React, { useState } from 'react';
import FormComponents from '@/components/form-builder/FormComponents';
import { Icons } from '@/components/ui/ui-icons';

const PreviewModal = ({ onClose, formFields, formName }) => {
  const [formValues, setFormValues] = useState({});
  
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
                  <div className={`${bannerField?.position === 'top' ? 'w-full h-64' : 'md:float-left md:w-1/3 h-full md:min-h-[400px]'} relative`}>
                    {bannerField?.bannerUrl ? (
                      <div className="w-full h-full">
                        <img 
                          src={bannerField.bannerUrl} 
                          alt="Form Banner" 
                          className="w-full h-full object-cover"
                        />
                        {bannerField?.canUpload && (
                          <div className="absolute bottom-0 right-0 m-4">
                            <label className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 bg-opacity-90">
                              Change Banner
                              <input 
                                type="file" 
                                className="sr-only" 
                                accept="image/*" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        // Update the local state with the new image
                                        handleFormValueChange(bannerField.id, {
                                          file: file,
                                          preview: event.target.result
                                        });
                                        console.log("Banner would be uploaded:", file.name);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }} 
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border-b md:border-r border-gray-200 h-full p-6 flex flex-col items-center justify-center">
                        <Icons.BannerUpload className="h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">{bannerField?.label || 'Event Banner'}</p>
                        <p className="text-xs text-gray-400 mt-1">{bannerField?.helperText || 'This form includes a banner image'}</p>
                        <label className="mt-4 cursor-pointer px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                          Upload Banner
                          <input 
                            type="file" 
                            className="sr-only" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    // Update the local state with the new image
                                    handleFormValueChange(bannerField.id, {
                                      file: file,
                                      preview: event.target.result
                                    });
                                    console.log("Banner would be uploaded:", file.name);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  
                  {/* Form fields section */}
                  <div className={`${bannerField?.position === 'top' ? 'w-full' : 'md:ml-1/3'} p-6`}>
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
                            field={field} 
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
                        <FormComponents 
                          field={field} 
                          isPreview={true} 
                          onChange={handleFormValueChange}
                        />
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
