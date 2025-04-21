import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Render the appropriate component based on field type
const FormComponents = ({ field, isPreview, onChange = () => {} }) => {
  switch (field.type) {
    case 'textInput':
      return (
        <input 
          type="text" 
          placeholder={field.placeholder || ''}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          disabled={!isPreview}
          onChange={(e) => onChange(field.id, e.target.value)}
          required={field.required}
          minLength={field.minLength}
          maxLength={field.maxLength}
          readOnly={field.readOnly}
        />
      );

    case 'textArea':
      return (
        <textarea 
          placeholder={field.placeholder || ''}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          rows={field.rows || 3}
          disabled={!isPreview}
          onChange={(e) => onChange(field.id, e.target.value)}
          required={field.required}
          minLength={field.minLength}
          maxLength={field.maxLength}
          readOnly={field.readOnly}
        ></textarea>
      );

    case 'checkbox':
      return (
        <div className="mt-2">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <Checkbox
                id={`checkbox-${field.id}`}
                disabled={!isPreview}
                onCheckedChange={(checked) => onChange(field.id, checked)}
                required={field.required}
              />
            </div>
            <div className="ml-3 text-sm">
              <Label htmlFor={`checkbox-${field.id}`}>{field.label || 'I agree to the terms and conditions'}</Label>
              {field.checkboxText && <p className="text-gray-500">{field.checkboxText}</p>}
            </div>
          </div>
        </div>
      );

    case 'select':
      return (
        <select 
          className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          disabled={!isPreview}
          onChange={(e) => onChange(field.id, e.target.value)}
          required={field.required}
        >
          <option value="">{field.placeholder || 'Please select an option'}</option>
          {field.options?.map((option, idx) => (
            <option key={idx} value={option.value}>{option.label}</option>
          )) || (
            <>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
            </>
          )}
        </select>
      );

    case 'radio':
      return (
        <RadioGroup 
          className="mt-2 space-y-2" 
          disabled={!isPreview}
          onValueChange={(value) => onChange(field.id, value)}
          required={field.required}
        >
          {field.options?.map((option, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`radio-${field.id}-${idx}`} />
              <Label htmlFor={`radio-${field.id}-${idx}`}>{option.label}</Label>
            </div>
          )) || (
            <>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option1" id={`radio-${field.id}-1`} />
                <Label htmlFor={`radio-${field.id}-1`}>Option 1</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option2" id={`radio-${field.id}-2`} />
                <Label htmlFor={`radio-${field.id}-2`}>Option 2</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option3" id={`radio-${field.id}-3`} />
                <Label htmlFor={`radio-${field.id}-3`}>Option 3</Label>
              </div>
            </>
          )}
        </RadioGroup>
      );

    case 'date':
      return (
        <input 
          type="date" 
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          disabled={!isPreview}
          onChange={(e) => onChange(field.id, e.target.value)}
          required={field.required}
          min={field.min}
          max={field.max}
          readOnly={field.readOnly}
        />
      );

    case 'toggle':
      return (
        <div className="mt-2 flex items-center">
          <Switch
            checked={field.value !== undefined ? field.value : field.defaultChecked || false}
            onCheckedChange={(checked) => {
              console.log("Toggle switched:", checked);
              if (onChange) onChange(field.id, checked);
            }}
            disabled={!isPreview}
          />
          <span className="ml-2 text-sm text-gray-700">{field.toggleLabel || 'Enable'}</span>
        </div>
      );

    case 'fileUpload':
      return (
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center w-full">
            {field.previewUrl || field.value?.previewUrl ? (
              <div className="flex flex-col items-center">
                <div className="my-3 p-2 border rounded bg-gray-50 flex items-center max-w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-gray-700 truncate max-w-[200px]">
                    {field.fileName || field.value?.fileName || 'Uploaded file'}
                  </span>
                </div>
                
                {isPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onChange) onChange(field.id, null);
                      console.log("File removed");
                    }}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Remove file
                  </button>
                )}
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
                    onClick={(e) => {
                      e.preventDefault();
                      if (isPreview) {
                        console.log("Trying to open file input with ID:", `file-upload-${field.id}`);
                        // Direct approach - open file selector
                        const fileInput = document.getElementById(`file-upload-${field.id}`);
                        if (fileInput) {
                          fileInput.click();
                          console.log("File input clicked");
                        } else {
                          console.error(`Could not find file input with id file-upload-${field.id}`);
                        }
                      }
                    }}
                  >
                    Select a file
                  </button>
                  <input 
                    id={`file-upload-${field.id}`} 
                    name={`file-upload-${field.id}`} 
                    type="file" 
                    className="hidden"
                    disabled={!isPreview}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        console.log("File selected:", file.name);
                        
                        // Create a FileReader to read the file as data URL
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            // Create file data with both file object and data URL
                            const fileData = {
                              file: file,
                              fileName: file.name,
                              fileType: file.type,
                              previewUrl: URL.createObjectURL(file),
                              dataUrl: event.target.result
                            };
                            
                            // Log success and call onChange handler
                            console.log("File successfully processed:", file.name);
                            if (onChange) onChange(field.id, fileData);
                          }
                        };
                        
                        // Handle potential errors during file reading
                        reader.onerror = () => {
                          console.error("Error reading file:", file.name);
                        };
                        
                        // Start reading the file as data URL
                        reader.readAsDataURL(file);
                      }
                    }}
                    required={field.required}
                    accept={field.allowedTypes || "image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
                  />
                  <p className="text-sm text-center text-gray-500">or drag and drop your file here</p>
                </div>
                <p className="text-xs text-gray-500">
                  {field.fileTypeText || 'PNG, JPG, PDF, DOC up to 10MB'}
                </p>
              </>
            )}
          </div>
        </div>
      );

    case 'number':
      return (
        <input 
          type="number" 
          placeholder={field.placeholder || '0'}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          disabled={!isPreview}
          onChange={(e) => onChange(field.id, e.target.value)}
          required={field.required}
          min={field.min}
          max={field.max}
          step={field.step || 1}
          readOnly={field.readOnly}
        />
      );

    case 'email':
      return (
        <input 
          type="email" 
          placeholder={field.placeholder || 'email@example.com'}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          disabled={!isPreview}
          onChange={(e) => onChange(field.id, e.target.value)}
          required={field.required}
          pattern={field.pattern}
          readOnly={field.readOnly}
        />
      );

    case 'mediaUpload':
      return (
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center w-full">
            {field.previewUrl || field.value?.previewUrl ? (
              <div className="flex flex-col items-center">
                {(field.fileType && field.fileType.startsWith('video/')) || 
                 (field.value?.fileType && field.value.fileType.startsWith('video/')) ? (
                  <video 
                    controls 
                    className="max-w-full h-auto max-h-[200px] mb-2 border rounded"
                    src={field.previewUrl || field.value?.previewUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (field.fileType && field.fileType.startsWith('audio/')) || 
                   (field.value?.fileType && field.value.fileType.startsWith('audio/')) ? (
                  <audio 
                    controls 
                    className="max-w-full mb-2"
                    src={field.previewUrl || field.value?.previewUrl}
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
                      {field.fileName || field.value?.fileName || 'Uploaded media'}
                    </span>
                  </div>
                )}
                
                {isPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onChange) onChange(field.id, null);
                      console.log("Media removed");
                    }}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Remove media
                  </button>
                )}
              </div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex flex-col text-sm text-gray-600 justify-center">
                  <button 
                    type="button"
                    className="cursor-pointer mx-auto mb-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    onClick={(e) => {
                      e.preventDefault();
                      if (isPreview) {
                        console.log("Trying to open media file input with ID:", `media-upload-${field.id}`);
                        // Direct approach - open file selector
                        const fileInput = document.getElementById(`media-upload-${field.id}`);
                        if (fileInput) {
                          fileInput.click();
                          console.log("Media file input clicked");
                        } else {
                          console.error(`Could not find file input with id media-upload-${field.id}`);
                        }
                      }
                    }}
                  >
                    Select media file
                  </button>
                  <input 
                    id={`media-upload-${field.id}`} 
                    name={`media-upload-${field.id}`} 
                    type="file" 
                    className="hidden"
                    disabled={!isPreview}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        console.log("Media file selected:", file.name, file.type);
                        
                        // Create a FileReader to read the file as data URL
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            // Create media file data with both file object and data URL
                            const fileData = {
                              file: file,
                              fileName: file.name,
                              fileType: file.type,
                              previewUrl: URL.createObjectURL(file),
                              dataUrl: event.target.result
                            };
                            
                            // Log success and call onChange handler
                            console.log("Media file successfully processed:", file.name);
                            if (onChange) onChange(field.id, fileData);
                          }
                        };
                        
                        // Handle potential errors during file reading
                        reader.onerror = () => {
                          console.error("Error reading media file:", file.name);
                        };
                        
                        // Start reading the file as data URL
                        reader.readAsDataURL(file);
                      }
                    }}
                    required={field.required}
                    accept={field.allowedTypes || "audio/*,video/*"}
                  />
                  <p className="text-sm text-center text-gray-500">or drag and drop your media file here</p>
                </div>
                <p className="text-xs text-gray-500">
                  {field.mediaTypeText || 'MP3, WAV, MP4, MOV up to 10MB'}
                </p>
              </>
            )}
          </div>
        </div>
      );

    case 'bannerUpload':
      // This is handled in the FormCanvas component
      return null;

    default:
      return <p className="text-sm text-gray-500">Unknown field type: {field.type}</p>;
  }
};

export default FormComponents;