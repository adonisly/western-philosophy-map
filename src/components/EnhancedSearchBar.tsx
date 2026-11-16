// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Search, X, Clock, TrendingUp, User } from 'lucide-react'
import { useI18n } from '../i18n'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { getSearchHistory, addToSearchHistory, clearSearchHistory, searchPhilosophers } from '../search'
import { Philosopher } from '../types/western-philosophy'
import type { HotSearchTerm } from '../data-source'

export interface EnhancedSearchBarProps {
  globalHotTerms?: HotSearchTerm[]
  onTrackSearch?: (term: string) => void | Promise<void>
  value: string
  onChange: (value: string) => void
  onSearch?: () => void
  placeholder?: string
  hotSearches?: Array<string | { term: string; count?: number }>
  philosophers?: Philosopher[]
  onSelectPhilosopher?: (philosopher: Philosopher) => void
}

export function EnhancedSearchBar({
  value,
  onChange,
  onSearch,
  placeholder,
  hotSearches = [],
  philosophers = [],
  onSelectPhilosopher,
  globalHotTerms: suppliedHotTerms,
  onTrackSearch
}: EnhancedSearchBarProps) {
  const { t, en, primaryName, secondaryName, schoolLabel, year, hotTerm } = useI18n()
  const [isFocused, setIsFocused] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)
  
  const globalHotTerms = useMemo(() => suppliedHotTerms ?? hotSearches.map(term =>
    typeof term === 'string' ? { term } : term
  ), [suppliedHotTerms, hotSearches])
  
  // 创建搜索次数映射（用于搜索历史）
  const termCountMap = useMemo(() => {
    const map = new Map<string, number>()
    globalHotTerms?.forEach(t => { if (t.count !== undefined) map.set(t.term, t.count) })
    return map
  }, [globalHotTerms])
  
  // 热门搜索只显示前12条
  const hotSearchList = useMemo(() => {
    return (globalHotTerms || []).slice(0, 12).map(t => ({ term: t.term, count: t.count }))
  }, [globalHotTerms])
  
  // 实时搜索建议：当用户输入时显示匹配的哲学家
  const searchSuggestions = useMemo(() => {
    if (!value.trim() || philosophers.length === 0) return []
    
    // 使用searchPhilosophers函数搜索，限制返回30个结果
    const matched = searchPhilosophers(philosophers, value)
    return matched.slice(0, 30)
  }, [value, philosophers])
  
  // 跟踪搜索到服务器
  const trackSearch = useCallback(async (term: string) => {
    if (!term.trim()) return
    
    try {
      await onTrackSearch?.(term.trim())
    } catch (error) {
      console.warn('Failed to track search:', error)
    }
  }, [onTrackSearch])

  // 加载搜索历史
  useEffect(() => {
    setSearchHistory(getSearchHistory())
  }, [])

  // 点击外部关闭下拉
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (query: string) => {
    if (query.trim()) {
      addToSearchHistory(query)
      setSearchHistory(getSearchHistory())
      trackSearch(query) // 添加全局搜索跟踪
      onChange(query)
      onSearch?.()
      setIsFocused(false)
    }
  }

  const handleClearHistory = () => {
    clearSearchHistory()
    setSearchHistory([])
  }
  
  const handleSelectPhilosopher = (philosopher: Philosopher) => {
    const searchTerm = primaryName(philosopher)
    onChange(searchTerm)
    addToSearchHistory(searchTerm)
    setSearchHistory(getSearchHistory())
    trackSearch(searchTerm) // 添加全局搜索跟踪
    onSelectPhilosopher?.(philosopher)
    setIsFocused(false)
  }
  
  const handleClickHotSearch = (term: string) => {
    onChange(term)
    addToSearchHistory(term)
    setSearchHistory(getSearchHistory())
    trackSearch(term) // 添加全局搜索跟踪
    onSearch?.()
    setIsFocused(false)
  }
  
  const handleClickHistory = (term: string) => {
    onChange(term)
    trackSearch(term) // 添加全局搜索跟踪
    onSearch?.()
    setIsFocused(false)
  }

  const showDropdown = isFocused && (searchSuggestions.length > 0 || searchHistory.length > 0 || hotSearchList.length > 0)

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder || t("搜索哲学家（中文/英文）、流派或思想...")}
          aria-label={t("搜索哲学家（中文/英文）、流派或思想...")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(value)
            }
          }}
          className="pl-10 pr-10"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            aria-label={t('清除搜索')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 搜索提示和历史记录下拉 */}
      {showDropdown && (
        <div className="absolute z-50 w-full md:min-w-[600px] mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[600px] overflow-y-auto">
          {/* 搜索建议 - 实时匹配的哲学家 */}
          {searchSuggestions.length > 0 && (
            <div className="p-2 border-b border-gray-100">
              <div className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-gray-700">
                <User className="h-4 w-4" />
                <span>{t('匹配的哲学家')}</span>
                <span className="text-xs text-gray-500">({searchSuggestions.length})</span>
              </div>
              <div className="space-y-1 mt-1">
                {searchSuggestions.map((philosopher) => (
                  <button
                    key={philosopher.id}
                    onClick={() => handleSelectPhilosopher(philosopher)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                          {primaryName(philosopher)}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center flex-wrap gap-x-2 gap-y-1 mt-0.5">
                          <span className="font-medium">{secondaryName(philosopher)}</span>
                          {philosopher.school && (
                            <>
                              <span>•</span>
                              <span>{schoolLabel(philosopher.school)}</span>
                            </>
                          )}
                          {philosopher.birthYear && (
                            <>
                              <span>•</span>
                              <span className="whitespace-nowrap">
                                {year(philosopher.birthYear)}
                                {philosopher.deathYear && ` – ${year(philosopher.deathYear)}`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* 搜索历史 */}
          {searchHistory.length > 0 && !value.trim() && (
            <div className="p-2 border-b border-gray-100">
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="h-4 w-4" />
                  <span>{t('搜索历史')}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearHistory}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  {t("清除")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 px-2">
                {searchHistory.map((item, index) => {
                  const count = termCountMap.get(item) || 0
                  return (
                    <button
                      key={index}
                      onClick={() => handleClickHistory(item)}
                      className="px-3 py-1 rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm transition-colors flex items-center gap-1"
                    >
                      {item}
                      {count > 0 && <span className="text-xs text-gray-400">({count})</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 热门搜索 */}
          {hotSearchList.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-gray-700">
                <TrendingUp className="h-4 w-4" />
                <span>{t('热门搜索')}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 px-2">
                {hotSearchList.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleClickHotSearch(hotTerm(item.term, philosophers))}
                    className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm transition-colors flex items-center gap-1"
                  >
                    {hotTerm(item.term, philosophers)}
                    {(item.count ?? 0) > 0 && <span className="text-xs text-blue-400">({item.count})</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 搜索提示 */}
          <div className="p-3 bg-blue-50 text-xs text-blue-700 border-t border-blue-100">
            💡 <span className="font-medium">{t('搜索技巧：')}</span>
            {en ? 'Search English or Chinese names, schools, ideas, pinyin or initials. Try “Hegel”, “Empiricism”, “Socrates” or “sgld”.' : '支持中文、英文名、流派、拼音、首字母搜索。试试 "Hegel"、"德国古典哲学"、"sgld"、"sugeladi" 或 "苏格拉底"'}
          </div>
        </div>
      )}
    </div>
  )
}
