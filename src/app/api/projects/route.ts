import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { ensureDbInitialized } from '@/lib/db/init';
import { desc, eq } from 'drizzle-orm';
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

// GET /api/projects - 获取所有方案
export async function GET() {
  try {
    ensureDbInitialized();
    const db = getDb();
    const rows = await db.select().from(projects).orderBy(desc(projects.createdAt)).execute();
    const data: ProjectView[] = rows.map(toView);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('获取方案列表失败:', error);
    return NextResponse.json({ success: false, error: '获取方案列表失败' }, { status: 500 });
  }
}

// POST /api/projects - 创建方案
export async function POST(request: NextRequest) {
  try {
    ensureDbInitialized();
    const body = await request.json();
    const { name, genre, story, theme, classType, features, customFeatures } = body;

    if (!name || !genre || !classType) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    const db = getDb();
    const now = Date.now();
    const result = await db.insert(projects).values({
      name,
      genre,
      story: story || '',
      theme: theme || '',
      classType,
      features: JSON.stringify(features || []),
      customFeatures: customFeatures || '',
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({ success: true, data: toView(result[0]) }, { status: 201 });
  } catch (error) {
    console.error('创建方案失败:', error);
    return NextResponse.json({ success: false, error: '创建方案失败' }, { status: 500 });
  }
}
