import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Stepper } from '../components/Stepper';
import { AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import { startAnalysis } from '../services/api';
import type { ValidationResponse } from '../services/api';

export const Preview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.data as ValidationResponse;

  useEffect(() => {
    if (!data) {
      navigate('/upload');
    }
  }, [data, navigate]);

  if (!data) return null;

  const handleGenerate = async () => {
    try {
      await startAnalysis(data.job_id);
      navigate(`/processing/${data.job_id}`);
    } catch (error) {
      console.error("Failed to start analysis", error);
      alert("Failed to start analysis. Please try again.");
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Stepper currentStep={2} />
        
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Excel Preview</h2>
              <p className="text-slate-600 mt-1">
                {data.total_students} students detected ({data.valid_students} valid, {data.invalid_students} invalid)
              </p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <button 
                onClick={() => navigate('/upload')}
                className="btn-secondary px-4 py-2 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              
              <button 
                onClick={handleGenerate}
                disabled={data.valid_students === 0}
                className="btn-primary px-4 py-2 flex items-center gap-2"
              >
                Generate Report
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {data.invalid_students > 0 && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800">We found issues in your Excel</h3>
                <p className="text-sm text-amber-700 mt-1">
                  {data.invalid_students} rows contain errors and will be skipped during analysis. You can proceed with the valid rows or fix the file and re-upload.
                </p>
              </div>
            </div>
          )}

          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                    <th className="py-3 px-4 font-semibold">Reg.No</th>
                    <th className="py-3 px-4 font-semibold">Name</th>
                    <th className="py-3 px-4 font-semibold">LeetCode</th>
                    <th className="py-3 px-4 font-semibold">GitHub</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.preview.map((student, idx) => (
                    <tr key={idx} className={student.is_valid ? 'hover:bg-slate-50' : 'bg-red-50 hover:bg-red-100'}>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{student.reg_no}</td>
                      <td className="py-3 px-4 text-sm text-slate-700">{student.name}</td>
                      <td className="py-3 px-4 text-sm">
                        {student.leetcode_url ? (
                          <div className="flex flex-col">
                            <span className="text-slate-600 truncate max-w-xs" title={student.leetcode_url}>{student.leetcode_url}</span>
                            {!student.is_valid && student.validation_message?.includes('LeetCode') && (
                              <span className="text-xs text-red-600 mt-1 flex items-center">
                                <AlertTriangle className="w-3 h-3 mr-1" /> Invalid
                              </span>
                            )}
                          </div>
                        ) : (
                           <span className="text-slate-400 italic">Missing</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {student.github_url ? (
                          <div className="flex flex-col">
                            <span className="text-slate-600 truncate max-w-xs" title={student.github_url}>{student.github_url}</span>
                            {!student.is_valid && student.validation_message?.includes('GitHub') && (
                              <span className="text-xs text-red-600 mt-1 flex items-center">
                                <AlertTriangle className="w-3 h-3 mr-1" /> Invalid
                              </span>
                            )}
                          </div>
                        ) : (
                           <span className="text-slate-400 italic">Missing</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
