// SPDX-License-Identifier: AGPL-3.0-only
import { pinyin } from 'pinyin-pro'
import { Philosopher } from './types/western-philosophy'
import { KnowledgeEntity } from './types/knowledge-graph'

/**
 * 拼音搜索工具 - 支持全拼、首字母、模糊匹配
 *
 * 性能说明：
 * - 拼音转换结果按文本内容缓存（相同学派名等重复文本只转换一次）
 * - 实体搜索索引按对象引用缓存（WeakMap），每个实体只构建一次，
 *   之后所有查询均为查表，不再随输入框击键重复转换拼音
 * - 数据加载完成后可调用 prebuildSearchIndexes / prebuildEntityIndexes
 *   预热索引，把首次查询的开销也移到加载阶段
 *
 * 注意：这个文件保留了西方哲学特定的搜索函数以保持向后兼容。
 * 对于新的知识图谱，请使用通用搜索函数 searchEntities。
 */

// 单个字段的搜索索引（原文、全拼、首字母）
export interface StringIndex {
  original: string
  fullPinyin: string
  firstLetters: string
}

// 拼音转换结果缓存：同一文本全局只转换一次
const textIndexCache = new Map<string, StringIndex>()
const TEXT_INDEX_CACHE_LIMIT = 5000

// 为文本生成搜索索引（包含原文、全拼、首字母）
export function generateSearchIndex(text: string): StringIndex {
  const key = text.toLowerCase().trim()
  const cached = textIndexCache.get(key)
  if (cached) return cached

  let index: StringIndex
  try {
    // 全拼（不带音调）
    const fullPinyin = pinyin(text, {
      toneType: 'none',
      type: 'array'
    }).join('').toLowerCase()

    // 首字母
    const firstLetters = pinyin(text, {
      pattern: 'first',
      toneType: 'none'
    }).toLowerCase().replace(/\s/g, '')

    index = { original: key, fullPinyin, firstLetters }
  } catch (error) {
    console.warn('拼音转换失败:', text, error)
    index = { original: key, fullPinyin: key, firstLetters: key }
  }

  if (textIndexCache.size < TEXT_INDEX_CACHE_LIMIT) {
    textIndexCache.set(key, index)
  }
  return index
}

// 检查查询是否匹配索引
export function matchesSearchIndex(
  query: string,
  index: StringIndex
): boolean {
  const q = query.toLowerCase().trim()

  return (
    index.original.includes(q) ||
    index.fullPinyin.includes(q) ||
    index.firstLetters.includes(q)
  )
}

// 计算匹配分数
export function calculateMatchScore(
  query: string,
  index: StringIndex
): number {
  const q = query.toLowerCase().trim()

  // 完全匹配（最高分）
  if (index.original === q) return 100

  // 前缀匹配
  if (index.original.startsWith(q)) return 90

  // 包含匹配（越靠前分数越高）
  const containsIndex = index.original.indexOf(q)
  if (containsIndex !== -1) {
    return 80 - containsIndex * 0.5
  }

  // 全拼匹配
  if (index.fullPinyin === q) return 70
  if (index.fullPinyin.startsWith(q)) return 60
  if (index.fullPinyin.includes(q)) return 50

  // 首字母匹配
  if (index.firstLetters === q) return 40
  if (index.firstLetters.startsWith(q)) return 30
  if (index.firstLetters.includes(q)) return 20

  return 0
}

// ============================================
// 哲学家搜索（索引按对象引用缓存）
// ============================================

export interface PhilosopherSearchIndex {
  philosopher: Philosopher
  zhNameIndex: StringIndex
  enNameIndex: StringIndex
  schoolIndex: StringIndex
  ideasIndex: StringIndex[]
}

const philosopherIndexCache = new WeakMap<Philosopher, PhilosopherSearchIndex>()

// 为哲学家生成完整的搜索索引（带缓存，同一对象只构建一次）
export function buildPhilosopherIndex(philosopher: Philosopher): PhilosopherSearchIndex {
  const cached = philosopherIndexCache.get(philosopher)
  if (cached) return cached

  const index: PhilosopherSearchIndex = {
    philosopher,
    zhNameIndex: generateSearchIndex(philosopher.name.zh),
    enNameIndex: generateSearchIndex(philosopher.name.en),
    schoolIndex: generateSearchIndex(philosopher.school),
    ideasIndex: philosopher.mainIdeas.map(idea => generateSearchIndex(idea))
  }

  philosopherIndexCache.set(philosopher, index)
  return index
}

// 数据加载完成后调用，预热全部哲学家索引（可选优化）
export function prebuildSearchIndexes(philosophers: Philosopher[]): void {
  for (const p of philosophers) buildPhilosopherIndex(p)
}

// 带权重的搜索字段：命中时在基础分上加 bonus（可为负）
interface WeightedField {
  index: StringIndex
  bonus: number
}

// 汇总各字段匹配分：取所有命中字段中的最高分
function collectMatchScore(query: string, fields: WeightedField[]): number {
  let maxScore = 0
  for (const { index, bonus } of fields) {
    const score = calculateMatchScore(query, index)
    if (score > 0) {
      maxScore = Math.max(maxScore, score + bonus)
    }
  }
  return maxScore
}

// 搜索哲学家（支持拼音）并按匹配度排序
export function searchPhilosophers(
  philosophers: Philosopher[],
  query: string
): Philosopher[] {
  if (!query.trim()) {
    return philosophers
  }

  return philosophers
    .map(buildPhilosopherIndex)
    .map(index => ({
      philosopher: index.philosopher,
      score: collectMatchScore(query.toLowerCase().trim(), [
        { index: index.schoolIndex, bonus: 20 },   // 学派匹配（最高优先级）
        { index: index.zhNameIndex, bonus: 10 },   // 中文名匹配
        { index: index.enNameIndex, bonus: 0 },    // 英文名匹配
        ...index.ideasIndex.map(i => ({ index: i, bonus: -10 })) // 主要思想匹配降分
      ])
    }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(result => result.philosopher)
}

// ============================================
// 通用知识实体搜索（与哲学家搜索共用打分逻辑）
// ============================================

export interface EntitySearchIndex {
  entity: KnowledgeEntity
  zhNameIndex: StringIndex
  enNameIndex: StringIndex
  categoryIndex: StringIndex
  ideasIndex: StringIndex[]
}

const entityIndexCache = new WeakMap<KnowledgeEntity, EntitySearchIndex>()

// 为通用知识实体生成搜索索引（带缓存）
export function buildEntityIndex(entity: KnowledgeEntity): EntitySearchIndex {
  const cached = entityIndexCache.get(entity)
  if (cached) return cached

  const index: EntitySearchIndex = {
    entity,
    zhNameIndex: generateSearchIndex(entity.name.zh),
    enNameIndex: generateSearchIndex(entity.name.en),
    categoryIndex: generateSearchIndex(entity.category),
    ideasIndex: entity.mainIdeas.map(idea => generateSearchIndex(idea))
  }

  entityIndexCache.set(entity, index)
  return index
}

// 数据加载完成后调用，预热全部实体索引（可选优化）
export function prebuildEntityIndexes(entities: KnowledgeEntity[]): void {
  for (const e of entities) buildEntityIndex(e)
}

// 搜索通用知识实体（支持拼音）并按匹配度排序
export function searchEntities(
  entities: KnowledgeEntity[],
  query: string
): KnowledgeEntity[] {
  if (!query.trim()) {
    return entities
  }

  return entities
    .map(buildEntityIndex)
    .map(index => ({
      entity: index.entity,
      score: collectMatchScore(query.toLowerCase().trim(), [
        { index: index.categoryIndex, bonus: 20 }, // 分类匹配（最高优先级）
        { index: index.zhNameIndex, bonus: 10 },   // 中文名匹配
        { index: index.enNameIndex, bonus: 0 },    // 英文名匹配
        ...index.ideasIndex.map(i => ({ index: i, bonus: -10 })) // 主要思想匹配降分
      ])
    }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(result => result.entity)
}

// ============================================
// 搜索历史管理
// ============================================

export function createSearchHistoryManager(storageKey: string, maxItems: number = 10) {
  return {
    getHistory(): string[] {
      if (typeof window === 'undefined') return []

      try {
        const history = localStorage.getItem(storageKey)
        return history ? JSON.parse(history) : []
      } catch (error) {
        console.warn('读取搜索历史失败:', error)
        return []
      }
    },

    addToHistory(query: string): void {
      if (typeof window === 'undefined') return
      if (!query.trim()) return

      try {
        const history = this.getHistory()
        const filtered = history.filter(item => item !== query)
        const newHistory = [query, ...filtered].slice(0, maxItems)
        localStorage.setItem(storageKey, JSON.stringify(newHistory))
      } catch (error) {
        console.warn('保存搜索历史失败:', error)
      }
    },

    clearHistory(): void {
      if (typeof window === 'undefined') return

      try {
        localStorage.removeItem(storageKey)
      } catch (error) {
        console.warn('清除搜索历史失败:', error)
      }
    }
  }
}

// 哲学家搜索历史（沿用原有 storage key，行为不变）
const philosopherHistory = createSearchHistoryManager('western-philosophy-search-history')

export const getSearchHistory = philosopherHistory.getHistory
export const addToSearchHistory = philosopherHistory.addToHistory
export const clearSearchHistory = philosopherHistory.clearHistory

/**
 * 高亮匹配文本
 */
export function highlightMatch(text: string, query: string): {
  text: string
  isMatch: boolean
  matchedPart?: string
} {
  if (!query.trim()) {
    return { text, isMatch: false }
  }

  const index = generateSearchIndex(text)
  const q = query.toLowerCase().trim()

  // 检查是否匹配
  if (index.original.includes(q)) {
    return {
      text,
      isMatch: true,
      matchedPart: q
    }
  }

  if (index.fullPinyin.includes(q) || index.firstLetters.includes(q)) {
    return {
      text,
      isMatch: true,
      matchedPart: text // 拼音匹配时高亮整个文本
    }
  }

  return { text, isMatch: false }
}
