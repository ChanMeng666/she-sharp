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
    // For the download API, the file extension must be separated from the public_id
    // and passed as the format parameter. e.g. "she-sharp/cv/file.pdf" becomes
    // public_id="she-sharp/cv/file" and format="pdf".
    const extMatch = fullPublicId.match(/^(.+)\.(\w+)$/);
    const publicId = extMatch ? extMatch[1] : fullPublicId;
    const format = extMatch ? extMatch[2] : '';

    // Use the SDK to generate a correctly signed private download URL.
    // This hits api.cloudinary.com (not the CDN res.cloudinary.com),
    // so it is not affected by CDN delivery restrictions on raw resources.
    const downloadUrl = cloudinary.utils.private_download_url(publicId, format, {
      resource_type: 'raw',
    });

    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error('CV download proxy error:', error);
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
  }
}
