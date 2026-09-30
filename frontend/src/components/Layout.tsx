import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Code2 } from 'lucide-react';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-primary-600">
            <Code2 className="w-8 h-8" />
            <span className="font-bold text-xl text-slate-900 tracking-tight">Student Coding Analytics</span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link to="/" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Dashboard</Link>
            <Link to="/history" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">My Reports</Link>
          </nav>
        </div>
      </header>
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
          <p>Student Coding Analytics &copy; {new Date().getFullYear()}</p>
          <p className="mt-2 text-xs">We only process the information required to generate your report. Profile information is retrieved from publicly accessible sources.</p>
        </div>
      </footer>
    </div>
  );
};
