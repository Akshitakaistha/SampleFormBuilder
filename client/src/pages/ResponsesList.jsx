import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { Icons } from '@/components/ui/ui-icons';
import Sidebar from '@/components/sidebar/Sidebar';

const ResponsesList = () => {
  const { formId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewResponse, setViewResponse] = useState(null);
  
  const itemsPerPage = 10;
  
  // Fetch form details if formId is provided
  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: [`/api/forms/${formId}`],
    enabled: !!formId,
  });
  
  // Fetch submissions
  const { data: submissions, isLoading: submissionsLoading, isError } = useQuery({
    queryKey: [formId ? `/api/forms/${formId}/submissions` : '/api/submissions'],
    enabled: !!formId || !formId,
  });
  
  // Filter submissions based on search query
  const filteredSubmissions = submissions?.filter(submission => {
    if (!searchQuery) return true;
    
    // Search in submission data - assuming data is a JSON object with potential name/email fields
    const searchLower = searchQuery.toLowerCase();
    const data = submission.data;
    
    if (typeof data === 'object') {
      return Object.values(data).some(value => 
        String(value).toLowerCase().includes(searchLower)
      );
    }
    
    return false;
  }) || [];
  
  // Paginate
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Delete submission mutation
  const deleteMutation = useMutation({
    mutationFn: async (submissionId) => {
      await apiRequest('DELETE', `/api/submissions/${submissionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [formId ? `/api/forms/${formId}/submissions` : '/api/submissions'] });
      toast({
        title: 'Success',
        description: 'Response deleted successfully',
      });
      setConfirmDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete response',
        variant: 'destructive',
      });
    },
  });
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  // Handle submission delete
  const handleDeleteSubmission = (submissionId) => {
    deleteMutation.mutate(submissionId);
  };
  
  // Export to CSV
  const exportToCSV = () => {
    if (!submissions || submissions.length === 0) {
      toast({
        title: 'Error',
        description: 'No data to export',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Get all unique keys from all submissions
      const allKeys = new Set();
      submissions.forEach(submission => {
        if (submission.data && typeof submission.data === 'object') {
          Object.keys(submission.data).forEach(key => allKeys.add(key));
        }
      });
      
      const keys = Array.from(allKeys);
      const headerRow = ['ID', 'Submission Date', ...keys].join(',');
      
      const dataRows = submissions.map(submission => {
        const submissionDate = new Date(submission.createdAt).toLocaleString();
        const values = keys.map(key => {
          const value = submission.data[key] || '';
          // Escape quotes and handle commas for CSV
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        
        return [submission.id, submissionDate, ...values].join(',');
      });
      
      const csvContent = [headerRow, ...dataRows].join('\n');
      
      // Create a download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `submissions-${formId || 'all'}-${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Success',
        description: 'CSV file downloaded',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export CSV',
        variant: 'destructive',
      });
    }
  };
  
  // Render response data as a formatted string
  const formatResponseData = (data) => {
    if (!data || typeof data !== 'object') return 'No data';
    
    return Object.entries(data)
      .map(([key, value]) => {
        // Skip empty values
        if (value === null || value === undefined || value === '') return null;
        
        // Format the key name to be more readable
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1') // Insert a space before all capital letters
          .replace(/^./, str => str.toUpperCase()); // Capitalize the first letter
        
        // Format the value based on its type
        let formattedValue = value;
        if (typeof value === 'boolean') {
          formattedValue = value ? 'Yes' : 'No';
        } else if (Array.isArray(value)) {
          formattedValue = value.join(', ');
        } else if (typeof value === 'object') {
          formattedValue = JSON.stringify(value);
        }
        
        return `${formattedKey}: ${formattedValue}`;
      })
      .filter(Boolean) // Remove null entries
      .join('\n');
  };
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile menu button */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        <button
          className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
          onClick={toggleMobileMenu}
        >
          <Icons.Menu />
        </button>
      </div>
      
      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white h-full">
            <Sidebar isMobile={true} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}
      
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {formId ? 
                  (formLoading ? 'Loading...' : `Responses: ${form?.name || 'Untitled Form'}`) : 
                  'All Responses'
                }
              </h1>
              <p className="text-gray-500">View and manage form submissions</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Button variant="outline" onClick={exportToCSV} disabled={!submissions || submissions.length === 0}>
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </span>
              </Button>
              
              {formId && (
                <Button variant="outline" asChild>
                  <Link href={`/forms/edit/${formId}`}>
                    <span className="flex items-center">
                      <Icons.Edit className="mr-2" />
                      Edit Form
                    </span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
          
          {/* Search bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icons.Search />
              </div>
              <Input
                type="text"
                placeholder="Search responses..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Responses table */}
          {(submissionsLoading || formLoading) ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : isError ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8">
                <p className="text-red-500 mb-4">Failed to load responses. Please try again.</p>
                <Button 
                  onClick={() => queryClient.invalidateQueries({ 
                    queryKey: [formId ? `/api/forms/${formId}/submissions` : '/api/submissions'] 
                  })}
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : filteredSubmissions.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Submission Date</TableHead>
                        <TableHead>Response Summary</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">{submission.id}</TableCell>
                          <TableCell>{new Date(submission.createdAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="max-w-sm truncate">
                              {formatResponseData(submission.data).split('\n')[0]}...
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewResponse(submission)}
                              className="mr-2"
                            >
                              <Icons.Responses className="mr-1" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmDelete(submission.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Icons.Delete className="mr-1" />
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="py-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink 
                              isActive={page === currentPage}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8">
                {searchQuery ? (
                  <p className="text-gray-500 mb-4">No responses found matching your search.</p>
                ) : (
                  <p className="text-gray-500 mb-4">No form submissions yet.</p>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Response</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this response? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDeleteSubmission(confirmDelete)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View response dialog */}
      <Dialog open={!!viewResponse} onOpenChange={() => setViewResponse(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Response Details</DialogTitle>
          </DialogHeader>
          
          {viewResponse && (
            <div className="mt-4">
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Submitted on {new Date(viewResponse.createdAt).toLocaleString()}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="whitespace-pre-wrap text-sm">
                  {formatResponseData(viewResponse.data)}
                </pre>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewResponse(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResponsesList;
