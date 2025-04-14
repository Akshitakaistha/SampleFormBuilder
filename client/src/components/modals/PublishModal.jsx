import React, { useState } from 'react';
import { Icons } from '@/components/ui/ui-icons';
import { useToast } from '@/hooks/use-toast';

const PublishModal = ({ onClose, formId, publishedUrl }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // Construct the full shareable URL
  const baseUrl = window.location.origin;
  const fullUrl = `${baseUrl}/public-form/${formId}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl)
      .then(() => {
        setCopied(true);
        toast({
          title: 'Success',
          description: 'Link copied to clipboard!',
        });
        
        // Reset the "Copied!" text after 2 seconds
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch(err => {
        toast({
          title: 'Error',
          description: 'Failed to copy link. Please try again.',
          variant: 'destructive'
        });
      });
  };
  
  const handleViewForm = () => {
    window.open(`/public-form/${formId}`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                <Icons.Success />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Form Published
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Your form has been published successfully. You can now share it with others.
                  </p>
                </div>
                <div className="mt-4">
                  <label htmlFor="form-url" className="block text-sm font-medium text-gray-700">Share URL</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input 
                      type="text" 
                      name="form-url" 
                      id="form-url" 
                      className="focus:ring-primary-500 focus:border-primary-500 flex-grow block w-full rounded-none rounded-l-md sm:text-sm border-gray-300" 
                      value={fullUrl}
                      readOnly
                    />
                    <button 
                      type="button" 
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm hover:bg-gray-100" 
                      id="copyLinkBtn"
                      onClick={handleCopyLink}
                    >
                      <Icons.Copy />
                      <span className="ml-1">{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
              type="button" 
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleViewForm}
            >
              View Form
            </button>
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

export default PublishModal;
