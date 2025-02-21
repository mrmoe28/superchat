import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { openai, anthropic } from '@/lib/openai';

const FASTAPI_URL = 'http://localhost:8000';

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;
    let { model } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    let response;
    if (model === 'claude-3-5-sonnet-20241022') {
      try {
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error('Anthropic API key not configured');
        }

        // Convert messages to Anthropic format
        const anthropicMessages = messages.map(msg => ({
          role: msg.role === 'system' ? 'assistant' : msg.role,
          content: msg.content
        }));
        
        response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: anthropicMessages,
          temperature: 0.7
        });

        if (!response.content || response.content.length === 0) {
          throw new Error('Empty response from Claude API');
        }

        const textContent = response.content.find(block => block.type === 'text');
        if (!textContent || textContent.type !== 'text') {
          throw new Error('Invalid response format from Claude API');
        }

        return NextResponse.json({
          response: textContent.text,
          preview: undefined
        });
      } catch (error: any) {
        console.error('Anthropic API error:', error);
        
        // Check if error is due to invalid API key
        if (error.status === 401) {
          return NextResponse.json(
            { error: 'Invalid Anthropic API key' },
            { status: 401 }
          );
        }

        // Check if error is due to rate limiting
        if (error.status === 429) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
          );
        }

        // Check if error is due to network issues
        if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
          return NextResponse.json(
            { error: 'Network error. Please check your internet connection.' },
            { status: 503 }
          );
        }

        // Fall back to OpenAI
        console.log('Falling back to OpenAI...');
        model = 'gpt-3.5-turbo';
      }
    }

    // OpenAI fallback or default
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const completion = await openai.chat.completions.create({
      messages,
      model: model || 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const content = completion.choices[0]?.message?.content || 'No response generated';
    
    // Check if response contains HTML/code for preview
    const hasHtmlContent = /<[^>]+>/.test(content);
    const hasCodeContent = /```[\s\S]*?```/.test(content);
    
    return NextResponse.json({
      response: content,
      preview: hasHtmlContent || hasCodeContent ? content : undefined
    });
  } catch (error: any) {
    console.error('Error in chat API route:', error);

    // Format error message based on type
    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500;

    if (error.status === 401) {
      errorMessage = 'Invalid API key';
      statusCode = 401;
    } else if (error.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Network error. Please check your internet connection.';
      statusCode = 503;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : undefined
      },
      { status: statusCode }
    );
  }
} 