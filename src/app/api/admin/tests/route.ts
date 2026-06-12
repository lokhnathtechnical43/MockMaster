import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Create a new test
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, examId, totalQuestions, duration, markingCorrect, markingWrong, markingSkipped, difficulty, isFree, questions } = body;

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    const test = await db.test.create({
      data: {
        title,
        slug,
        examId,
        totalQuestions: totalQuestions || questions?.length || 0,
        duration: duration || 10,
        markingCorrect: markingCorrect || 1.0,
        markingWrong: markingWrong || 0.0,
        markingSkipped: markingSkipped || 0.0,
        difficulty: difficulty || 'mixed',
        isFree: isFree !== undefined ? isFree : true,
        active: true,
      }
    });

    // Add questions if provided
    if (questions && Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await db.question.create({
          data: {
            testId: test.id,
            questionText: q.questionText,
            questionImage: q.questionImage || null,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
            subject: q.subject || null,
            topic: q.topic || null,
            difficulty: q.difficulty || 'medium',
            order: i + 1,
          }
        });
      }

      // Update total questions count
      await db.test.update({
        where: { id: test.id },
        data: { totalQuestions: questions.length }
      });
    }

    return NextResponse.json({ success: true, test });
  } catch (error) {
    console.error('Admin create test error:', error);
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
  }
}

// Update a test
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'Test ID required' }, { status: 400 });

    const test = await db.test.update({
      where: { id },
      data: updates
    });

    return NextResponse.json({ success: true, test });
  } catch (error) {
    console.error('Admin update test error:', error);
    return NextResponse.json({ error: 'Failed to update test' }, { status: 500 });
  }
}

// Delete (deactivate) a test
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Test ID required' }, { status: 400 });

    await db.test.update({
      where: { id },
      data: { active: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete test error:', error);
    return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 });
  }
}
