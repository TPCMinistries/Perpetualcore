import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary/config';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters, checkRateLimit } from '@/lib/rate-limit';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = {
  config: ['application/json', 'application/zip', 'application/x-zip-compressed'],
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
};

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting - file uploads are resource intensive
    const rateLimitResponse = await checkRateLimit(request, rateLimiters.strict);
    if (rateLimitResponse) return rateLimitResponse;

    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('type') as 'config' | 'image'; // config or image

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ALLOWED_TYPES[fileType] || [];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Convert file to base64 for Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Determine folder based on type
    const folder = `marketplace/${fileType}s/${user.id}`;

    // Upload to Cloudinary
    const result = await uploadToCloudinary(base64, {
      folder,
      resourceType: fileType === 'image' ? 'image' : 'raw',
      tags: ['marketplace', fileType, user.id],
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: {
        url: result.url,
        publicId: result.publicId,
        format: result.format,
        size: result.bytes,
        type: fileType,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: 'No public ID provided' },
        { status: 400 }
      );
    }

    // Verify user owns this file (publicId should contain user ID)
    if (!publicId.includes(user.id)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { deleteFromCloudinary } = await import('@/lib/cloudinary/config');
    const result = await deleteFromCloudinary(publicId);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Delete failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    );
  }
}
