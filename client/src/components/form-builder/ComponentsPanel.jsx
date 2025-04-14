import React from 'react';
import { Icons } from '@/components/ui/ui-icons';
import { useFormBuilder } from '@/contexts/FormBuilderContext';

const ComponentsPanel = () => {
  const { addField } = useFormBuilder();
  
  const formComponents = [
    { type: 'textInput', label: 'Text Input', icon: <Icons.TextInput /> },
    { type: 'textArea', label: 'Text Area', icon: <Icons.TextArea /> },
    { type: 'checkbox', label: 'Checkbox', icon: <Icons.Checkbox /> },
    { type: 'select', label: 'Select List', icon: <Icons.Select /> },
    { type: 'radio', label: 'Radio Button', icon: <Icons.Radio /> },
    { type: 'date', label: 'Date/Time Picker', icon: <Icons.Date /> },
    { type: 'toggle', label: 'Toggle Switch', icon: <Icons.Toggle /> },
    { type: 'fileUpload', label: 'File Upload', icon: <Icons.FileUpload /> },
    { type: 'number', label: 'Number Input', icon: <Icons.Number /> },
    { type: 'email', label: 'Email Input', icon: <Icons.Email /> },
    { type: 'mediaUpload', label: 'Audio/Video Upload', icon: <Icons.MediaUpload /> },
    { type: 'bannerUpload', label: 'Banner Upload', icon: <Icons.BannerUpload /> }
  ];
  
  const handleDragStart = (e, component) => {
    e.dataTransfer.setData('componentType', component.type);
    e.target.classList.add('opacity-50');
  };
  
  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50');
  };
  
  const handleComponentClick = (component) => {
    addField(component.type);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Form Components</h2>
      </div>
      <div className="p-4 space-y-3">
        {formComponents.map(component => (
          <div
            key={component.type}
            className={`form-component bg-white border border-gray-200 rounded-md p-3 shadow-sm cursor-move hover:border-primary-400 ${
              component.type === 'bannerUpload' ? 'bg-primary-50 border-primary-300' : ''
            }`}
            draggable="true"
            data-type={component.type}
            onDragStart={(e) => handleDragStart(e, component)}
            onDragEnd={handleDragEnd}
            onClick={() => handleComponentClick(component)}
          >
            <div className="flex items-center">
              <div className={`mr-2 ${component.type === 'bannerUpload' ? 'text-primary-500' : 'text-gray-400'}`}>
                {component.icon}
              </div>
              <span className={`text-sm ${
                component.type === 'bannerUpload' 
                  ? 'text-primary-700 font-medium' 
                  : 'text-gray-700'
              }`}>
                {component.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComponentsPanel;
