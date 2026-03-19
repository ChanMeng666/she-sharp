import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

const MIN_SIZE = 256;
const MAX_SIZE = 2048;
const DEFAULT_SIZE = 512;
const BRAND_COLOR = '#9b2e83';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const url = searchParams.get('url');
  const format = searchParams.get('format') || 'png';
  const sizeParam = parseInt(searchParams.get('size') || String(DEFAULT_SIZE), 10);
  const color = searchParams.get('color') || BRAND_COLOR;

  if (!url) {
    return NextResponse.json({ error: 'Missing required "url" parameter' }, { status: 400 });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
  }

  if (format !== 'png' && format !== 'svg') {
    return NextResponse.json({ error: 'Format must be "png" or "svg"' }, { status: 400 });
  }

  const size = Math.min(MAX_SIZE, Math.max(MIN_SIZE, isNaN(sizeParam) ? DEFAULT_SIZE : sizeParam));

  const qrOptions = {
    errorCorrectionLevel: 'H' as const,
    margin: 2,
    width: size,
    color: {
      dark: color,
      light: '#ffffff',
    },
  };

  try {
    if (format === 'svg') {
      const svg = await QRCode.toString(url, { ...qrOptions, type: 'svg' });
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // PNG format
    const buffer = await QRCode.toBuffer(url, { ...qrOptions, type: 'png' });
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('QR code generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
