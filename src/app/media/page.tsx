import Link from 'next/link';
import { Storage } from '@google-cloud/storage';
import Image from 'next/image';

// This needs to be configured in your environment variables
const bucketName = process.env.GCS_BUCKET_NAME || 'thailandpenthouses-cms-media';

const storage = new Storage({
  keyFilename: process.env.NODE_ENV !== 'production' ? 'service-account-key.json' : undefined,
});

// We make the page dynamic to ensure it fetches the latest file list on each visit
export const dynamic = 'force-dynamic';

async function getGcsFiles() {
  try {
    const [files] = await storage.bucket(bucketName).getFiles();

    // Create signed URLs for each file for reading
    const signedUrls = await Promise.all(
      files.map(async (file) => {
        const options = {
          version: 'v4' as const,
          action: 'read' as const,
          expires: Date.now() + 60 * 60 * 1000, // 1 hour
        };
        const [url] = await file.getSignedUrl(options);
        return {
          name: file.name,
          url: url,
        };
      })
    );
    
    return signedUrls;
  } catch (error) {
    console.error('Failed to list files or create signed URLs from GCS:', error);
    // Return an empty array or handle the error as needed
    return [];
  }
}


export default async function MediaPage() {
  const files = await getGcsFiles();

  return (
    <main className="container mx-auto p-8">
      <div className="mb-4">
        <Link href="/" className="text-blue-500 hover:underline">
          &larr; Back to Home
        </Link>
      </div>
      <h1 className="text-4xl font-bold mb-8">Media Management</h1>
      
      <div className="mb-8">
        <Link href="/media/upload" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Upload New File
        </Link>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Image Gallery</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {files.length > 0 ? (
          files.map(file => (
            <div key={file.name} className="relative aspect-square overflow-hidden rounded-lg shadow-lg">
              <Image
                src={file.url}
                alt={file.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                style={{ objectFit: 'cover' }}
                // It's good practice to provide width/height, but for a responsive grid, 'fill' is often better.
                // For direct src, Next.js can't optimize images from arbitrary URLs without configuration.
                unoptimized // Use this if you haven't configured the GCS domain in next.config.js
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white text-xs truncate">
                {file.name}
              </div>
            </div>
          ))
        ) : (
          <p>No images found in the bucket.</p>
        )}
      </div>
    </main>
  );
}
