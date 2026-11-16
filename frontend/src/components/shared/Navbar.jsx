import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Target, Share2, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: null },
    { label: 'Learn', path: '/learn', icon: BookOpen },
    { label: 'Practice', path: '/practice', icon: Target },
    { label: 'Share Experience', path: '/experiences', icon: Share2 },
  ];

  return (
    <nav className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <span className="font-bold text-xl tracking-tight text-slate-900">
                Interview<span className="text-brand-600">Prep</span>
              </span>
            </Link>

            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-brand-600 bg-brand-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4 mr-1.5" />}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-sm text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="font-medium">{user.full_name || user.email}</span>
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center text-sm text-slate-500 hover:text-red-600 p-2 rounded-md hover:bg-slate-100"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-md transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
