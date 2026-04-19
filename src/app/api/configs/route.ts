import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generatedConfigs } from '@/lib/db/schema';
import { ensureDbInitialized } from '@/lib/db/init';
import { eq, and } from 'drizzle-orm';
import type { ConfigType } from '@/types/game-planner';

// GET /api/configs?projectId=1&ideaId=2 - 获取生成配置
export async function GET(request: NextRequest) {
  try {
    ensureDbInitialized();
    const projectId = request.nextUrl.searchParams.get('projectId');
    const ideaId = request.nextUrl.searchParams.get('ideaId');
    const configType = request.nextUrl.searchParams.get('configType');

    if (!projectId) {
      return NextResponse.json({ success: false, error: '缺少projectId' }, { status: 400 });
    }

    const db = getDb();
    let rows;

    if (ideaId && configType) {
      rows = await db.select().from(generatedConfigs)
        .where(and(
          eq(generatedConfigs.projectId, Number(projectId)),
          eq(generatedConfigs.ideaId, Number(ideaId)),
          eq(generatedConfigs.configType, configType)
        )).execute();
    } else if (ideaId) {
      rows = await db.select().from(generatedConfigs)
        .where(and(
          eq(generatedConfigs.projectId, Number(projectId)),
          eq(generatedConfigs.ideaId, Number(ideaId))
        )).execute();
    } else if (configType) {
      rows = await db.select().from(generatedConfigs)
        .where(and(
          eq(generatedConfigs.projectId, Number(projectId)),
          eq(generatedConfigs.configType, configType)
        )).execute();
    } else {
      rows = await db.select().from(generatedConfigs)
        .where(eq(generatedConfigs.projectId, Number(projectId)))
        .execute();
    }

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('获取配置列表失败:', error);
    return NextResponse.json({ success: false, error: '获取配置列表失败' }, { status: 500 });
  }
}
