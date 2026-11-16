// SPDX-License-Identifier: AGPL-3.0-only
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Philosopher } from '../types/western-philosophy'
import { translatedField, formatYear, centuryLabel } from './content.mjs'
export type Locale = 'zh' | 'en'
export type Translations = Record<string, any>
const messages: Record<string,string> = {
  '理念论':'Theory of Forms', '辩证法':'Dialectic',
  '西方哲学思想脉络图':'Western Philosophy Map',
  '探索从古希腊到当代西方哲学思想的传承与演变':'Explore ideas and influences from ancient Greece to contemporary philosophy',
  '西方哲学图谱 GitHub 源码与 Star 支持（新窗口打开）':'Western Philosophy Map on GitHub (opens in a new tab)',
  '查看西方哲学图谱源码、提交建议或 Star 支持项目':'Explore the source, report an issue or star the project',
  '查看本版本源码与 AGPL-3.0 许可':'Source for this version and AGPL-3.0 license',
  '返回阅读路书首页':'Visit ReadMap (Chinese)', '返回首页':'ReadMap', '阅读路书':'ReadMap', '源码':'Source',
  '分享':'Share', '分享当前图谱':'Share this map', '分享此人物':'Share this philosopher',
  '搜索哲学家（中文/英文）、流派或思想（支持拼音/首字母）':'Search philosophers, schools or ideas…',
  '搜索哲学家（中文/英文）、流派或思想...':'Search philosophers, schools or ideas…',
  '使用数据库配置的位置':'Use the curated default positions',
  '紧凑布局：优化横向排列，解决位置冲突':'Compact layout with reduced spacing',
  '默认':'Default', '紧凑':'Compact', '流派':'Schools', '世纪':'Centuries', '传承':'Influences',
  '意见反馈':'Feedback', '意见':'', '反馈':'Feedback',
  '筛选条件':'Filters', '清除全部筛选':'Clear all filters', '清除':'Clear',
  '展开筛选条件':'Expand filters', '收起筛选条件':'Collapse filters', '展开':'Expand', '收起':'Collapse',
  '流派:':'Schools:', '时代:':'Periods:', '层级:':'Levels:', '关键词:':'Query:',
  '全部流派':'All schools', '全部时代':'All periods', '全部层级':'All levels',
  '探索起点':'Explore starting points', '从这里开始':'Start exploring',
  '苏格拉底的思想传承':'Socrates and his influences', '人物与流派索引':'Philosophers & schools',
  '放大':'Zoom in', '缩小':'Zoom out', '适应视图':'Fit to view', '重置节点位置和视图状态':'Reset positions and view', '重置':'Reset',
  '展开缩放控制':'Expand zoom controls', '缩放控制':'Zoom controls', '展开预览图':'Open minimap', '预览图':'Minimap', '关闭预览图':'Close minimap',
  '加载哲学数据中...':'Loading the philosophy map…', '加载失败':'Unable to load the map', '重新加载':'Try again',
  '关闭人物详情':'Close philosopher details', '生平简介':'Biography', '思想继承':'Intellectual sources',
  '主要思想':'Main ideas', '后世影响':'Later influence', '主要著作':'Major works', '人物标签':'Quotation / characterisation (translated)',
  '关系类型':'Relationship types', '匹配的哲学家':'Matching philosophers', '搜索历史':'Search history', '热门搜索':'Popular searches',
  '搜索技巧：':'Search tips:', '关闭':'Close', '复制链接':'Copy link', '分享链接':'Share link',
  '链接已复制，可以发给读书伙伴了。':'Link copied. Share it with a fellow reader.',
  '未能自动复制，请长按或使用 Ctrl/Cmd+C 复制上方链接。':'Copy failed. Select the link and use Ctrl/Cmd+C or long-press to copy.',
  '打开链接即可恢复人物、布局、搜索与筛选。拖动位置和缩放不包含在链接中。':'The link restores the philosopher, layout, search and filters. Drag positions and zoom are not included.',
  '清除搜索':'Clear search', '未分类':'Uncategorised',
}
const Context = createContext({locale:'zh' as Locale, translations:{} as Translations})
export function I18nProvider({locale='zh',translations={},children}:{locale?:Locale;translations?:Translations;children:ReactNode}) {
  const value = useMemo(()=>({locale,translations}),[locale,translations])
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export function useI18n() {
  const {locale,translations} = useContext(Context)
  return useMemo(()=>{
    const en = locale === 'en'
    const schoolEntries = Object.values(translations.schools || {}) as any[]
    const schoolLabel = (key:string, forceEnglish = false) => (en || forceEnglish) ? (schoolEntries.find(s=>s.name?.source?.[0] === key)?.name?.text?.[0] || key) : key
    const primaryName = (p:Philosopher) => en ? (translatedField(p.name.en,translations.philosophers?.[p.id]?.name).text[0] || p.name.zh) : (p.name.zh || p.name.en)
    const secondaryName = (p:Philosopher) => en ? p.name.zh : p.name.en
    const localize = (p:Philosopher, forceEnglish = false) => {
      if (!en && !forceEnglish) return p
      const entry = translations.philosophers?.[p.id]
      const sourceFields = {detailedBio:'description',mainIdeas:'contributions',majorWorks:'works',quotes:'quotes',inheritedThoughts:'inherited_thoughts',laterInfluence:'later_influence',nationality:'nationality'}
      const result:any = {...p, name: {...p.name, en: translatedField(p.name.en,entry?.name).text[0] || p.name.en}}
      const statuses:string[] = []
      for (const [target,field] of Object.entries(sourceFields)) {
        const value = p[target as keyof Philosopher]
        const translated = translatedField(value,entry?.[field])
        result[target] = target === 'nationality' ? translated.text[0] : translated.text
        if (translated.status !== 'empty') statuses.push(translated.status)
      }
      result.translationStatus = statuses.includes('stale') ? 'stale' : statuses.includes('missing') ? 'missing' : statuses.includes('draft') ? 'draft' : 'reviewed'
      return result as Philosopher & {translationStatus:string}
    }
    return {locale,en,schoolLabel,primaryName,secondaryName,localize,
      t:(key:string)=>en ? (messages[key] || key) : key,
      year:(n:number)=>formatYear(n,locale), century:(id:string)=>centuryLabel(id,locale),
      hotTerm:(term:string,people:Philosopher[])=>en ? (people.find(p=>p.name.zh === term)?.name.en || schoolLabel(term)) : term,
      searchText:(id:string)=> Object.values(translations.philosophers?.[id] || {}).flatMap((field:any)=>Array.isArray(field?.text)?field.text:[]),
    }
  },[locale,translations])
}
