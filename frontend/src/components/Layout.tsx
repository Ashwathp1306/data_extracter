import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Code2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
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
            
            {/* User Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors focus:outline-none py-2">
                <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span>{user?.full_name?.split(' ')[0] || 'User'}</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              
              {/* Invisible spacer wrapper to bridge the gap and keep hover active */}
              <div className="absolute right-0 top-full pt-1 w-48 z-20 hidden group-hover:block">
                <div className="bg-white rounded-md shadow-lg py-1 border border-slate-100">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{user?.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <Link to="/weekly-analysis" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                    <span className="text-base">📊</span> Weekly Analysis
                  </Link>
                  <Link to="/history" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                    <span className="text-base">📁</span> My Reports
                  </Link>
                  <Link to="/account" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                    <span className="text-base">⚙️</span> Account
                  </Link>
                  <button onClick={logout} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-100">
                    <span className="text-base">🚪</span> Logout
                  </button>
                </div>
              </div>
            </div>
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
