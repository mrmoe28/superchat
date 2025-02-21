import { FC, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PreviewActions } from './PreviewActions';

interface PreviewProps {
  html: string;
  title?: string;
}

export const Preview: FC<PreviewProps> = ({ html, title }) => {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const processHtml = (content: string) => {
    // Remove description text and clean up HTML
    const cleanedContent = content
      .replace(/Here['']s[\s\S]*?```html/, '')
      .replace(/```html|```jsx|```/g, '')
      .trim();

    // Create a full HTML document with necessary styles
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { margin: 0; padding: 1rem; }
          </style>
        </head>
        <body>
          ${cleanedContent}
        </body>
      </html>
    `;
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: processHtml(html),
          title
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preview');
      }

      const data = await response.json();
      setPreviewId(data.previewId);
      setIsSaved(true);
    } catch (error) {
      console.error('Error saving preview:', error);
      throw error;
    }
  };

  const handleShare = async () => {
    if (!previewId) return;

    try {
      const response = await fetch('/api/preview', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          previewId,
          action: 'share'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      const { shareUrl } = await response.json();
      await navigator.clipboard.writeText(shareUrl);
      // You could show a toast notification here
    } catch (error) {
      console.error('Error sharing preview:', error);
      throw error;
    }
  };

  const handlePublish = async () => {
    if (!previewId) return;

    try {
      const response = await fetch('/api/preview', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          previewId,
          action: 'publish'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish preview');
      }

      const data = await response.json();
      setIsPublished(data.isPublished);
    } catch (error) {
      console.error('Error publishing preview:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(processHtml(html));
        iframeDoc.close();
      }
    }
  }, [html]);

  return (
    <div className="bg-white">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">{title || 'Live Preview'}</h2>
          <PreviewActions
            onSave={handleSave}
            onShare={handleShare}
            onPublish={handlePublish}
            isSaved={isSaved}
            isPublished={isPublished}
          />
        </div>
      </div>
      <div className="preview-container relative">
        <iframe
          ref={iframeRef}
          className="w-full min-h-[400px] border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          title="Preview"
        />
      </div>
    </div>
  );
}; 