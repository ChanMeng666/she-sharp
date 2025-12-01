'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { HintIcon } from '@/components/ui/hint-icon';
import { Upload, X, Loader2, Camera, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface PhotoUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  type: 'mentor' | 'mentee';
  email?: string;
  label?: string;
  description?: string;
  required?: boolean;
  error?: string;
}

export function PhotoUpload({
  value,
  onChange,
  type,
  email,
  label = 'Profile Photo',
  description = 'Upload a recent photo of yourself',
  required = false,
  error,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image must be smaller than 2MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (email) {
        formData.append('email', email);
      }

      const response = await fetch('/api/upload/photo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        setUploadError(data.error);
        return;
      }

      onChange(data.url);
    } catch (err) {
      setUploadError('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [type, email, onChange]);

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
        await fetch(`/api/upload/photo?url=${encodeURIComponent(value)}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to delete photo:', err);
      }
      onChange(undefined);
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

      {value ? (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200 group">
          <Image
            src={value}
            alt="Profile photo"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-white hover:bg-red-600 border-red-200 hover:border-red-600"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
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
            accept="image/jpeg,image/png,image/webp,image/gif"
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
                <Camera className="h-7 w-7 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPEG, PNG, WebP or GIF (max 2MB)
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
