export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface Chat {
  id: string;
  messages: Message[];
  userId: string;
  createdAt: number;
  updatedAt: number;
} 