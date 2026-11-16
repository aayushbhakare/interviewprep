import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/shared/Navbar';
import AppRouter from './app/router';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <Navbar />
          <main className="flex-1">
            <AppRouter />
          </main>
          <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
            Interview Preparation Platform &copy; {new Date().getFullYear()} &bull; Salary-Wise Preparation
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
