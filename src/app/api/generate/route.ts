import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import type { GameConfig, GeneratorType } from "@/types/game-planner";

// 游戏配置映射
const genreDescriptions: Record<string, string> = {
  '玄幻修真': '仙侠题材，飞升问道，充满东方神话色彩',
  '西方魔幻': '魔法与龙的世界，充满异域风情',
  '武侠江湖': '刀光剑影，快意恩仇，江湖儿女情长',
  '科幻未来': '星际战争，机械文明，高科技与异能',
  '暗黑哥特': '黑暗美学，恐怖悬疑，阴森诡异的氛围'
};

const classDescriptions: Record<string, string> = {
  'single': '单职业模式，简化选择，专注战斗体验',
  'tripartite': '三职业模式：战士（近战物理）、法师（远程魔法）、道士（召唤辅助）'
};

const featureDescriptions: Record<string, string> = {
  'classic_battle': '经典战法道职业系统',
  'gold_farming': '打金赚钱系统',
  'siege_war': '攻沙城主争夺战',
  'free_trade': '玩家自由交易系统',
  'boss_battle': 'BOSS战斗挑战',
  'pvp_arena': 'PVP竞技对战',
  'guild_system': '行会公会系统',
  'mount_system': '坐骑培养系统',
  'pet_system': '宠物伙伴系统'
};

// 提示词模板
function buildPrompt(gameConfig: GameConfig, generatorType: GeneratorType, keywords?: string): string {
  const { background, classConfig, features } = gameConfig;
  
  const baseInfo = `
## 游戏基本信息
- 游戏名称：${background.name || '未命名'}
- 题材类型：${background.genre}（${genreDescriptions[background.genre] || ''}）
- 故事背景：${background.story || '暂无背景描述'}
- 核心主题：${background.theme || '热血激情'}
- 职业系统：${classDescriptions[classConfig.type]}
- 已选玩法：${features.features.map(f => featureDescriptions[f] || f).join('、')}
${features.customFeatures ? `- 自定义玩法：${features.customFeatures}` : ''}
`;

  let generateSection = '';
  
  switch (generatorType) {
    case 'map':
      generateSection = `
## 生成要求：地图设计
请设计一个完整的游戏地图/副本，包含：
1. 地图名称（要有创意，符合游戏世界观）
2. 推荐等级范围
3. 怪物配置（至少4种怪物，注明名称和特点）
4. BOSS名称和特色
5. 特殊机制（如机关、解谜、限时等）
6. 奖励预览（装备、道具、材料等）

请以JSON格式输出：
{
  "name": "地图名称",
  "level": "等级范围",
  "monsters": ["怪物1:描述", "怪物2:描述", ...],
  "boss": "BOSS名称:特色描述",
  "specialMechanic": "特殊机制描述",
  "rewards": ["奖励1", "奖励2", ...]
}
${keywords ? `\\n额外关键词：${keywords}` : ''}
`;
      break;
      
    case 'npc':
      generateSection = `
## 生成要求：NPC角色设计
请设计一个生动的NPC角色，包含：
1. NPC名称
2. 角色定位（商人、任务NPC、BOSS等）
3. 所在位置
4. 对话内容（要有角色个性）
5. 相关任务或功能

请以JSON格式输出：
{
  "name": "NPC名称",
  "role": "角色定位",
  "location": "所在位置",
  "dialogue": "对话内容（2-3句）",
  "quest": "任务描述或功能说明"
}
${keywords ? `\\n额外关键词：${keywords}` : ''}
`;
      break;
      
    case 'equipment':
      generateSection = `
## 生成要求：装备配置
请设计一套完整的装备，包含：
1. 装备名称（要有传奇风格）
2. 装备类型（武器/衣服/首饰等）
3. 装备等级
4. 属性数值（攻防血等基础属性）
5. 特殊效果（触发技能或BUFF）

请以JSON格式输出：
{
  "name": "装备名称",
  "type": "装备类型",
  "level": "等级",
  "attributes": {"攻击": 100, "防御": 50, "生命": 200},
  "specialEffect": "特殊效果描述"
}
${keywords ? `\\n额外关键词：${keywords}` : ''}
`;
      break;
      
    case 'props':
      generateSection = `
## 生成要求：道具设计
请设计一个特色道具，包含：
1. 道具名称
2. 道具类型（消耗品/材料/功能道具等）
3. 稀有度（普通/稀有/史诗/传说）
4. 使用方式或获取方式
5. 详细描述

请以JSON格式输出：
{
  "name": "道具名称",
  "type": "道具类型",
  "rarity": "稀有度",
  "usage": "使用方式或获取方式",
  "description": "详细描述"
}
${keywords ? `\\n额外关键词：${keywords}` : ''}
`;
      break;
      
    case 'boss':
      generateSection = `
## 生成要求：BOSS设计
请设计一个震撼的BOSS，包含：
1. BOSS名称（要有气势）
2. 等级/难度
3. 出现位置
4. 核心技能（至少3个）
5. 弱点/克制方法
6. 击杀奖励

请以JSON格式输出：
{
  "name": "BOSS名称",
  "level": "难度等级",
  "location": "出现位置",
  "abilities": ["技能1:描述", "技能2:描述", "技能3:描述"],
  "weakness": "弱点/克制方法",
  "rewards": ["奖励1", "奖励2", ...]
}
${keywords ? `\\n额外关键词：${keywords}` : ''}
`;
      break;
      
    case 'drop':
      generateSection = `
## 生成要求：掉落配置
请设计一个完整的掉落表，包含：
1. 怪物名称
2. 掉落物品列表（含概率和数量）

请以JSON格式输出：
{
  "monster": "怪物名称",
  "items": [
    {"name": "物品1", "rate": "概率", "quantity": "数量"},
    ...
  ]
}
${keywords ? `\\n额外关键词：${keywords}` : ''}
`;
      break;
      
    case 'ui':
      generateSection = `
## 生成要求：玩法UI设计
请设计一个创新的玩法界面，包含：
1. 玩法名称
2. UI类型（活动界面/功能面板/特殊玩法等）
3. 核心功能描述
4. 交互方式说明

请以JSON格式输出：
{
  "name": "玩法名称",
  "type": "UI类型",
  "description": "核心功能描述",
  "interactions": ["交互1", "交互2", ...]
}
${keywords ? `\\n额外关键词：${keywords}` : ''}
`;
      break;
  }

  const systemPrompt = `你是传奇游戏的专业策划师，拥有10年传奇类游戏设计经验。请根据游戏配置，生成富有创意且符合传奇游戏风格的策划内容。要求：
1. 内容要有创意和特色，不能平淡无奇
2. 要符合传奇游戏"简单粗暴、上瘾机制"的设计理念
3. 数据要平衡合理
4. 名称要有冲击力，让人印象深刻
5. 输出必须是合法的JSON格式`;

  return `${systemPrompt}
${baseInfo}
${generateSection}
`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameConfig, generatorType, keywords } = body as {
      gameConfig: GameConfig;
      generatorType: GeneratorType;
      keywords?: string;
    };

    if (!gameConfig || !generatorType) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const prompt = buildPrompt(gameConfig, generatorType, keywords);

    // 使用流式输出
    const stream = client.stream(
      [{ role: 'user', content: prompt }],
      {
        model: 'doubao-seed-2-0-pro-260215',
        temperature: 0.8
      }
    );

    // 创建流式响应
    const encoder = new TextEncoder();
    const streamData = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = '';
          
          for await (const chunk of stream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              fullContent += text;
              controller.enqueue(encoder.encode(text));
            }
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
    console.error('生成失败:', error);
    return NextResponse.json(
      { success: false, error: '生成失败，请重试' },
      { status: 500 }
    );
  }
}
