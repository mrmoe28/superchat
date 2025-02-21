'use client';

import { useEffect, useState } from 'react';
import { Preview } from '@/components/ui/Preview';
import { TextShimmer } from '@/components/ui/text-shimmer';

interface PreviewPageProps {
  params: {
    id: string;
  };
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const [preview, setPreview] = useState<{
    html: string;
    title: string;
    isPublished: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await fetch(`/api/preview?id=${params.id}`);
        if (!response.ok) {
          throw new Error('Preview not found');
        }
        const data = await response.json();
        setPreview(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preview');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreview();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[rgb(52,53,65)] flex items-center justify-center">
        <TextShimmer className="text-xl">Loading preview...</TextShimmer>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="min-h-screen bg-[rgb(52,53,65)] flex items-center justify-center">
        <div className="text-red-500 text-center">
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p>{error || 'Preview not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(52,53,65)]">
      <header className="bg-[rgb(32,33,35)] border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white text-xl font-medium">{preview.title}</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <Preview html={preview.html} title={preview.title} />
        </div>
      </main>
    </div>
  );
} 