import Link from 'next/link';
import { Storage } from '@google-cloud/storage';
import MediaGrid from './MediaGrid'; // Import the new client component

const bucketName = process.env.GCS_BUCKET_NAME || 'thailandpenthouses-cms-media';
const cdnDomain = process.env.CDN_DOMAIN || 'thailandpenthouses-cdn.digi-team.work';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID || 'sc-thailandpenthouses-uat',
});

// We force this page to be dynamic to ensure it fetches the latest file list on each visit.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type FileDetail = {
  name: string;
  url: string;
  size: number;
};

async function getGcsFiles(): Promise<FileDetail[]> {
  try {
    const [files] = await storage.bucket(bucketName).getFiles();

    const fileDetails = files.map(file => ({
      name: file.name,
      url: `https://${cdnDomain}/${encodeURIComponent(file.name)}`,
      size: file.metadata.size ? parseInt(String(file.metadata.size), 10) : 0,
    }));
    
    // Sort by name for consistent ordering
    return fileDetails.sort((a, b) => a.name.localeCompare(b.name));

  } catch (error) {
    console.error('Failed to list files from GCS:', error);
    return [];
  }
}

// This remains a Server Component responsible for data fetching.
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
      
      {/* The presentation logic is now delegated to the MediaGrid Client Component. */}
      <MediaGrid files={files} />
      
    </main>
  );
}
