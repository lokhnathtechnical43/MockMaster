import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId, correctCount, wrongCount, skippedCount, score, maxScore, timeTaken, answers, totalQuestions, rank } = body;

    // For demo, create a guest user if none exists
    let user = await db.user.findFirst();
    if (!user) {
      user = await db.user.create({
        data: { name: 'Guest User', language: 'en' }
      });
    }

    const result = await db.testResult.create({
      data: {
        userId: user.id,
        testId,
        totalQuestions,
        correctCount,
        wrongCount,
        skippedCount,
        score,
        maxScore,
        timeTaken,
        answers: JSON.stringify(answers),
        rank: rank || null,
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Results API error:', error);
    return NextResponse.json({ error: 'Failed to save result' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');

    if (testId) {
      // Get leaderboard for a test
      const results = await db.testResult.findMany({
        where: { testId },
        orderBy: { score: 'desc' },
        take: 100,
        include: {
          user: { select: { name: true } },
          test: { select: { title: true } }
        }
      });
      return NextResponse.json(results);
    }

    // Get all results
    const results = await db.testResult.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { name: true } },
        test: { select: { title: true } }
      }
    });
    return NextResponse.json(results);
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}
