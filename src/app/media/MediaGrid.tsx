'use client';

import { useState } from 'react';
import Image from 'next/image';

type FileDetail = {
  name: string;
  url: string;
  size: number;
};

type MediaGridProps = {
  files: FileDetail[];
};

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default function MediaGrid({ files: initialFiles }: MediaGridProps) {
  const [files, setFiles] = useState<FileDetail[]>(initialFiles);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(filename);

    try {
      const response = await fetch(`/api/media/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Try to parse error message from the server, otherwise use a generic one.
        const errorData = response.status !== 204 ? await response.json() : {};
        throw new Error(errorData.error || `Failed to delete file. Status: ${response.status}`);
      }
      
      // Update the UI immediately for a better user experience.
      setFiles(currentFiles => currentFiles.filter(file => file.name !== filename));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {files.length > 0 ? (
        files.map(file => (
          <div key={file.name} className="group relative border border-gray-300 rounded-lg p-2 shadow-sm flex flex-col justify-between bg-white">
            <div className="relative aspect-square w-full overflow-hidden rounded-md mb-2">
              <Image
                src={file.url}
                alt={file.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16.6vw"
                style={{ objectFit: 'cover' }}
                unoptimized
                className="bg-gray-100"
              />
              <div className="absolute inset-0 group-hover:bg-black group-hover:bg-opacity-50 transition-colors duration-300 flex items-center justify-center">
                <button
                  onClick={() => handleDelete(file.name)}
                  disabled={isDeleting === file.name}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 rounded-full bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed cursor-pointer"
                  aria-label={`Delete ${file.name}`}
                >
                  {isDeleting === file.name ? (
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <TrashIcon />
                  )}
                </button>
              </div>
            </div>
            <div className="text-xs">
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
        <p className="col-span-full text-gray-500">No images found in the bucket.</p>
      )}
    </div>
  );
}
