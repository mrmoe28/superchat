import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// In a real app, this would be a database
const previewStore = new Map<string, {
  html: string;
  title: string;
  isPublished: boolean;
  createdAt: Date;
}>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { html, title } = body;

    if (!html) {
      return NextResponse.json(
        { error: 'Missing preview content' },
        { status: 400 }
      );
    }

    const previewId = nanoid();
    previewStore.set(previewId, {
      html,
      title: title || 'Untitled Preview',
      isPublished: false,
      createdAt: new Date()
    });

    return NextResponse.json({ previewId });
  } catch (error) {
    console.error('Error saving preview:', error);
    return NextResponse.json(
      { error: 'Failed to save preview' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { previewId, action } = body;

    if (!previewId || !previewStore.has(previewId)) {
      return NextResponse.json(
        { error: 'Preview not found' },
        { status: 404 }
      );
    }

    const preview = previewStore.get(previewId)!;

    switch (action) {
      case 'publish':
        preview.isPublished = true;
        previewStore.set(previewId, preview);
        return NextResponse.json({ success: true, isPublished: true });

      case 'share':
        // Generate a shareable link
        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/preview/${previewId}`;
        return NextResponse.json({ shareUrl });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating preview:', error);
    return NextResponse.json(
      { error: 'Failed to update preview' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const previewId = url.searchParams.get('id');

    if (!previewId || !previewStore.has(previewId)) {
      return NextResponse.json(
        { error: 'Preview not found' },
        { status: 404 }
      );
    }

    const preview = previewStore.get(previewId)!;
    return NextResponse.json(preview);
  } catch (error) {
    console.error('Error fetching preview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preview' },
      { status: 500 }
    );
  }
} 