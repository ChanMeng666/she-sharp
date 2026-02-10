'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { HintIcon } from '@/components/ui/hint-icon';
import { FileText, X, Loader2, AlertCircle } from 'lucide-react';

interface CVUploadProps {
  value?: string;
  fileName?: string;
  onChange: (url: string | undefined, fileName: string | undefined) => void;
  email?: string;
  label?: string;
  description?: string;
  required?: boolean;
  error?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CVUpload({
  value,
  fileName,
  onChange,
  email,
  label = 'CV / Resume',
  description = 'Upload your CV or resume',
  required = false,
  error,
}: CVUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    const name = file.name.toLowerCase();

    if (file.type !== 'application/pdf' && !name.endsWith('.pdf')) {
      setUploadError('Please upload a PDF file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File must be smaller than 10MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (email) {
        formData.append('email', email);
      }

      const response = await fetch('/api/upload/cv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        setUploadError(data.error);
        return;
      }

      setFileSize(file.size);
      onChange(data.url, file.name);
    } catch {
      setUploadError('Failed to upload CV. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [email, onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleUpload(file);
    }
  }, [handleUpload]);

  const handleRemove = async () => {
    if (value) {
      try {
        await fetch(`/api/upload/cv?url=${encodeURIComponent(value)}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to delete CV:', err);
      }
      setFileSize(null);
      onChange(undefined, undefined);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label className="flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
        {description && <HintIcon hint={description} />}
      </div>

      {value && fileName ? (
        <div className="flex items-center gap-3 rounded-lg border-2 border-gray-200 p-4 bg-muted/30">
          <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
            {fileSize && (
              <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors hover:border-foreground hover:bg-muted/50
            ${dragOver ? 'border-foreground bg-muted' : 'border-border'}
            ${error || uploadError ? 'border-red-300 bg-red-50/50' : ''}
          `}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-10 w-10 text-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center">
                <FileText className="h-7 w-7 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF only (max 10MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {(error || uploadError) && (
        <div className="flex items-center gap-1.5 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />
          {error || uploadError}
        </div>
      )}
    </div>
  );
}
