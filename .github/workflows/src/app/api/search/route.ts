import { NextResponse } from 'next/server';

const DUCKDUCKGO_API = 'https://api.duckduckgo.com/';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Make request to DuckDuckGo API
    const response = await fetch(`${DUCKDUCKGO_API}?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    const data = await response.json();

    // Extract relevant information
    const results = {
      abstract: data.Abstract,
      abstractSource: data.AbstractSource,
      relatedTopics: data.RelatedTopics.map((topic: any) => ({
        text: topic.Text,
        url: topic.FirstURL
      })).slice(0, 5),
      infobox: data.Infobox,
      answer: data.Answer,
      definition: data.Definition,
      definitionSource: data.DefinitionSource
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
} 