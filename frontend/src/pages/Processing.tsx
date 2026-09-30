import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stepper } from '../components/Stepper';
import { CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { getJobStatus } from '../services/api';
import type { JobStatus } from '../services/api';

export const Processing: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const pollStatus = async () => {
      try {
        const data = await getJobStatus(jobId);
        setStatus(data);

        if (data.status === 'Completed' || data.status === 'Failed') {
          // Add a slight delay before moving to results to let user see 100%
          setTimeout(() => {
            navigate(`/results/${jobId}`);
          }, 1500);
        }
      } catch (err) {
        console.error('Error fetching job status', err);
        setError('Failed to fetch processing status.');
      }
    };

    pollStatus();
    const interval = setInterval(() => {
      if (status?.status !== 'Completed' && status?.status !== 'Failed') {
        pollStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, navigate, status?.status]);

  if (error) {
    return (
      <div className="flex-1 bg-slate-50 py-8 px-4 flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Error</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <button onClick={() => navigate('/')} className="btn-primary">Return Home</button>
      </div>
    );
  }

  const percent = status && status.total > 0 
    ? Math.round((status.processed / status.total) * 100) 
    : 0;

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Stepper currentStep={3} />
        
        <div className="mt-8 card p-12 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Generating Student Report</h2>
          <p className="text-slate-600 mb-10">
            Processing student profiles from GitHub and LeetCode...
          </p>

          <div className="mb-6 relative h-4 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-primary-600 transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center text-sm font-medium text-slate-700 mb-10">
            <span>{percent}% Complete</span>
            <span>{status?.processed || 0} / {status?.total || 0} students processed</span>
          </div>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>GitHub data retrieved</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>LeetCode data retrieved</span>
            </div>
            {percent < 100 && (
              <div className="flex items-center space-x-2 text-primary-600 font-medium">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Processing next student...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
