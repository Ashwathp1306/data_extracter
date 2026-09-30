import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, ShieldCheck } from 'lucide-react';

export const Account: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <User className="w-8 h-8 text-primary-600" />
          Account Settings
        </h1>
        <p className="text-slate-600 mt-2 text-lg">
          Manage your account profile and preferences.
        </p>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-8 sm:p-10">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-3xl font-bold">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{user?.full_name}</h2>
              <p className="text-slate-500 flex items-center gap-1.5 mt-1">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Authenticated User
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Profile Information</h3>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Full Name</p>
                  <p className="text-base font-medium text-slate-900">{user?.full_name}</p>
                </div>
                <User className="w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Email Address</p>
                  <p className="text-base font-medium text-slate-900">{user?.email}</p>
                </div>
                <Mail className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
