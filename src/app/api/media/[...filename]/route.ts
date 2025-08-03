import { Storage } from '@google-cloud/storage';
import { NextRequest, NextResponse } from 'next/server';

const bucketName = process.env.GCS_BUCKET_NAME || 'thailandpenthouses-cms-media';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID || 'sc-thailandpenthouses-uat',
});

// This approach avoids issues with dynamic route parameter types by parsing the URL directly.
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    // The pathname will be like /api/media/folder/image.png
    // We want to extract the path segments after /api/media/
    const pathSegments = url.pathname.split('/');
    const apiMediaIndex = pathSegments.findIndex(seg => seg === 'media');
    
    // Validate that the URL structure is as expected.
    if (apiMediaIndex === -1 || apiMediaIndex + 1 >= pathSegments.length) {
      return NextResponse.json({ error: 'Invalid file path in URL' }, { status: 400 });
    }

    const filename = pathSegments
      .slice(apiMediaIndex + 1)
      .map(decodeURIComponent)
      .join('/');

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // This requires the `storage.objects.delete` permission on the bucket.
    await storage.bucket(bucketName).file(filename).delete();
    
    // Return a 204 No Content response, which is standard for a successful DELETE.
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete file from GCS:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to delete file: ${errorMessage}` }, { status: 500 });
  }
}
