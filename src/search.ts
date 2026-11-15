// SPDX-License-Identifier: AGPL-3.0-only
import { pinyin } from 'pinyin-pro'
import { Philosopher } from './types/western-philosophy'
import { KnowledgeEntity } from './types/knowledge-graph'

/**
 * 拼音搜索工具 - 支持全拼、首字母、模糊匹配
 * 
 * 注意：这个文件保留了西方哲学特定的搜索函数以保持向后兼容。
 * 对于新的知识图谱，请使用 @/lib/knowledge-graph/utils/search 中的通用搜索函数。
 */

// 为文本生成搜索索引（包含原文、全拼、首字母）
export function generateSearchIndex(text: string): {
  original: string
  fullPinyin: string
  firstLetters: string
} {
  const original = text.toLowerCase().trim()
  
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
    
    return { original, fullPinyin, firstLetters }
  } catch (error) {
    console.warn('拼音转换失败:', text, error)
    return { original, fullPinyin: original, firstLetters: original }
  }
}

// 检查查询是否匹配索引
export function matchesSearchIndex(
  query: string, 
  index: { original: string; fullPinyin: string; firstLetters: string }
): boolean {
  const q = query.toLowerCase().trim()
  
  return (
    index.original.includes(q) ||
    index.fullPinyin.includes(q) ||
    index.firstLetters.includes(q)
  )
}

// 为哲学家生成完整的搜索索引
export interface PhilosopherSearchIndex {
  philosopher: Philosopher
  zhNameIndex: ReturnType<typeof generateSearchIndex>
  enNameIndex: ReturnType<typeof generateSearchIndex>
  schoolIndex: ReturnType<typeof generateSearchIndex>
  ideasIndex: ReturnType<typeof generateSearchIndex>[]
}

export function buildPhilosopherIndex(philosopher: Philosopher): PhilosopherSearchIndex {
  return {
    philosopher,
    zhNameIndex: generateSearchIndex(philosopher.name.zh),
    enNameIndex: generateSearchIndex(philosopher.name.en),
    schoolIndex: generateSearchIndex(philosopher.school),
    ideasIndex: philosopher.mainIdeas.map(idea => generateSearchIndex(idea))
  }
}

// 计算匹配分数的辅助函数（导出供其他组件使用）
export function calculateMatchScore(
  query: string,
  index: { original: string; fullPinyin: string; firstLetters: string }
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

// 搜索哲学家（支持拼音）并按匹配度排序
export function searchPhilosophers(
  philosophers: Philosopher[],
  query: string
): Philosopher[] {
  if (!query.trim()) {
    return philosophers
  }

  const indexes = philosophers.map(p => buildPhilosopherIndex(p))
  
  // 计算每个哲学家的匹配分数
  const results = indexes
    .map(index => {
      let maxScore = 0
      
      // 检查学派匹配（最高优先级）
      const schoolScore = calculateMatchScore(query, index.schoolIndex)
      if (schoolScore > 0) {
        maxScore = Math.max(maxScore, schoolScore + 20) // 学派匹配额外加20分
      }
      
      // 检查中文名匹配
      const zhNameScore = calculateMatchScore(query, index.zhNameIndex)
      if (zhNameScore > 0) {
        maxScore = Math.max(maxScore, zhNameScore + 10) // 中文名匹配额外加10分
      }
      
      // 检查英文名匹配
      const enNameScore = calculateMatchScore(query, index.enNameIndex)
      if (enNameScore > 0) {
        maxScore = Math.max(maxScore, enNameScore)
      }
      
      // 检查主要思想匹配
      for (const ideaIndex of index.ideasIndex) {
        const ideaScore = calculateMatchScore(query, ideaIndex)
        if (ideaScore > 0) {
          maxScore = Math.max(maxScore, ideaScore - 10) // 主要思想匹配降10分
        }
      }
      
      return {
        philosopher: index.philosopher,
        score: maxScore
      }
    })
    .filter(result => result.score > 0) // 只保留有匹配的结果
    .sort((a, b) => b.score - a.score) // 按分数从高到低排序
  
  return results.map(result => result.philosopher)
}

/**
 * 搜索历史管理
 */
const SEARCH_HISTORY_KEY = 'western-philosophy-search-history'
const MAX_HISTORY_ITEMS = 10

export function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return []
  
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch (error) {
    console.warn('读取搜索历史失败:', error)
    return []
  }
}

export function addToSearchHistory(query: string): void {
  if (typeof window === 'undefined') return
  if (!query.trim()) return
  
  try {
    const history = getSearchHistory()
    
    // 移除重复项
    const filtered = history.filter(item => item !== query)
    
    // 添加到开头
    const newHistory = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS)
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
  } catch (error) {
    console.warn('保存搜索历史失败:', error)
  }
}

export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  } catch (error) {
    console.warn('清除搜索历史失败:', error)
  }
}

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

// ============================================
// 通用搜索函数（支持 KnowledgeEntity）
// ============================================

/**
 * 为通用知识实体生成搜索索引
 */
export interface EntitySearchIndex {
  entity: KnowledgeEntity
  zhNameIndex: ReturnType<typeof generateSearchIndex>
  enNameIndex: ReturnType<typeof generateSearchIndex>
  categoryIndex: ReturnType<typeof generateSearchIndex>
  ideasIndex: ReturnType<typeof generateSearchIndex>[]
}

export function buildEntityIndex(entity: KnowledgeEntity): EntitySearchIndex {
  return {
    entity,
    zhNameIndex: generateSearchIndex(entity.name.zh),
    enNameIndex: generateSearchIndex(entity.name.en),
    categoryIndex: generateSearchIndex(entity.category),
    ideasIndex: entity.mainIdeas.map(idea => generateSearchIndex(idea))
  }
}

/**
 * 搜索通用知识实体（支持拼音）并按匹配度排序
 */
export function searchEntities(
  entities: KnowledgeEntity[],
  query: string
): KnowledgeEntity[] {
  if (!query.trim()) {
    return entities
  }

  const indexes = entities.map(e => buildEntityIndex(e))
  
  const results = indexes
    .map(index => {
      let maxScore = 0
      
      // 检查分类匹配（最高优先级）
      const categoryScore = calculateMatchScore(query, index.categoryIndex)
      if (categoryScore > 0) {
        maxScore = Math.max(maxScore, categoryScore + 20)
      }
      
      // 检查中文名匹配
      const zhNameScore = calculateMatchScore(query, index.zhNameIndex)
      if (zhNameScore > 0) {
        maxScore = Math.max(maxScore, zhNameScore + 10)
      }
      
      // 检查英文名匹配
      const enNameScore = calculateMatchScore(query, index.enNameIndex)
      if (enNameScore > 0) {
        maxScore = Math.max(maxScore, enNameScore)
      }
      
      // 检查主要思想匹配
      for (const ideaIndex of index.ideasIndex) {
        const ideaScore = calculateMatchScore(query, ideaIndex)
        if (ideaScore > 0) {
          maxScore = Math.max(maxScore, ideaScore - 10)
        }
      }
      
      return {
        entity: index.entity,
        score: maxScore
      }
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
  
  return results.map(result => result.entity)
}

/**
 * 创建搜索历史管理器（通用版本）
 */
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
