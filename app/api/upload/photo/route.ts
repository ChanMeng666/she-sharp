import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';

// Max file size: 2MB (to conserve storage)
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'jpg';
    const prefix = type || 'profile';
    const sanitizedEmail = email?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown';
    const filename = `${prefix}/${sanitizedEmail}_${timestamp}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
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

    await del(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
