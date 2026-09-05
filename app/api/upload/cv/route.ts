import { NextRequest, NextResponse } from 'next/server';
import {
  CV_PREFIX,
  deleteUserUpload,
  emailStem,
  isOwnUploadUrl,
  putUserUpload,
} from '@/lib/blob/uploads';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf'];
const ALLOWED_EXTENSIONS = ['.pdf'];

/**
 * POST /api/upload/cv
 * Uploads a CV document (PDF only) to Vercel Blob storage.
 *
 * Unlike the Cloudinary `resource_type: 'raw'` upload this replaces, a Blob
 * object served as `application/pdf` opens in the browser's PDF viewer rather
 * than downloading. `PutBlobResult.downloadUrl` is the force-download variant
 * if that is ever wanted, but the plain `url` is what is stored: it is the
 * canonical object URL, it is what `del()` takes, and previewing a CV in place
 * is the friendlier default for the recruitment dashboard that reads it.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const email = formData.get('email') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (PDF only)
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!ALLOWED_TYPES.includes(file.type) && !hasValidExtension) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit. Please upload a smaller file.' },
        { status: 400 }
      );
    }

    // The sanitised email the Cloudinary public_id carried; the millisecond
    // timestamp it also carried is gone, because `addRandomSuffix` supersedes
    // it. A browser can submit a `.pdf` with an empty or wrong `file.type`
    // (the extension branch above accepts that), so the content type is
    // asserted rather than echoed — otherwise Blob would serve the CV as
    // `application/octet-stream`.
    const pathname = `${CV_PREFIX}/${emailStem(email)}.pdf`;

    // addRandomSuffix: true — a CV is a personal document, and a public Blob
    // URL is readable by anyone holding it, exactly as the Cloudinary URL it
    // replaces was. That is parity, not a regression, and the unguessable
    // suffix is what keeps it parity: without it the URL would be derivable
    // from the applicant's email address alone.
    const result = await putUserUpload(pathname, file, 'application/pdf');

    return NextResponse.json({
      success: true,
      url: result.url,
      fileName: file.name,
      size: file.size,
      contentType: file.type,
    });
  } catch (error) {
    console.error('[CV Upload API] Error:', error instanceof Error ? {
      message: error.message,
      name: error.name,
    } : error);
    return NextResponse.json(
      { error: 'Failed to upload CV. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/cv
 * Deletes a CV from Vercel Blob storage.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    // The route is unauthenticated (the public volunteer form uses it), so
    // without this check `?url=` would be an instruction to delete any object
    // in the store. Replaces the old "Invalid Cloudinary URL" guard.
    if (!isOwnUploadUrl(url)) {
      return NextResponse.json({ error: 'Invalid upload URL' }, { status: 400 });
    }

    await deleteUserUpload(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting CV:', error);
    return NextResponse.json(
      { error: 'Failed to delete CV' },
      { status: 500 }
    );
  }
}
