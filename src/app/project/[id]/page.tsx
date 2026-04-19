'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Sparkles, 
  Star, 
  StarOff,
  RefreshCw, 
  Copy, 
  Check,
  Settings2,
  Lightbulb,
  Wrench,
  Trash2
} from 'lucide-react';
import type { 
  ProjectView, 
  CreativeIdea, 
  GeneratedConfig, 
  ConfigType,
  GameFeature
} from '@/types/game-planner';
import { configTypeLabels, genreOptions, classOptions, featureOptions } from '@/types/game-planner';

// 配置类型选项
const configTypeOptions: ConfigType[] = ['class', 'map', 'npc', 'equipment', 'props', 'boss', 'monster', 'quest', 'drop', 'ui'];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<number | null>(null);
  const [project, setProject] = useState<ProjectView | null>(null);
  const [ideas, setIdeas] = useState<CreativeIdea[]>([]);
  const [configs, setConfigs] = useState<GeneratedConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // AI相关状态
  const [recommending, setRecommending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState<ConfigType | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [selectedIdea, setSelectedIdea] = useState<CreativeIdea | null>(null);
  const [selectedConfigType, setSelectedConfigType] = useState<ConfigType>('map');
  const [copied, setCopied] = useState(false);

  // 编辑模式
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<ProjectView | null>(null);

  // 解析params
  useEffect(() => {
    params.then(p => setProjectId(Number(p.id)));
  }, [params]);

  // 加载数据
  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    try {
      const [projectRes, ideasRes, configsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/ideas?projectId=${projectId}`),
        fetch(`/api/configs?projectId=${projectId}`),
      ]);
      const projectData = await projectRes.json();
      const ideasData = await ideasRes.json();
      const configsData = await configsRes.json();

      if (projectData.success) setProject(projectData.data);
      if (ideasData.success) setIdeas(ideasData.data);
      if (configsData.success) setConfigs(configsData.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // AI推荐创意
  const handleRecommend = async () => {
    if (!projectId || recommending) return;
    setRecommending(true);
    try {
      const res = await fetch('/api/ideas/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, count: 5 }),
      });
      const data = await res.json();
      if (data.success) {
        setIdeas(prev => [...(data.data || []), ...prev]);
      }
    } catch (err) {
      console.error('推荐创意失败:', err);
    } finally {
      setRecommending(false);
    }
  };

  // 选择/取消选择创意
  const handleToggleIdea = async (idea: CreativeIdea) => {
    try {
      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSelected: !idea.isSelected }),
      });
      const data = await res.json();
      if (data.success) {
        setIdeas(prev => prev.map(i => i.id === idea.id ? data.data : i));
      }
    } catch (err) {
      console.error('更新创意失败:', err);
    }
  };

  // 删除创意
  const handleDeleteIdea = async (ideaId: number) => {
    if (!confirm('确定删除该创意？相关配置将一并删除。')) return;
    try {
      await fetch(`/api/ideas/${ideaId}`, { method: 'DELETE' });
      setIdeas(prev => prev.filter(i => i.id !== ideaId));
      setConfigs(prev => prev.filter(c => c.ideaId !== ideaId));
      if (selectedIdea?.id === ideaId) setSelectedIdea(null);
    } catch (err) {
      console.error('删除创意失败:', err);
    }
  };

  // AI生成详细配置
  const handleGenerateConfig = async (idea: CreativeIdea, configType: ConfigType) => {
    if (!projectId || generating) return;
    setGenerating(true);
    setGeneratingType(configType);
    setStreamingContent('');

    try {
      const res = await fetch('/api/generate-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, ideaId: idea.id, configType }),
      });

      if (!res.ok) throw new Error('生成请求失败');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setStreamingContent(fullContent);
      }

      // 刷新配置列表
      const configsRes = await fetch(`/api/configs?projectId=${projectId}`);
      const configsData = await configsRes.json();
      if (configsData.success) setConfigs(configsData.data);

    } catch (err) {
      console.error('生成配置失败:', err);
      setStreamingContent('生成失败，请重试');
    } finally {
      setGenerating(false);
      setGeneratingType(null);
    }
  };

  // 更新方案
  const handleSaveProject = async () => {
    if (!project || !editForm) return;
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setProject(data.data);
        setEditing(false);
      }
    } catch (err) {
      console.error('更新方案失败:', err);
    }
  };

  // 复制内容
  const copyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败', err);
    }
  };

  // 获取创意下的配置
  const getConfigsForIdea = (ideaId: number) => {
    return configs.filter(c => c.ideaId === ideaId);
  };

  // 已选创意
  const selectedIdeas = ideas.filter(i => i.isSelected);
  // 未选创意
  const unselectedIdeas = ideas.filter(i => !i.isSelected);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">方案不存在</h2>
          <Button onClick={() => router.push('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> 返回首页
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">{project.name}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{project.genre}</Badge>
                <Badge variant="secondary">
                  {project.classType === 'single' ? '单职业' : '三职业'}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setEditForm(project); setEditing(true); }} className="gap-2">
            <Settings2 className="h-4 w-4" /> 编辑方案
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="ideas" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="ideas" className="gap-2">
              <Lightbulb className="h-4 w-4" /> 创意玩法
            </TabsTrigger>
            <TabsTrigger value="configs" className="gap-2">
              <Wrench className="h-4 w-4" /> 配置生成
            </TabsTrigger>
          </TabsList>

          {/* ===== 创意玩法 Tab ===== */}
          <TabsContent value="ideas" className="mt-6 space-y-6">
            {/* 推荐按钮 */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">AI创意推荐</h2>
              <Button onClick={handleRecommend} disabled={recommending} className="gap-2">
                {recommending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    AI推荐中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    推荐新创意
                  </>
                )}
              </Button>
            </div>

            {/* 已选创意 */}
            {selectedIdeas.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  已选创意（{selectedIdeas.length}）
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {selectedIdeas.map(idea => (
                    <Card key={idea.id} className="border-primary/50 bg-primary/5">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium flex items-center gap-2">
                              {idea.title}
                              <Badge variant="outline" className="text-xs">{idea.category}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {idea.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleToggleIdea(idea)}
                              title="取消选择"
                            >
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteIdea(idea.id)}
                              title="删除"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 未选创意 */}
            {unselectedIdeas.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <StarOff className="h-4 w-4" />
                  待选择创意（{unselectedIdeas.length}）
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {unselectedIdeas.map(idea => (
                    <Card key={idea.id} className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium flex items-center gap-2">
                              {idea.title}
                              <Badge variant="outline" className="text-xs">{idea.category}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {idea.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleToggleIdea(idea)}
                              title="选择此创意"
                            >
                              <StarOff className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteIdea(idea.id)}
                              title="删除"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 无创意提示 */}
            {ideas.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Lightbulb className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium mb-1">还没有创意</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    点击「推荐新创意」，让AI根据你的方案推荐玩法创意
                  </p>
                  <Button onClick={handleRecommend} disabled={recommending} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    开始推荐
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== 配置生成 Tab ===== */}
          <TabsContent value="configs" className="mt-6 space-y-6">
            {selectedIdeas.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium mb-1">请先选择创意</h3>
                  <p className="text-sm text-muted-foreground">
                    在「创意玩法」中选择感兴趣的创意，然后为它生成详细配置
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* 左：创意选择 */}
                <div className="lg:col-span-1 space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">选择创意</h3>
                  <ScrollArea className="h-[calc(100vh-250px)]">
                    <div className="space-y-2 pr-3">
                      {selectedIdeas.map(idea => (
                        <Card
                          key={idea.id}
                          className={`cursor-pointer transition-all ${
                            selectedIdea?.id === idea.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedIdea(idea)}
                        >
                          <CardContent className="p-3">
                            <div className="font-medium text-sm">{idea.title}</div>
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {idea.description}
                            </div>
                            <div className="flex items-center gap-1 mt-2">
                              <Badge variant="outline" className="text-xs">{idea.category}</Badge>
                              <Badge variant="secondary" className="text-xs">
                                {getConfigsForIdea(idea.id).length}个配置
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* 右：配置生成区 */}
                <div className="lg:col-span-2 space-y-4">
                  {selectedIdea ? (
                    <>
                      {/* 创意信息 */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-5 w-5 text-orange-500" />
                            <h3 className="font-semibold">{selectedIdea.title}</h3>
                            <Badge variant="outline">{selectedIdea.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedIdea.description}
                          </p>
                        </CardContent>
                      </Card>

                      {/* 配置类型选择 */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">选择要生成的配置类型</h4>
                        <div className="flex flex-wrap gap-2">
                          {configTypeOptions.map(type => {
                            const hasConfig = getConfigsForIdea(selectedIdea.id).some(c => c.configType === type);
                            return (
                              <Button
                                key={type}
                                variant={selectedConfigType === type ? 'default' : 'outline'}
                                size="sm"
                                className={`gap-1 ${hasConfig ? 'border-green-500/50' : ''}`}
                                onClick={() => setSelectedConfigType(type)}
                              >
                                {configTypeLabels[type]}
                                {hasConfig && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 生成按钮 */}
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => handleGenerateConfig(selectedIdea, selectedConfigType)}
                        disabled={generating}
                      >
                        {generating && generatingType === selectedConfigType ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            AI正在生成{configTypeLabels[selectedConfigType]}...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            生成{configTypeLabels[selectedConfigType]}
                          </>
                        )}
                      </Button>

                      {/* 流式输出 */}
                      {streamingContent && (
                        <Card>
                          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm">
                              {generating ? '生成中...' : '生成结果'}
                            </CardTitle>
                            {!generating && (
                              <Button variant="ghost" size="sm" onClick={() => copyContent(streamingContent)}>
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            )}
                          </CardHeader>
                          <CardContent>
                            <pre className="p-3 bg-muted rounded-lg overflow-auto max-h-[400px] text-xs font-mono whitespace-pre-wrap">
                              {streamingContent}
                            </pre>
                          </CardContent>
                        </Card>
                      )}

                      {/* 已有配置列表 */}
                      {getConfigsForIdea(selectedIdea.id).length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">已生成的配置</h4>
                          {getConfigsForIdea(selectedIdea.id).map(config => (
                            <Card key={config.id}>
                              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Badge variant="secondary">{configTypeLabels[config.configType as ConfigType]}</Badge>
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => copyContent(config.content)}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </CardHeader>
                              <CardContent>
                                <pre className="p-3 bg-muted rounded-lg overflow-auto max-h-[200px] text-xs font-mono whitespace-pre-wrap">
                                  {(() => {
                                    try { return JSON.stringify(JSON.parse(config.content), null, 2); } 
                                    catch { return config.content; }
                                  })()}
                                </pre>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Wrench className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <h3 className="font-medium mb-1">选择一个创意</h3>
                        <p className="text-sm text-muted-foreground">
                          从左侧选择一个已选创意，然后为其生成详细配置
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* 编辑方案 Dialog */}
      {editing && editForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>编辑方案</CardTitle>
              <CardDescription>修改方案配置信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>游戏名称</Label>
                <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>游戏题材</Label>
                <div className="grid grid-cols-3 gap-2">
                  {genreOptions.map(g => (
                    <Card
                      key={g.value}
                      className={`cursor-pointer p-2 text-center transition-all ${editForm.genre === g.value ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => setEditForm({ ...editForm, genre: g.value })}
                    >
                      <div className="text-xs font-medium">{g.label}</div>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>故事背景</Label>
                <Textarea value={editForm.story} onChange={e => setEditForm({ ...editForm, story: e.target.value })} className="min-h-[80px]" />
              </div>
              <div className="space-y-2">
                <Label>核心主题</Label>
                <Input value={editForm.theme} onChange={e => setEditForm({ ...editForm, theme: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>职业模式</Label>
                <div className="grid grid-cols-2 gap-2">
                  {classOptions.map(c => (
                    <Card
                      key={c.value}
                      className={`cursor-pointer p-3 text-center transition-all ${editForm.classType === c.value ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => setEditForm({ ...editForm, classType: c.value })}
                    >
                      <div className="text-sm font-medium">{c.label}</div>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>玩法系统</Label>
                <div className="flex flex-wrap gap-2">
                  {featureOptions.map(f => (
                    <Badge
                      key={f.value}
                      variant={editForm.features.includes(f.value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setEditForm({
                        ...editForm,
                        features: editForm.features.includes(f.value)
                          ? editForm.features.filter(ff => ff !== f.value)
                          : [...editForm.features, f.value]
                      })}
                    >
                      {f.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>自定义玩法</Label>
                <Textarea
                  value={editForm.customFeatures || ''}
                  onChange={e => setEditForm({ ...editForm, customFeatures: e.target.value })}
                  className="min-h-[60px]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={handleSaveProject}>保存</Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>取消</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
