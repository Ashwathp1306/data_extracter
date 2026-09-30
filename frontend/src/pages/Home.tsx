import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, FileSpreadsheet, BarChart2, Server, AlertCircle } from 'lucide-react';
import { getTemplateUrl, getGithubStatus } from '../services/api';
import type { GithubStatus } from '../services/api';

const GithubStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<GithubStatus | null>(null);

  useEffect(() => {
    getGithubStatus().then(setStatus).catch(() => {});
  }, []);

  if (!status) return null;

  const isConnected = status.github_api === 'connected' && status.authenticated;
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${isConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
      <Server className="w-3.5 h-3.5" />
      <span>GitHub API: {isConnected ? 'Connected' : 'Unauthenticated / Limited'}</span>
      {isConnected && status.remaining !== undefined && (
        <>
          <span className="w-1 h-1 rounded-full bg-green-300 mx-1"></span>
          <span>{status.remaining.toLocaleString()} / {status.limit?.toLocaleString()} requests remaining</span>
        </>
      )}
      {!isConnected && (
        <AlertCircle className="w-3.5 h-3.5 ml-1 text-amber-500" />
      )}
    </div>
  );
};

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 bg-slate-50">
      {/* Hero Section */}
      <section className="px-4 py-20 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
          Analyze student LeetCode and GitHub activity from a single Excel file.
        </h1>
        <p className="text-xl text-slate-600 mb-6 max-w-2xl mx-auto">
          No manual profile checking required. Upload your student list and generate the report automatically.
        </p>
        
        <div className="flex justify-center mb-10">
          <GithubStatusBadge />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => navigate('/upload')}
            className="btn-primary text-lg px-8 py-4 flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Upload className="w-5 h-5" />
            Upload Student Excel
          </button>
          
          <a 
            href={getTemplateUrl()}
            className="btn-secondary text-lg px-8 py-4 flex items-center gap-2 w-full sm:w-auto justify-center"
            download
          >
            <Download className="w-5 h-5" />
            Download Excel Template
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">HOW IT WORKS</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center p-6 card">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">1. Prepare</h3>
              <p className="text-slate-600 text-sm">Download the template and enter student information.</p>
            </div>
            
            <div className="text-center p-6 card">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">2. Upload</h3>
              <p className="text-slate-600 text-sm">Upload the completed Excel file containing profiles.</p>
            </div>
            
            <div className="text-center p-6 card">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">3. Analyze</h3>
              <p className="text-slate-600 text-sm">The system checks the public profiles automatically.</p>
            </div>
            
            <div className="text-center p-6 card">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">4. Download</h3>
              <p className="text-slate-600 text-sm">Download the completed Excel report with stats.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
