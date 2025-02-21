'use client';

import { FC, useState, useEffect, useRef } from 'react';
import type { ChatMessage, ModelType } from '../lib/openai';
import { ChatPrompt } from './ChatPrompt';
import { ChatSidebar } from './ChatSidebar';
import Navbar from './Navbar';
import { TextShimmer } from './ui/text-shimmer';
import { Preview } from './ui/Preview';
import { TypeWriter } from './ui/TypeWriter';

interface PreviewData {
  html: string;
  title?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const Chat: FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [previews, setPreviews] = useState<Record<number, PreviewData>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [currentPreview, setCurrentPreview] = useState<PreviewData | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showArtifacts, setShowArtifacts] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const chatSessions = [
    {
      id: '1',
      title: 'First Chat',
      timestamp: new Date()
    },
    {
      id: '2',
      title: 'AI Discussion',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  ];

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (message: string, model: ModelType) => {
    setIsLoading(true);
    setError(null);
    
    // Create new AbortController for this request
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      const newMessage: Message = {
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, newMessage].map(({ role, content }) => ({ role, content })),
          model
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error('Failed to get response from API');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      // Check if the response contains code or HTML content
      const hasCodeContent = /```[\s\S]*?```/.test(data.response);
      const hasHtmlContent = /<[^>]+>/.test(data.response);
      
      if (hasHtmlContent) {
        setShowPreview(true);
        setCurrentPreview({
          html: data.response,
          title: 'Live Preview'
        });
      }
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        console.error('Error processing message:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while processing your message');
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, there was an error processing your request.',
          timestamp: new Date()
        }]);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleStopResponse = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    if (sessionId === 'new') {
      // Reset all states for new chat
      setMessages([]);
      setPreviews({});
      setCurrentPreview(null);
      setShowPreview(false);
      setCurrentSessionId(undefined);
      setIsLoading(false);
      setError(null);
      if (abortController) {
        abortController.abort();
        setAbortController(null);
      }
    } else {
      setCurrentSessionId(sessionId);
    }
  };

  // Function to handle closing the preview
  const handleClosePreview = () => {
    setShowPreview(false);
    setCurrentPreview(null);
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  // Reset loading state if there's an error
  useEffect(() => {
    if (error) {
      setIsLoading(false);
      setAbortController(null);
    }
  }, [error]);

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-[rgb(52,53,65)] overflow-hidden">
      <Navbar />
      <ChatSidebar
        sessions={chatSessions}
        onSessionSelect={handleSessionSelect}
        currentSessionId={currentSessionId}
      />
      <div className="flex h-[calc(100vh-4rem)]">
        <main className={`pl-64 pt-16 pb-4 transition-all duration-300 ${showPreview ? 'w-[60%]' : 'w-full'} overflow-y-auto relative`}>
          {isLoading && (
            <div className="fixed top-20 right-4 z-50">
              <button
                onClick={handleStopResponse}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Stop Generation</span>
              </button>
            </div>
          )}

          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowArtifacts(!showArtifacts)}
                  className="text-white bg-[rgb(68,70,84)] px-3 py-1.5 rounded-md text-sm flex items-center space-x-2 hover:bg-[rgb(78,80,94)] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  <span>Toggle Artifacts</span>
                </button>
              </div>

              {showArtifacts && (
                <div className="bg-[rgb(68,70,84)] rounded-xl p-4 mb-4">
                  <h3 className="text-white font-medium mb-2">Generated Artifacts</h3>
                  <div className="space-y-2">
                    {messages.map((message, index) => {
                      if (message.role === 'assistant') {
                        const codeBlocks = message.content.match(/```[\s\S]*?```/g) || [];
                        const hasHtmlContent = /<[^>]+>/.test(message.content);
                        
                        return codeBlocks.length > 0 || hasHtmlContent ? (
                          <div key={index} className="bg-[rgb(52,53,65)] p-3 rounded-xl border border-gray-700">
                            <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                              <span>Artifact #{index + 1}</span>
                              {hasHtmlContent && (
                                <button
                                  onClick={() => {
                                    setShowPreview(true);
                                    setCurrentPreview({
                                      html: message.content,
                                      title: `Preview #${index + 1}`
                                    });
                                  }}
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  View Preview
                                </button>
                              )}
                            </div>
                            {codeBlocks.map((block, blockIndex) => (
                              <div key={blockIndex} className="text-sm text-gray-300 font-mono">
                                {block.replace(/```\w*\n?|\n?```/g, '')}
                              </div>
                            ))}
                          </div>
                        ) : null;
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-4">
                {messages.length === 0 ? (
                  <div className="bg-[rgb(68,70,84)] rounded-xl p-4">
                    <TextShimmer
                      duration={1.2}
                      className='text-xl font-medium [--base-color:theme(colors.blue.600)] [--base-gradient-color:theme(colors.blue.200)] dark:[--base-color:theme(colors.blue.700)] dark:[--base-gradient-color:theme(colors.blue.400)]'
                    >
                      Welcome to Chad Worth. How can I help you today?
                    </TextShimmer>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div key={index}>
                      <div
                        className={`p-4 rounded-xl ${
                          message.role === 'user' 
                            ? 'bg-[rgb(68,70,84)]' 
                            : 'bg-[rgb(52,53,65)] border border-gray-700'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {message.role === 'user' ? (
                              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                                <span className="text-white text-sm">You</span>
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-white text-sm">AI</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 text-white overflow-x-auto">
                            {message.role === 'user' ? (
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            ) : (
                              <TypeWriter 
                                text={message.content} 
                                speed={10}
                                onComplete={() => {
                                  const hasHtmlContent = /<[^>]+>/.test(message.content);
                                  if (hasHtmlContent) {
                                    setShowPreview(true);
                                    setCurrentPreview({
                                      html: message.content,
                                      title: 'Live Preview'
                                    });
                                  }
                                }}
                                onStop={handleStopResponse}
                              />
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-300 mt-2">
                          {formatTimestamp(new Date(message.timestamp))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {error && (
                  <div className="bg-red-500/10 border border-red-500 rounded-xl p-4">
                    <p className="text-red-500">{error}</p>
                  </div>
                )}
                {isLoading && (
                  <div className="bg-[rgb(68,70,84)] rounded-xl p-4">
                    <TextShimmer className='font-mono text-sm text-white'>
                      Generating response...
                    </TextShimmer>
                  </div>
                )}
              </div>
              <div className="sticky bottom-4">
                <ChatPrompt
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  placeholder="Send a message..."
                />
              </div>
            </div>
          </div>
        </main>
        {showPreview && currentPreview && (
          <div className="fixed top-16 right-0 w-[40%] h-[calc(100vh-4rem)] bg-white border-l border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between bg-[rgb(32,33,35)] px-4 py-2 border-b border-gray-700">
              <h3 className="text-sm font-medium text-white">Live Preview</h3>
              <button
                onClick={handleClosePreview}
                className="text-gray-400 hover:text-white"
                aria-label="Close preview"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-full overflow-y-auto">
              <Preview
                html={currentPreview.html}
                title={currentPreview.title || 'Live Preview'}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat; 