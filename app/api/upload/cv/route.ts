import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary/config';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

/**
 * Extracts the public_id from a Cloudinary URL for raw resources.
 */
function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * POST /api/upload/cv
 * Uploads a CV document to Cloudinary storage.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const email = formData.get('email') as string | null;

    // Diagnose Cloudinary config at runtime
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    console.log('[CV Upload API] Cloudinary config check:', {
      cloudName,
      apiKey,
      apiKeyLength: apiKey?.length,
      apiKeyCharCodes: apiKey ? [...apiKey].map(c => c.charCodeAt(0)) : [],
      hasApiSecret: !!apiSecret,
      apiSecretLength: apiSecret?.length,
    });

    console.log('[CV Upload API] Received request:', {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      email,
    });

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!ALLOWED_TYPES.includes(file.type) && !hasValidExtension) {
      console.log('[CV Upload API] Rejected file type:', file.type, fileName);
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.' },
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

    // Generate unique public_id for Cloudinary (no extension in public_id for raw)
    const timestamp = Date.now();
    const sanitizedEmail = email?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown';
    const publicId = `she-sharp/cv/${sanitizedEmail}_${timestamp}`;

    console.log('[CV Upload API] Preparing Cloudinary upload:', { publicId });

    // Convert file to base64 data URI for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    console.log('[CV Upload API] Base64 size:', base64.length, 'bytes');

    // Upload to Cloudinary as raw resource
    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
      resource_type: 'raw',
      overwrite: true,
    });

    console.log('[CV Upload API] Cloudinary success:', {
      url: result.secure_url,
      publicId: result.public_id,
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      fileName: file.name,
      size: file.size,
      contentType: file.type,
    });
  } catch (error) {
    console.error('[CV Upload API] Error:', error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack,
    } : error);
    return NextResponse.json(
      { error: 'Failed to upload CV. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/cv
 * Deletes a CV from Cloudinary storage.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    const publicId = extractPublicId(url);
    if (!publicId) {
      return NextResponse.json({ error: 'Invalid Cloudinary URL' }, { status: 400 });
    }

    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting CV:', error);
    return NextResponse.json(
      { error: 'Failed to delete CV' },
      { status: 500 }
    );
  }
}
