import * as React from 'react';
import { useState, useCallback } from 'react';
import type { ModelType } from '../lib/openai';

interface ChatPromptProps {
  onSubmit: (message: string, model: ModelType) => void;
  onStop?: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const ChatPrompt: React.FC<ChatPromptProps> = ({
  onSubmit,
  onStop,
  isLoading = false,
  placeholder = "Type your message here..."
}) => {
  const [message, setMessage] = useState('');
  const [model, setModel] = useState<ModelType>('claude-3-5-sonnet-20241022');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSubmit(message.trim(), model);
      setMessage('');
    }
  }, [message, model, isLoading, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }, [handleSubmit]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "Generating response..." : placeholder}
            rows={1}
            className="w-full p-4 pr-24 text-white bg-[rgb(68,70,84)] rounded-t-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            style={{ minHeight: '60px' }}
            disabled={isLoading}
          />
          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              className="absolute right-2 bottom-2 p-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-sm">Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="absolute right-2 bottom-2 p-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
              aria-label="Send message"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center space-x-4 bg-[rgb(52,53,65)] p-2 rounded-b-lg border-t border-gray-700">
          <label htmlFor="model-select" className="text-white text-sm">Model:</label>
          <select
            id="model-select"
            value={model}
            onChange={(e) => setModel(e.target.value as ModelType)}
            className="bg-[rgb(68,70,84)] text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="claude-3-sonnet">Claude 3.5 Sonnet</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </select>
        </div>
      </form>
    </div>
  );
}; 