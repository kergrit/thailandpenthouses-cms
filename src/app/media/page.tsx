import Link from 'next/link';
import { Storage } from '@google-cloud/storage';
import Image from 'next/image';

const bucketName = process.env.GCS_BUCKET_NAME || 'thailandpenthouses-cms-media';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID || 'sc-thailandpenthouses-uat',
});

export const dynamic = 'force-dynamic';

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

async function getGcsFiles() {
  try {
    const [files] = await storage.bucket(bucketName).getFiles();

    const fileDetails = files.map(file => ({
      name: file.name,
      url: `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(file.name)}`,
      size: file.metadata.size ? parseInt(String(file.metadata.size), 10) : 0,
    }));
    
    return fileDetails;
  } catch (error) {
    console.error('Failed to list files from GCS:', error);
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Media Management</h1>
        <Link href="/media/upload" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Upload New File
        </Link>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Image Gallery</h2>
      {/* Updated Grid: Max 6 columns on large screens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {files.length > 0 ? (
          files.map(file => (
            <div key={file.name} className="border border-gray-300 rounded-lg p-2 shadow-sm flex flex-col justify-between bg-white">
              <div className="relative aspect-square w-full overflow-hidden rounded-md mb-2">
                <Image
                  src={file.url}
                  alt={file.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16.6vw"
                  style={{ objectFit: 'cover' }}
                  unoptimized
                />
              </div>
              <div className="text-xs">
                {/* Updated Text Contrast: Darker text for better readability */}
                <p className="font-semibold text-gray-900 truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-gray-600">
                  {formatBytes(file.size)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-gray-500">No images found in the bucket. Ensure your local environment has permissions or check the bucket content.</p>
        )}
      </div>
    </main>
  );
}
