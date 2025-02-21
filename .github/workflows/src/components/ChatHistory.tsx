import { useEffect, useState } from 'react';
import { type Message } from '@/types/chat';

export default function ChatHistory({ onSelectChat }: { onSelectChat: (messages: Message[]) => void }) {
  const [chats, setChats] = useState<{ id: string; messages: Message[]; title: string }[]>([]);

  useEffect(() => {
    // Load chats from localStorage
    const savedChats = localStorage.getItem('chat_history');
    if (savedChats) {
      setChats(JSON.parse(savedChats));
    }
  }, []);

  return (
    <div className="chat-history">
      <h2 className="text-lg font-semibold text-white mb-4">Chat History</h2>
      <div className="space-y-2">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.messages)}
            className="w-full p-3 text-left text-white bg-[#2D2D3A] hover:bg-[#34344A] rounded-lg transition-colors"
          >
            <div className="font-medium truncate">{chat.title || chat.messages[0]?.content || 'New Chat'}</div>
            <div className="text-sm text-gray-400 truncate mt-1">
              {chat.messages[chat.messages.length - 1]?.content || 'No messages'}
            </div>
          </button>
        ))}
        {chats.length === 0 && (
          <div className="text-gray-400 text-center p-4">
            No chat history yet
          </div>
        )}
      </div>
    </div>
  );
} 