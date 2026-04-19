'use client';

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Swords, 
  Users, 
  Gamepad2, 
  Sparkles,
  Map,
  UserCircle,
  Sword,
  FlaskConical,
  Skull,
  Package,
  LayoutGrid
} from 'lucide-react';
import type { 
  GameBackground, 
  ClassConfig, 
  GameFeatures, 
  GameConfig,
  GeneratorType,
  GameFeature,
  GameGenre,
  ClassType
} from '@/types/game-planner';

const genreOptions = [
  { value: '玄幻修真', label: '玄幻修真', desc: '仙侠飞升、问道长生' },
  { value: '西方魔幻', label: '西方魔幻', desc: '魔法战争、龙与地下城' },
  { value: '武侠江湖', label: '武侠江湖', desc: '刀光剑影、快意恩仇' },
  { value: '科幻未来', label: '科幻未来', desc: '星际战争、机械文明' },
  { value: '暗黑哥特', label: '暗黑哥特', desc: '黑暗美学、恐怖悬疑' }
];

const classOptions = [
  { 
    value: 'single', 
    label: '单职业', 
    desc: '战士一刀999，简化职业选择',
    icon: Swords
  },
  { 
    value: 'tripartite', 
    label: '三职业', 
    desc: '战士/法师/道士，经典战法道',
    icon: Users
  }
];

const featureOptions = [
  { value: 'classic_battle', label: '经典战法道', desc: '战士近战、法师群攻、道士辅助' },
  { value: 'gold_farming', label: '打金系统', desc: '自由交易、元宝回收' },
  { value: 'siege_war', label: '攻沙战', desc: '万人同屏、城主争夺' },
  { value: 'free_trade', label: '自由交易', desc: '玩家间自由买卖' },
  { value: 'boss_battle', label: 'BOSS战', desc: '世界BOSS、公会BOSS' },
  { value: 'pvp_arena', label: 'PVP竞技', desc: '1v1、3v3竞技场' },
  { value: 'guild_system', label: '行会系统', desc: '创建行会、兄弟同心' },
  { value: 'mount_system', label: '坐骑系统', desc: '酷炫坐骑、属性加成' },
  { value: 'pet_system', label: '宠物系统', desc: '萌宠相伴、战斗助力' }
];

const generatorTypeOptions: Array<{ value: GeneratorType; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }> = [
  { value: 'map', label: '地图设计', icon: Map, desc: '生成副本地图配置' },
  { value: 'npc', label: 'NPC设计', icon: UserCircle, desc: '生成NPC角色设定' },
  { value: 'equipment', label: '装备配置', icon: Sword, desc: '生成装备属性数据' },
  { value: 'props', label: '道具设计', icon: FlaskConical, desc: '生成特色道具' },
  { value: 'boss', label: 'BOSS设计', icon: Skull, desc: '生成BOSS技能掉落' },
  { value: 'drop', label: '掉落配置', icon: Package, desc: '生成掉落概率表' },
  { value: 'ui', label: '玩法UI', icon: LayoutGrid, desc: '生成玩法界面设计' }
];

interface GameConfigPanelProps {
  config: GameConfig;
  onConfigChange: (config: GameConfig) => void;
  selectedGenerator: GeneratorType;
  onGeneratorChange: (type: GeneratorType) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function GameConfigPanel({
  config,
  onConfigChange,
  selectedGenerator,
  onGeneratorChange,
  onGenerate,
  isGenerating
}: GameConfigPanelProps) {
  // 更新背景配置
  const updateBackground = (updates: Partial<GameBackground>) => {
    onConfigChange({
      ...config,
      background: { ...config.background, ...updates }
    });
  };

  // 更新职业配置
  const updateClassConfig = (updates: Partial<ClassConfig>) => {
    onConfigChange({
      ...config,
      classConfig: { ...config.classConfig, ...updates }
    });
  };

  // 更新玩法配置
  const updateFeatures = (updates: Partial<GameFeatures>) => {
    onConfigChange({
      ...config,
      features: { ...config.features, ...updates }
    });
  };

  // 切换玩法特性
  const toggleFeature = (feature: string) => {
    const currentFeatures = config.features.features;
    if (currentFeatures.includes(feature as GameFeature)) {
      updateFeatures({
        features: currentFeatures.filter(f => f !== feature) as GameFeature[]
      });
    } else {
      updateFeatures({
        features: [...currentFeatures, feature as GameFeature]
      });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* 标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
          996传奇策划生成器
        </h1>
        <p className="text-muted-foreground">
          基于AI的传奇游戏创意策划工具 · 无限生成地图/NPC/装备/BOSS等游戏内容
        </p>
      </div>

      {/* 主配置区域 */}
      <Tabs defaultValue="background" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="background" className="gap-2">
            <Sparkles className="h-4 w-4" />
            游戏背景
          </TabsTrigger>
          <TabsTrigger value="class" className="gap-2">
            <Users className="h-4 w-4" />
            职业系统
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <Gamepad2 className="h-4 w-4" />
            玩法配置
          </TabsTrigger>
          <TabsTrigger value="generator" className="gap-2">
            <Swords className="h-4 w-4" />
            创意生成
          </TabsTrigger>
        </TabsList>

        {/* 游戏背景配置 */}
        <TabsContent value="background" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>游戏背景设定</CardTitle>
              <CardDescription>
                配置游戏的世界观、题材和核心主题
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gameName">游戏名称</Label>
                <Input
                  id="gameName"
                  placeholder="例如：烈焰乾坤"
                  value={config.background.name}
                  onChange={(e) => updateBackground({ name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>游戏题材</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {genreOptions.map((genre) => (
                    <Card 
                      key={genre.value}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        config.background.genre === genre.value 
                          ? 'border-primary bg-primary/5' 
                          : ''
                      }`}
                      onClick={() => updateBackground({ genre: genre.value as GameGenre })}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="font-medium text-sm">{genre.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {genre.desc}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="story">故事背景</Label>
                <Textarea
                  id="story"
                  placeholder="描述游戏的世界观和故事背景..."
                  className="min-h-[120px]"
                  value={config.background.story}
                  onChange={(e) => updateBackground({ story: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">核心主题</Label>
                <Input
                  id="theme"
                  placeholder="例如：热血、激情、兄弟情谊"
                  value={config.background.theme}
                  onChange={(e) => updateBackground({ theme: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 职业系统配置 */}
        <TabsContent value="class" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>职业系统配置</CardTitle>
              <CardDescription>
                选择单职业或三职业模式
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {classOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = config.classConfig.type === option.value;
                  return (
                    <Card
                      key={option.value}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        isSelected ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => updateClassConfig({ type: option.value as ClassType })}
                    >
                      <CardContent className="p-6 text-center space-y-3">
                        <div className="flex justify-center">
                          <div className={`p-3 rounded-full ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}>
                            <Icon className={`h-8 w-8 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="font-semibold text-lg">{option.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {option.desc}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {config.classConfig.type === 'tripartite' && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-3">三职业介绍</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="font-medium text-red-500">战士</div>
                      <ul className="text-muted-foreground space-y-1">
                        <li>高血量、高防御</li>
                        <li>近战物理攻击</li>
                        <li>爆发力强</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-blue-500">法师</div>
                      <ul className="text-muted-foreground space-y-1">
                        <li>高攻击、低血量</li>
                        <li>远程魔法攻击</li>
                        <li>范围伤害</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-green-500">道士</div>
                      <ul className="text-muted-foreground space-y-1">
                        <li>平衡型职业</li>
                        <li>召唤、神圣符咒</li>
                        <li>辅助治疗</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 玩法配置 */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>玩法系统配置</CardTitle>
              <CardDescription>
                选择游戏的主要玩法系统
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {featureOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all hover:border-primary ${
                      config.features.features.includes(option.value as GameFeature)
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                    onClick={() => toggleFeature(option.value)}
                  >
                    <Checkbox
                      checked={config.features.features.includes(option.value as GameFeature)}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {option.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor="customFeatures">自定义玩法描述</Label>
                <Textarea
                  id="customFeatures"
                  placeholder="添加更多自定义玩法描述..."
                  className="min-h-[80px]"
                  value={config.features.customFeatures || ''}
                  onChange={(e) => updateFeatures({ customFeatures: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 创意生成器 */}
        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI创意玩法生成器</CardTitle>
              <CardDescription>
                选择要生成的创意内容类型
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 生成类型选择 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {generatorTypeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedGenerator === option.value;
                  return (
                    <Card
                      key={option.value}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        isSelected ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => onGeneratorChange(option.value)}
                    >
                      <CardContent className="p-4 text-center space-y-2">
                        <Icon className={`h-6 w-6 mx-auto ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {option.desc}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* 当前配置预览 */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  当前配置预览
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">游戏名：</span>
                    <span className="font-medium">{config.background.name || '未设置'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">题材：</span>
                    <Badge variant="outline">{config.background.genre}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">职业：</span>
                    <Badge variant="outline">
                      {config.classConfig.type === 'single' ? '单职业' : '三职业'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">玩法：</span>
                    <Badge variant="outline">
                      {config.features.features.length}个
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 生成按钮 */}
              <Button
                size="lg"
                className="w-full"
                onClick={onGenerate}
                disabled={isGenerating || !config.background.name}
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin mr-2" />
                    AI正在创意生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    开始AI生成
                  </>
                )}
              </Button>

              {!config.background.name && (
                <p className="text-sm text-muted-foreground text-center">
                  请先在「游戏背景」中设置游戏名称
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
