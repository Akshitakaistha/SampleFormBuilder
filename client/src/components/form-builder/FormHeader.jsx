import React, { useState } from 'react';
import { Icons } from '@/components/ui/ui-icons';
import { useFormBuilder } from '@/contexts/FormBuilderContext';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const FormHeader = ({ onPreview, onSaveDraft, onPublish }) => {
  const { formState, setFormState } = useFormBuilder();
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  
  const handleFormNameChange = (e) => {
    setFormState(prev => ({
      ...prev,
      name: e.target.value
    }));
  };
  
  const handleDescriptionChange = (e) => {
    setFormState(prev => ({
      ...prev,
      description: e.target.value
    }));
  };
  
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <button className="md:hidden mr-4 text-gray-500 hover:text-gray-700">
            <Icons.Menu />
          </button>
          <input 
            type="text" 
            placeholder="Untitled Form" 
            className="text-xl font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent rounded px-2 py-1" 
            value={formState.name || ''}
            onChange={handleFormNameChange}
          />
        </div>
        <div className="flex items-center space-x-3">
          <button 
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={onPreview}
          >
            Preview
          </button>
          <button 
            className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            onClick={onSaveDraft}
          >
            Save Draft
          </button>
          <button 
            className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={onPublish}
          >
            Publish
          </button>
        </div>
      </div>
      
      <div className="mt-2 flex items-center">
        <Popover open={isDescriptionOpen} onOpenChange={setIsDescriptionOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs text-gray-600 flex items-center gap-1"
            >
              <Icons.MessageSquare className="h-3 w-3" />
              {formState.description ? 'Edit Description' : 'Add Description'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium">Form Description</h4>
              <p className="text-sm text-gray-500">Add details about your form to help users understand its purpose.</p>
              <Textarea
                placeholder="Enter form description..."
                value={formState.description || ''}
                onChange={handleDescriptionChange}
                className="min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setIsDescriptionOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {formState.description && (
          <p className="ml-3 text-sm text-gray-500 truncate max-w-md">
            {formState.description}
          </p>
        )}
      </div>
    </header>
  );
};

export default FormHeader;
