import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface UploadResponse {
  filename: string;
  size: number;
  extension: string;
  detected_version: string;
  message: string;
}

export interface VersionInfo {
  versions: string[];
  details: Record<string, { version: number; byte_value: string }>;
}

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<UploadResponse>('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const processFile = async (file: File, targetVersion: string): Promise<Blob> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('target_version', targetVersion);

  const response = await api.post('/api/process', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'blob',
  });

  return response.data;
};

export const getVersions = async (): Promise<VersionInfo> => {
  const response = await api.get<VersionInfo>('/api/versions');
  return response.data;
};

export const healthCheck = async (): Promise<{ status: string }> => {
  const response = await api.get('/health');
  return response.data;
};
