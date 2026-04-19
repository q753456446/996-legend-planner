// 游戏策划生成器类型定义

export type GameGenre = 
  | '玄幻修真' 
  | '西方魔幻' 
  | '武侠江湖' 
  | '科幻未来' 
  | '暗黑哥特';

export type ClassType = 'single' | 'tripartite';

export type GameFeature = 
  | 'classic_battle'
  | 'gold_farming'
  | 'siege_war'
  | 'free_trade'
  | 'boss_battle'
  | 'pvp_arena'
  | 'guild_system'
  | 'mount_system'
  | 'pet_system';

export type ConfigType = 
  | 'map'
  | 'npc'
  | 'equipment'
  | 'props'
  | 'boss'
  | 'monster'
  | 'quest'
  | 'drop'
  | 'ui'
  | 'class';

// ========== 方案（Project） ==========

export interface Project {
  id: number;
  name: string;
  genre: string;
  story: string;
  theme: string;
  classType: string;
  features: string;          // JSON字符串，前端解析
  customFeatures: string | null;
  createdAt: number;
  updatedAt: number;
}

// 前端展示用的解析后方案
export interface ProjectView {
  id: number;
  name: string;
  genre: GameGenre;
  story: string;
  theme: string;
  classType: ClassType;
  features: GameFeature[];
  customFeatures: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateProjectInput {
  name: string;
  genre: GameGenre;
  story: string;
  theme: string;
  classType: ClassType;
  features: GameFeature[];
  customFeatures?: string;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

// ========== 创意（CreativeIdea） ==========

export interface CreativeIdea {
  id: number;
  projectId: number;
  title: string;
  description: string;
  category: string;       // 创意分类标签
  isSelected: boolean;
  createdAt: number;
}

// ========== 生成配置（GeneratedConfig） ==========

export interface GeneratedConfig {
  id: number;
  projectId: number;
  ideaId: number;
  configType: ConfigType;
  content: string;         // JSON字符串
  createdAt: number;
}

// ========== API 类型 ==========

// 方案 CRUD
export interface ProjectListResponse {
  success: boolean;
  data?: ProjectView[];
  error?: string;
}

export interface ProjectResponse {
  success: boolean;
  data?: ProjectView;
  error?: string;
}

// 创意推荐
export interface RecommendIdeasRequest {
  projectId: number;
  count?: number;       // 推荐数量，默认3
  keywords?: string;
}

export interface CreativeIdeasResponse {
  success: boolean;
  data?: CreativeIdea[];
  error?: string;
}

// 详细配置生成
export interface GenerateConfigRequest {
  projectId: number;
  ideaId: number;
  configType: ConfigType;
}

// ========== UI 显示类型 ==========

export const configTypeLabels: Record<ConfigType, string> = {
  class: '职业配置',
  map: '地图设计',
  npc: 'NPC设计',
  equipment: '装备配置',
  props: '道具设计',
  boss: 'BOSS设计',
  monster: '怪物设计',
  quest: '任务设计',
  drop: '掉落配置',
  ui: '玩法UI',
};

export const configTypeIcons: Record<ConfigType, string> = {
  class: 'Swords',
  map: 'Map',
  npc: 'UserCircle',
  equipment: 'Sword',
  props: 'FlaskConical',
  boss: 'Skull',
  monster: 'Bug',
  quest: 'ScrollText',
  drop: 'Package',
  ui: 'LayoutGrid',
};

export const genreOptions = [
  { value: '玄幻修真' as GameGenre, label: '玄幻修真', desc: '仙侠飞升、问道长生' },
  { value: '西方魔幻' as GameGenre, label: '西方魔幻', desc: '魔法战争、龙与地下城' },
  { value: '武侠江湖' as GameGenre, label: '武侠江湖', desc: '刀光剑影、快意恩仇' },
  { value: '科幻未来' as GameGenre, label: '科幻未来', desc: '星际战争、机械文明' },
  { value: '暗黑哥特' as GameGenre, label: '暗黑哥特', desc: '黑暗美学、恐怖悬疑' }
];

export const classOptions = [
  { value: 'single' as ClassType, label: '单职业', desc: '战士一刀999，简化职业选择' },
  { value: 'tripartite' as ClassType, label: '三职业', desc: '战士/法师/道士，经典战法道' }
];

export const featureOptions: Array<{ value: GameFeature; label: string; desc: string }> = [
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
