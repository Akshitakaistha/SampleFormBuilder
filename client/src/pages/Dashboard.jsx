import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Icons } from '@/components/ui/ui-icons';
import Sidebar from '@/components/sidebar/Sidebar';

const Dashboard = () => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Fetch forms for the dashboard
  const { data: forms, isLoading: formsLoading } = useQuery({
    queryKey: ['/api/forms'],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch submissions for the dashboard
  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['/api/forms/submissions/recent'],
    staleTime: 60000, // 1 minute
  });
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500">Welcome back, {user?.username || 'User'}!</p>
            </div>
            
            {/* Stats overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 uppercase tracking-wider">Total Forms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formsLoading ? '...' : forms?.length || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 uppercase tracking-wider">Published Forms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formsLoading ? '...' : forms?.filter(form => form.status === 'published')?.length || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 uppercase tracking-wider">Total Responses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{submissionsLoading ? '...' : submissions?.length || 0}</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent forms */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Recent Forms</h2>
                <Link href="/forms">
                  <Button variant="outline">View All</Button>
                </Link>
              </div>
              
              {formsLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : forms?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {forms.slice(0, 3).map(form => (
                    <Card key={form.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle>{form.name || 'Untitled Form'}</CardTitle>
                        <CardDescription>
                          {form.status === 'published' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Draft
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-24 overflow-hidden">
                        <p className="text-gray-500 text-sm">
                          {form.description || 'No description'}
                        </p>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline" asChild>
                          <Link href={`/forms/edit/${form.id}`}>
                            Edit
                          </Link>
                        </Button>
                        {form.status === 'published' && (
                          <Button variant="outline" asChild>
                            <Link href={`/forms/${form.id}/responses`}>
                              View Responses
                            </Link>
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-8">
                    <p className="text-gray-500 mb-4">You haven't created any forms yet.</p>
                    <Button asChild>
                      <Link href="/forms/new">Create your first form</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Quick actions */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="p-3 bg-primary-100 rounded-full mb-4">
                      <Icons.Forms className="h-6 w-6 text-primary-600" />
                    </div>
                    <h3 className="font-medium mb-2">Create New Form</h3>
                    <p className="text-sm text-gray-500 mb-4">Start building a new form with drag and drop components</p>
                    <Button asChild>
                      <Link href="/forms/new">
                        Create Form
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="p-3 bg-primary-100 rounded-full mb-4">
                      <Icons.Responses className="h-6 w-6 text-primary-600" />
                    </div>
                    <h3 className="font-medium mb-2">View Responses</h3>
                    <p className="text-sm text-gray-500 mb-4">Access and manage all form submissions</p>
                    <Button asChild>
                      <Link href="/responses">
                        View Responses
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                
                {user?.role === 'super_admin' && (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="p-3 bg-primary-100 rounded-full mb-4">
                        <Icons.Users className="h-6 w-6 text-primary-600" />
                      </div>
                      <h3 className="font-medium mb-2">Manage Users</h3>
                      <p className="text-sm text-gray-500 mb-4">Create and manage admin users</p>
                      <Button asChild>
                        <Link href="/users">
                          Manage Users
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
