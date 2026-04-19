import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { creativeIdeas, generatedConfigs } from '@/lib/db/schema';
import { ensureDbInitialized } from '@/lib/db/init';
import { eq, and, desc } from 'drizzle-orm';
import type { CreativeIdea } from '@/types/game-planner';

// GET /api/ideas?projectId=1 - 获取方案下的所有创意
export async function GET(request: NextRequest) {
  try {
    ensureDbInitialized();
    const projectId = request.nextUrl.searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ success: false, error: '缺少projectId' }, { status: 400 });
    }

    const db = getDb();
    const rows = await db.select().from(creativeIdeas)
      .where(eq(creativeIdeas.projectId, Number(projectId)))
      .orderBy(desc(creativeIdeas.createdAt))
      .execute();

    const data: CreativeIdea[] = rows.map(row => ({
      ...row,
      isSelected: row.isSelected === 1,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('获取创意列表失败:', error);
    return NextResponse.json({ success: false, error: '获取创意列表失败' }, { status: 500 });
  }
}

// POST /api/ideas - 批量保存AI推荐的创意
export async function POST(request: NextRequest) {
  try {
    ensureDbInitialized();
    const body = await request.json();
    const { projectId, ideas } = body as {
      projectId: number;
      ideas: Array<{ title: string; description: string; category: string }>;
    };

    if (!projectId || !ideas || !Array.isArray(ideas)) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    const db = getDb();
    const now = Date.now();
    const result = await db.insert(creativeIdeas).values(
      ideas.map(idea => ({
        projectId,
        title: idea.title,
        description: idea.description,
        category: idea.category,
        isSelected: 0,
        createdAt: now,
      }))
    ).returning();

    const data: CreativeIdea[] = result.map(row => ({
      ...row,
      isSelected: row.isSelected === 1,
    }));

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('保存创意失败:', error);
    return NextResponse.json({ success: false, error: '保存创意失败' }, { status: 500 });
  }
}
