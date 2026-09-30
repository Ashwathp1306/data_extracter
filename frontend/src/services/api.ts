import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
});



export interface StudentValidation {
  reg_no: string;
  name: string;
  leetcode_url: string;
  github_url: string;
  is_valid: boolean;
  validation_message?: string;
}

export interface ValidationResponse {
  job_id: string;
  total_students: number;
  valid_students: number;
  invalid_students: number;
  preview: StudentValidation[];
}

export interface JobStatus {
  job_id: string;
  status: string;
  total: number;
  processed: number;
  successful: number;
  partial: number;
  failed: number;
}

export interface StudentResult {
  reg_no: string;
  name: string;
  leetcode_url: string;
  github_url: string;
  easy: number;
  medium: number;
  hard: number;
  total_solved: number;
  repo_count: number;
  status: string;
  error_message?: string;
}

export interface JobResultResponse {
  job_id: string;
  status: string;
  results: StudentResult[];
  summary: {
    total: number;
    successful: number;
    partial: number;
    failed: number;
  };
}

export const uploadExcel = async (file: File): Promise<ValidationResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<ValidationResponse>('/upload', formData);
  return response.data;
};

export const startAnalysis = async (jobId: string) => {
  const response = await api.post(`/analyze/${jobId}`);
  return response.data;
};

export const getJobStatus = async (jobId: string): Promise<JobStatus> => {
  const response = await api.get<JobStatus>(`/status/${jobId}`);
  return response.data;
};

export const getJobResults = async (jobId: string): Promise<JobResultResponse> => {
  const response = await api.get<JobResultResponse>(`/results/${jobId}`);
  return response.data;
};

export const getDownloadUrl = (jobId: string) => {
  return `${API_URL}/download/${jobId}`;
};

export const getTemplateUrl = () => {
  return `${API_URL}/template`;
};

export interface GithubStatus {
  authenticated: boolean;
  github_api: string;
  limit?: number;
  remaining?: number;
  used?: number;
  reset?: number;
  error?: string;
}

export const getGithubStatus = async (): Promise<GithubStatus> => {
  const response = await api.get<GithubStatus>('/github/status');
  return response.data;
};

