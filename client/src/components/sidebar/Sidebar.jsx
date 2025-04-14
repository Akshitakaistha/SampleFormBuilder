import React from 'react';
import { Link, useLocation } from 'wouter';
import { Icons } from '@/components/ui/ui-icons';
import { useAuth } from '@/contexts/AuthContext';

const Sidebar = ({ isMobile, closeMobileMenu }) => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const isActive = (path) => location === path;
  
  const handleLinkClick = () => {
    if (isMobile && closeMobileMenu) {
      closeMobileMenu();
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600">FormCraft</h1>
          {isMobile && (
            <button 
              className="text-gray-500 hover:text-gray-700 md:hidden"
              onClick={closeMobileMenu}
            >
              <Icons.Close />
            </button>
          )}
        </div>
      </div>
      
      <nav className="p-4 flex-grow">
        <ul className="space-y-2">
          <li>
            <Link 
              href="/"
              onClick={handleLinkClick}
              className={`flex items-center px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 ${
                isActive('/') ? 'bg-primary-50 text-primary-600 font-medium' : ''
              }`}
            >
              <Icons.Dashboard />
              <span className="ml-3">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link 
              href="/forms"
              onClick={handleLinkClick}
              className={`flex items-center px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 ${
                isActive('/forms') ? 'bg-primary-50 text-primary-600 font-medium' : ''
              }`}
            >
              <Icons.Forms />
              <span className="ml-3">Forms</span>
            </Link>
          </li>
          <li>
            <Link 
              href="/responses"
              onClick={handleLinkClick}
              className={`flex items-center px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 ${
                isActive('/responses') ? 'bg-primary-50 text-primary-600 font-medium' : ''
              }`}
            >
              <Icons.Responses />
              <span className="ml-3">Responses</span>
            </Link>
          </li>
          
          {/* Show User Management only for Super Admins */}
          {user && user.role === 'super_admin' && (
            <li>
              <Link 
                href="/users"
                onClick={handleLinkClick}
                className={`flex items-center px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 ${
                  isActive('/users') ? 'bg-primary-50 text-primary-600 font-medium' : ''
                }`}
              >
                <Icons.Users />
                <span className="ml-3">Manage Users</span>
              </Link>
            </li>
          )}
          
          <li>
            <Link 
              href="/settings"
              onClick={handleLinkClick}
              className={`flex items-center px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 ${
                isActive('/settings') ? 'bg-primary-50 text-primary-600 font-medium' : ''
              }`}
            >
              <Icons.Settings />
              <span className="ml-3">Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold mr-3">
            {user && user.username ? user.username.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {user ? user.username : 'Loading...'}
            </p>
            <p className="text-xs text-gray-500">
              {user ? (user.role === 'super_admin' ? 'Super Admin' : 'Admin') : ''}
            </p>
          </div>
          <div className="ml-auto">
            <button 
              className="text-gray-400 hover:text-gray-600"
              onClick={logout}
            >
              <Icons.Logout />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
