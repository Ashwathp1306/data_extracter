import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stepper } from '../components/Stepper';
import { Download, Search, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { getJobResults, getDownloadUrl } from '../services/api';
import type { JobResultResponse } from '../services/api';

export const Results: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<JobResultResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    const fetchResults = async () => {
      try {
        const resultData = await getJobResults(jobId);
        setData(resultData);
      } catch (err) {
        console.error('Error fetching results', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [jobId]);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading results...</div>;
  }

  if (!data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Results not found</h2>
        <button onClick={() => navigate('/')} className="btn-primary">Return Home</button>
      </div>
    );
  }

  const filteredResults = data.results.filter(r => {
    const matchesSearch = 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.reg_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.leetcode_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.github_url.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalProblems = data.results.reduce((acc, curr) => acc + (curr.total_solved || 0), 0);
  const totalRepos = data.results.reduce((acc, curr) => acc + (curr.repo_count || 0), 0);

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <Stepper currentStep={4} />
        
        <div className="mt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                Analysis Complete 🎉
              </h2>
              <p className="text-slate-600 mt-1">Your student coding report is ready.</p>
            </div>
            
            <div className="flex space-x-4 mt-4 md:mt-0">
              <button 
                onClick={() => navigate('/upload')}
                className="btn-secondary"
              >
                Analyze Another Excel
              </button>
              
              <a 
                href={getDownloadUrl(jobId!)} 
                className="btn-primary flex items-center gap-2"
                download
              >
                <Download className="w-4 h-4" />
                Download Excel Report
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="text-sm font-medium text-slate-500 mb-1">Students Analyzed</div>
              <div className="text-3xl font-bold text-slate-900">{data.summary.total}</div>
            </div>
            <div className="card p-6">
              <div className="text-sm font-medium text-slate-500 mb-1">Successful Profiles</div>
              <div className="text-3xl font-bold text-green-600">{data.summary.successful}</div>
            </div>
            <div className="card p-6">
              <div className="text-sm font-medium text-slate-500 mb-1">Total Problems Solved</div>
              <div className="text-3xl font-bold text-primary-600">{totalProblems.toLocaleString()}</div>
            </div>
            <div className="card p-6">
              <div className="text-sm font-medium text-slate-500 mb-1">Total Repositories</div>
              <div className="text-3xl font-bold text-purple-600">{totalRepos.toLocaleString()}</div>
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search students..."
                  className="pl-10 w-full border border-slate-300 rounded-lg py-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                className="w-full sm:w-auto border border-slate-300 rounded-lg py-2 pl-3 pr-10 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Success">Success</option>
                <option value="Partial">Partial</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                    <th className="py-3 px-4 font-semibold">Reg.No</th>
                    <th className="py-3 px-4 font-semibold">Name</th>
                    <th className="py-3 px-4 font-semibold text-right">Easy</th>
                    <th className="py-3 px-4 font-semibold text-right">Medium</th>
                    <th className="py-3 px-4 font-semibold text-right">Hard</th>
                    <th className="py-3 px-4 font-semibold text-right">Total</th>
                    <th className="py-3 px-4 font-semibold text-right">Repos</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResults.map((student, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{student.reg_no}</td>
                      <td className="py-3 px-4 text-sm text-slate-700">{student.name}</td>
                      <td className="py-3 px-4 text-sm text-slate-600 text-right">{student.status === 'Failed' || student.easy === null ? 'N/A' : student.easy}</td>
                      <td className="py-3 px-4 text-sm text-slate-600 text-right">{student.status === 'Failed' || student.medium === null ? 'N/A' : student.medium}</td>
                      <td className="py-3 px-4 text-sm text-slate-600 text-right">{student.status === 'Failed' || student.hard === null ? 'N/A' : student.hard}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900 text-right">{student.status === 'Failed' || student.total_solved === null ? 'N/A' : student.total_solved}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900 text-right">{student.status === 'Failed' || student.repo_count === null ? 'N/A' : student.repo_count}</td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-1.5" title={student.error_message || ''}>
                          {student.status === 'Success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {student.status === 'Partial' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          {student.status === 'Failed' && <XCircle className="w-4 h-4 text-red-500" />}
                          <span className={`font-medium ${
                            student.status === 'Success' ? 'text-green-700' : 
                            student.status === 'Partial' ? 'text-amber-700' : 'text-red-700'
                          }`}>
                            {student.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredResults.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No students match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
