import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getDb } from '@/lib/db';
import { projects, creativeIdeas, generatedConfigs } from '@/lib/db/schema';
import { ensureDbInitialized } from '@/lib/db/init';
import { eq } from 'drizzle-orm';
import type { GameFeature, ConfigType } from '@/types/game-planner';

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

function buildConfigPrompt(
  projectData: { name: string; genre: string; story: string; theme: string; classType: string; features: string; customFeatures: string | null },
  ideaData: { title: string; description: string; category: string },
  configType: ConfigType
): string {
  const features = (JSON.parse(projectData.features) as GameFeature[]).map(f => featureLabels[f] || f).join('、');

  const baseInfo = `
## 游戏方案
- 游戏名称：${projectData.name}
- 题材类型：${projectData.genre}（${genreDescriptions[projectData.genre] || ''}）
- 故事背景：${projectData.story || '暂无'}
- 核心主题：${projectData.theme || '热血激情'}
- 职业模式：${projectData.classType === 'single' ? '单职业' : '三职业（战法道）'}
- 已选玩法：${features}
${projectData.customFeatures ? `- 自定义玩法：${projectData.customFeatures}` : ''}

## 选中的创意玩法
- 创意名称：${ideaData.title}
- 创意描述：${ideaData.description}
- 分类标签：${ideaData.category}`;

  const typePrompts: Record<ConfigType, string> = {
    'class': `请为该创意生成职业配置（如果已有三职业则侧重职业技能树和进阶路线），包含：
- 职业名称、职业定位、核心技能（至少4个）、进阶路线、专属装备类型
输出JSON: { "classes": [{ "name": "", "role": "", "skills": [{ "name": "", "description": "", "damage": "" }], "advancement": "", "exclusiveEquip": "" }] }`,

    'map': `请为该创意生成副本地图配置，包含：
- 地图名称、等级范围、怪物配置（至少4种）、BOSS、特殊机制、奖励
输出JSON: { "name": "", "level": "", "monsters": ["名称:描述"], "boss": "名称:描述", "specialMechanic": "", "rewards": [""] }`,

    'npc': `请为该创意生成3个相关NPC，每个包含：
- NPC名称、角色定位、所在位置、对话内容、相关任务
输出JSON: { "npcs": [{ "name": "", "role": "", "location": "", "dialogue": "", "quest": "" }] }`,

    'equipment': `请为该创意生成3件特色装备，包含：
- 装备名称、类型、等级、属性、特殊效果
输出JSON: { "equipments": [{ "name": "", "type": "", "level": "", "attributes": {}, "specialEffect": "" }] }`,

    'props': `请为该创意生成3个特色道具，包含：
- 名称、类型、稀有度、用途、描述
输出JSON: { "props": [{ "name": "", "type": "", "rarity": "", "usage": "", "description": "" }] }`,

    'boss': `请为该创意生成BOSS配置，包含：
- 名称、等级、位置、核心技能（至少3个）、弱点、奖励
输出JSON: { "name": "", "level": "", "location": "", "abilities": [""], "weakness": "", "rewards": [""] }`,

    'monster': `请为该创意生成4种怪物配置，包含：
- 名称、等级、攻击方式、特殊技能、掉落
输出JSON: { "monsters": [{ "name": "", "level": "", "attackType": "", "specialSkill": "", "drops": [""] }] }`,

    'quest': `请为该创意生成任务链配置（3个关联任务），包含：
- 任务名称、类型、描述、目标、奖励
输出JSON: { "quests": [{ "name": "", "type": "", "description": "", "objectives": [""], "rewards": [""] }] }`,

    'drop': `请为该创意生成掉落配置表，包含：
- 来源（怪物/BOSS/宝箱）、掉落物品列表（名称、概率、数量）
输出JSON: { "source": "", "items": [{ "name": "", "rate": "", "quantity": "" }] }`,

    'ui': `请为该创意生成玩法UI设计，包含：
- 玩法名称、UI类型、核心功能描述、交互方式
输出JSON: { "name": "", "type": "", "description": "", "interactions": [""] }`
  };

  return `你是传奇游戏的专业策划师，拥有10年传奇类游戏设计经验。请根据游戏方案和选中的创意玩法，生成具体的配置数据。

${baseInfo}

## 生成要求：${configType === 'class' ? '职业配置' : configType === 'map' ? '地图设计' : configType === 'npc' ? 'NPC设计' : configType === 'equipment' ? '装备配置' : configType === 'props' ? '道具设计' : configType === 'boss' ? 'BOSS设计' : configType === 'monster' ? '怪物设计' : configType === 'quest' ? '任务设计' : configType === 'drop' ? '掉落配置' : '玩法UI'}

${typePrompts[configType]}

要求：
1. 内容要有创意和特色，让人印象深刻
2. 符合传奇游戏"简单粗暴、上瘾机制"的设计理念
3. 数据平衡合理
4. 名称要有冲击力
5. 严格输出合法JSON，不要输出其他内容`;
}

export async function POST(request: NextRequest) {
  try {
    ensureDbInitialized();
    const body = await request.json();
    const { projectId, ideaId, configType } = body as {
      projectId: number;
      ideaId: number;
      configType: ConfigType;
    };

    if (!projectId || !ideaId || !configType) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    const db = getDb();

    // 获取方案信息
    const projectRows = await db.select().from(projects)
      .where(eq(projects.id, projectId)).execute();
    if (projectRows.length === 0) {
      return NextResponse.json({ success: false, error: '方案不存在' }, { status: 404 });
    }

    // 获取创意信息
    const ideaRows = await db.select().from(creativeIdeas)
      .where(eq(creativeIdeas.id, ideaId)).execute();
    if (ideaRows.length === 0) {
      return NextResponse.json({ success: false, error: '创意不存在' }, { status: 404 });
    }

    const projectData = projectRows[0];
    const ideaData = ideaRows[0];

    const prompt = buildConfigPrompt(
      {
        name: projectData.name,
        genre: projectData.genre,
        story: projectData.story,
        theme: projectData.theme,
        classType: projectData.classType,
        features: projectData.features,
        customFeatures: projectData.customFeatures,
      },
      {
        title: ideaData.title,
        description: ideaData.description,
        category: ideaData.category,
      },
      configType
    );

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 使用流式输出
    const stream = client.stream(
      [{ role: 'user', content: prompt }],
      { temperature: 0.8 }
    );

    const encoder = new TextEncoder();
    const streamData = new ReadableStream({
      async start(controller) {
        let fullContent = '';
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              fullContent += text;
              controller.enqueue(encoder.encode(text));
            }
          }
          
          // 流完成后，尝试保存到数据库
          try {
            const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              JSON.parse(jsonMatch[0]); // 验证JSON合法
              await db.insert(generatedConfigs).values({
                projectId,
                ideaId,
                configType,
                content: jsonMatch[0],
                createdAt: Date.now(),
              }).execute();
            }
          } catch (saveErr) {
            console.error('保存生成配置失败:', saveErr);
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(streamData, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('生成配置失败:', error);
    return NextResponse.json({ success: false, error: '生成配置失败' }, { status: 500 });
  }
}
