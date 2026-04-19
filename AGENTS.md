# 996传奇策划生成器

## 项目概述

这是一个基于AI的传奇游戏创意策划生成工具，支持无限生成游戏内容。

## 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **AI能力**: coze-coding-dev-sdk (豆包大模型)

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── api/            # API接口
│   │   │   └── generate/   # AI生成接口
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # 首页
│   ├── components/         # 业务组件
│   │   ├── game-config-panel.tsx  # 游戏配置面板
│   │   └── result-display.tsx    # 结果展示组件
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   │   └── utils.ts        # 通用工具函数 (cn)
│   ├── types/               # 类型定义
│   │   └── game-planner.ts # 游戏策划类型
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

## 核心功能

### 1. 游戏背景配置
- 游戏名称
- 题材类型（玄幻修真/西方魔幻/武侠江湖/科幻未来/暗黑哥特）
- 故事背景
- 核心主题

### 2. 职业系统配置
- 单职业模式
- 三职业模式（战士/法师/道士）

### 3. 玩法系统配置
- 经典战法道、打金系统、攻沙战、自由交易
- BOSS战、PVP竞技、行会系统、坐骑系统、宠物系统

### 4. AI创意生成器
| 类型 | 说明 |
|------|------|
| 地图设计 | 生成副本地图配置 |
| NPC设计 | 生成NPC角色设定 |
| 装备配置 | 生成装备属性数据 |
| 道具设计 | 生成特色道具 |
| BOSS设计 | 生成BOSS技能掉落 |
| 掉落配置 | 生成掉落概率表 |
| 玩法UI | 生成玩法界面设计 |

## API接口

### POST /api/generate
生成创意玩法内容

**请求体：**
```json
{
  "gameConfig": {
    "background": { "name": "", "genre": "", "story": "", "theme": "" },
    "classConfig": { "type": "single" | "tripartite" },
    "features": { "features": [], "customFeatures": "" }
  },
  "generatorType": "map" | "npc" | "equipment" | "props" | "boss" | "drop" | "ui",
  "keywords": "可选关键词"
}
```

**响应：** 流式SSE输出JSON格式的策划内容

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。

### next.config 配置规范

- 配置的路径不要写死绝对路径，必须使用 path.resolve(__dirname, ...)、import.meta.dirname 或 process.cwd() 动态拼接。

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。**必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染**；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。
2. **禁止使用 head 标签**，优先使用 metadata，详见文档：https://nextjs.org/docs/app/api-reference/functions/generate-metadata
   1. 三方 CSS、字体等资源可在 `globals.css` 中顶部通过 `@import` 引入或使用 next/font
   2. preload, preconnect, dns-prefetch 通过 ReactDOM 的 preload、preconnect、dns-prefetch 方法引入
   3. json-ld 可阅读 https://nextjs.org/docs/app/guides/json-ld

## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**
