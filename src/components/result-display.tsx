'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy, Check, RefreshCw, Download, Sparkles } from 'lucide-react';
import type { 
  CreativeResult, 
  GeneratorType, 
  MapConfig,
  NPCConfig,
  EquipmentConfig,
  PropsConfig,
  BossConfig,
  DropConfig,
  UIFeatureConfig
} from '@/types/game-planner';

interface ResultDisplayProps {
  result: CreativeResult | null;
  isStreaming: boolean;
  streamingContent: string;
  onRegenerate: () => void;
}

export function ResultDisplay({
  result,
  isStreaming,
  streamingContent,
  onRegenerate
}: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [displayContent, setDisplayContent] = useState('');

  useEffect(() => {
    if (streamingContent) {
      setDisplayContent(streamingContent);
    } else if (result?.content) {
      setDisplayContent(JSON.stringify(result.content, null, 2));
    }
  }, [result, streamingContent]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(displayContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败', err);
    }
  };

  const downloadResult = () => {
    const blob = new Blob([displayContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `策划案_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!result && !isStreaming && !streamingContent) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="py-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-muted rounded-full">
              <Sparkles className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">等待生成</h3>
              <p className="text-sm text-muted-foreground">
                在左侧配置游戏内容，然后点击「开始AI生成」
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            生成结果
          </CardTitle>
          {result && (
            <Badge variant="outline" className="capitalize">
              {result.type === 'map' && '地图设计'}
              {result.type === 'npc' && 'NPC设计'}
              {result.type === 'equipment' && '装备配置'}
              {result.type === 'props' && '道具设计'}
              {result.type === 'boss' && 'BOSS设计'}
              {result.type === 'drop' && '掉落配置'}
              {result.type === 'ui' && '玩法UI'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={isStreaming}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isStreaming ? 'animate-spin' : ''}`} />
            重新生成
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            disabled={!displayContent}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                已复制
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                复制
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadResult}
            disabled={!displayContent}
          >
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isStreaming && (
          <div className="mb-4 p-3 bg-primary/5 rounded-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-pulse text-primary" />
            <span className="text-sm text-primary">AI正在生成中...</span>
          </div>
        )}
        
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">格式化预览</TabsTrigger>
            <TabsTrigger value="raw">原始JSON</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="mt-4">
            {result?.content && <ContentPreview content={result.content} type={result.type} />}
            {isStreaming && !result && (
              <PreBlock content={streamingContent} />
            )}
          </TabsContent>
          
          <TabsContent value="raw" className="mt-4">
            <PreBlock content={displayContent} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ContentPreview({ 
  content, 
  type 
}: { 
  content: MapConfig | NPCConfig | EquipmentConfig | PropsConfig | BossConfig | DropConfig | UIFeatureConfig;
  type: GeneratorType;
}) {
  switch (type) {
    case 'map':
      return <MapPreview content={content as MapConfig} />;
    case 'npc':
      return <NPCPreview content={content as NPCConfig} />;
    case 'equipment':
      return <EquipmentPreview content={content as EquipmentConfig} />;
    case 'props':
      return <PropsPreview content={content as PropsConfig} />;
    case 'boss':
      return <BossPreview content={content as BossConfig} />;
    case 'drop':
      return <DropPreview content={content as DropConfig} />;
    case 'ui':
      return <UIPreview content={content as UIFeatureConfig} />;
    default:
      return <PreBlock content={JSON.stringify(content, null, 2)} />;
  }
}

function MapPreview({ content }: { content: MapConfig }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-bold">{content.name}</h3>
        <Badge variant="secondary">等级 {content.level}</Badge>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">怪物分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {content.monsters.map((monster, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  {monster}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">特殊机制</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{content.specialMechanic}</p>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">BOSS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{content.boss}</p>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">奖励</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {content.rewards.map((reward, i) => (
                <Badge key={i} variant="outline">{reward}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NPCPreview({ content }: { content: NPCConfig }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-bold">{content.name}</h3>
        <Badge variant="outline">{content.role}</Badge>
      </div>
      
      <div className="space-y-3">
        <div className="p-3 bg-muted rounded-lg">
          <span className="text-muted-foreground text-sm">位置：</span>
          <span className="text-sm">{content.location}</span>
        </div>
        
        <div className="p-3 bg-muted rounded-lg">
          <span className="text-muted-foreground text-sm block mb-2">对话：</span>
          <p className="text-sm">{content.dialogue}</p>
        </div>
        
        <div className="p-3 bg-muted rounded-lg">
          <span className="text-muted-foreground text-sm block mb-2">任务：</span>
          <p className="text-sm">{content.quest}</p>
        </div>
      </div>
    </div>
  );
}

function EquipmentPreview({ content }: { content: EquipmentConfig }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-bold">{content.name}</h3>
        <Badge variant="secondary">{content.type}</Badge>
        <Badge variant="outline">等级 {content.level}</Badge>
      </div>
      
      <div className="space-y-3">
        <div className="p-3 bg-muted rounded-lg">
          <span className="text-muted-foreground text-sm block mb-2">属性：</span>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(content.attributes).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span>{key}</span>
                <span className="font-medium text-green-600">+{value}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-3 bg-muted rounded-lg">
          <span className="text-muted-foreground text-sm block mb-2">特效：</span>
          <p className="text-sm">{content.specialEffect}</p>
        </div>
      </div>
    </div>
  );
}

function PropsPreview({ content }: { content: PropsConfig }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-bold">{content.name}</h3>
        <Badge variant="secondary">{content.type}</Badge>
        <Badge 
          variant={
            content.rarity === '传说' ? 'destructive' : 
            content.rarity === '史诗' ? 'default' : 
            content.rarity === '稀有' ? 'secondary' : 'outline'
          }
        >
          {content.rarity}
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div className="p-3 bg-muted rounded-lg">
          <span className="text-muted-foreground text-sm block mb-2">用途：</span>
          <p className="text-sm">{content.usage}</p>
        </div>
        
        <div className="p-3 bg-muted rounded-lg">
          <span className="text-muted-foreground text-sm block mb-2">描述：</span>
          <p className="text-sm">{content.description}</p>
        </div>
      </div>
    </div>
  );
}

function BossPreview({ content }: { content: BossConfig }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-bold text-red-500">{content.name}</h3>
        <Badge variant="destructive">等级 {content.level}</Badge>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">位置</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{content.location}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">弱点</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{content.weakness}</p>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">技能</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {content.abilities.map((ability, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-orange-500 rounded-full" />
                  {ability}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">奖励</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {content.rewards.map((reward, i) => (
                <Badge key={i} variant="outline">{reward}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DropPreview({ content }: { content: DropConfig }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">{content.monster}</h3>
      
      <div className="space-y-2">
        {content.items.map((item, i) => (
          <Card key={i}>
            <CardContent className="p-3 flex justify-between items-center">
              <div>
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground ml-2">x{item.quantity}</span>
              </div>
              <Badge variant="secondary">{item.rate}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function UIPreview({ content }: { content: UIFeatureConfig }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-bold">{content.name}</h3>
        <Badge variant="outline">{content.type}</Badge>
      </div>
      
      <div className="p-3 bg-muted rounded-lg">
        <span className="text-muted-foreground text-sm block mb-2">描述：</span>
        <p className="text-sm">{content.description}</p>
      </div>
      
      <div className="space-y-2">
        <span className="text-muted-foreground text-sm">交互方式：</span>
        <ul className="space-y-1">
          {content.interactions.map((interaction, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              {interaction}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PreBlock({ content }: { content: string }) {
  return (
    <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-[500px] text-sm font-mono whitespace-pre-wrap">
      {content || '暂无内容'}
    </pre>
  );
}
