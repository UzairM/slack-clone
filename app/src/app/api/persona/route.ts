import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('GET /api/persona - Received request for userId:', userId);

    if (!userId) {
      console.log('GET /api/persona - Missing userId parameter');
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Test database connection
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: String(dbError) },
        { status: 500 }
      );
    }

    const persona = await prisma.persona.findUnique({
      where: { userId },
    });

    console.log('GET /api/persona - Found persona:', persona ? 'yes' : 'no');

    return NextResponse.json(persona);
  } catch (error) {
    console.error('GET /api/persona - Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch persona',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/persona - Received request');

    const body = await request.json();
    console.log('POST /api/persona - Request body:', body);

    const { userId, displayName, personality, tone, interests, responseStyle } = body;

    if (!userId) {
      console.log('POST /api/persona - Missing userId in request body');
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Test database connection
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: String(dbError) },
        { status: 500 }
      );
    }

    const persona = await prisma.persona.upsert({
      where: { userId },
      update: {
        displayName,
        personality,
        tone,
        interests,
        responseStyle,
        updatedAt: new Date(),
      },
      create: {
        userId,
        displayName,
        personality,
        tone,
        interests,
        responseStyle,
      },
    });

    console.log('POST /api/persona - Successfully saved persona for userId:', userId);
    return NextResponse.json(persona);
  } catch (error) {
    console.error('POST /api/persona - Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save persona',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
