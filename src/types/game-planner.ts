// 游戏策划生成器类型定义

export type GameGenre = 
  | '玄幻修真' 
  | '西方魔幻' 
  | '武侠江湖' 
  | '科幻未来' 
  | '暗黑哥特';

export type ClassType = 'single' | 'tripartite';

export type GameFeature = 
  | 'classic_battle'      // 经典战法道
  | 'gold_farming'       // 打金系统
  | 'siege_war'          // 攻沙战
  | 'free_trade'         // 自由交易
  | 'boss_battle'        // BOSS战
  | 'pvp_arena'          // PVP竞技
  | 'guild_system'       // 行会系统
  | 'mount_system'       // 坐骑系统'
  | 'pet_system';        // 宠物系统

export type GeneratorType = 
  | 'map'
  | 'npc'
  | 'equipment'
  | 'props'
  | 'boss'
  | 'drop'
  | 'ui';

// 游戏背景配置
export interface GameBackground {
  name: string;
  genre: GameGenre;
  story: string;
  theme: string;
}

// 职业配置
export interface ClassConfig {
  type: ClassType;
  customClasses?: string[];
}

// 玩法配置
export interface GameFeatures {
  features: GameFeature[];
  customFeatures?: string;
}

// 完整游戏配置
export interface GameConfig {
  background: GameBackground;
  classConfig: ClassConfig;
  features: GameFeatures;
}

// 地图配置
export interface MapConfig {
  name: string;
  level: string;
  monsters: string[];
  boss: string;
  specialMechanic: string;
  rewards: string[];
}

// NPC配置
export interface NPCConfig {
  name: string;
  role: string;
  location: string;
  dialogue: string;
  quest: string;
}

// 装备配置
export interface EquipmentConfig {
  name: string;
  type: string;
  level: string;
  attributes: Record<string, number>;
  specialEffect: string;
}

// 道具配置
export interface PropsConfig {
  name: string;
  type: string;
  rarity: string;
  usage: string;
  description: string;
}

// BOSS配置
export interface BossConfig {
  name: string;
  level: string;
  location: string;
  abilities: string[];
  weakness: string;
  rewards: string[];
}

// 掉落配置
export interface DropConfig {
  monster: string;
  items: Array<{
    name: string;
    rate: string;
    quantity: string;
  }>;
}

// 玩法UI配置
export interface UIFeatureConfig {
  name: string;
  type: string;
  description: string;
  interactions: string[];
}

// 创意玩法结果
export interface CreativeResult {
  type: GeneratorType;
  content: MapConfig | NPCConfig | EquipmentConfig | PropsConfig | BossConfig | DropConfig | UIFeatureConfig;
}

// API请求类型
export interface GenerateRequest {
  gameConfig: GameConfig;
  generatorType: GeneratorType;
  keywords?: string;
}

// API响应类型
export interface GenerateResponse {
  success: boolean;
  data?: CreativeResult;
  error?: string;
}
