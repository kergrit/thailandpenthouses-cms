import { Storage } from '@google-cloud/storage';
import { NextRequest, NextResponse } from 'next/server';

const storage = new Storage({
  keyFilename: process.env.NODE_ENV !== 'production' ? 'service-account-key.json' : undefined,
});
const bucketName = process.env.GCS_BUCKET_NAME || 'thailandpenthouses-cms-media';

export async function POST(req: NextRequest) {
  try {
    const { filename, contentType } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Filename and content type are required' }, { status: 400 });
    }

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filename);

    const options = {
      version: 'v4' as const,
      action: 'write' as const,
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType,
    };

    const [url] = await file.getSignedUrl(options);

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error('Error creating signed URL:', error);
    return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
  }
}
