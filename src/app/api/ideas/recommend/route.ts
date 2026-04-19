import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getDb } from '@/lib/db';
import { projects, creativeIdeas } from '@/lib/db/schema';
import { ensureDbInitialized } from '@/lib/db/init';
import { eq } from 'drizzle-orm';
import type { GameFeature } from '@/types/game-planner';

const featureLabels: Record<string, string> = {
  'classic_battle': '经典战法道',
  'gold_farming': '打金系统',
  'siege_war': '攻沙战',
  'free_trade': '自由交易',
  'boss_battle': 'BOSS战',
  'pvp_arena': 'PVP竞技',
  'guild_system': '行会系统',
  'mount_system': '坐骑系统',
  'pet_system': '宠物系统'
};

const genreDescriptions: Record<string, string> = {
  '玄幻修真': '仙侠飞升、问道长生',
  '西方魔幻': '魔法战争、龙与地下城',
  '武侠江湖': '刀光剑影、快意恩仇',
  '科幻未来': '星际战争、机械文明',
  '暗黑哥特': '黑暗美学、恐怖悬疑'
};

export async function POST(request: NextRequest) {
  try {
    ensureDbInitialized();
    const body = await request.json();
    const { projectId, count = 5, keywords } = body as {
      projectId: number;
      count?: number;
      keywords?: string;
    };

    if (!projectId) {
      return NextResponse.json({ success: false, error: '缺少projectId' }, { status: 400 });
    }

    // 获取方案信息
    const db = getDb();
    const projectRows = await db.select().from(projects)
      .where(eq(projects.id, projectId)).execute();
    
    if (projectRows.length === 0) {
      return NextResponse.json({ success: false, error: '方案不存在' }, { status: 404 });
    }

    const p = projectRows[0];
    const features = (JSON.parse(p.features) as GameFeature[]).map(f => featureLabels[f] || f).join('、');

    const prompt = `你是传奇游戏顶级策划师，拥有10年传奇类游戏设计经验。

## 当前游戏方案
- 游戏名称：${p.name}
- 题材类型：${p.genre}（${genreDescriptions[p.genre] || ''}）
- 故事背景：${p.story || '暂无'}
- 核心主题：${p.theme || '热血激情'}
- 职业模式：${p.classType === 'single' ? '单职业' : '三职业（战法道）'}
- 已选玩法：${features}
${p.customFeatures ? `- 自定义玩法：${p.customFeatures}` : ''}

## 任务
请为这个游戏方案推荐${count}个创意玩法想法。要求：
1. 每个创意要新颖有趣，符合传奇游戏风格
2. 创意要和当前方案的世界观、玩法系统呼应
3. 每个创意描述要具体，包含核心机制说明
4. 给每个创意一个分类标签（如：PVP、PVE、社交、经济、探索、养成等）

请严格以JSON数组格式输出：
[
  {
    "title": "创意名称（要霸气有冲击力）",
    "description": "创意描述（2-3句话，包含核心机制和玩法亮点）",
    "category": "分类标签"
  }
]
${keywords ? `\n额外关键词提示：${keywords}` : ''}

注意：只输出JSON数组，不要输出其他内容。`;

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const stream = client.stream(
      [{ role: 'user', content: prompt }],
      { temperature: 0.9 }
    );

    let fullContent = '';
    for await (const chunk of stream) {
      if (chunk.content) {
        fullContent += chunk.content.toString();
      }
    }

    // 解析AI返回的创意
    let ideas: Array<{ title: string; description: string; category: string }> = [];
    try {
      const jsonMatch = fullContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        ideas = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('解析创意JSON失败:', parseError);
      return NextResponse.json({ 
        success: false, 
        error: 'AI返回格式异常，请重试',
        raw: fullContent 
      }, { status: 500 });
    }

    if (ideas.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '未能生成有效创意，请重试' 
      }, { status: 500 });
    }

    // 保存创意到数据库
    const now = Date.now();
    const savedIdeas = await db.insert(creativeIdeas).values(
      ideas.map(idea => ({
        projectId,
        title: idea.title,
        description: idea.description,
        category: idea.category,
        isSelected: 0,
        createdAt: now,
      }))
    ).returning();

    const data = savedIdeas.map(row => ({
      ...row,
      isSelected: row.isSelected === 1,
    }));

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('推荐创意失败:', error);
    return NextResponse.json({ success: false, error: '推荐创意失败' }, { status: 500 });
  }
}
