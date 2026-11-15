// SPDX-License-Identifier: AGPL-3.0-only
/**
 * 通用知识脉络图 - 数据类型定义
 * 
 * 这是一个可复用的知识图谱模块，支持：
 * - 西方哲学思想脉络图
 * - 佛学史发展脉络图
 * - 西方音乐史发展脉络
 * - 其他任何知识领域的脉络图
 */

// ============================================
// 核心实体类型
// ============================================

/**
 * 知识实体（节点）- 通用接口
 * 可以是哲学家、音乐家、佛教人物等
 */
export interface KnowledgeEntity {
  id: string;
  name: {
    zh: string;  // 中文名
    en: string;  // 英文名/原名
  };
  birthYear: number;  // 出生/起始年份（负数表示公元前）
  deathYear: number;  // 去世/结束年份
  category: string;   // 分类/流派/学派
  categoryColor: string; // 分类颜色（用于卡片样式）
  createdAt?: number;
  
  // 核心内容
  mainIdeas: string[];  // 主要思想/贡献（简短描述）
  
  // 可选扩展字段
  detailedBio?: string | string[]; // 详细生平
  inheritedFrom?: string[]; // 思想继承/师承
  majorWorks?: string[]; // 主要著作/作品
  tags?: string[];     // 标签
  laterInfluence?: string | string[]; // 后世影响
  imageUrl?: string;   // 头像/图片URL
  
  // 自定义扩展数据（不同领域可以添加特定字段）
  metadata?: Record<string, any>;
}

/**
 * 关系类型枚举
 */
export type RelationType = 'direct' | 'indirect' | 'opposition';

/**
 * 影响关系（边）- 通用接口
 */
export interface KnowledgeRelation {
  id: string;
  from: string;  // 影响者的实体 id
  to: string;    // 被影响者的实体 id
  type: RelationType; // 关系类型
  description?: string; // 关系描述
  rawType?: string; // 原始数据库关系类型
}

/**
 * 分类/流派 - 通用接口
 */
export interface KnowledgeCategory {
  id: string;
  name: string;
  color: string;  // 主题色
  period?: string; // 活跃时期
  description?: string;
  keywords?: string[]; // 关键概念
  vertical?: number;  // 纵向级别（控制垂直位置）
  horizontal?: number; // 横向位置
}

/**
 * 关系类型配置
 */
export interface RelationTypeConfig {
  value: string;      // 数据库值
  label_zh: string;   // 中文标签
  label_en?: string;  // 英文标签
  color: string;      // 连线颜色
  description?: string;
}

// ============================================
// 时间段定义
// ============================================

/**
 * 时间段（用于时间轴筛选）
 */
export interface TimePeriod {
  id: string;
  label: string;
  start_year: number;
  end_year: number;
  count?: number; // 该时期的实体数量
}

// ============================================
// React Flow 相关类型
// ============================================

/**
 * React Flow 节点数据类型
 */
export interface KnowledgeNodeData {
  entity: KnowledgeEntity;
  onClick?: (entity: KnowledgeEntity) => void;
  isHighlighted?: boolean;
  isConnected?: boolean;
  isAncestor?: boolean;
  isDescendant?: boolean;
  isDimmed?: boolean;
  isSameLevel?: boolean;
}

/**
 * React Flow 边数据类型
 */
export interface KnowledgeEdgeData {
  relation: KnowledgeRelation;
  edgeOffset?: number;
  edgeIndex?: number;
  totalEdges?: number;
  verticalOffset?: number;
}

// ============================================
// 布局相关类型
// ============================================

/**
 * 布局位置
 */
export interface LayoutPosition {
  x: number;
  y: number;
}

/**
 * 布局边界
 */
export interface LayoutBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * 布局结果
 */
export interface LayoutResult {
  positions: Map<string, LayoutPosition>;
  bounds: LayoutBounds;
}

/**
 * 布局模式
 */
export type LayoutMode = 'database' | 'category' | 'century' | 'lineage';

// ============================================
// 配置类型
// ============================================

/**
 * 知识图谱配置
 */
export interface KnowledgeGraphConfig {
  // 基本信息
  id: string;           // 图谱唯一标识，如 'western-philosophy'
  title: string;        // 标题，如 '西方哲学思想脉络图'
  subtitle?: string;    // 副标题
  
  // 数据源配置
  apiEndpoints: {
    entities: string;      // 实体API，如 '/api/philosophy/philosophers'
    relations: string;     // 关系API，如 '/api/philosophy/influences'
    categories: string;    // 分类API，如 '/api/philosophy/schools'
    relationTypes: string; // 关系类型API
    hotSearches?: string;  // 热门搜索API
  };
  
  // 实时更新配置
  realtime?: {
    enabled: boolean;
    channel: string;      // Supabase channel 名称
    table: string;        // 监听的表名
  };
  
  // UI 配置
  ui: {
    primaryColor: string;     // 主色调
    secondaryColor: string;   // 次要色调
    cardWidth: number;        // 卡片宽度
    cardHeight: number;       // 卡片高度
    horizontalGap: number;    // 水平间距
    verticalGap: number;      // 垂直间距
  };
  
  // 搜索配置
  search: {
    placeholder: string;      // 搜索框占位符
    historyKey: string;       // localStorage 存储键
    maxHistoryItems: number;  // 最大历史记录数
  };
  
  // 布局配置
  layout: {
    defaultMode: LayoutMode;
    availableModes: LayoutMode[];
    rootCategory?: string;    // 根分类（用于 lineage 布局）
  };
  
  // 反馈配置
  feedback?: {
    enabled: boolean;
    resourceId: string;
  };
  
  // 字段映射（用于数据转换）
  fieldMapping: {
    // 实体字段映射
    entity: {
      id: string;
      nameZh: string | string[];  // 支持多个字段名，按优先级
      nameEn: string | string[];
      birthYear: string | string[];
      deathYear: string | string[];
      category: string | string[];
      mainIdeas: string | string[];
      detailedBio?: string | string[];
      inheritedFrom?: string | string[];
      majorWorks?: string | string[];
      tags?: string | string[];
      laterInfluence?: string | string[];
    };
    // 关系字段映射
    relation: {
      id: string;
      from: string;
      to: string;
      type: string;
      description?: string;
    };
    // 分类字段映射
    category: {
      id: string;
      name: string;
      color: string;
      vertical?: string;
      horizontal?: string;
    };
  };
  
  // 关系类型映射
  relationTypeMapping: {
    [dbType: string]: RelationType;
  };
}

// ============================================
// 搜索相关类型
// ============================================

/**
 * 搜索索引
 */
export interface SearchIndex {
  original: string;
  fullPinyin: string;
  firstLetters: string;
}

/**
 * 实体搜索索引
 */
export interface EntitySearchIndex {
  entity: KnowledgeEntity;
  zhNameIndex: SearchIndex;
  enNameIndex: SearchIndex;
  categoryIndex: SearchIndex;
  ideasIndex: SearchIndex[];
}

// ============================================
// 数据库模板类型
// ============================================

/**
 * 数据库表结构模板
 */
export interface DatabaseSchema {
  // 实体表
  entities: {
    tableName: string;
    columns: {
      id: 'string';
      name: 'string';
      name_zh?: 'string';
      name_en?: 'string';
      period?: 'string';
      birth_year?: 'number';
      death_year?: 'number';
      category: 'string';
      description?: 'string[]';
      main_ideas?: 'string[]';
      inherited_from?: 'string[]';
      works?: 'string[]';
      tags?: 'string[]';
      later_influence?: 'string[]';
      created_at: 'timestamp';
      updated_at: 'timestamp';
    };
  };
  
  // 分类表
  categories: {
    tableName: string;
    columns: {
      id: 'string';
      name: 'string';
      color: 'string';
      description?: 'string';
      vertical?: 'number';
      horizontal?: 'number';
      created_at: 'timestamp';
      updated_at: 'timestamp';
    };
  };
  
  // 关系表
  relations: {
    tableName: string;
    columns: {
      id: 'number';
      from_entity_id: 'string';
      to_entity_id: 'string';
      relation_type: 'string';
      description?: 'string';
      created_at: 'timestamp';
      updated_at: 'timestamp';
    };
  };
  
  // 关系类型表
  relationTypes: {
    tableName: string;
    columns: {
      id: 'number';
      value: 'string';
      label_zh: 'string';
      label_en?: 'string';
      color: 'string';
      description?: 'string';
    };
  };
}

// ============================================
// 导出西方哲学特定类型（向后兼容）
// ============================================

// 为了向后兼容，保留原有的类型别名
export type Philosopher = KnowledgeEntity;
export type Influence = KnowledgeRelation;
export type School = KnowledgeCategory;
export type PhilosopherNodeData = KnowledgeNodeData;
export type InfluenceEdgeData = KnowledgeEdgeData;
