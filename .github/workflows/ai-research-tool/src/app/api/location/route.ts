import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// @ts-ignore: Suppress type error until proper type declarations for openai are provided
import { openai } from '../../../lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { query, location } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Create a location-aware prompt
    const prompt = `You are a location-aware AI assistant. Please provide information about "${query}" in or around ${location || 'the user\'s location'}. Focus on:
1. Relevant local details
2. Geographical context
3. Current status/availability
4. Local considerations
5. Related nearby points of interest

Please format the response in a clear, structured way.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content || '';

      return NextResponse.json({
        result: response,
        location: location || 'current location'
      });
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to process location search' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Location search error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 