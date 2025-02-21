import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello from Vercel Serverless Functions!' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Here you can interact with Firebase or perform other operations
    return NextResponse.json({ 
      message: 'Data received successfully',
      data: body 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 400 }
    );
  }
} 