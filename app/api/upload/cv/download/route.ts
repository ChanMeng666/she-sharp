import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary/config';

/**
 * Extracts the public_id (without extension) from a Cloudinary image URL.
 * Example: /image/upload/v123/she-sharp/cv/email_123.pdf → she-sharp/cv/email_123
 */
function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+)\.\w+(?:\?.*)?$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * GET /api/upload/cv/download?url=<cloudinary_url>
 *
 * Generates a time-limited download URL via the Cloudinary API endpoint
 * (api.cloudinary.com) and redirects. This bypasses CDN delivery restrictions
 * that cause 401 errors on direct CDN URLs.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  const publicId = extractPublicId(url);

  if (!publicId || !publicId.startsWith('she-sharp/cv/')) {
    return NextResponse.json({ error: 'Invalid CV resource' }, { status: 400 });
  }

  try {
    // For image resources, public_id does NOT include the extension.
    // The format is passed separately. This is the key difference from raw
    // resources and why the download API can correctly locate the resource.
    const downloadUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
      resource_type: 'image',
    });

    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error('CV download proxy error:', error);
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
  }
}
