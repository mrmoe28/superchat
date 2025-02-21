import React from 'react';

type ChatSession = {
  id: string;
  title: string;
  timestamp: Date;
};

interface ChatSidebarProps {
  sessions: ChatSession[];
  onSessionSelect: (sessionId: string) => void;
  currentSessionId?: string;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  onSessionSelect,
  currentSessionId
}) => {
  return (
    <div className="bg-[rgb(32,33,35)] w-64 h-full fixed left-0 top-16 border-r border-gray-700 overflow-y-auto">
      <div className="p-4">
        <button
          onClick={() => onSessionSelect('new')}
          className="w-full bg-[rgb(52,53,65)] hover:bg-[rgb(62,63,75)] text-white rounded-lg px-4 py-2 flex items-center justify-center space-x-2 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>New Chat</span>
        </button>
      </div>
      
      <div className="px-2 py-2">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSessionSelect(session.id)}
            className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors ${
              currentSessionId === session.id
                ? 'bg-[rgb(52,53,65)] text-white'
                : 'text-gray-300 hover:bg-[rgb(42,43,55)]'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm">{session.title}</p>
                <p className="text-xs text-gray-500">
                  {session.timestamp.toLocaleDateString()}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}; 