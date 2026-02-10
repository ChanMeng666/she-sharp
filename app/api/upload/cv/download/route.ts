import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary/config';

/**
 * Extracts the public_id from a Cloudinary raw resource URL.
 * Handles regular, versioned, and signed URLs.
 */
function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/raw\/upload\/(?:s--[^/]+--\/)?(?:v\d+\/)?(.+?)(?:\?.*)?$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * GET /api/upload/cv/download?url=<cloudinary_url>
 *
 * Proxies CV downloads via the Cloudinary API endpoint (api.cloudinary.com)
 * to bypass CDN delivery restrictions on raw resources that cause 401 errors.
 * Uses the SDK's private_download_url to generate a correctly signed URL.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  const fullPublicId = extractPublicId(url);

  if (!fullPublicId || !fullPublicId.startsWith('she-sharp/cv/')) {
    return NextResponse.json({ error: 'Invalid CV resource' }, { status: 400 });
  }

  try {
    // For raw resources, the extension is part of the stored public_id.
    // Pass the full public_id (including .pdf) and empty format so the
    // download API looks up the resource by its exact public_id.
    const downloadUrl = cloudinary.utils.private_download_url(fullPublicId, '', {
      resource_type: 'raw',
    });

    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error('CV download proxy error:', error);
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
  }
}
