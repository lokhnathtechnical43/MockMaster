import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const categories = await db.examCategory.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      include: {
        exams: {
          where: { active: true },
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { tests: { where: { active: true } } } }
          }
        }
      }
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Exams API error:', error);
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 });
  }
}
