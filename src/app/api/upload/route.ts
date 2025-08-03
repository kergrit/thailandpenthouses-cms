import { Storage } from '@google-cloud/storage';
import { NextRequest, NextResponse } from 'next/server';

// Initialize storage client without credentials for public access.
// The library will automatically handle authentication in a GCP environment (like Cloud Run)
// and will work for generating signed URLs for public buckets without a key file.
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID || 'sc-thailandpenthouses-uat',
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

    // When generating a V4 signed URL, the client doesn't need credentials 
    // if the bucket is public or if the service account has the correct IAM role in the environment.
    // By removing the explicit key file, we allow it to work in both local (against public buckets)
    // and production (using the attached service account) environments.
    const [url] = await file.getSignedUrl(options);

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error('Error creating signed URL:', error);
    return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
  }
}
