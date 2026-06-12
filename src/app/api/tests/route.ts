import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const testId = searchParams.get('testId');

    if (testId) {
      // Get single test with questions
      const test = await db.test.findUnique({
        where: { id: testId, active: true },
        include: {
          exam: true,
          questions: {
            where: { active: true },
            orderBy: { order: 'asc' }
          }
        }
      });
      if (!test) {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 });
      }
      return NextResponse.json(test);
    }

    if (examId) {
      // Get tests for an exam
      const tests = await db.test.findMany({
        where: { examId, active: true },
        orderBy: { createdAt: 'desc' },
        include: { exam: true }
      });
      return NextResponse.json(tests);
    }

    // Get all tests
    const tests = await db.test.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      include: { exam: true },
      take: 20,
    });
    return NextResponse.json(tests);
  } catch (error) {
    console.error('Tests API error:', error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}
