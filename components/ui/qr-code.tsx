'use client';

import { useCallback, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QRCodeDisplayProps {
  /** Full URL to encode */
  url: string;
  /** Display size in pixels (default: 200) */
  size?: number;
  /** Label text below the QR code */
  label?: string;
  /** Show download button */
  showDownload?: boolean;
  /** Download filename without extension */
  downloadFilename?: string;
  /** Path to center logo image */
  logoSrc?: string;
  className?: string;
}

export function QRCodeDisplay({
  url,
  size = 200,
  label,
  showDownload = false,
  downloadFilename = 'qr-code',
  logoSrc,
  className,
}: QRCodeDisplayProps) {
  const [downloading, setDownloading] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);

  const handleDownload = useCallback(
    async (format: 'png' | 'svg') => {
      setDownloading(true);
      try {
        const params = new URLSearchParams({
          url,
          format,
          size: '1024',
        });
        const response = await fetch(`/api/qr?${params}`);
        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        if (linkRef.current) {
          linkRef.current.href = blobUrl;
          linkRef.current.download = `${downloadFilename}.${format}`;
          linkRef.current.click();
          URL.revokeObjectURL(blobUrl);
        }
      } catch (error) {
        console.error('QR download failed:', error);
      } finally {
        setDownloading(false);
      }
    },
    [url, downloadFilename]
  );

  const logoSettings = logoSrc
    ? {
        src: logoSrc,
        height: size * 0.2,
        width: size * 0.2,
        excavate: true,
      }
    : undefined;

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="rounded-lg bg-white p-4">
        <QRCodeSVG
          value={url}
          size={size}
          level="H"
          fgColor="#9b2e83"
          bgColor="#ffffff"
          imageSettings={logoSettings}
        />
      </div>

      {label && (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      )}

      {showDownload && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload('png')}
            disabled={downloading}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload('svg')}
            disabled={downloading}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            SVG
          </Button>
        </div>
      )}

      {/* Hidden anchor for triggering downloads */}
      <a ref={linkRef} className="hidden" />
    </div>
  );
}
