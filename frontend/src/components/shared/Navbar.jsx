import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BrandLogo from './BrandLogo';
import {
  BookOpen,
  Target,
  Share2,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Database,
  Settings,
  Bot,
  Shield,
  ChevronDown,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)) {
        setAdminMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Learn', path: '/learn', icon: BookOpen },
    { label: 'Practice', path: '/practice', icon: Target },
    { label: 'Share Experience', path: '/experiences', icon: Share2 },
  ];

  const isActiveRoute = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Desktop Nav Links */}
          <div className="flex items-center space-x-4 lg:space-x-8">
            <BrandLogo linkTo="/" size={28} />

            <div className="hidden lg:flex space-x-1 lg:space-x-2">
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
            <div className="hidden lg:flex items-center space-x-3">
              {isAuthenticated ? (
                <>
                  {user?.is_staff && (
                    <div className="relative" ref={adminDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setAdminMenuOpen((prev) => !prev)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          location.pathname.startsWith('/admin')
                            ? 'bg-brand-50 text-brand-700 border-brand-300'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                        aria-expanded={adminMenuOpen}
                      >
                        <Shield className="w-3.5 h-3.5 text-brand-600" />
                        <span>Admin Console</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>

                      {adminMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                          <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Platform Administration
                            </span>
                            <Link
                              to="/admin/dashboard"
                              onClick={() => setAdminMenuOpen(false)}
                              className="mt-1 flex items-center justify-between text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100/80 px-2.5 py-1.5 rounded-lg transition"
                            >
                              <span>Admin Dashboard</span>
                              <span className="text-[10px] font-semibold text-brand-600">→</span>
                            </Link>
                          </div>
                          <Link
                            to="/admin/students"
                            onClick={() => setAdminMenuOpen(false)}
                            className={`flex items-center px-3 py-1.5 text-xs font-medium transition-colors ${
                              location.pathname === '/admin/students'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>Student Management</span>
                          </Link>
                          <Link
                            to="/admin/learning"
                            onClick={() => setAdminMenuOpen(false)}
                            className={`flex items-center px-3 py-1.5 text-xs font-medium transition-colors ${
                              location.pathname === '/admin/learning'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>Learning Content</span>
                          </Link>
                          <Link
                            to="/admin/question-bank"
                            onClick={() => setAdminMenuOpen(false)}
                            className={`flex items-center px-3 py-1.5 text-xs font-medium transition-colors ${
                              location.pathname === '/admin/question-bank'
                                ? 'bg-purple-50 text-purple-700'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>Tech Question Bank</span>
                          </Link>
                          <Link
                            to="/admin/aptitude"
                            onClick={() => setAdminMenuOpen(false)}
                            className={`flex items-center px-3 py-1.5 text-xs font-medium transition-colors ${
                              location.pathname === '/admin/aptitude'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>Aptitude Admin</span>
                          </Link>
                          <Link
                            to="/admin/interviews"
                            onClick={() => setAdminMenuOpen(false)}
                            className={`flex items-center px-3 py-1.5 text-xs font-medium transition-colors ${
                              location.pathname === '/admin/interviews'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>Interview Simulations</span>
                          </Link>
                          <Link
                            to="/admin/experiences"
                            onClick={() => setAdminMenuOpen(false)}
                            className={`flex items-center px-3 py-1.5 text-xs font-medium transition-colors ${
                              location.pathname === '/admin/experiences'
                                ? 'bg-amber-50 text-amber-700'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>Experience Moderation</span>
                          </Link>
                          <div className="my-1 border-t border-slate-100" />
                          <Link
                            to="/admin/settings"
                            onClick={() => setAdminMenuOpen(false)}
                            className={`flex items-center px-3 py-1.5 text-xs font-medium transition-colors ${
                              location.pathname === '/admin/settings'
                                ? 'bg-slate-100 text-slate-900 font-bold'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span>Platform Settings</span>
                          </Link>
                          <Link
                            to="/admin/monitoring"
                            onClick={() => setAdminMenuOpen(false)}
                            className={`flex items-center px-3 py-1.5 text-xs font-medium transition-colors ${
                              location.pathname === '/admin/monitoring'
                                ? 'bg-slate-100 text-slate-900 font-bold'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span>Health & Telemetry</span>
                          </Link>
                        </div>
                      )}
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
                    <span className="max-w-[170px] truncate">{user?.full_name || 'Profile'}</span>
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
          <div className="flex items-center lg:hidden">
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
        <div id="navbar-mobile-drawer" className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
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
                    <div className="pt-2 pb-1 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Administration
                    </div>
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-md text-base font-bold text-brand-700 bg-brand-50"
                    >
                      <Shield className="w-5 h-5 mr-3 text-brand-600" />
                      Admin Dashboard
                    </Link>
                    <Link
                      to="/admin/students"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <User className="w-5 h-5 mr-3 text-slate-500" />
                      Student Management
                    </Link>
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
                      Aptitude Bank
                    </Link>
                    <Link
                      to="/admin/interviews"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      <Bot className="w-5 h-5 mr-3 text-emerald-600" />
                      Interview Simulations
                    </Link>
                    <Link
                      to="/admin/experiences"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-amber-700 hover:bg-amber-50"
                    >
                      <Shield className="w-5 h-5 mr-3 text-amber-600" />
                      Experience Moderation
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
