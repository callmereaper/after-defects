'use client';

import { useState, useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedExtensions?: string[];
}

export function FileUpload({ onFileSelect, acceptedExtensions = ['.aep', '.ffx'] }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): boolean => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return acceptedExtensions.includes(ext || '');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!selectedFile ? (
        <div
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300',
            'glassmorphism border-glow',
            isDragging
              ? 'border-blue-500 bg-blue-500/10 scale-105'
              : 'border-gray-300 dark:border-gray-700 hover:border-blue-400'
          )}
        >
          <input
            type="file"
            accept={acceptedExtensions.join(',')}
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-4">
            <div className={cn(
              'p-4 rounded-full transition-colors',
              isDragging ? 'bg-blue-500/20' : 'bg-gray-100 dark:bg-gray-800'
            )}>
              <Upload className={cn(
                'h-8 w-8',
                isDragging ? 'text-blue-500' : 'text-gray-500'
              )} />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                {isDragging ? 'Drop your file here' : 'Drag & drop your file'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                or click to browse
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              {acceptedExtensions.map((ext) => (
                <span
                  key={ext}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={cn(
          'glassmorphism border-glow rounded-xl p-6',
          'flex items-center justify-between gap-4'
        )}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <File className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      )}
    </div>
  );
}
