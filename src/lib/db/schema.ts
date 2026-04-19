import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 方案表
export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),                   // 游戏名称
  genre: text('genre').notNull().default('玄幻修真'), // 题材类型
  story: text('story').notNull().default(''),      // 故事背景
  theme: text('theme').notNull().default(''),      // 核心主题
  classType: text('class_type').notNull().default('tripartite'), // single | tripartite
  features: text('features').notNull().default('[]'),  // JSON数组，玩法特性
  customFeatures: text('custom_features').default(''),  // 自定义玩法
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now()),
});

// 创意表 - AI推荐的玩法创意
export const creativeIdeas = sqliteTable('creative_ideas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),                  // 创意标题
  description: text('description').notNull(),       // 创意描述
  category: text('category').notNull(),             // 分类标签
  isSelected: integer('is_selected').notNull().default(0), // 0=未选 1=已选
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
});

// 生成配置表 - 基于创意生成的详细配置
export const generatedConfigs = sqliteTable('generated_configs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  ideaId: integer('idea_id').notNull().references(() => creativeIdeas.id, { onDelete: 'cascade' }),
  configType: text('config_type').notNull(),        // map|npc|equipment|props|boss|monster|quest|drop|ui|class
  content: text('content').notNull(),               // JSON字符串，生成的内容
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
});
