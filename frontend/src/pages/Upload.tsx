import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Stepper } from '../components/Stepper';
import { uploadExcel } from '../services/api';

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      const response = await uploadExcel(file);
      
      // Store response in state and navigate
      navigate('/preview', { state: { data: response } });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred while uploading the file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Stepper currentStep={2} />
        
        <div className="mt-8 card p-8 sm:p-12 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Student Excel</h2>
          <p className="text-slate-600 mb-8">
            Upload an Excel file containing Registration Number, Student Name, LeetCode Profile, and GitHub Profile.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start text-left">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">Upload Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div 
            className={`border-2 border-dashed rounded-xl p-12 transition-colors ${
              isDragging ? 'border-primary-500 bg-primary-50' : 'border-slate-300 hover:border-primary-400 bg-slate-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center">
              <UploadCloud className={`w-16 h-16 mb-4 ${isDragging ? 'text-primary-500' : 'text-slate-400'}`} />
              
              {isLoading ? (
                <div className="text-lg font-medium text-slate-700">Uploading and validating...</div>
              ) : (
                <>
                  <p className="text-lg font-medium text-slate-700 mb-2">
                    Drag & Drop your Excel file here
                  </p>
                  <p className="text-sm text-slate-500 mb-6">or</p>
                  
                  <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    Browse Files
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".xlsx, .xls" 
                      onChange={handleFileChange}
                    />
                  </label>
                </>
              )}
            </div>
          </div>
          
          <div className="mt-8 text-sm text-slate-500">
            Supported formats: .xlsx, .xls
          </div>
        </div>
      </div>
    </div>
  );
};
