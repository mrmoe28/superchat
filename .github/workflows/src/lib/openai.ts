import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import * as fs from 'fs/promises';
import { execSync } from 'child_process';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('Missing ANTHROPIC_API_KEY environment variable');
}

if (!process.env.OPENAI_API_KEY) {
  console.warn('Missing OPENAI_API_KEY environment variable');
}

// Configure Anthropic client with improved error handling and retry logic
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  maxRetries: 3,
  httpAgent: undefined, // Required for Next.js edge runtime
});

// Configure OpenAI client with improved retry logic and error handling
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  maxRetries: 3,
  timeout: 60000,
  defaultQuery: { 'api-version': '2024-02' },
  dangerouslyAllowBrowser: true
});

export type ModelType = 'gpt-3.5-turbo' | 'gpt-4' | 'claude-3-5-sonnet-20241022';

// Computer tool definition
export const computerTool = {
  type: 'function' as const,
  function: {
    name: 'computer',
    description: 'A tool for interacting with the computer screen and UI',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['screenshot', 'click', 'type', 'scroll', 'drag'],
          description: 'The action to perform'
        },
        coordinate: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' }
          },
          description: 'Screen coordinates for actions'
        },
        text: {
          type: 'string',
          description: 'Text to type or other text input'
        },
        displayNumber: {
          type: 'number',
          description: 'Optional display number for X11 environments'
        }
      },
      required: ['action']
    }
  }
};

// Text editor tool definition
export const textEditorTool = {
  type: 'function' as const,
  function: {
    name: 'text_editor',
    description: 'A tool for editing and viewing text files',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          enum: ['view', 'edit', 'insert'],
          description: 'The operation to perform'
        },
        path: {
          type: 'string',
          description: 'Path to the file'
        },
        file_text: {
          type: 'string',
          description: 'The text content to write or edit'
        },
        insert_line: {
          type: 'number',
          description: 'Line number for insertion'
        },
        new_str: {
          type: 'string',
          description: 'New string for replacement'
        },
        old_str: {
          type: 'string',
          description: 'Old string to replace'
        },
        view_range: {
          type: 'object',
          properties: {
            start: { type: 'number' },
            end: { type: 'number' }
          },
          description: 'Line range to view'
        }
      },
      required: ['command', 'path']
    }
  }
};

// Type definition for chat messages
export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export interface PreviewData {
  html: string;
  title?: string;
}

export interface ChatResponse {
  response: string;
  preview?: PreviewData;
}

// Helper function to take screenshots (macOS specific)
export async function takeScreenshot(): Promise<string> {
  const timestamp = Date.now();
  const screenshotPath = `/tmp/screenshot-${timestamp}.png`;
  
  try {
    // Use screencapture on macOS
    execSync(`screencapture -x ${screenshotPath}`);
    const imageBuffer = await fs.readFile(screenshotPath);
    await fs.unlink(screenshotPath); // Clean up
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error('Screenshot error:', error);
    throw error;
  }
}

// Function to generate text using the selected model
export async function generateModelResponse(messages: ChatMessage[], model: ModelType = 'gpt-3.5-turbo') {
  const maxRetries = 3;
  const retryDelay = 1000;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      if (model === 'gpt-3.5-turbo') {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: messages.map(msg => ({
            role: msg.role === 'system' ? 'system' : msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          temperature: 0.7,
          max_tokens: 4000
        });

        if (!completion.choices?.[0]?.message?.content) {
          throw new Error('Invalid response format from OpenAI API');
        }
        
        return completion.choices[0].message.content;
      } else if (model === 'claude-3-5-sonnet-20241022') {
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          temperature: 0.7,
          messages: messages.map(msg => ({
            role: msg.role === 'system' ? 'assistant' : msg.role,
            content: msg.content
          }))
        });

        if (!response.content || response.content.length === 0) {
          throw new Error('Empty response from Claude API');
        }

        return response.content[0]?.type === 'text' ? response.content[0].text : '';
      }
    } catch (error: any) {
      console.error(`API error (attempt ${retryCount + 1}):`, error);
      
      // Check if error is retryable
      const isRetryable = 
        error.status === 429 || // Rate limit
        error.status === 500 || // Server error
        error.status === 503 || // Service unavailable
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.message.includes('timeout');

      if (!isRetryable || retryCount === maxRetries - 1) {
        // Format error message
        if (error.status === 401) {
          throw new Error(`Invalid ${model === 'gpt-3.5-turbo' ? 'OpenAI' : 'Claude'} API key.`);
        } else if (error.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (error.code === 'ENOTFOUND') {
          throw new Error(`Unable to connect to ${model === 'gpt-3.5-turbo' ? 'OpenAI' : 'Claude'} API. Please check your internet connection.`);
        } else if (error.code === 'ETIMEDOUT') {
          throw new Error('Request timed out. Please try again.');
        }
        
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
      retryCount++;
    }
  }

  throw new Error('Maximum retry attempts reached');
}

// Function to generate text using Claude with file support
export async function generateText({
  model,
  messages,
}: {
  model: Anthropic;
  messages: Array<{
    role: 'user' | 'assistant';
    content: Array<{
      type: 'text' | 'file';
      text?: string;
      data?: Buffer;
      mimeType?: string;
    }>;
  }>;
}) {
  try {
    const response = await model.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content.map(content => {
          if (content.type === 'text' && content.text) {
            return { type: 'text' as const, text: content.text };
          } else if (content.type === 'file' && content.data && content.mimeType) {
            return {
              type: 'document' as const,
              source: {
                type: 'base64' as const,
                media_type: content.mimeType as 'application/pdf',
                data: content.data.toString('base64')
              }
            };
          }
          throw new Error('Invalid content format');
        })
      }))
    });

    return response;
  } catch (error) {
    console.error('Error generating text:', error);
    throw error;
  }
}

// Add error handling wrapper with network check
const handleApiError = (error: any) => {
  console.error('API Error:', error);
  
  // Network connectivity check
  if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
    return new Error('Network connectivity issue. Please check your internet connection and try again.');
  }
  
  if (error.status === 401) {
    return new Error('Invalid API key. Please check your configuration.');
  }
  
  if (error.status === 429) {
    return new Error('Rate limit exceeded. Please try again later.');
  }
  
  return new Error('An unexpected error occurred. Please try again.');
};

export async function getChatCompletion(
  messages: ChatMessage[],
  model: ModelType = 'gpt-3.5-turbo'
): Promise<ChatResponse> {
  try {
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      throw new Error('No API keys configured. Please add your API keys to .env.local');
    }

    if (model === 'claude-3-5-sonnet-20241022') {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('Anthropic API key not configured');
      }
      
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: messages.map(msg => ({
          role: msg.role === 'system' ? 'assistant' : msg.role,
          content: msg.content
        }))
      });

      const textContent = response.content.find(block => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('Invalid response format from Claude API');
      }

      return {
        response: textContent.text,
        preview: undefined
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const completion = await openai.chat.completions.create({
      messages,
      model,
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const content = completion.choices[0]?.message?.content || 'No response generated';
    
    return {
      response: content,
      preview: undefined
    };
  } catch (error) {
    throw handleApiError(error);
  }
} 