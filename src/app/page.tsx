'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  ArrowRight, 
  Swords, 
  Sparkles,
  Calendar
} from 'lucide-react';
import type { ProjectView, GameGenre, ClassType, GameFeature, CreateProjectInput } from '@/types/game-planner';
import { genreOptions, classOptions, featureOptions } from '@/types/game-planner';

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // 新建方案表单
  const [form, setForm] = useState<CreateProjectInput>({
    name: '',
    genre: '玄幻修真',
    story: '',
    theme: '',
    classType: 'tripartite',
    features: ['classic_battle', 'boss_battle'],
    customFeatures: '',
  });

  // 加载方案列表
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (err) {
      console.error('加载方案失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // 创建方案
  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setDialogOpen(false);
        router.push(`/project/${data.data.id}`);
      }
    } catch (err) {
      console.error('创建方案失败:', err);
    } finally {
      setCreating(false);
    }
  };

  // 删除方案
  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定删除该方案？所有创意和配置将一并删除。')) return;
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('删除方案失败:', err);
    }
  };

  // 切换玩法特性
  const toggleFeature = (feature: GameFeature) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Swords className="h-7 w-7 text-orange-500" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              996传奇策划生成器
            </h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                新建方案
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新建策划方案</DialogTitle>
                <DialogDescription>
                  配置游戏背景、职业和玩法，创建一个专属的策划方案
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-4">
                {/* 游戏名称 */}
                <div className="space-y-2">
                  <Label htmlFor="name">游戏名称 *</Label>
                  <Input
                    id="name"
                    placeholder="例如：烈焰乾坤"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                {/* 题材类型 */}
                <div className="space-y-2">
                  <Label>游戏题材</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {genreOptions.map(g => (
                      <Card
                        key={g.value}
                        className={`cursor-pointer transition-all hover:border-primary text-center p-3 ${
                          form.genre === g.value ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setForm(prev => ({ ...prev, genre: g.value }))}
                      >
                        <div className="font-medium text-sm">{g.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{g.desc}</div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* 故事背景 */}
                <div className="space-y-2">
                  <Label htmlFor="story">故事背景</Label>
                  <Textarea
                    id="story"
                    placeholder="描述游戏的世界观和故事背景..."
                    className="min-h-[100px]"
                    value={form.story}
                    onChange={e => setForm(prev => ({ ...prev, story: e.target.value }))}
                  />
                </div>

                {/* 核心主题 */}
                <div className="space-y-2">
                  <Label htmlFor="theme">核心主题</Label>
                  <Input
                    id="theme"
                    placeholder="例如：热血、激情、兄弟情谊"
                    value={form.theme}
                    onChange={e => setForm(prev => ({ ...prev, theme: e.target.value }))}
                  />
                </div>

                <Separator />

                {/* 职业模式 */}
                <div className="space-y-2">
                  <Label>职业模式</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {classOptions.map(c => (
                      <Card
                        key={c.value}
                        className={`cursor-pointer transition-all hover:border-primary p-4 text-center ${
                          form.classType === c.value ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setForm(prev => ({ ...prev, classType: c.value }))}
                      >
                        <div className="font-semibold">{c.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{c.desc}</div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* 玩法系统 */}
                <div className="space-y-2">
                  <Label>玩法系统</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {featureOptions.map(f => (
                      <div
                        key={f.value}
                        className={`flex items-start space-x-2 p-2 rounded-lg border cursor-pointer transition-all hover:border-primary ${
                          form.features.includes(f.value) ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => toggleFeature(f.value)}
                      >
                        <Checkbox checked={form.features.includes(f.value)} className="mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">{f.label}</div>
                          <div className="text-xs text-muted-foreground">{f.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 自定义玩法 */}
                <div className="space-y-2">
                  <Label htmlFor="customFeatures">自定义玩法描述</Label>
                  <Textarea
                    id="customFeatures"
                    placeholder="添加更多自定义玩法描述..."
                    className="min-h-[60px]"
                    value={form.customFeatures || ''}
                    onChange={e => setForm(prev => ({ ...prev, customFeatures: e.target.value }))}
                  />
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCreate}
                  disabled={!form.name.trim() || creating}
                >
                  {creating ? '创建中...' : '创建方案'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* 内容区 */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">加载中...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
              <Sparkles className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-medium mb-2">还没有策划方案</h2>
            <p className="text-muted-foreground mb-6">
              创建一个方案，开始AI驱动的传奇游戏策划之旅
            </p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              新建方案
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
              <Card
                key={project.id}
                className="cursor-pointer transition-all hover:border-primary hover:shadow-lg group"
                onClick={() => router.push(`/project/${project.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={(e) => handleDelete(project.id, e)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <CardDescription className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{project.genre}</Badge>
                    <Badge variant="secondary">
                      {project.classType === 'single' ? '单职业' : '三职业'}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {project.story || '暂无背景描述'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(project.createdAt)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-primary font-medium">
                      进入方案 <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
