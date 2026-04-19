import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { projects, creativeIdeas, generatedConfigs } from '@/lib/db/schema';
import { ensureDbInitialized } from '@/lib/db/init';
import { eq } from 'drizzle-orm';
import type { Project, ProjectView, GameFeature, GameGenre, ClassType } from '@/types/game-planner';

function toView(p: Project): ProjectView {
  return {
    id: p.id,
    name: p.name,
    genre: p.genre as GameGenre,
    story: p.story,
    theme: p.theme,
    classType: p.classType as ClassType,
    features: JSON.parse(p.features) as GameFeature[],
    customFeatures: p.customFeatures ?? '',
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// GET /api/projects/[id] - 获取方案详情
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureDbInitialized();
    const { id } = await params;
    const db = getDb();
    const rows = await db.select().from(projects).where(eq(projects.id, Number(id))).execute();

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: '方案不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: toView(rows[0]) });
  } catch (error) {
    console.error('获取方案详情失败:', error);
    return NextResponse.json({ success: false, error: '获取方案详情失败' }, { status: 500 });
  }
}

// PUT /api/projects/[id] - 更新方案
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureDbInitialized();
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const updateData: Record<string, unknown> = { updatedAt: Date.now() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.genre !== undefined) updateData.genre = body.genre;
    if (body.story !== undefined) updateData.story = body.story;
    if (body.theme !== undefined) updateData.theme = body.theme;
    if (body.classType !== undefined) updateData.classType = body.classType;
    if (body.features !== undefined) updateData.features = JSON.stringify(body.features);
    if (body.customFeatures !== undefined) updateData.customFeatures = body.customFeatures;

    const result = await db.update(projects)
      .set(updateData)
      .where(eq(projects.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: '方案不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: toView(result[0]) });
  } catch (error) {
    console.error('更新方案失败:', error);
    return NextResponse.json({ success: false, error: '更新方案失败' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - 删除方案
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureDbInitialized();
    const { id } = await params;
    const db = getDb();

    // 先删除关联的生成配置
    const ideaRows = await db.select({ id: creativeIdeas.id })
      .from(creativeIdeas)
      .where(eq(creativeIdeas.projectId, Number(id)))
      .execute();

    for (const idea of ideaRows) {
      await db.delete(generatedConfigs)
        .where(eq(generatedConfigs.ideaId, idea.id))
        .execute();
    }

    // 删除创意
    await db.delete(creativeIdeas)
      .where(eq(creativeIdeas.projectId, Number(id)))
      .execute();

    // 删除方案
    const result = await db.delete(projects)
      .where(eq(projects.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: '方案不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除方案失败:', error);
    return NextResponse.json({ success: false, error: '删除方案失败' }, { status: 500 });
  }
}
