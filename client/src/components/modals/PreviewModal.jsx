import React, { useState } from 'react';
import FormComponents from '@/components/form-builder/FormComponents';
import { Icons } from '@/components/ui/ui-icons';

const PreviewModal = ({ onClose, formFields, formName }) => {
  const [formValues, setFormValues] = useState({});
  
  const handleFormValueChange = (fieldId, value) => {
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
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full md:max-w-2xl">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Form Preview: {formName}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    This is how your form will appear to users.
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {hasBannerComponent ? (
                    <div className="flex flex-col md:flex-row">
                      {/* Banner section */}
                      <div className="md:w-1/3 p-4 border-b md:border-b-0 md:border-r border-gray-200">
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center h-full">
                          <Icons.BannerUpload />
                          <p className="mt-2 text-sm text-gray-500">{bannerField?.label || 'Upload event banner'}</p>
                          <p className="text-xs text-gray-400 mt-1">{bannerField?.helperText || 'PNG, JPG, GIF up to 10MB'}</p>
                          <button className="mt-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            Upload Banner
                          </button>
                        </div>
                      </div>
                      
                      {/* Form fields section */}
                      <div className="md:w-2/3 p-4">
                        <div className="space-y-4">
                          {regularFields.map(field => (
                            <div key={field.id}>
                              {!field.hideLabel && (
                                <>
                                  <label className="block text-sm font-medium text-gray-700">{field.label || `Untitled ${field.type}`}</label>
                                  {field.helperText && <p className="text-xs text-gray-500">{field.helperText}</p>}
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
                          <div className="pt-4">
                            <button
                              type="submit"
                              className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                              Submit Form
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formFields.map(field => (
                        <div key={field.id}>
                          {!field.hideLabel && (
                            <>
                              <label className="block text-sm font-medium text-gray-700">{field.label || `Untitled ${field.type}`}</label>
                              {field.helperText && <p className="text-xs text-gray-500">{field.helperText}</p>}
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
                      <div className="pt-4">
                        <button
                          type="submit"
                          className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Submit Form
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
              type="button" 
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
