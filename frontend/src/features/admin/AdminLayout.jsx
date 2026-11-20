import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Database,
  Layers,
  Bot,
  MessageSquare,
  Settings,
  Cpu,
  Activity,
  FileText,
  ShieldCheck,
  Wrench,
  ArrowLeft,
  Menu,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

const ADMIN_NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Student Management', path: '/admin/students', icon: Users },
    ],
  },
  {
    title: 'Content & Question Banks',
    items: [
      { name: 'Learning Content', path: '/admin/learning', icon: BookOpen },
      { name: 'Tech Question Bank', path: '/admin/question-bank', icon: Database },
      { name: 'Aptitude Question Bank', path: '/admin/aptitude', icon: Layers },
      { name: 'Interview Simulations', path: '/admin/interviews', icon: Bot },
      { name: 'Experience Moderation', path: '/admin/experiences', icon: MessageSquare },
    ],
  },
  {
    title: 'Platform Operations',
    items: [
      { name: 'Platform Settings', path: '/admin/settings', icon: Settings },
      { name: 'AI Models & Routing', path: '/admin/ai-models', icon: Cpu },
      { name: 'System Monitoring', path: '/admin/monitoring', icon: Activity },
      { name: 'Activity Audit Logs', path: '/admin/activity-logs', icon: FileText },
      { name: 'Maintenance Controls', path: '/admin/maintenance', icon: Wrench },
      { name: 'Admin Security', path: '/admin/security', icon: ShieldCheck },
    ],
  },
];

export default function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle admin navigation"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-pulse" />
            <span className="font-black text-sm text-slate-900 tracking-tight">Admin Console</span>
          </div>
        </div>
        <Link
          to="/dashboard"
          className="text-xs font-semibold text-slate-600 hover:text-brand-600 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit</span>
        </Link>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-brand-500 text-white">
                Platform Admin
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <h1 className="text-base font-extrabold text-white mt-1.5 tracking-tight">
              Control Center
            </h1>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {ADMIN_NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.path === '/admin/dashboard'
                      ? location.pathname === '/admin/dashboard' || location.pathname === '/admin'
                      : location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-2.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Admin Staff Identity & Back link */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-white block truncate">
                  {user?.full_name || 'Staff Administrator'}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {user?.email || 'admin@interviewprep.local'}
                </span>
              </div>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white transition shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Student App</span>
          </Link>
        </div>
      </aside>

      {/* Main Administrative Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Operational Bar */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-8 py-3.5 items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-3 text-xs">
            <span className="font-semibold text-slate-400">Admin</span>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-800 capitalize">
              {location.pathname.replace('/admin/', '').replace('-', ' ') || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Platform Operational</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Zero-Cost Tier Active (₹0 Budget)
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
