import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface PreviewActionsProps {
  onSave: () => Promise<void>;
  onShare: () => Promise<void>;
  onPublish: () => Promise<void>;
  isSaved?: boolean;
  isPublished?: boolean;
}

export const PreviewActions: React.FC<PreviewActionsProps> = ({
  onSave,
  onShare,
  onPublish,
  isSaved = false,
  isPublished = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: () => Promise<void>, actionName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(`Failed to ${actionName.toLowerCase()} preview`);
      console.error(`Error ${actionName.toLowerCase()}ing preview:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ color: 'rgb(239, 68, 68)', marginBottom: '0.5rem', fontSize: '0.875rem' }}
        >
          {error}
        </motion.div>
      )}
      
      <button
        onClick={() => handleAction(onSave, 'Save')}
        disabled={isLoading || isSaved}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1
          ${isSaved 
            ? 'bg-green-100 text-green-700' 
            : 'bg-blue-600 text-white hover:bg-blue-700'}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d={isSaved 
              ? "M5 13l4 4L19 7" 
              : "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"} 
          />
        </svg>
        <span>{isSaved ? 'Saved' : 'Save'}</span>
      </button>

      <button
        onClick={() => handleAction(onShare, 'Share')}
        disabled={isLoading || !isSaved}
        className="px-3 py-1.5 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors flex items-center space-x-1 disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" 
          />
        </svg>
        <span>Share</span>
      </button>

      <button
        onClick={() => handleAction(onPublish, 'Publish')}
        disabled={isLoading || !isSaved || isPublished}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1
          ${isPublished 
            ? 'bg-purple-100 text-purple-700' 
            : 'bg-purple-600 text-white hover:bg-purple-700'} 
          disabled:opacity-50`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d={isPublished 
              ? "M5 13l4 4L19 7"
              : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} 
          />
        </svg>
        <span>{isPublished ? 'Published' : 'Publish'}</span>
      </button>
    </div>
  );
}; 