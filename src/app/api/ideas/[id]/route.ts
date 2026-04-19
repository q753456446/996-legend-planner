import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { creativeIdeas, generatedConfigs } from '@/lib/db/schema';
import { ensureDbInitialized } from '@/lib/db/init';
import { eq } from 'drizzle-orm';
import type { CreativeIdea, GeneratedConfig } from '@/types/game-planner';

// PUT /api/ideas/[id] - 更新创意（主要是选择/取消选择）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureDbInitialized();
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const updateData: Record<string, unknown> = {};
    if (body.isSelected !== undefined) {
      updateData.isSelected = body.isSelected ? 1 : 0;
    }
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;

    const result = await db.update(creativeIdeas)
      .set(updateData)
      .where(eq(creativeIdeas.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: '创意不存在' }, { status: 404 });
    }

    const data: CreativeIdea = {
      ...result[0],
      isSelected: result[0].isSelected === 1,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('更新创意失败:', error);
    return NextResponse.json({ success: false, error: '更新创意失败' }, { status: 500 });
  }
}

// DELETE /api/ideas/[id] - 删除创意
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureDbInitialized();
    const { id } = await params;
    const db = getDb();

    // 先删除关联的生成配置
    await db.delete(generatedConfigs)
      .where(eq(generatedConfigs.ideaId, Number(id)))
      .execute();

    // 删除创意
    const result = await db.delete(creativeIdeas)
      .where(eq(creativeIdeas.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: '创意不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除创意失败:', error);
    return NextResponse.json({ success: false, error: '删除创意失败' }, { status: 500 });
  }
}
