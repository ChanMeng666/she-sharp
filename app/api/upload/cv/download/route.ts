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
 * Generates a fresh private download URL and redirects to it.
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
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Generate a signed download URL via the Cloudinary API endpoint.
    // This uses api.cloudinary.com (not the CDN res.cloudinary.com),
    // so it is not affected by CDN delivery restrictions on raw resources.
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { public_id: publicId, timestamp },
      apiSecret,
    );

    const downloadUrl =
      `https://api.cloudinary.com/v1_1/${cloudName}/raw/download` +
      `?public_id=${encodeURIComponent(publicId)}` +
      `&timestamp=${timestamp}` +
      `&signature=${signature}` +
      `&api_key=${apiKey}`;

    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error('CV download proxy error:', error);
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
  }
}
