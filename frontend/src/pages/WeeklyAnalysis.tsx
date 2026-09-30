import React, { useEffect, useState, useMemo } from 'react';
import { getWeeklyAnalysis, downloadWeeklyAnalysisExcel } from '../services/api';
import type { WeeklyAnalysisItem } from '../services/api';
import { BarChart2, AlertCircle, Download, Search, ChevronUp, ChevronDown } from 'lucide-react';

type SortKey = keyof WeeklyAnalysisItem;
type SortDirection = 'asc' | 'desc';

export const WeeklyAnalysis: React.FC = () => {
  const [analysis, setAnalysis] = useState<WeeklyAnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Date filters
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const fetchAnalysis = () => {
    setLoading(true);
    getWeeklyAnalysis(fromDate, toDate)
      .then((data) => {
        setAnalysis(data.analysis);
        setLoading(false);
        setError('');
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load weekly analysis.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = () => {
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      setError('From Date cannot be after To Date');
      return;
    }
    fetchAnalysis();
  };

  const handleDownload = () => {
    downloadWeeklyAnalysisExcel(fromDate, toDate);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...analysis];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => item.name.toLowerCase().includes(term));
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      
      // Handle N/A
      if (aVal === 'N/A') aVal = -Infinity;
      if (bVal === 'N/A') bVal = -Infinity;
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [analysis, searchTerm, sortKey, sortDirection]);

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-primary-600" />
          Weekly Analysis
        </h1>
        <p className="text-slate-600 mt-1">
          Track student progress over time using historical snapshot data.
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
          <input 
            type="date" 
            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
            value={fromDate}
            max={toDate || new Date().toISOString().split('T')[0]}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
          <input 
            type="date" 
            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
            value={toDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <button 
          onClick={handleGenerate}
          className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Generate Analysis
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Search Student..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleDownload}
          disabled={analysis.length === 0}
          className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Download Excel
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : analysis.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No historical data available</h2>
          <p className="text-slate-600 max-w-md mx-auto">
            Try adjusting your date range. If you haven't generated any reports yet, upload a student Excel file on the dashboard first.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('name')}>Name {renderSortIcon('name')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('easy')}>Easy {renderSortIcon('easy')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('medium')}>Medium {renderSortIcon('medium')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('hard')}>Hard {renderSortIcon('hard')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('previous_total')}>Previous {renderSortIcon('previous_total')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('current_total')}>Current {renderSortIcon('current_total')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('this_week')}>This Week {renderSortIcon('this_week')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredAndSortedData.map((student, idx) => {
                  const thisWeek = student.this_week;
                  const isPositive = typeof thisWeek === 'number' && thisWeek > 0;
                  const isNegative = typeof thisWeek === 'number' && thisWeek < 0;
                  
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">{student.name}</span>
                          <span className="text-xs text-slate-500">{student.reg_no}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{student.easy}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{student.medium}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{student.hard}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{student.previous_total}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{student.current_total}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {typeof thisWeek === 'number' ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isPositive ? 'bg-green-100 text-green-800' :
                            isNegative ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {isPositive ? '+' : ''}{thisWeek}
                          </span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredAndSortedData.length === 0 && (
                   <tr>
                     <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                       No results found matching your search.
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
