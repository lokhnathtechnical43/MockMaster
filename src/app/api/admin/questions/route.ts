import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Create a new question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation, subject, topic, difficulty, questionImage } = body;

    if (!testId || !questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the max order for this test
    const maxOrder = await db.question.findFirst({
      where: { testId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const question = await db.question.create({
      data: {
        testId,
        questionText,
        questionImage: questionImage || null,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        explanation: explanation || null,
        subject: subject || null,
        topic: topic || null,
        difficulty: difficulty || 'medium',
        order: (maxOrder?.order || 0) + 1,
      }
    });

    // Update test totalQuestions
    const count = await db.question.count({ where: { testId, active: true } });
    await db.test.update({
      where: { id: testId },
      data: { totalQuestions: count }
    });

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error('Admin create question error:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}

// Update a question
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'Question ID required' }, { status: 400 });

    const question = await db.question.update({
      where: { id },
      data: updates
    });

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error('Admin update question error:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

// Delete (deactivate) a question
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Question ID required' }, { status: 400 });

    await db.question.update({
      where: { id },
      data: { active: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete question error:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
