// SPDX-License-Identifier: AGPL-3.0-only
/**
 * 西方哲学脉络图 - 数据类型定义
 * 
 * 注意：这些类型是为西方哲学特定的，但基于通用的 KnowledgeGraph 类型。
 * 如果你正在创建新的知识图谱，请使用 @/lib/types/knowledge-graph 中的通用类型。
 */

import { 
  KnowledgeEntity, 
  KnowledgeRelation, 
  KnowledgeCategory,
  KnowledgeNodeData,
  KnowledgeEdgeData,
  TimePeriod as GenericTimePeriod
} from './knowledge-graph'

// ============================================
// 西方哲学特定类型（向后兼容）
// ============================================

/**
 * 哲学家信息
 * 扩展自通用 KnowledgeEntity，添加西方哲学特定字段
 */
export interface Philosopher {
  id: string;
  name: {
    zh: string;  // 中文名
    en: string;  // 英文名
  };
  birthYear: number;  // 出生年份（负数表示公元前）
  deathYear: number;  // 去世年份
  school: string;     // 所属流派
  schoolColor: string; // 流派颜色（用于卡片样式）
  nationality?: string; // 国籍/地区
  createdAt?: number;
  mainIdeas: string[];  // 主要思想（简短描述）
  detailedBio?: string | string[]; // 详细生平（可选，支持字符串或数组）
  inheritedThoughts?: string[]; // 思想继承（可选）
  majorWorks?: string[]; // 主要著作（可选）
  quotes?: string[];     // 人物标签（可选）
  laterInfluence?: string | string[]; // 后世影响（可选，支持字符串或数组，原 legacyImpact）
  legacyImpact?: string | string[]; // 保留向后兼容（已弃用，请使用 laterInfluence）
  imageUrl?: string;     // 头像图片URL（可选）
  positionOverride?: {   // 可选的位置覆盖，用于精细控制个别哲学家的位置
    vertical?: number;   // 纵向位置（行号）
    horizontal?: number; // 横向位置（列号）
  } | null;
}

/**
 * 影响关系
 */
export interface Influence {
  id: string;
  from: string;  // 影响者的 philosopher id
  to: string;    // 被影响者的 philosopher id
  type: 'direct' | 'indirect' | 'opposition'; // 关系类型
  description?: string; // 关系描述
  rawType?: string; // 原始数据库 influence_type （如 teacher-student, inspiration 等）
}

/**
 * 哲学流派
 */
export interface School {
  id: string;
  name: string;
  color: string;  // 主题色
  period?: string; // 活跃时期
  description?: string;
  keywords?: string[]; // 关键概念
  vertical?: number;  // 纵向级别（从0开始），控制流派的垂直位置
  horizontal?: number; // 横向位置（从0开始），控制流派在同一级别中的横向位置
}

/**
 * React Flow 节点数据类型
 */
export interface PhilosopherNodeData {
  philosopher: Philosopher;
  onClick?: (philosopher: Philosopher) => void;
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
export interface InfluenceEdgeData {
  influence: Influence;
  edgeOffset?: number;
  edgeIndex?: number;
  totalEdges?: number;
  verticalOffset?: number;
}

/**
 * 时间段定义（用于时间轴）
 */
export interface TimePeriod {
  id: string;
  label: string;
  start_year: number;
  end_year: number;
  count?: number;
  // 向后兼容
  startYear?: number;
  endYear?: number;
  yPosition?: number;
}

// ============================================
// 类型转换工具（用于与通用类型互操作）
// ============================================

/**
 * 将 Philosopher 转换为 KnowledgeEntity
 */
export function philosopherToEntity(p: Philosopher): KnowledgeEntity {
  return {
    id: p.id,
    name: p.name,
    birthYear: p.birthYear,
    deathYear: p.deathYear,
    category: p.school,
    categoryColor: p.schoolColor,
    createdAt: p.createdAt,
    mainIdeas: p.mainIdeas,
    detailedBio: p.detailedBio,
    inheritedFrom: p.inheritedThoughts,
    majorWorks: p.majorWorks,
    tags: p.quotes,
    laterInfluence: p.laterInfluence,
    imageUrl: p.imageUrl
  }
}

/**
 * 将 KnowledgeEntity 转换为 Philosopher
 */
export function entityToPhilosopher(e: KnowledgeEntity): Philosopher {
  return {
    id: e.id,
    name: e.name,
    birthYear: e.birthYear,
    deathYear: e.deathYear,
    school: e.category,
    schoolColor: e.categoryColor,
    createdAt: e.createdAt,
    mainIdeas: e.mainIdeas,
    detailedBio: e.detailedBio,
    inheritedThoughts: e.inheritedFrom,
    majorWorks: e.majorWorks,
    quotes: e.tags,
    laterInfluence: e.laterInfluence,
    imageUrl: e.imageUrl
  }
}

/**
 * 将 Influence 转换为 KnowledgeRelation
 */
export function influenceToRelation(i: Influence): KnowledgeRelation {
  return {
    id: i.id,
    from: i.from,
    to: i.to,
    type: i.type,
    description: i.description,
    rawType: i.rawType
  }
}

/**
 * 将 School 转换为 KnowledgeCategory
 */
export function schoolToCategory(s: School): KnowledgeCategory {
  return {
    id: s.id,
    name: s.name,
    color: s.color,
    period: s.period,
    description: s.description,
    keywords: s.keywords,
    vertical: s.vertical,
    horizontal: s.horizontal
  }
}
