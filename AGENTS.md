# 996传奇策划生成器

## 项目概述

基于AI的传奇游戏创意策划工具，采用项目制方案管理。用户创建方案后，AI根据方案背景推荐创意玩法，选中创意后进一步生成详细配置。

## 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **AI能力**: coze-coding-dev-sdk (豆包大模型)
- **数据库**: SQLite + Drizzle ORM (本地存储)
- **包管理**: pnpm

## 目录结构

```
├── data/                        # SQLite数据库文件
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── projects/        # 方案CRUD
│   │   │   │   └── [id]/        # 方案详情/更新/删除
│   │   │   ├── ideas/           # 创意管理
│   │   │   │   ├── [id]/        # 创意更新/删除
│   │   │   │   └── recommend/   # AI创意推荐
│   │   │   ├── configs/         # 生成配置查询
│   │   │   └── generate-config/ # AI详细配置生成（流式）
│   │   ├── project/[id]/        # 方案详情页
│   │   ├── layout.tsx
│   │   └── page.tsx             # 首页（方案列表）
│   ├── components/ui/           # shadcn/ui组件
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts        # Drizzle表定义
│   │   │   ├── index.ts         # 数据库连接
│   │   │   ├── migrate.ts       # 建表迁移
│   │   │   └── init.ts          # 初始化入口
│   │   └── utils.ts
│   └── types/
│       └── game-planner.ts      # 全局类型定义
```

## 核心流程

```
1. 创建方案 → 配置名称/题材/背景/职业/玩法
2. AI推荐创意 → 用户选择感兴趣的创意（可无限推荐）
3. 选中创意 → 为创意生成详细配置（职业/地图/NPC/装备/道具/BOSS/怪物/任务/掉落/UI）
```

## 数据库表

| 表 | 说明 |
|----|------|
| projects | 方案（名称、题材、背景、职业、玩法） |
| creative_ideas | 创意（关联方案，含标题、描述、分类、选择状态） |
| generated_configs | 生成配置（关联方案+创意，含类型和JSON内容） |

## API接口

### 方案 CRUD
- `GET /api/projects` - 列表
- `POST /api/projects` - 创建
- `GET /api/projects/[id]` - 详情
- `PUT /api/projects/[id]` - 更新
- `DELETE /api/projects/[id]` - 删除

### 创意管理
- `GET /api/ideas?projectId=1` - 获取方案下的创意
- `POST /api/ideas` - 批量保存创意
- `PUT /api/ideas/[id]` - 更新（选择/取消）
- `DELETE /api/ideas/[id]` - 删除
- `POST /api/ideas/recommend` - AI推荐创意

### 配置生成
- `GET /api/configs?projectId=1&ideaId=2` - 查询已生成配置
- `POST /api/generate-config` - AI生成详细配置（流式SSE）

## 编码规范

- 严格TypeScript，禁止隐式any
- pnpm管理依赖，严禁npm/yarn
- next.config路径用path.resolve动态拼接
- 前端动态数据用useEffect+useState防hydration问题
