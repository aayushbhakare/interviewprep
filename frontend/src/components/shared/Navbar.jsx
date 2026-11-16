import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Target, Share2, User, LogOut, Menu, X, LayoutDashboard, Database, Settings } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Learn', path: '/learn', icon: BookOpen },
    { label: 'Practice', path: '/practice', icon: Target },
    { label: 'Share Experience', path: '/experiences', icon: Share2 },
  ];

  const isActiveRoute = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Desktop Nav Links */}
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <span className="font-bold text-xl tracking-tight text-slate-900">
                Interview<span className="text-brand-600">Prep</span>
              </span>
            </Link>

            <div className="hidden md:flex space-x-1 lg:space-x-2">
              {navItems.map((item) => {
                const active = isActiveRoute(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'text-brand-700 bg-brand-50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mr-1.5 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {user?.is_staff && (
                  <div className="flex items-center space-x-2">
                    <Link
                      to="/admin/question-bank"
                      className={`inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                        location.pathname === '/admin/question-bank'
                          ? 'bg-purple-50 text-purple-700 border-purple-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <Database className="w-3.5 h-3.5 mr-1 text-purple-600" />
                      Tech Bank
                    </Link>
                    <Link
                      to="/admin/aptitude"
                      className={`inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                        location.pathname === '/admin/aptitude'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                      Aptitude Admin
                    </Link>
                  </div>
                )}
                <Link
                  to="/profile"
                  className={`inline-flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/profile'
                      ? 'text-brand-700 bg-brand-50'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-xs">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.full_name || 'Profile'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center text-slate-500 hover:text-red-600 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-700 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const active = isActiveRoute(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  active
                    ? 'text-brand-700 bg-brand-50 font-semibold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-100 mt-2 space-y-1">
            {isAuthenticated ? (
              <>
                {user?.is_staff && (
                  <>
                    <Link
                      to="/admin/question-bank"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-purple-700 hover:bg-purple-50"
                    >
                      <Database className="w-5 h-5 mr-3 text-purple-600" />
                      Tech Question Bank
                    </Link>
                    <Link
                      to="/admin/aptitude"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-indigo-700 hover:bg-indigo-50"
                    >
                      <Settings className="w-5 h-5 mr-3 text-indigo-600" />
                      Aptitude Administration
                    </Link>
                  </>
                )}
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
                >
                  <User className="w-5 h-5 mr-3 text-slate-400" />
                  My Profile ({user?.full_name})
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center w-full px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center w-full px-4 py-2 bg-brand-600 text-white rounded-md text-sm font-medium hover:bg-brand-700 shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
