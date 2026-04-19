'use client';

import { useState, useCallback } from 'react';
import { GameConfigPanel } from '@/components/game-config-panel';
import { ResultDisplay } from '@/components/result-display';
import { GameConfig, GeneratorType, CreativeResult } from '@/types/game-planner';

// 默认配置
const defaultConfig: GameConfig = {
  background: {
    name: '烈焰乾坤',
    genre: '玄幻修真',
    story: '上古时期，天地初开，诸多势力割据。玩家从微末中崛起，经历无数磨难，最终踏上成仙之路。',
    theme: '热血、激情、兄弟情谊'
  },
  classConfig: {
    type: 'tripartite'
  },
  features: {
    features: ['classic_battle', 'boss_battle', 'siege_war', 'gold_farming']
  }
};

export default function Home() {
  const [config, setConfig] = useState<GameConfig>(defaultConfig);
  const [selectedGenerator, setSelectedGenerator] = useState<GeneratorType>('map');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<CreativeResult | null>(null);
  const [streamingContent, setStreamingContent] = useState('');

  // 生成创意玩法
  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setResult(null);
    setStreamingContent('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameConfig: config,
          generatorType: selectedGenerator
        }),
      });

      if (!response.ok) {
        throw new Error('生成请求失败');
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let fullContent = '';
      let jsonBuffer = '';
      let isJsonMode = false;
      let jsonStartIndex = -1;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        
        // 查找JSON开始位置
        if (!isJsonMode) {
          const jsonStart = fullContent.indexOf('{');
          if (jsonStart !== -1) {
            isJsonMode = true;
            jsonStartIndex = jsonStart;
            jsonBuffer = fullContent.substring(jsonStart);
          } else {
            // JSON开始前的内容直接显示
            setStreamingContent(fullContent);
          }
        } else {
          jsonBuffer = fullContent.substring(jsonStartIndex);
        }

        // 实时更新显示
        if (isJsonMode) {
          // 尝试解析JSON并格式化显示
          try {
            const parsed = JSON.parse(jsonBuffer);
            setStreamingContent(JSON.stringify(parsed, null, 2));
          } catch {
            // JSON还未完整，继续累积
            setStreamingContent(jsonBuffer);
          }
        }
      }

      // 最终解析并保存结果
      try {
        const jsonStart = fullContent.indexOf('{');
        if (jsonStart !== -1) {
          const jsonStr = fullContent.substring(jsonStart);
          const parsed = JSON.parse(jsonStr);
          setResult({
            type: selectedGenerator,
            content: parsed
          });
        }
      } catch (parseError) {
        console.error('JSON解析失败:', parseError);
      }

    } catch (error) {
      console.error('生成失败:', error);
      setStreamingContent('生成失败，请重试。错误信息: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }, [config, selectedGenerator, isGenerating]);

  // 重新生成
  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 配置面板 */}
        <GameConfigPanel
          config={config}
          onConfigChange={setConfig}
          selectedGenerator={selectedGenerator}
          onGeneratorChange={setSelectedGenerator}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />

        {/* 结果展示 */}
        <ResultDisplay
          result={result}
          isStreaming={isGenerating}
          streamingContent={streamingContent}
          onRegenerate={handleRegenerate}
        />

        {/* 底部说明 */}
        <div className="text-center text-sm text-muted-foreground">
          <p>996传奇策划生成器 · 基于AI的传奇游戏创意策划工具</p>
          <p className="mt-1">支持无限生成地图、NPC、装备、道具、BOSS、掉落配置等游戏内容</p>
        </div>
      </div>
    </div>
  );
}
