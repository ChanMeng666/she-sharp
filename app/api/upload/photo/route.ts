import { NextRequest, NextResponse } from 'next/server';
import {
  PHOTO_PREFIX,
  deleteUserUpload,
  emailStem,
  isOwnUploadUrl,
  putUserUpload,
} from '@/lib/blob/uploads';

// Max file size: 2MB (to conserve storage)
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * File extension for each accepted image type.
 *
 * Blob infers `Content-Type` from the pathname when none is given, so the
 * extension has to match the bytes; and the browser gets no other hint of what
 * the object is, because a Blob pathname carries no metadata of its own.
 */
const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/**
 * POST /api/upload/photo
 * Uploads a photo to Vercel Blob storage.
 * Returns the public URL of the uploaded image.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null; // 'mentor' or 'mentee'
    const email = formData.get('email') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 2MB limit. Please upload a smaller image.' },
        { status: 400 }
      );
    }

    // Same identifying information the Cloudinary public_id carried — the
    // applicant kind and a sanitised email — minus the millisecond timestamp,
    // whose only job was uniqueness and which `addRandomSuffix` now does
    // better. `type` is caller-supplied, so it is whitelisted rather than
    // interpolated: an unchecked value could otherwise walk the path out of
    // the `profile-photos/` prefix the DELETE guard relies on.
    const kind = type === 'mentor' || type === 'mentee' ? type : 'profile';
    const extension = EXTENSION_BY_TYPE[file.type];
    const pathname = `${PHOTO_PREFIX}/${kind}/${emailStem(email)}.${extension}`;

    // addRandomSuffix: true — a profile photo is a personal document, and a
    // public Blob URL is readable by anyone holding it, exactly as the
    // Cloudinary URL it replaces was. That is parity, not a regression, and the
    // unguessable suffix is what keeps it parity: without it the URL would be
    // derivable from the applicant's email address alone.
    const result = await putUserUpload(pathname, file, file.type);

    return NextResponse.json({
      success: true,
      url: result.url,
      size: file.size,
      contentType: file.type,
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/photo
 * Deletes a photo from Vercel Blob storage.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    // The route is unauthenticated (the public application forms use it), so
    // without this check `?url=` would be an instruction to delete any object
    // in the store. Replaces the old "Invalid Cloudinary URL" guard.
    if (!isOwnUploadUrl(url)) {
      return NextResponse.json({ error: 'Invalid upload URL' }, { status: 400 });
    }

    await deleteUserUpload(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
