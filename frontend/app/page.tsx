'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import { FileUpload } from '@/components/file-upload';
import { VersionBadge } from '@/components/version-badge';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ConfettiEffect } from '@/components/confetti-effect';
import { ThemeToggle } from '@/components/theme-toggle';
import { uploadFile, processFile, getVersions } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectedVersion, setDetectedVersion] = useState<string | null>(null);
  const [targetVersion, setTargetVersion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: versionsData } = useQuery({
    queryKey: ['versions'],
    queryFn: getVersions,
    retry: 3,
  });

  const versionOptions = (versionsData?.versions || ['2024', '2023', '2022', '18.x', '17.x']).map(
    (v) => ({ value: v, label: `After Effects ${v}` })
  );

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setDetectedVersion(null);
    setDownloadSuccess(false);

    try {
      const response = await uploadFile(file);
      setDetectedVersion(response.detected_version);
    } catch (err) {
      setError('Failed to analyze file. Please try again.');
      console.error(err);
    }
  }, []);

  const handleProcess = async () => {
    if (!selectedFile || !targetVersion) return;

    setIsProcessing(true);
    setError(null);

    try {
      const blob = await processFile(selectedFile, targetVersion);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile.name.split('.')[0]}_${targetVersion}.${selectedFile.name.split('.').pop()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      setError('Failed to process file. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const canProcess = selectedFile && targetVersion && !isProcessing;

  return (
    <>
      <ConfettiEffect trigger={downloadSuccess} />
      
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">AE</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                  AE Version Shifter
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Downgrade AEP & FFX files
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 pt-32 pb-20">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Upload Section */}
            <section className="space-y-4">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Upload Your File
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Drag and drop your After Effects project or preset file
                </p>
              </div>
              <FileUpload onFileSelect={handleFileSelect} />
            </section>

            {/* Version Detection */}
            {detectedVersion && (
              <section className="glassmorphism border-glow rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <VersionBadge
                    version={detectedVersion}
                    label="Detected Version"
                    variant="success"
                  />
                  
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Target Version:
                    </span>
                    <div className="w-48">
                      <Select
                        value={targetVersion}
                        onValueChange={setTargetVersion}
                        options={versionOptions}
                        placeholder="Select version..."
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Error Display */}
            {error && (
              <div className="glassmorphism border border-red-500/30 rounded-xl p-4 bg-red-500/10">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Process Button */}
            {canProcess && (
              <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="w-full max-w-sm gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : downloadSuccess ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Download Complete!
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      Process & Download
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Info Cards */}
            <section className="grid md:grid-cols-3 gap-4 mt-12">
              {[
                {
                  title: 'Binary Analysis',
                  desc: 'Auto-detects AE version from file headers',
                  icon: '🔍',
                },
                {
                  title: 'Hex Patching',
                  desc: 'Modifies version bytes without re-saving',
                  icon: '⚡',
                },
                {
                  title: 'File Integrity',
                  desc: 'Maintains original file size and structure',
                  icon: '✓',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="glassmorphism rounded-xl p-6 text-center space-y-2"
                >
                  <div className="text-3xl">{feature.icon}</div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
