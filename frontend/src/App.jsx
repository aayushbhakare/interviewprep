import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/shared/Navbar';
import ScrollToTop from './components/shared/ScrollToTop';
import AppRouter from './app/router';

function AppLayout() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden">
      {!isLandingPage && <Navbar />}
      <main className="flex-1">
        <AppRouter />
      </main>
      {!isLandingPage && (
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          Interview Preparation Platform &copy; {new Date().getFullYear()} &bull; Salary-Wise Preparation
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
