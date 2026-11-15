// SPDX-License-Identifier: AGPL-3.0-only
import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  useReactFlow
} from 'reactflow'
import 'reactflow/dist/style.css'
import { X, Filter, Loader2, ZoomIn, ZoomOut, Maximize2, MessageSquare, ChevronDown, ChevronUp, Map as MapIcon, Home } from 'lucide-react'

import PhilosopherNode from './components/PhilosopherNode'
import CustomEdge from './components/CustomEdge'
import { EnhancedSearchBar } from './components/EnhancedSearchBar'
import { Philosopher, Influence, School } from './types/western-philosophy'
import { searchPhilosophers, addToSearchHistory } from './search'
import { Button } from './ui/button'
import type { PhilosophyDataSource, HotSearchTerm } from './data-source'

// 自定义节点类型
const nodeTypes = {
  philosopher: PhilosopherNode
}

// 自定义边类型
const edgeTypes = {
  custom: CustomEdge
}

// 缩放控制组件
function ZoomControls({ onResetNodes }: { onResetNodes: () => void }) {
  const reactFlowInstance = useReactFlow()
  
  const handleZoomIn = () => {
    console.log('Zoom In clicked')
    reactFlowInstance.zoomIn({ duration: 300 })
  }
  
  const handleZoomOut = () => {
    console.log('Zoom Out clicked')
    reactFlowInstance.zoomOut({ duration: 300 })
  }
  
  const handleFitView = () => {
    console.log('Fit View clicked')
    reactFlowInstance.fitView({ padding: 0.2, duration: 300 })
  }
  
  const handleReset = () => {
    console.log('Reset clicked')
    // 先重置节点位置
    onResetNodes()
    // 等待节点位置更新后重置视图
    setTimeout(() => {
      reactFlowInstance.setViewport(INITIAL_VIEWPORT, { duration: 300 })
    }, 50)
  }
  
  return (
    <div className="bg-white/90 backdrop-blur rounded-lg shadow-lg">
      <div className="grid grid-cols-2 gap-1.5 md:gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          className="h-8 w-full border border-gray-200 hover:bg-gray-100 text-xs"
          title="放大"
        >
          <ZoomIn className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          className="h-8 w-full border border-gray-200 hover:bg-gray-100 text-xs"
          title="缩小"
        >
          <ZoomOut className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFitView}
          className="h-8 w-full border border-gray-200 hover:bg-gray-100 text-xs"
          title="适应视图"
        >
          <Maximize2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 w-full border border-gray-200 hover:bg-gray-100 text-xs"
          title="重置节点位置和视图状态"
        >
          重置
        </Button>
      </div>
    </div>
  )
}

// 自动定位组件：监听筛选条件变化并自动定位到匹配的节点
function AutoFitView({ 
  filteredIds, 
  trigger,
  centerMode = false // 新增：是否为中心定位模式（用于搜索）
}: { 
  filteredIds: string[]
  trigger: string // 用于触发重新定位的标识
  centerMode?: boolean
}) {
  const { fitView, getNodes } = useReactFlow()
  const prevTriggerRef = useRef<string>('')
  
  useEffect(() => {
    // 只在trigger变化时执行
    if (trigger === prevTriggerRef.current || !trigger) return
    prevTriggerRef.current = trigger
    
    // 如果没有筛选结果，不执行定位
    if (filteredIds.length === 0) return
    
    // 延迟执行，确保节点已经渲染和更新
    const timer = setTimeout(() => {
      const allNodes = getNodes()
      
      // 按 filteredIds 的顺序排列匹配的节点（保持搜索分数排序）
      const matchedNodes = filteredIds
        .map(id => allNodes.find(node => node.id === id))
        .filter((node): node is typeof allNodes[0] => node !== undefined)
      
      if (matchedNodes.length > 0) {
        console.log('🎯 自动定位到', matchedNodes.length, '个节点', centerMode ? '(中心定位模式)' : '')
        
        // 中心定位模式：只定位第一个节点（分数最高的），并放大显示
        if (centerMode && matchedNodes.length > 0) {
          const targetNode = matchedNodes[0]
          console.log('🎯 中心定位到:', targetNode.id, '(排序后的第一个)')
          
          fitView({
            nodes: [targetNode], // 只定位到第一个节点
            duration: 600,
            padding: 0.6, // 更大的padding，确保节点在屏幕中央显示
            minZoom: 0.8,
            maxZoom: 1.0 // 适当放大
          })
          return
        }
        
        // 普通筛选模式：根据匹配节点数量调整视图
        const isSingleNode = matchedNodes.length === 1
        const isFewNodes = matchedNodes.length <= 3
        
        fitView({
          nodes: matchedNodes,
          duration: 600,
          padding: isSingleNode ? 0.5 : isFewNodes ? 0.3 : 0.2,
          minZoom: 0.5,
          maxZoom: isSingleNode ? 1.5 : isFewNodes ? 1.2 : 1
        })
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [trigger, filteredIds, fitView, getNodes, centerMode])
  
  return null
}

function ViewportReset({
  trigger,
  viewport
}: {
  trigger: string
  viewport: { x: number; y: number; zoom: number }
}) {
  const { setViewport } = useReactFlow()
  const prevRef = useRef<string>('')

  useEffect(() => {
    if (!trigger || trigger === prevRef.current) return
    prevRef.current = trigger

    const timer = setTimeout(() => {
      setViewport(viewport, { duration: 300 })
    }, 50)

    return () => clearTimeout(timer)
  }, [trigger, viewport, setViewport])

  return null
}

// Century layout helper
// 将年份转换为世纪（公元前世纪为负数，例如 -450 => -5 表示前5世纪）
const yearToCentury = (year: number) => {
  if (year === 0) return 0
  if (year < 0) {
    return -Math.ceil(Math.abs(year) / 100) // -600..-501 => -6, -500..-401 => -5
  }
  return Math.floor((year - 1) / 100) + 1
}

type LayoutPosition = { x: number; y: number }

// 增大卡片间距,避免重叠
const CARD_WIDTH = 280
const CARD_HEIGHT = 280
const HORIZONTAL_GAP = 100  // 从60增加到100
const VERTICAL_GAP = 100     // 从80增加到100
const HORIZONTAL_MARGIN = -80  // 增加左边距，与筛选框对齐
const VERTICAL_MARGIN = -80  // 增加顶部边距，让卡片与画布顶部有更大距离
const INITIAL_VIEWPORT = { x: 100, y: 100, zoom: 0.7 }

/**
 * 动态生成时代分类（基于哲学家的死亡年份）
 * 按世纪自动分组
 * 注意：如果没有死亡年份，默认为20世纪（说明可能还活着）
 */
function generateTimePeriods(philosophers: Philosopher[]): Array<{
  id: string
  label: string
  start_year: number
  end_year: number
  count: number
}> {
  if (philosophers.length === 0) return []
  
  // 按世纪分组（按死亡年份）
  const centuryGroups = new Map<number, Philosopher[]>()
  
  philosophers.forEach(p => {
    // 使用死亡年份，如果没有则默认为2000（20世纪）
    const yearToUse = (p.deathYear && p.deathYear !== 0) ? p.deathYear : 2000
    const century = yearToCentury(yearToUse)
    
    if (!centuryGroups.has(century)) {
      centuryGroups.set(century, [])
    }
    centuryGroups.get(century)!.push(p)
  })
  
  // 转换为时代数组
  const periods = Array.from(centuryGroups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([century, philos]) => {
      // 计算这个世纪的年份范围
      let start_year: number
      let end_year: number
      let label: string
      
      if (century < 0) {
        // 公元前
        const absCentury = Math.abs(century)
        start_year = -(absCentury * 100)
        end_year = -(absCentury * 100 - 99)
        label = `公元前${absCentury}世纪`
      } else if (century === 0) {
        // 公元1世纪
        start_year = 1
        end_year = 100
        label = '公元1世纪'
      } else {
        // 公元后
        start_year = (century - 1) * 100 + 1
        end_year = century * 100
        label = `${century}世纪`
      }
      
      return {
        id: `century_${century}`,
        label,
        start_year,
        end_year,
        count: philos.length
      }
    })
  
  return periods
}

function calculateLayout(philosophers: Philosopher[], influences?: Influence[]): {
  positions: Map<string, LayoutPosition>
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
} {
  // 1. 按出生年份排序
  const sorted = [...philosophers].sort((a, b) => a.birthYear - b.birthYear)

  // 2. 按世纪分组（保持顺序）
  const centuryMap = new Map<number, Philosopher[]>()
  sorted.forEach(p => {
    const c = yearToCentury(p.birthYear)
    if (!centuryMap.has(c)) centuryMap.set(c, [])
    centuryMap.get(c)!.push(p)
  })

  // 3. 获取有序世纪列表
  const centuries = Array.from(centuryMap.keys()).sort((a, b) => a - b)

  // 4. 为每个世纪内的哲学家分配水平位置（简单序号）
  const positions = new Map<string, LayoutPosition>()
  let maxX = 0
  let maxY = 0

  // 计算出度（直系影响次数）
  const outDegree = new Map<string, number>()
  if (influences) {
    influences.forEach(inf => {
      outDegree.set(inf.from, (outDegree.get(inf.from) || 0) + 1)
    })
  }

  centuries.forEach((century, rowIndex) => {
    const list = centuryMap.get(century)!
    list.sort((a, b) => {
      const ob = (outDegree.get(b.id) || 0) - (outDegree.get(a.id) || 0)
      if (ob !== 0) return ob
      if (a.birthYear !== b.birthYear) return a.birthYear - b.birthYear
      return a.id.localeCompare(b.id)
    })
    list.forEach((p, colIndex) => {
      const x = HORIZONTAL_MARGIN + colIndex * (CARD_WIDTH + HORIZONTAL_GAP)
      const y = VERTICAL_MARGIN + rowIndex * (CARD_HEIGHT + VERTICAL_GAP)
      positions.set(p.id, { x, y })
      maxX = Math.max(maxX, x + CARD_WIDTH)
      maxY = Math.max(maxY, y + CARD_HEIGHT)
    })
  })

  return {
    positions,
    bounds: { minX: 0, maxX, minY: 0, maxY }
  }
}

// 按流派布局：同一流派的哲学家横向排列
function calculateSchoolLayout(philosophers: Philosopher[]): {
  positions: Map<string, LayoutPosition>
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
} {
  const positions = new Map<string, LayoutPosition>()
  if (philosophers.length === 0) {
    return { positions, bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } }
  }

  // 1. 按流派分组
  const schoolMap = new Map<string, Philosopher[]>()
  philosophers.forEach(p => {
    const school = p.school || '未分类'
    if (!schoolMap.has(school)) schoolMap.set(school, [])
    schoolMap.get(school)!.push(p)
  })

  // 2. 获取所有流派，并按最早哲学家的出生年份排序
  const schools = Array.from(schoolMap.entries()).map(([name, philos]) => ({
    name,
    philosophers: philos.sort((a, b) => a.birthYear - b.birthYear), // 按出生年份排序
    minBirthYear: Math.min(...philos.map(p => p.birthYear))
  }))
  schools.sort((a, b) => a.minBirthYear - b.minBirthYear)

  // 3. 为每个流派分配位置
  let currentRow = 0
  let maxX = 0
  let maxY = 0

  schools.forEach(school => {
    const philosophers = school.philosophers
    
    // 同一流派的哲学家横向排列
    philosophers.forEach((p, index) => {
      const x = HORIZONTAL_MARGIN + index * (CARD_WIDTH + HORIZONTAL_GAP)
      const y = VERTICAL_MARGIN + currentRow * (CARD_HEIGHT + VERTICAL_GAP)
      
      positions.set(p.id, { x, y })
      maxX = Math.max(maxX, x + CARD_WIDTH)
      maxY = Math.max(maxY, y + CARD_HEIGHT)
    })
    
    // 移动到下一行
    currentRow++
  })

  return {
    positions,
    bounds: { minX: 0, maxX, minY: 0, maxY }
  }
}

// 基于数据库字段的布局：使用流派的 vertical 和 horizontal 字段精确定位
function calculateDatabaseLayout(philosophers: Philosopher[], schools: School[]): {
  positions: Map<string, LayoutPosition>
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
} {
  const positions = new Map<string, LayoutPosition>()
  if (philosophers.length === 0) {
    return { positions, bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } }
  }

  // 1. 创建流派信息映射
  const schoolInfoMap = new Map<string, { vertical: number; horizontal: number }>()
  schools.forEach(school => {
    schoolInfoMap.set(school.name, {
      vertical: school.vertical ?? 0,
      horizontal: school.horizontal ?? 0
    })
  })

  // 2. 按流派分组哲学家
  const schoolPhilosophersMap = new Map<string, Philosopher[]>()
  philosophers.forEach(p => {
    const school = p.school || '未分类'
    if (!schoolPhilosophersMap.has(school)) {
      schoolPhilosophersMap.set(school, [])
    }
    schoolPhilosophersMap.get(school)!.push(p)
  })

  // 3. 对每个流派内的哲学家按出生年份排序
  schoolPhilosophersMap.forEach((philos, schoolName) => {
    philos.sort((a, b) => a.birthYear - b.birthYear)
  })

  // 4. 按行分组流派，然后按 horizontal 排序
  type RowSchool = {
    name: string
    philosophers: Philosopher[]
    horizontal: number
  }
  
  const rowsMap = new Map<number, RowSchool[]>()
  
  schoolPhilosophersMap.forEach((philos, schoolName) => {
    const schoolInfo = schoolInfoMap.get(schoolName) || { vertical: 0, horizontal: 0 }
    const vertical = schoolInfo.vertical
    
    if (!rowsMap.has(vertical)) {
      rowsMap.set(vertical, [])
    }
    
    rowsMap.get(vertical)!.push({
      name: schoolName,
      philosophers: philos,
      horizontal: schoolInfo.horizontal
    })
  })
  
  // 5. 对每一行内的流派按 horizontal 排序
  rowsMap.forEach(schools => {
    schools.sort((a, b) => a.horizontal - b.horizontal)
  })

  // 6. 计算位置
  // 流派间间距为流派内间距的1.5倍
  const SCHOOL_GAP = HORIZONTAL_GAP * 1.5
  let maxX = 0
  let maxY = 0

  rowsMap.forEach((schools, vertical) => {
    let currentX = HORIZONTAL_MARGIN // 每一行从左边距开始
    
    schools.forEach((school, schoolIndex) => {
      // 如果不是第一个流派，添加流派间距
      if (schoolIndex > 0) {
        currentX += SCHOOL_GAP
      }
      
      // 摆放该流派的所有哲学家
      school.philosophers.forEach((p, philoIndex) => {
        const x = currentX + philoIndex * (CARD_WIDTH + HORIZONTAL_GAP)
        const y = VERTICAL_MARGIN + vertical * (CARD_HEIGHT + VERTICAL_GAP)
        
        positions.set(p.id, { x, y })
        maxX = Math.max(maxX, x + CARD_WIDTH)
        maxY = Math.max(maxY, y + CARD_HEIGHT)
      })
      
      // 更新 currentX 为下一个流派的起始位置
      // 流派宽度 = N个卡片宽度 + (N-1)个卡片间距
      const schoolWidth = school.philosophers.length * CARD_WIDTH + 
                          Math.max(0, school.philosophers.length - 1) * HORIZONTAL_GAP
      currentX += schoolWidth
    })
  })

  return {
    positions,
    bounds: { minX: 0, maxX, minY: 0, maxY }
  }
}

// 紧凑布局：优化 horizontal 值，解决重复和 null 问题
// 1. 同一行内的学派从 0 开始连续编号
// 2. 处理 null 值：给没有 horizontal 的学派分配位置
// 3. 解决重复冲突：同一 vertical+horizontal 的学派错开显示
// 4. 支持 positionOverride：个别哲学家可以通过此字段精确定位
function calculateCompactLayout(philosophers: Philosopher[], schools: School[]): {
  positions: Map<string, LayoutPosition>
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
} {
  const positions = new Map<string, LayoutPosition>()
  if (philosophers.length === 0) {
    return { positions, bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } }
  }

  // 分离有 positionOverride 和没有的哲学家
  const overriddenPhilosophers: Philosopher[] = []
  const normalPhilosophers: Philosopher[] = []
  
  philosophers.forEach(p => {
    if (p.positionOverride && 
        (p.positionOverride.vertical !== undefined || p.positionOverride.horizontal !== undefined)) {
      overriddenPhilosophers.push(p)
    } else {
      normalPhilosophers.push(p)
    }
  })

  // 1. 创建流派信息映射
  const schoolInfoMap = new Map<string, { vertical: number; horizontal: number | null }>()
  schools.forEach(school => {
    schoolInfoMap.set(school.name, {
      vertical: school.vertical ?? 0,
      horizontal: school.horizontal ?? null
    })
  })

  // 2. 按流派分组哲学家（只处理没有 positionOverride 的）
  const schoolPhilosophersMap = new Map<string, Philosopher[]>()
  normalPhilosophers.forEach(p => {
    const school = p.school || '未分类'
    if (!schoolPhilosophersMap.has(school)) {
      schoolPhilosophersMap.set(school, [])
    }
    schoolPhilosophersMap.get(school)!.push(p)
  })

  // 3. 对每个流派内的哲学家按出生年份排序
  schoolPhilosophersMap.forEach((philos) => {
    philos.sort((a, b) => a.birthYear - b.birthYear)
  })

  // 4. 按行分组流派
  type RowSchool = {
    name: string
    philosophers: Philosopher[]
    originalHorizontal: number | null
  }
  
  const rowsMap = new Map<number, RowSchool[]>()
  
  schoolPhilosophersMap.forEach((philos, schoolName) => {
    const schoolInfo = schoolInfoMap.get(schoolName) || { vertical: 0, horizontal: null }
    const vertical = schoolInfo.vertical
    
    if (!rowsMap.has(vertical)) {
      rowsMap.set(vertical, [])
    }
    
    rowsMap.get(vertical)!.push({
      name: schoolName,
      philosophers: philos,
      originalHorizontal: schoolInfo.horizontal
    })
  })
  
  // 5. 对每一行内的流派进行排序和重新编号
  // 排序规则：有 horizontal 的按值排序，null 的放最后按名称排序
  rowsMap.forEach(schoolsInRow => {
    schoolsInRow.sort((a, b) => {
      // 都有值：按值排序
      if (a.originalHorizontal !== null && b.originalHorizontal !== null) {
        return a.originalHorizontal - b.originalHorizontal
      }
      // a 有值，b 为 null：a 在前
      if (a.originalHorizontal !== null) return -1
      // a 为 null，b 有值：b 在前
      if (b.originalHorizontal !== null) return 1
      // 都为 null：按名称排序
      return a.name.localeCompare(b.name)
    })
  })

  // 6. 计算位置（紧凑排列，流派间有间隔）
  const SCHOOL_GAP = HORIZONTAL_GAP * 1.2 // 流派间距
  let maxX = 0
  let maxY = 0

  rowsMap.forEach((schoolsInRow, vertical) => {
    let currentX = HORIZONTAL_MARGIN
    
    schoolsInRow.forEach((school, schoolIndex) => {
      // 如果不是第一个流派，添加流派间距
      if (schoolIndex > 0) {
        currentX += SCHOOL_GAP
      }
      
      // 摆放该流派的所有哲学家
      school.philosophers.forEach((p, philoIndex) => {
        const x = currentX + philoIndex * (CARD_WIDTH + HORIZONTAL_GAP)
        const y = VERTICAL_MARGIN + vertical * (CARD_HEIGHT + VERTICAL_GAP)
        
        positions.set(p.id, { x, y })
        maxX = Math.max(maxX, x + CARD_WIDTH)
        maxY = Math.max(maxY, y + CARD_HEIGHT)
      })
      
      // 更新 currentX 为下一个流派的起始位置
      const schoolWidth = school.philosophers.length * CARD_WIDTH + 
                          Math.max(0, school.philosophers.length - 1) * HORIZONTAL_GAP
      currentX += schoolWidth
    })
  })

  // 7. 处理有 positionOverride 的哲学家（精确定位）
  overriddenPhilosophers.forEach(p => {
    const override = p.positionOverride!
    // 获取学派的默认 vertical（如果 override 没有指定）
    const schoolInfo = schoolInfoMap.get(p.school || '未分类') || { vertical: 0, horizontal: 0 }
    
    const v = override.vertical ?? schoolInfo.vertical
    const h = override.horizontal ?? 0
    
    const x = HORIZONTAL_MARGIN + h * (CARD_WIDTH + HORIZONTAL_GAP)
    const y = VERTICAL_MARGIN + v * (CARD_HEIGHT + VERTICAL_GAP)
    
    positions.set(p.id, { x, y })
    maxX = Math.max(maxX, x + CARD_WIDTH)
    maxY = Math.max(maxY, y + CARD_HEIGHT)
  })

  return {
    positions,
    bounds: { minX: 0, maxX, minY: 0, maxY }
  }
}

// 树形布局：按思想传承构建树形结构
// 1. 同一流派的哲学家按思想继承顺序从左到右排列
// 2. 不同流派的后继者在父节点下一行显示
function calculateLineageLayout(philosophers: Philosopher[], influences: Influence[]): {
  positions: Map<string, LayoutPosition>
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
} {
  const positions = new Map<string, LayoutPosition>()
  if (philosophers.length === 0) {
    return { positions, bounds: { minX:0, maxX:0, minY:0, maxY:0 } }
  }

  // 构建影响关系图
  const inMap = new Map<string, string[]>()
  const outMap = new Map<string, string[]>()
  influences.forEach(inf => {
    inMap.set(inf.to, [...(inMap.get(inf.to) || []), inf.from])
    outMap.set(inf.from, [...(outMap.get(inf.from) || []), inf.to])
  })
  
  const byId = new Map(philosophers.map(p => [p.id, p]))
  
  // 动态获取米利都学派的哲学家ID（作为根节点）
  const miletuSchool = philosophers
    .filter(p => p.school === '米利都学派')
    .map(p => p.id)
  
  // 为每个节点计算深度（代数）
  const depths = new Map<string, number>()
  const visited = new Set<string>()
  
  function calculateDepth(id: string, depth: number = 0): number {
    if (depths.has(id)) return depths.get(id)!
    if (visited.has(id)) return depth // 避免循环
    
    // 米利都学派的哲学家都是第0级
    if (miletuSchool.includes(id)) {
      depths.set(id, 0)
      return 0
    }
    
    visited.add(id)
    const parents = inMap.get(id) || []
    
    if (parents.length === 0) {
      depths.set(id, 0)
      return 0
    }
    
    // 深度 = 最大父节点深度 + 1
    const maxParentDepth = Math.max(...parents.map(p => calculateDepth(p, depth)))
    const myDepth = maxParentDepth + 1
    depths.set(id, myDepth)
    return myDepth
  }
  
  philosophers.forEach(p => calculateDepth(p.id))
  
  // 按深度分组
  const levelGroups = new Map<number, Philosopher[]>()
  philosophers.forEach(p => {
    const depth = depths.get(p.id) || 0
    if (!levelGroups.has(depth)) levelGroups.set(depth, [])
    levelGroups.get(depth)!.push(p)
  })
  
  // 按流派和出生年份在同一层级内排序
  const levels = Array.from(levelGroups.keys()).sort((a, b) => a - b)
  levels.forEach(level => {
    const group = levelGroups.get(level)!
    // 第0级特殊处理：米利都学派按出生年份排序
    if (level === 0 && group.some(p => miletuSchool.includes(p.id))) {
      group.sort((a, b) => a.birthYear - b.birthYear)
    } else {
      // 其他层级：按流派的最早哲学家出生年份排序，让同一父级的子级流派按时间顺序排列
      // 先计算每个流派的最早出生年份
      const schoolMinBirthYear = new Map<string, number>()
      group.forEach(p => {
        const current = schoolMinBirthYear.get(p.school) || Infinity
        schoolMinBirthYear.set(p.school, Math.min(current, p.birthYear))
      })
      
      // 按流派最早年份排序，同一流派内按出生年份排序
      group.sort((a, b) => {
        if (a.school !== b.school) {
          const yearA = schoolMinBirthYear.get(a.school) || 0
          const yearB = schoolMinBirthYear.get(b.school) || 0
          return yearA - yearB  // 按流派最早年份排序
        }
        return a.birthYear - b.birthYear  // 同流派按个人出生年份排序
      })
    }
  })
  
  // 为每一层的哲学家分配水平位置
  const horizontalPositions = new Map<string, number>()
  
  levels.forEach(level => {
    const group = levelGroups.get(level)!
    let currentX = 0  // 每一级都从0开始
    
    if (level === 0) {
      // 第0级：米利都学派横向排列
      group.forEach(p => {
        horizontalPositions.set(p.id, currentX)
        currentX++
      })
    } else {
      // 其他层级：按流派分组
      const schoolGroups = new Map<string, Philosopher[]>()
      group.forEach(p => {
        if (!schoolGroups.has(p.school)) schoolGroups.set(p.school, [])
        schoolGroups.get(p.school)!.push(p)
      })
      
      // 计算每个流派的最早年份，用于排序
      const schoolMinYear = new Map<string, number>()
      schoolGroups.forEach((philos, school) => {
        const minYear = Math.min(...philos.map(p => p.birthYear))
        schoolMinYear.set(school, minYear)
      })
      
      // 按流派的最早年份排序（而不是字母顺序），为每个流派组分配连续的水平位置
      Array.from(schoolGroups.keys())
        .sort((a, b) => (schoolMinYear.get(a) || 0) - (schoolMinYear.get(b) || 0))
        .forEach(school => {
          const schoolPhilosophers = schoolGroups.get(school)!
          // 同一流派内按出生年份排序
          schoolPhilosophers.sort((a, b) => a.birthYear - b.birthYear)
          schoolPhilosophers.forEach(p => {
            horizontalPositions.set(p.id, currentX)
            currentX++
          })
        })
    }
  })
  
  // 调整子节点位置：尽量靠近父节点
  for (let iteration = 0; iteration < 3; iteration++) {
    levels.forEach((level, levelIndex) => {
      if (level === 0) return // 跳过根节点
      
      const group = levelGroups.get(level)!
      group.forEach(child => {
        const parents = inMap.get(child.id) || []
        if (parents.length === 0) return
        
        // 计算父节点的平均位置
        const parentPositions = parents
          .map(p => horizontalPositions.get(p))
          .filter(pos => pos !== undefined) as number[]
        
        if (parentPositions.length === 0) return
        
        const avgParentPos = parentPositions.reduce((a, b) => a + b, 0) / parentPositions.length
        const currentPos = horizontalPositions.get(child.id)!
        
        // 尝试将子节点移动到更接近父节点平均位置
        const targetPos = Math.round(avgParentPos)
        
        // 检查是否会与同层级其他节点冲突
        const sameLevel = group.filter(p => p.id !== child.id)
        const occupied = new Set(sameLevel.map(p => horizontalPositions.get(p.id)!))
        
        if (!occupied.has(targetPos) && Math.abs(targetPos - currentPos) <= 2) {
          horizontalPositions.set(child.id, targetPos)
        }
      })
    })
  }
  
  // 计算最终位置
  let maxX = 0
  let maxY = 0
  
  philosophers.forEach(p => {
    const depth = depths.get(p.id) || 0
    const horizontalPos = horizontalPositions.get(p.id) || 0
    
    const x = HORIZONTAL_MARGIN + horizontalPos * (CARD_WIDTH + HORIZONTAL_GAP)
    const y = VERTICAL_MARGIN + depth * (CARD_HEIGHT + VERTICAL_GAP)
    
    positions.set(p.id, { x, y })
    maxX = Math.max(maxX, x + CARD_WIDTH)
    maxY = Math.max(maxY, y + CARD_HEIGHT)
  })
  
  return { positions, bounds: { minX: 0, maxX, minY: 0, maxY } }
}

// 碰撞检测：检查两个矩形是否重叠
function isColliding(pos1: LayoutPosition, pos2: LayoutPosition, padding = 10): boolean {
  const rect1 = {
    left: pos1.x - padding,
    right: pos1.x + CARD_WIDTH + padding,
    top: pos1.y - padding,
    bottom: pos1.y + CARD_HEIGHT + padding
  }
  const rect2 = {
    left: pos2.x - padding,
    right: pos2.x + CARD_WIDTH + padding,
    top: pos2.y - padding,
    bottom: pos2.y + CARD_HEIGHT + padding
  }
  
  return !(rect1.right < rect2.left || 
           rect1.left > rect2.right || 
           rect1.bottom < rect2.top || 
           rect1.top > rect2.bottom)
}

// 调整重叠卡片：如果检测到碰撞，自动调整位置
function resolveCollisions(positions: Map<string, LayoutPosition>): Map<string, LayoutPosition> {
  const adjusted = new Map(positions)
  const ids = Array.from(adjusted.keys())
  
  // 多次迭代以解决连锁碰撞
  for (let iteration = 0; iteration < 3; iteration++) {
    let hasCollision = false
    
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const id1 = ids[i]
        const id2 = ids[j]
        const pos1 = adjusted.get(id1)!
        const pos2 = adjusted.get(id2)!
        
        if (isColliding(pos1, pos2)) {
          hasCollision = true
          
          // 计算调整方向：优先横向调整
          const centerX1 = pos1.x + CARD_WIDTH / 2
          const centerX2 = pos2.x + CARD_WIDTH / 2
          const centerY1 = pos1.y + CARD_HEIGHT / 2
          const centerY2 = pos2.y + CARD_HEIGHT / 2
          
          const dx = centerX2 - centerX1
          const dy = centerY2 - centerY1
          
          // 计算需要的最小偏移量
          const minSeparationX = CARD_WIDTH + 40  // 40px间隔
          const minSeparationY = CARD_HEIGHT + 40
          
          if (Math.abs(dx) > Math.abs(dy)) {
            // 横向调整
            const moveDistance = (minSeparationX - Math.abs(dx)) / 2
            if (dx > 0) {
              adjusted.set(id2, { ...pos2, x: pos2.x + moveDistance })
            } else {
              adjusted.set(id2, { ...pos2, x: pos2.x - moveDistance })
            }
          } else {
            // 纵向调整
            const moveDistance = (minSeparationY - Math.abs(dy)) / 2
            if (dy > 0) {
              adjusted.set(id2, { ...pos2, y: pos2.y + moveDistance })
            } else {
              adjusted.set(id2, { ...pos2, y: pos2.y - moveDistance })
            }
          }
        }
      }
    }
    
    // 如果没有碰撞了，提前退出
    if (!hasCollision) break
  }
  
  return adjusted
}

export interface WesternPhilosophyMapProps {
  dataSource: PhilosophyDataSource
  homeHref?: string
  sourceHref?: string
  onFeedback?: () => void
  searchHotTerms?: HotSearchTerm[]
  onTrackSearch?: (term: string) => void | Promise<void>
}

export default function WesternPhilosophyMap({
  dataSource,
  homeHref = '/',
  sourceHref,
  onFeedback,
  searchHotTerms,
  onTrackSearch
}: WesternPhilosophyMapProps) {
  // 数据状态
  const [philosophers, setPhilosophers] = useState<Philosopher[]>([])
  const [influences, setInfluences] = useState<Influence[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [influenceTypes, setInfluenceTypes] = useState<any[]>([])
  const [autoFitTrigger, setAutoFitTrigger] = useState<string>('')
  const [resetViewportTrigger, setResetViewportTrigger] = useState<string>('')
  const [hotSearches, setHotSearches] = useState<string[]>(['苏格拉底', '柏拉图', '亚里士多德'])
  const [filterCollapsed, setFilterCollapsed] = useState(false) // 默认值会在 useEffect 中根据设备设置
  const [zoomControlExpanded, setZoomControlExpanded] = useState(false)
  const [minimapExpanded, setMinimapExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const skipNextAutoFitRef = useRef(false)

  // 检测设备类型并设置筛选面板初始折叠状态
  useEffect(() => {
    // 只在客户端执行
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768 // md breakpoint
      setFilterCollapsed(isMobile) // 移动端默认折叠，桌面端默认展开
    }
  }, [])

  // UI 状态
  const [selectedPhilosopher, setSelectedPhilosopher] = useState<Philosopher | null>(null)
  const [highlightedPhilosopherId, setHighlightedPhilosopherId] = useState<string | null>(null)
  const [connectedPhilosopherIds, setConnectedPhilosopherIds] = useState<Set<string>>(new Set())
  const [ancestorIds, setAncestorIds] = useState<Set<string>>(new Set())
  const [descendantIds, setDescendantIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(new Set())
  const [selectedPeriods, setSelectedPeriods] = useState<Set<string>>(new Set())
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(new Set())
  const [timePeriods, setTimePeriods] = useState<any[]>([])
  const [availableLevels, setAvailableLevels] = useState<number[]>([])
  // 布局模式：database | school | century | lineage | compact
  const [layoutMode, setLayoutMode] = useState<'database' | 'school' | 'century' | 'lineage' | 'compact'>('database')
  
  // 🔥 动态生成哲学家分组：从实际数据中提取学派并分组
  const philosopherGroups = useMemo(() => {
    if (philosophers.length === 0) return []
    
    // 按学派分组
    const groupBySchool = new Map<string, string[]>()
    
    philosophers.forEach(p => {
      const schoolName = p.school || '未分类'
      if (!groupBySchool.has(schoolName)) {
        groupBySchool.set(schoolName, [])
      }
      groupBySchool.get(schoolName)!.push(p.id)
    })
    
    // 转换为数组格式，按出生年份排序每个学派内的哲学家
    const groups = Array.from(groupBySchool.entries()).map(([name, ids]) => {
      // 按哲学家的出生年份排序 ID
      const sortedIds = ids.sort((a, b) => {
        const philA = philosophers.find(p => p.id === a)
        const philB = philosophers.find(p => p.id === b)
        if (!philA || !philB) return 0
        return philA.birthYear - philB.birthYear
      })
      
      return {
        name,
        ids: sortedIds,
        description: `${sortedIds.length} 位哲学家`
      }
    })
    
    // 按学派内最早哲学家的出生年份排序学派
    groups.sort((a, b) => {
      const firstA = philosophers.find(p => p.id === a.ids[0])
      const firstB = philosophers.find(p => p.id === b.ids[0])
      if (!firstA || !firstB) return 0
      return firstA.birthYear - firstB.birthYear
    })
    
    return groups
  }, [philosophers])

  // The host supplies either a static snapshot or live API data.
  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        const { philosophers: philosophersData, influences: influencesData,
          schools: originalSchools, influenceTypes: influenceTypesData,
          hotSearches: hotSearchesData } = await dataSource.load()
        if (cancelled) return
        // Layout sorting must not mutate the caller's cached snapshot.
        const schoolsData = [...originalSchools]

        // 按 vertical 和 horizontal 字段排序学派
        schoolsData.sort((a: any, b: any) => {
          const verticalA = a.vertical ?? 999
          const verticalB = b.vertical ?? 999
          if (verticalA !== verticalB) {
            return verticalA - verticalB
          }
          const horizontalA = a.horizontal ?? 999
          const horizontalB = b.horizontal ?? 999
          return horizontalA - horizontalB
        })

        // 创建学校名称到颜色的映射
        const schoolColorMap = new Map(schoolsData.map((s: any) => [s.name, s.color]))

        // 解析出生年份的辅助函数
        const parseBirthYear = (period: string): number => {
          // 处理"约前624-前546"、"前469-前399"、"1596-1650"等格式
          // 移除"约"字
          let cleaned = period.replace(/约/g, '')
          
          // 匹配第一个年份
          const bcMatch = cleaned.match(/前(\d+)/)
          if (bcMatch) {
            return -parseInt(bcMatch[1]) // 公元前用负数表示
          }
          
          const adMatch = cleaned.match(/^(\d+)/)
          if (adMatch) {
            return parseInt(adMatch[1])
          }
          
          // 如果是"约前5世纪"这种格式，估算为该世纪中期
          const centuryMatch = cleaned.match(/前(\d+)世纪/)
          if (centuryMatch) {
            const century = parseInt(centuryMatch[1])
            return -(century * 100 - 50) // 例如前5世纪 = -450
          }
          
          return 0 // 默认值
        }

        const parseDeathYear = (period: string): number => {
          if (!period) return 0
          
          // 移除"约"字
          let cleaned = period.replace(/约/g, '').trim()
          
          // 情况1：处理"1929–"格式（没有死亡日期）
          if (cleaned.match(/^\d+[-–—－]\s*$/)) {
            return 2000 // 默认为20世纪
          }
          
          // 情况2：处理范围格式"前334-前262"或"480-524"
          // 注意：需要处理不同类型的破折号：- – — － (包含全角破折号)
          const parts = cleaned.split(/[-–—－]/).map(s => s.trim()).filter(Boolean)
          
          if (parts.length >= 2) {
            // 取最后一个部分作为死亡年份
            const lastPart = parts[parts.length - 1]
            
            // 公元前格式
            const bcMatch = lastPart.match(/前(\d+)/)
            if (bcMatch) {
              return -parseInt(bcMatch[1])
            }
            
            // 公元后格式
            const adMatch = lastPart.match(/(\d+)/)
            if (adMatch) {
              return parseInt(adMatch[1])
            }
          }
          
          // 情况3：单个年份"约500"或"前500"（当作死亡年份）
          if (parts.length === 1) {
            const bcMatch = cleaned.match(/前(\d+)/)
            if (bcMatch) {
              return -parseInt(bcMatch[1])
            }
            
            const adMatch = cleaned.match(/(\d+)/)
            if (adMatch) {
              return parseInt(adMatch[1])
            }
          }
          
          // 默认返回2000（20世纪）
          return 2000
        }

        // 转换数据格式以匹配类型定义
        const transformedPhilosophers: Philosopher[] = philosophersData.map((p: any) => ({
          id: p.id,
          name: {
            zh: p.name_zh || p.chinese_name, // 支持两种schema
            en: p.name_en || p.name
          },
          birthYear: (typeof p.birth_year === 'number' && p.birth_year !== 0)
            ? p.birth_year
            : parseBirthYear(p.period),
          deathYear: (typeof p.death_year === 'number' && p.death_year !== 0)
            ? p.death_year
            : parseDeathYear(p.period),
          school: p.school_name || p.school || '未分类',
          schoolColor: schoolColorMap.get(p.school_name || p.school) || p.color || '#94a3b8',
          nationality: p.nationality || undefined,
          createdAt: (() => {
            const ts = p.created_at || p.createdAt
            if (!ts) return undefined
            const ms = Date.parse(ts)
            return isNaN(ms) ? undefined : ms
          })(),
          mainIdeas: p.main_ideas || p.contributions || [],
          quotes: p.quotes || [],
          majorWorks: p.major_works || p.works || [],
          detailedBio: (() => {
            // 处理 detailedBio 的多种格式
            const rawBio = p.detailed_bio || p.description
            if (!rawBio) return []
            if (Array.isArray(rawBio)) return rawBio
            
            // 如果是 JSON 字符串，尝试解析
            if (typeof rawBio === 'string') {
              if (rawBio.startsWith('[')) {
                try {
                  const parsed = JSON.parse(rawBio)
                  return Array.isArray(parsed) ? parsed : [rawBio]
                } catch (e) {
                  return [rawBio]
                }
              }
              return [rawBio]
            }
            
            return []
          })(),
          inheritedThoughts: (() => {
            // 处理 inherited_thoughts 的多种格式
            const raw = p.inherited_thoughts
            if (!raw) return []
            if (Array.isArray(raw)) return raw
            
            // 如果是 JSON 字符串，尝试解析
            if (typeof raw === 'string') {
              if (raw.startsWith('[')) {
                try {
                  const parsed = JSON.parse(raw)
                  return Array.isArray(parsed) ? parsed : [raw]
                } catch (e) {
                  return [raw]
                }
              }
              return [raw]
            }
            
            return []
          })(),
          laterInfluence: (() => {
            // 优先使用 later_influence，然后是 legacy_impact（向后兼容）
            const raw = p.later_influence || p.legacy_impact
            if (!raw) return []
            if (Array.isArray(raw)) return raw
            
            // 如果是 JSON 字符串，尝试解析
            if (typeof raw === 'string') {
              if (raw.startsWith('[')) {
                try {
                  const parsed = JSON.parse(raw)
                  return Array.isArray(parsed) ? parsed : [raw]
                } catch (e) {
                  return [raw]
                }
              }
              return [raw]
            }
            
            return []
          })(),
          positionOverride: p.position_override || null
        }))

        // 映射数据库的 influence_type 到前端类型
        const mapInfluenceType = (dbType: string): 'direct' | 'indirect' | 'opposition' => {
          switch (dbType) {
            case 'teacher-student':
            case 'influence':
              return 'direct'
            case 'inspiration':
            case 'collaboration':
              return 'indirect'
            case 'debate':
            case 'opposition':
              return 'opposition'
            default:
              return 'direct'
          }
        }

        const transformedInfluences: Influence[] = influencesData.map((inf: any) => ({
          id: inf.id.toString(),
          from: inf.from_philosopher_id,
          to: inf.to_philosopher_id,
          type: mapInfluenceType(inf.influence_type),
          description: inf.description || '',
          rawType: inf.influence_type
        }))

        // 动态生成时代分类（基于哲学家的生卒年）
        const generatedPeriods = generateTimePeriods(transformedPhilosophers)
        
        // 从流派数据中提取所有不同的层级值
        const levels = Array.from(
          new Set<number>(
            schoolsData
              .map((s: any) => s.vertical as number)
              .filter((v: any) => v !== null && v !== undefined)
          )
        ).sort((a, b) => a - b)
        
        setPhilosophers(transformedPhilosophers)
        setInfluences(transformedInfluences)
        setSchools(schoolsData)
        setInfluenceTypes(influenceTypesData)
        setTimePeriods(generatedPeriods)
        setHotSearches(hotSearchesData)
        setAvailableLevels(levels)
        
        // 调试日志
        console.log('✅ 数据加载成功!')
        console.log('哲学家数量:', transformedPhilosophers.length)
        console.log('影响关系数量:', transformedInfluences.length)
        console.log('流派数量:', schoolsData.length)
        console.log('影响类型数量:', influenceTypesData.length)
        console.log('动态生成时期数量:', generatedPeriods.length)
        console.log('热门搜索数量:', hotSearchesData.length)
        console.log('第一位哲学家:', transformedPhilosophers[0])
      } catch (err) {
        if (cancelled) return
        console.error('❌ Error fetching philosophy data:', err)
        setError('Failed to load philosophy data. Please try again later.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [dataSource])

  useEffect(() => {
    if (!dataSource.subscribeToPhilosophers) return
    return dataSource.subscribeToPhilosophers((p) => {
        const schoolName = p.school_name || p.school || '未分类'
        const schoolColor = (schools.find(s => s.name === schoolName)?.color) || p.color || '#94a3b8'
        const parseCreatedAt = () => {
          const ts = p.created_at || p.createdAt
          if (!ts) return undefined as number | undefined
          const ms = Date.parse(ts)
          return isNaN(ms) ? undefined : ms
        }
        const toArray = (raw: any) => {
          if (!raw) return [] as string[]
          if (Array.isArray(raw)) return raw as string[]
          if (typeof raw === 'string') {
            if (raw.startsWith('[')) {
              try {
                const parsed = JSON.parse(raw)
                return Array.isArray(parsed) ? parsed : [raw]
              } catch { return [raw] }
            }
            return [raw]
          }
          return [] as string[]
        }
        const phi: Philosopher = {
          id: p.id,
          name: { zh: p.name_zh || p.chinese_name || '', en: p.name_en || p.name || '' },
          birthYear: p.birth_year ?? 0,
          deathYear: p.death_year ?? 0,
          school: schoolName,
          schoolColor,
          createdAt: parseCreatedAt(),
          mainIdeas: p.main_ideas || p.contributions || [],
          quotes: p.quotes || [],
          majorWorks: p.major_works || p.works || [],
          detailedBio: toArray(p.detailed_bio || p.description),
          inheritedThoughts: toArray(p.inherited_thoughts),
          laterInfluence: toArray(p.later_influence || p.legacy_impact)
        }
        setPhilosophers(prev => prev.some(x => x.id === phi.id) ? prev : [...prev, phi])
    })
  }, [schools, dataSource])

  // 流派和时代筛选（不包含搜索）
  const filteredPhilosophers = useMemo(() => {
    let filtered = philosophers
    
    // 流派筛选（多选）
    if (selectedSchools.size > 0) {
      filtered = filtered.filter(p => p.school && selectedSchools.has(p.school))
    }

    // 时代筛选（按死亡年份，多选）
    if (selectedPeriods.size > 0) {
      const selectedRanges = timePeriods.filter((tp: any) => selectedPeriods.has(tp.id))
      filtered = filtered.filter(p => {
        const yearToUse = (p.deathYear && p.deathYear !== 0) ? p.deathYear : 2000
        return selectedRanges.some((r: any) => yearToUse >= r.start_year && yearToUse <= r.end_year)
      })
    }

    // 层级筛选（根据流派的 vertical 字段）
    if (selectedLevels.size > 0) {
      // 创建层级到流派的映射
      const levelToSchools = new Map<number, Set<string>>()
      schools.forEach(school => {
        const level = school.vertical
        if (level !== null && level !== undefined) {
          if (!levelToSchools.has(level)) {
            levelToSchools.set(level, new Set())
          }
          levelToSchools.get(level)!.add(school.name)
        }
      })
      
      // 获取所选层级的所有流派
      const schoolsInSelectedLevels = new Set<string>()
      selectedLevels.forEach(level => {
        const schoolsAtLevel = levelToSchools.get(level)
        if (schoolsAtLevel) {
          schoolsAtLevel.forEach(school => schoolsInSelectedLevels.add(school))
        }
      })
      
      // 筛选属于所选层级流派的哲学家
      filtered = filtered.filter(p => 
        p.school && schoolsInSelectedLevels.has(p.school)
      )
    }
    return filtered
  }, [philosophers, selectedSchools, selectedPeriods, selectedLevels, timePeriods, schools])

  // 搜索匹配的哲学家列表（保持顺序，分数最高的在前）
  const searchMatchedPhilosophers = useMemo(() => {
    if (!searchQuery.trim()) {
      return []
    }
    
    // 使用增强的搜索功能找到匹配的哲学家（已按分数排序）
    return searchPhilosophers(filteredPhilosophers, searchQuery)
  }, [searchQuery, filteredPhilosophers])
  
  // 搜索匹配的哲学家ID集合（用于高亮）
  const searchMatchedIds = useMemo(() => {
    return new Set(searchMatchedPhilosophers.map(p => p.id))
  }, [searchMatchedPhilosophers])

  // 获取筛选后的影响关系（只显示筛选后哲学家之间的关系）
  const filteredInfluences = useMemo(() => {
    const philosopherIds = new Set(filteredPhilosophers.map(p => p.id))
    return influences.filter(inf => 
      philosopherIds.has(inf.from) && philosopherIds.has(inf.to)
    )
  }, [influences, filteredPhilosophers])

  // 清除所有筛选
  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedSchools(new Set())
    setSelectedPeriods(new Set())
    setSelectedLevels(new Set())
    setResetViewportTrigger(`clear_${Date.now()}`)
  }

  // 检查是否有激活的筛选
  const hasActiveFilters = searchQuery.trim() || selectedSchools.size > 0 || selectedPeriods.size > 0 || selectedLevels.size > 0

  // 监听筛选条件变化，触发自动定位
  useEffect(() => {
    if (skipNextAutoFitRef.current) {
      skipNextAutoFitRef.current = false
      return
    }
    // 只在有筛选条件时触发
    if (!hasActiveFilters) return
    
    // 延迟触发，确保状态已更新
    // 搜索时使用更短的延迟，筛选时使用稍长延迟
    const delay = searchQuery.trim() ? 100 : 50
    const timer = setTimeout(() => {
      // 生成唯一的trigger值来触发AutoFitView
      const schoolsKey = Array.from(selectedSchools).sort().join('|') || 'all'
      const periodsKey = Array.from(selectedPeriods).sort().join('|') || 'all'
      const levelsKey = Array.from(selectedLevels).sort().join('|') || 'all'
      const trigger = `${searchQuery}_${schoolsKey}_${periodsKey}_${levelsKey}_${Date.now()}`
      setAutoFitTrigger(trigger)
      console.log('🔍 触发自动定位:', { searchQuery, schools: schoolsKey, periods: periodsKey, levels: levelsKey })
    }, delay)
    
    return () => clearTimeout(timer)
  }, [searchQuery, selectedSchools, selectedPeriods, selectedLevels, hasActiveFilters])

  // 处理哲学家点击 - 高亮影响链路
  const handlePhilosopherClick = useCallback((philosopher: Philosopher) => {
    setSelectedPhilosopher(philosopher)
    setHighlightedPhilosopherId(philosopher.id)
    
    // 找出所有相关的哲学家（影响者和被影响者）
    const connected = new Set<string>()
    influences.forEach(inf => {
      if (inf.from === philosopher.id) {
        connected.add(inf.to)
      }
      if (inf.to === philosopher.id) {
        connected.add(inf.from)
      }
    })
    setConnectedPhilosopherIds(connected)

    // 计算祖先与后继集合（限制深度可加参数，这里无限）
    const inMap = new Map<string,string[]>()
    const outMap = new Map<string,string[]>()
    influences.forEach(inf => {
      inMap.set(inf.to, [...(inMap.get(inf.to) || []), inf.from])
      outMap.set(inf.from, [...(outMap.get(inf.from) || []), inf.to])
    })
    const collect = (start: string, map: Map<string,string[]>) => {
      const visited = new Set<string>()
      const stack = [start]
      while (stack.length) {
        const id = stack.pop()!
        const next = map.get(id) || []
        next.forEach(n => { if (!visited.has(n)) { visited.add(n); stack.push(n) } })
      }
      visited.delete(start)
      return visited
    }
    setAncestorIds(collect(philosopher.id, inMap))
    setDescendantIds(collect(philosopher.id, outMap))
  }, [influences])

  // 关闭详情面板时清除高亮
  useEffect(() => {
    if (!selectedPhilosopher) {
      setHighlightedPhilosopherId(null)
      setConnectedPhilosopherIds(new Set())
      setAncestorIds(new Set())
      setDescendantIds(new Set())
    }
  }, [selectedPhilosopher])

  // 将哲学家数据转换为 React Flow 节点
  const { positions: layoutPositions, bounds: layoutBounds } = useMemo(() => {
    let result
    if (layoutMode === 'database') {
      result = calculateDatabaseLayout(filteredPhilosophers, schools)
    } else if (layoutMode === 'century') {
      result = calculateLayout(filteredPhilosophers, filteredInfluences)
    } else if (layoutMode === 'school') {
      result = calculateSchoolLayout(filteredPhilosophers)
    } else if (layoutMode === 'compact') {
      result = calculateCompactLayout(filteredPhilosophers, schools)
    } else {
      result = calculateLineageLayout(filteredPhilosophers, filteredInfluences)
    }
    
    // 应用碰撞检测和调整
    const adjustedPositions = resolveCollisions(result.positions)
    
    // 重新计算边界
    let maxX = 0
    let maxY = 0
    adjustedPositions.forEach(pos => {
      maxX = Math.max(maxX, pos.x + CARD_WIDTH)
      maxY = Math.max(maxY, pos.y + CARD_HEIGHT)
    })
    
    return {
      positions: adjustedPositions,
      bounds: { minX: 0, maxX, minY: 0, maxY }
    }
  }, [filteredPhilosophers, filteredInfluences, layoutMode, schools])

  const initialNodes: Node[] = useMemo(() => {
    console.log('🔄 生成节点，哲学家数量:', filteredPhilosophers.length)
    
    // 动态获取米利都学派的哲学家ID（同级水平排列）
    const miletuSchoolIds = new Set(
      filteredPhilosophers
        .filter(p => p.school === '米利都学派')
        .map(p => p.id)
    )
    
    const nodes = filteredPhilosophers.map((philosopher: Philosopher) => {
      const position = layoutPositions.get(philosopher.id) || { x: 0, y: 0 }
      const isHighlighted = highlightedPhilosopherId === philosopher.id
      const isConnected = connectedPhilosopherIds.has(philosopher.id)
      
      // 检查是否是搜索匹配项
      const isSearchMatch = searchMatchedIds.has(philosopher.id)
      
      // 判断是否是同级（米利都学派内部为同级）
      const isSameLevel = miletuSchoolIds.has(philosopher.id)
      
      return {
        id: philosopher.id,
        type: 'philosopher',
        position,
        data: {
          philosopher,
          onClick: handlePhilosopherClick,
          isHighlighted: isHighlighted || isSearchMatch, // 点击高亮或搜索匹配高亮
          isConnected,
          isAncestor: ancestorIds.has(philosopher.id),
          isDescendant: descendantIds.has(philosopher.id),
          isDimmed: highlightedPhilosopherId ? !(isHighlighted || ancestorIds.has(philosopher.id) || descendantIds.has(philosopher.id)) : false,
          isSameLevel // 同级标记
        }
      }
    })
    
    console.log('✅ 生成节点完成，节点数量:', nodes.length)
    if (nodes.length > 0) {
      console.log('第一个节点:', nodes[0])
    }
    
    return nodes
  }, [filteredPhilosophers, highlightedPhilosopherId, connectedPhilosopherIds, handlePhilosopherClick, searchMatchedIds, layoutPositions])

  // 将影响关系转换为 React Flow 边
  const initialEdges: Edge[] = useMemo(() => {
    console.log('🔄 生成边，影响关系数量:', filteredInfluences.length)
    
    // 预处理：按方向分组统计边数量，用于分散多条边
    // 关键：相同源节点、相同方向的边才需要分散
    const sourceDirectionEdges = new Map<string, Map<string, Array<{to: string, inf: any}>>>()
    
    filteredInfluences.forEach(inf => {
      const fromPos = layoutPositions.get(inf.from)
      const toPos = layoutPositions.get(inf.to)
      
      // 默认方向为 'unknown'
      let direction = 'unknown'
      
      if (fromPos && toPos) {
        // 计算方向：根据相对位置确定方向类别
        const deltaX = toPos.x - fromPos.x
        const deltaY = toPos.y - fromPos.y
        
        // 将方向分为8个扇区，但扩大"right"的范围
        // 关键：只要主要是向右（deltaX > 0 且 |deltaX| > |deltaY|），就分类为 right
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
        const absAngle = Math.abs(angle)
        
        // 优先判断主要方向（水平 vs 垂直）
        if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
          // 主要是水平方向（deltaX 明显大于 deltaY）
          direction = deltaX > 0 ? 'right' : 'left'
        } else if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
          // 主要是垂直方向（deltaY 明显大于 deltaX）
          direction = deltaY > 0 ? 'down' : 'up'
        } else {
          // 对角线方向，使用更细的角度划分
          if (angle >= -22.5 && angle < 22.5) direction = 'right'
          else if (angle >= 22.5 && angle < 67.5) direction = 'right-down'
          else if (angle >= 67.5 && angle < 112.5) direction = 'down'
          else if (angle >= 112.5 && angle < 157.5) direction = 'left-down'
          else if (angle >= 157.5 || angle < -157.5) direction = 'left'
          else if (angle >= -157.5 && angle < -112.5) direction = 'left-up'
          else if (angle >= -112.5 && angle < -67.5) direction = 'up'
          else if (angle >= -67.5 && angle < -22.5) direction = 'right-up'
        }
        
        // 调试日志
        if (inf.from.includes('anaximenes') || inf.from.includes('阿那克西美尼')) {
          console.log(`📐 ${inf.from} → ${inf.to}: deltaX=${deltaX.toFixed(0)}, deltaY=${deltaY.toFixed(0)}, angle=${angle.toFixed(1)}°, direction=${direction}`)
        }
      }
      
      // 按源节点和方向分组
      if (!sourceDirectionEdges.has(inf.from)) {
        sourceDirectionEdges.set(inf.from, new Map())
      }
      const directionMap = sourceDirectionEdges.get(inf.from)!
      if (!directionMap.has(direction)) {
        directionMap.set(direction, [])
      }
      directionMap.get(direction)!.push({ to: inf.to, inf })
    })
    
    // 为每个方向组内的边分配索引
    const edgeOffsetMap = new Map<string, {offset: number, total: number}>()
    sourceDirectionEdges.forEach((directionMap, source) => {
      directionMap.forEach((edges, direction) => {
        console.log(`📍 ${source} → ${direction} 方向有 ${edges.length} 条边:`, edges.map(e => e.to))
        edges.forEach((edge, index) => {
          const key = `${source}->${edge.to}`
          edgeOffsetMap.set(key, {
            offset: index,
            total: edges.length
          })
        })
      })
    })
    
    const edges = filteredInfluences.map(influence => {
      const isDirectlySelected = highlightedPhilosopherId ? (
        influence.from === highlightedPhilosopherId || influence.to === highlightedPhilosopherId
      ) : false
      const isAncestorEdge = ancestorIds.has(influence.from) && (ancestorIds.has(influence.to) || influence.to === highlightedPhilosopherId)
      const isDescendantEdge = descendantIds.has(influence.to) && (descendantIds.has(influence.from) || influence.from === highlightedPhilosopherId)
      const isRelevant = isDirectlySelected || isAncestorEdge || isDescendantEdge
      
      // 先计算该边的分散偏移量（基于方向分组）
      const edgeKey = `${influence.from}->${influence.to}`
      const edgeInfo = edgeOffsetMap.get(edgeKey)
      const totalEdgesInDirection = edgeInfo?.total || 1
      const currentEdgeIndex = edgeInfo?.offset || 0
      
      // 只有在同一方向有多条边时才计算偏移量
      let edgeOffset = 0
      if (totalEdgesInDirection > 1) {
        if (totalEdgesInDirection === 2) {
          edgeOffset = currentEdgeIndex === 0 ? -1 : 1
        } else {
          edgeOffset = (currentEdgeIndex - (totalEdgesInDirection - 1) / 2) / Math.max(1, (totalEdgesInDirection - 1) / 2)
        }
      }
      
      // 判断连线类型：根据相对位置选择最佳路径
      const fromPos = layoutPositions.get(influence.from)
      const toPos = layoutPositions.get(influence.to)
      
      // 使用自定义边类型来完全控制标签位置
      const edgeType = 'custom'

      // base color: read from influence_types (DB)
      const typeKeyForColor = influence.rawType || influence.type
      const typeConfigForColor = influenceTypes.find((t: any) => t.value === typeKeyForColor)
      let stroke = (typeConfigForColor && typeConfigForColor.color) ? typeConfigForColor.color : '#3b82f6'
      // keep highlights via width/opacity; do not override color

      const width = isDirectlySelected ? 3.5 : (isAncestorEdge || isDescendantEdge ? 3 : (influence.type === 'direct' ? 2 : 1.5))
      const dash = influence.type === 'indirect' ? '5,5' : (influence.type === 'opposition' ? '3,3' : undefined)

      // 关系文本：从 influenceTypes 数据库中查找 label_zh
      const raw = influence.rawType || influence.type
      const influenceTypeObj = influenceTypes.find(t => t.value === raw)
      const relationVerb = influenceTypeObj?.label_zh || raw  // 使用数据库的 label_zh，fallback 到原始值
      
      // 简化标签文字
      const labelText = relationVerb

      // 🎯 简化连接点规则：三种情况
      let sourceHandle = 'source-main'
      let targetHandle = 'target-main'
      
      if (fromPos && toPos) {
        const deltaY = toPos.y - fromPos.y
        const deltaX = toPos.x - fromPos.x
        
        // 判断是否为上下级关系
        const isDownwardRelation = deltaY > 50  // 目标在源节点下方（父→子）
        const isUpwardRelation = deltaY < -50   // 目标在源节点上方（子→父）
        
        if (isDownwardRelation) {
          // 🔥 情况1：向下影响（父→子）- 父级底部 → 子级顶部
          
          // 收集所有从同一父级向下的边，按目标X坐标排序
          const downwardEdges = filteredInfluences.filter(inf => {
            const infFromPos = layoutPositions.get(inf.from);
            const infToPos = layoutPositions.get(inf.to);
            return inf.from === influence.from && 
                   infFromPos && infToPos &&
                   infToPos.y > infFromPos.y + 50;  // 向下且有足够距离
          }).sort((a, b) => {
            const aPos = layoutPositions.get(a.to)!;
            const bPos = layoutPositions.get(b.to)!;
            return aPos.x - bPos.x; // 按X坐标从左到右排序
          });
          
          const edgeIndex = downwardEdges.findIndex(e => e.to === influence.to);
          const totalDownwardEdges = downwardEdges.length;
          
          if (totalDownwardEdges === 1) {
            // 单条边：父级底部中心 → 子级顶部中心
            sourceHandle = 'source-main'
            targetHandle = 'target-main'
          } else if (totalDownwardEdges === 2) {
            // 两条边：左右分布
            sourceHandle = edgeIndex === 0 ? 'source-bottom-left' : 'source-bottom-right';
            targetHandle = edgeIndex === 0 ? 'target-top-left' : 'target-top-right';
          } else if (totalDownwardEdges >= 3) {
            // 三条或更多：左、中、右分布
            if (edgeIndex === 0) {
              sourceHandle = 'source-bottom-left'
              targetHandle = 'target-top-left'
            } else if (edgeIndex === totalDownwardEdges - 1) {
              sourceHandle = 'source-bottom-right'
              targetHandle = 'target-top-right'
            } else {
              sourceHandle = 'source-main'
              targetHandle = 'target-main'
            }
          }
          
        } else if (isUpwardRelation) {
          // 🔥 情况2：向上影响（子→父）- 子级顶部 → 父级底部
          
          // 收集所有从同一子级向上的边，按目标X坐标排序
          const upwardEdges = filteredInfluences.filter(inf => {
            const infFromPos = layoutPositions.get(inf.from);
            const infToPos = layoutPositions.get(inf.to);
            return inf.from === influence.from && 
                   infFromPos && infToPos &&
                   infToPos.y < infFromPos.y - 50;  // 向上且有足够距离
          }).sort((a, b) => {
            const aPos = layoutPositions.get(a.to)!;
            const bPos = layoutPositions.get(b.to)!;
            return aPos.x - bPos.x; // 按X坐标从左到右排序
          });
          
          const edgeIndex = upwardEdges.findIndex(e => e.to === influence.to);
          const totalUpwardEdges = upwardEdges.length;
          
          if (totalUpwardEdges === 1) {
            // 单条边：子级顶部中心 → 父级底部中心
            sourceHandle = 'source-top-main'  // 使用顶部source
            targetHandle = 'target-bottom-main'  // 使用底部target
          } else if (totalUpwardEdges === 2) {
            // 两条边：左右分布
            sourceHandle = edgeIndex === 0 ? 'source-top-left' : 'source-top-right';
            targetHandle = edgeIndex === 0 ? 'target-bottom-left' : 'target-bottom-right';
          } else if (totalUpwardEdges >= 3) {
            // 三条或更多：左、中、右分布
            if (edgeIndex === 0) {
              sourceHandle = 'source-top-left'
              targetHandle = 'target-bottom-left'
            } else if (edgeIndex === totalUpwardEdges - 1) {
              sourceHandle = 'source-top-right'
              targetHandle = 'target-bottom-right'
            } else {
              sourceHandle = 'source-top-main'
              targetHandle = 'target-bottom-main'
            }
          }
          
        } else {
          // 🔥 情况3：平级影响 - 左右连接
          if (deltaX > 0) {
            // to 在 from 右侧：从右侧连接左侧
            if (totalEdgesInDirection === 1) {
              sourceHandle = 'source-right'
              targetHandle = 'target-left'
            } else if (totalEdgesInDirection === 2) {
              sourceHandle = currentEdgeIndex === 0 ? 'source-right-top' : 'source-right-bottom'
              targetHandle = 'target-left'
            } else {
              // 3条或更多
              sourceHandle = currentEdgeIndex === 0 ? 'source-right-top' :
                            currentEdgeIndex === 1 ? 'source-right' : 'source-right-bottom'
              targetHandle = 'target-left'
            }
          } else {
            // to 在 from 左侧：从左侧连接右侧
            if (totalEdgesInDirection === 1) {
              sourceHandle = 'source-left'
              targetHandle = 'target-right'
            } else if (totalEdgesInDirection === 2) {
              sourceHandle = currentEdgeIndex === 0 ? 'source-left-top' : 'source-left-bottom'
              targetHandle = 'target-right'
            } else {
              // 3条或更多
              sourceHandle = currentEdgeIndex === 0 ? 'source-left-top' :
                            currentEdgeIndex === 1 ? 'source-left' : 'source-left-bottom'
              targetHandle = 'target-right'
            }
          }
        }
      }

      // 多条边的分散通过两种方式实现：
      // 1. 使用不同的 sourceHandle（让边从不同位置出发）
      // 2. 标签偏移（让标签在视觉上分散）

      // 计算标签偏移（用于自定义边组件）
      const verticalOffset = totalEdgesInDirection > 1 ? edgeOffset * 20 : 0
      
      if (totalEdgesInDirection > 1) {
        console.log(`🎨 ${influence.from} → ${influence.to}: source=${sourceHandle}, target=${targetHandle}, 标签偏移=${verticalOffset}px (${currentEdgeIndex}/${totalEdgesInDirection})`)
      }

      const edge: any = {
        id: influence.id,
        source: influence.from,
        target: influence.to,
        sourceHandle,
        targetHandle,
        type: edgeType,
        animated: isDirectlySelected || (influence.type === 'direct' && (isAncestorEdge || isDescendantEdge)),
        style: {
          stroke,
          strokeWidth: width,
          strokeDasharray: dash,
          opacity: highlightedPhilosopherId ? (isRelevant ? 1 : 0.15) : 0.85
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
        label: labelText,
        // 为自定义边组件传递数据
        data: {
          edgeOffset,
          edgeIndex: currentEdgeIndex,
          totalEdges: totalEdgesInDirection,
          verticalOffset
        }
      }
      
      return edge
    })
    
    return edges
  }, [filteredInfluences, highlightedPhilosopherId, ancestorIds, descendantIds, layoutPositions, filteredPhilosophers, influenceTypes])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // 保存初始节点位置
  const initialNodesRef = useRef<Node[]>([])

  // 当 initialNodes 变化时更新节点并保存初始位置
  useEffect(() => {
    setNodes(initialNodes)
    // 深拷贝保存初始位置
    initialNodesRef.current = initialNodes.map(node => ({
      ...node,
      position: { ...node.position }
    }))
  }, [initialNodes, setNodes])

  // 当 initialEdges 变化时更新边
  useEffect(() => {
    setEdges(initialEdges)
  }, [initialEdges, setEdges])

  // 重置节点位置到初始状态
  const handleResetNodes = useCallback(() => {
    if (initialNodesRef.current.length > 0) {
      setNodes(nodes => 
        nodes.map(node => {
          const initialNode = initialNodesRef.current.find(n => n.id === node.id)
          if (initialNode) {
            return {
              ...node,
              position: { ...initialNode.position }
            }
          }
          return node
        })
      )
    }
  }, [setNodes])

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node)
  }, [])

  // 加载状态
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-lg text-gray-600">加载哲学数据中...</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-600 text-5xl">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800">加载失败</h2>
          <p className="text-gray-600">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            重新加载
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex flex-col">
      {/* 顶部标题栏 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sm:p-4 md:p-6 shadow-lg">
        <div className="px-2 sm:px-4 md:px-6 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">西方哲学思想脉络图</h1>
            <p className="text-xs sm:text-sm md:text-base text-blue-100">探索从古希腊到当代西方哲学思想的传承与演变</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {sourceHref && (
              <a href={sourceHref} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center rounded-md px-2 py-2 text-xs sm:text-sm font-medium text-white hover:bg-white/20 transition-colors"
                aria-label="查看本版本源码与 AGPL-3.0 许可" title="查看本版本源码与 AGPL-3.0 许可">
                源码<span className="hidden sm:inline"> · AGPL-3.0</span>
              </a>
            )}
            <a href={homeHref}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 md:gap-2 whitespace-nowrap h-8 md:h-10 text-xs md:text-sm text-white hover:bg-white/20 transition-all duration-200 flex-shrink-0"
                title="返回首页"
              >
                <Home className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="hidden sm:inline">返回首页</span>
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* 搜索和筛选工具栏 */}
      <div className="bg-gradient-to-b from-blue-50/50 to-white border-b border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
        <div className="px-2 sm:px-4 md:px-6 space-y-3 md:space-y-4">
          {/* 搜索框区域 - 居中显示 */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* 左侧占位 */}
            <div className="hidden lg:flex flex-1"></div>
            
            {/* 中间：搜索框和布局按钮 */}
            <div className="flex-1 max-w-6xl">
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
                {/* 搜索框带光晕效果 */}
                <div className="relative md:flex-[3] w-full md:min-w-[500px] min-w-0">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-lg blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                  <div className="relative">
                    <EnhancedSearchBar
                      value={searchQuery}
                      onChange={setSearchQuery}
                      onSearch={() => {
                        if (searchQuery.trim()) {
                          addToSearchHistory(searchQuery.trim())
                          // 触发自动定位到搜索结果
                          const trigger = `search_${searchQuery}_${Date.now()}`
                          setAutoFitTrigger(trigger)
                        }
                      }}
                      placeholder="搜索哲学家（中文/英文）、流派或思想（支持拼音/首字母）"
                      hotSearches={hotSearches}
                      globalHotTerms={searchHotTerms}
                      onTrackSearch={onTrackSearch}
                      philosophers={philosophers}
                      onSelectPhilosopher={(philosopher) => {
                        // 设置搜索query，这会触发筛选和高亮
                        setSearchQuery(philosopher.name.zh)
                        // 触发自动定位
                        const trigger = `select_${philosopher.id}_${Date.now()}`
                        setAutoFitTrigger(trigger)
                      }}
                    />
                  </div>
                </div>
                
                {/* 布局模式切换 */}
                <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                  <Button
                    variant={layoutMode === 'database' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 md:h-10 px-2 md:px-3 text-xs whitespace-nowrap flex-shrink-0"
                    onClick={() => { setLayoutMode('database'); skipNextAutoFitRef.current = true; setResetViewportTrigger(`layout_database_${Date.now()}`) }}
                    title="使用数据库配置的位置"
                  >默认</Button>
                  <Button
                    variant={layoutMode === 'compact' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 md:h-10 px-2 md:px-3 text-xs whitespace-nowrap flex-shrink-0"
                    onClick={() => { setLayoutMode('compact'); skipNextAutoFitRef.current = true; setResetViewportTrigger(`layout_compact_${Date.now()}`) }}
                    title="紧凑布局：优化横向排列，解决位置冲突"
                  >紧凑</Button>
                  <Button
                    variant={layoutMode === 'school' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 md:h-10 px-2 md:px-3 text-xs whitespace-nowrap flex-shrink-0"
                    onClick={() => { setLayoutMode('school'); skipNextAutoFitRef.current = true; setResetViewportTrigger(`layout_school_${Date.now()}`) }}
                  >流派</Button>
                  <Button
                    variant={layoutMode === 'century' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 md:h-10 px-2 md:px-3 text-xs whitespace-nowrap flex-shrink-0"
                    onClick={() => { setLayoutMode('century'); skipNextAutoFitRef.current = true; setResetViewportTrigger(`layout_century_${Date.now()}`) }}
                  >世纪</Button>
                  <Button
                    variant={layoutMode === 'lineage' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 md:h-10 px-2 md:px-3 text-xs whitespace-nowrap flex-shrink-0"
                    onClick={() => { setLayoutMode('lineage'); skipNextAutoFitRef.current = true; setResetViewportTrigger(`layout_lineage_${Date.now()}`) }}
                  >传承</Button>
                </div>
              </div>
            </div>
            
            {/* 右侧：意见反馈按钮 */}
            <div className="hidden lg:flex flex-1 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={onFeedback}
                disabled={!onFeedback}
                className="gap-1.5 md:gap-2 whitespace-nowrap h-8 md:h-10 text-xs md:text-sm border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md relative overflow-hidden group"
              >
                {/* 按钮背景动画效果 */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                
                {/* 图标带脉冲效果 */}
                <span className="relative">
                  <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
                  <span className="absolute inset-0 animate-ping opacity-75">
                    <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-400" />
                  </span>
                </span>
                
                <span className="relative font-medium text-blue-600">
                  意见反馈
                </span>
                
                {/* 小徽章提示 */}
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </Button>
            </div>
            
            {/* 移动端：意见反馈按钮 */}
            <div className="lg:hidden w-full flex justify-end mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onFeedback}
                disabled={!onFeedback}
                className="gap-1.5 whitespace-nowrap h-8 text-xs border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md relative overflow-hidden group"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                <span className="relative">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                  <span className="absolute inset-0 animate-ping opacity-75">
                    <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                  </span>
                </span>
                <span className="relative font-medium text-blue-600">
                  <span className="hidden sm:inline">意见</span>反馈
                </span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </Button>
            </div>
          </div>

          {/* 横向筛选框 */}
          <div className="border rounded-lg bg-gray-50/50">
            {/* 标题栏：始终显示 */}
            <div className="flex items-center justify-between p-3 md:p-4 pb-2 md:pb-3">
              <div className="flex items-center gap-2 md:gap-3">
                <Filter className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-600" />
                <span className="font-medium text-xs md:text-sm text-gray-700">筛选条件</span>
                {hasActiveFilters && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-1.5 md:px-2 py-0.5 rounded-full">
                    {selectedSchools.size + selectedPeriods.size + selectedLevels.size}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 md:gap-2">
                {/* 清除全部按钮 */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-xs h-7 px-2 md:px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-3 w-3 mr-0.5 md:mr-1" />
                    <span className="hidden sm:inline">清除</span>
                  </Button>
                )}
                {/* 折叠按钮 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilterCollapsed(!filterCollapsed)}
                  className="text-xs h-7 px-2 md:px-3"
                >
                  {filterCollapsed ? (
                    <>
                      <ChevronDown className="h-3 w-3 mr-0.5 md:mr-1" />
                      <span className="hidden sm:inline">展开</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-3 w-3 mr-0.5 md:mr-1" />
                      <span className="hidden sm:inline">收起</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 筛选内容区域：可折叠 */}
            {!filterCollapsed && (
              <div className="px-3 md:px-4 pb-3 md:pb-4 space-y-2 md:space-y-3 max-h-[200px] md:max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {/* 流派筛选 - 移动端垂直堆叠，桌面端横向 */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-2 md:gap-3">
                <span className="text-xs md:text-sm text-gray-600 whitespace-nowrap min-w-[50px] md:min-w-[60px] pt-1">流派:</span>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  <Button
                    variant={selectedSchools.size === 0 ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2 md:px-3 text-xs"
                    onClick={() => { setSelectedSchools(new Set()); skipNextAutoFitRef.current = true; setResetViewportTrigger(`schools_all_${Date.now()}`) }}
                  >
                    全部流派
                  </Button>
                  {schools.map(school => (
                    <Button
                      key={school.id}
                      variant={selectedSchools.has(school.name) ? "default" : "outline"}
                      size="sm"
                      className="h-7 px-2 md:px-3 text-xs flex items-center gap-1 md:gap-1.5"
                      onClick={() => setSelectedSchools(prev => { const next = new Set(prev); if (next.has(school.name)) next.delete(school.name); else next.add(school.name); return next; })}
                    >
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: school.color }}
                      />
                      {school.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 时代筛选 - 移动端垂直堆叠，桌面端横向 */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 md:gap-3">
                <span className="text-xs md:text-sm text-gray-600 whitespace-nowrap min-w-[50px] md:min-w-[60px] pt-1">时代:</span>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  <Button
                    variant={selectedPeriods.size === 0 ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2 md:px-3 text-xs"
                    onClick={() => { setSelectedPeriods(new Set()); skipNextAutoFitRef.current = true; setResetViewportTrigger(`periods_all_${Date.now()}`) }}
                  >
                    全部时代
                  </Button>
                  {timePeriods.map(period => (
                    <Button
                      key={period.id}
                      variant={selectedPeriods.has(period.id) ? "default" : "outline"}
                      size="sm"
                      className="h-7 px-2 md:px-3 text-xs"
                      onClick={() => setSelectedPeriods(prev => { const next = new Set(prev); if (next.has(period.id)) next.delete(period.id); else next.add(period.id); return next; })}
                    >
                      {period.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 层级筛选 - 移动端垂直堆叠，桌面端横向 */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 md:gap-3">
                <span className="text-xs md:text-sm text-gray-600 whitespace-nowrap min-w-[50px] md:min-w-[60px] pt-1">层级:</span>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  <Button
                    variant={selectedLevels.size === 0 ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2 md:px-3 text-xs"
                    onClick={() => { setSelectedLevels(new Set()); skipNextAutoFitRef.current = true; setResetViewportTrigger(`levels_all_${Date.now()}`) }}
                  >
                    全部层级
                  </Button>
                  {availableLevels.map(level => {
                    // 计算该层级有多少个流派
                    const schoolsAtLevel = schools.filter(s => s.vertical === level)
                    return (
                      <Button
                        key={level}
                        variant={selectedLevels.has(level) ? "default" : "outline"}
                        size="sm"
                        className="h-7 px-2 md:px-3 text-xs"
                        onClick={() => setSelectedLevels(prev => { const next = new Set(prev); if (next.has(level)) next.delete(level); else next.add(level); return next; })}
                        title={`第 ${level} 层级：${schoolsAtLevel.map(s => s.name).join('、')}`}
                      >
                        {level}
                      </Button>
                    )
                  })}
                </div>
              </div>
              </div>
            )}
          </div>

          {/* 筛选结果提示 */}
          <div className="flex items-start sm:items-center gap-2 text-xs md:text-sm px-3 md:px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
            <Filter className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-blue-800 leading-relaxed">
              {searchQuery ? (
                <>
                  找到 <span className="font-semibold">{searchMatchedIds.size}</span> 位匹配的哲学家
                  <span className="ml-1 md:ml-2 opacity-70 hidden sm:inline">（筛选匹配 {filteredPhilosophers.length} 位）</span>
                </>
              ) : hasActiveFilters ? (
                <>
                  筛选匹配 <span className="font-semibold">{filteredPhilosophers.length}</span> / {philosophers.length} 位哲学家
                </>
              ) : (
                <>
                  当前共有 <span className="font-semibold">{philosophers.length}</span> 位思想家
                </>
              )}
                {searchQuery && (
                  <span className="ml-1 md:ml-2 bg-blue-100 px-1.5 md:px-2 py-0.5 rounded text-xs">
                    关键词: "{searchQuery}"
                  </span>
                )}
                {selectedSchools.size > 0 && (
                  <span className="ml-1 md:ml-2 bg-blue-100 px-1.5 md:px-2 py-0.5 rounded text-xs">
                    流派: {(() => { const arr = Array.from(selectedSchools); const shown = arr.slice(0,3).join(', '); return arr.length > 3 ? `${shown} 等${arr.length}项` : shown })()}
                  </span>
                )}
                {selectedLevels.size > 0 && (
                  <span className="ml-1 md:ml-2 bg-blue-100 px-1.5 md:px-2 py-0.5 rounded text-xs">
                    层级: {Array.from(selectedLevels).sort((a, b) => a - b).map(l => `第${l}层级`).join(', ')}
                  </span>
                )}
                {selectedPeriods.size > 0 && (
                  <span className="ml-1 md:ml-2 bg-blue-100 px-1.5 md:px-2 py-0.5 rounded text-xs">
                    时代: {(() => { const labels = Array.from(selectedPeriods).map(id => (timePeriods.find(p => p.id === id)?.label) || id); const shown = labels.slice(0,3).join(', '); return labels.length > 3 ? `${shown} 等${labels.length}项` : shown })()}
                  </span>
                )}
              </span>
            </div>
        </div>
      </div>

      {/* React Flow 画布 */}
      <div className="flex-1 bg-gray-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedPhilosopher(null)}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={INITIAL_VIEWPORT}
          fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          panOnScroll={true}
          zoomOnScroll={true}
          zoomOnDoubleClick={false}
          preventScrolling={true}
        >
          <Background color="#e5e7eb" gap={24} size={1.5} />
          <Controls showInteractive={false} />
          
          {/* 自动定位组件 */}
          <AutoFitView 
            filteredIds={
              searchQuery.trim() 
                ? searchMatchedPhilosophers.map(p => p.id) // 使用排序后的列表，第一个是分数最高的
                : filteredPhilosophers.map(p => p.id)
            }
            trigger={autoFitTrigger}
            centerMode={!!searchQuery.trim()} // 搜索时启用中心定位模式
          />

          <ViewportReset trigger={resetViewportTrigger} viewport={INITIAL_VIEWPORT} />
          
          {/* 左上角 - 关系类型图例（暂时隐藏） */}
          {false && (
            <Panel position="top-left" className="mt-4 ml-4" style={{ width: '200px' }}>
              <div className="bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg">
                <h3 className="font-bold text-gray-800 mb-2">关系类型</h3>
                <div className="space-y-2 text-sm">
                  {influenceTypes.map((type: any) => {
                    // 根据类型决定是否使用虚线
                    const isDashed = type.value === 'indirect' || type.value === 'opposition'
                    
                    return (
                      <div key={type.value} className="flex items-center gap-2">
                        <div 
                          className="w-8 h-0.5" 
                          style={{ 
                            backgroundColor: type.color || '#3b82f6',
                            borderTop: isDashed ? `1.5px dashed ${type.color || '#3b82f6'}` : undefined,
                            background: !isDashed ? (type.color || '#3b82f6') : 'transparent'
                          }} 
                        />
                        <span className="text-gray-600">{type.label_zh || type.value}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Panel>
          )}
          
          {/* 右上角 - 缩放控制 */}
          <Panel position="top-right" className="mt-2 md:mt-4 mr-2 md:mr-4" style={{ zIndex: zoomControlExpanded ? 1001 : 100 }}>
            {!zoomControlExpanded ? (
              // 折叠状态 - 只显示图标按钮
              <button
                onClick={() => setZoomControlExpanded(true)}
                className="bg-white/90 backdrop-blur p-2.5 md:p-3 rounded-lg shadow-lg hover:bg-white transition-colors active:scale-95"
                title="展开缩放控制"
              >
                <ZoomIn className="h-5 w-5 md:h-5 md:w-5 text-gray-700" />
              </button>
            ) : (
              // 展开状态 - 显示完整卡片
              <div className="bg-white/90 backdrop-blur rounded-lg shadow-lg" style={{ width: '160px' }}>
                <div className="flex items-center justify-between p-2.5 md:p-3 border-b">
                  <h3 className="font-bold text-gray-800 text-xs md:text-sm">缩放控制</h3>
                  <button
                    onClick={() => setZoomControlExpanded(false)}
                    className="text-gray-500 hover:text-gray-700 active:scale-90"
                    title="收起"
                  >
                    <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </button>
                </div>
                <div className="p-2 md:p-3">
                  <ZoomControls onResetNodes={handleResetNodes} />
                </div>
              </div>
            )}
          </Panel>
          
          {/* 右侧 - MiniMap - 移动端默认隐藏 */}
          <Panel position="top-right" className="mr-2 md:mr-4 hidden md:block" style={{ marginTop: minimapExpanded ? '100px' : '80px', zIndex: minimapExpanded ? 1000 : 99 }}>
            {!minimapExpanded ? (
              // 折叠状态 - 只显示图标按钮
              <button
                onClick={() => setMinimapExpanded(true)}
                className="bg-white/90 backdrop-blur p-2.5 md:p-3 rounded-lg shadow-lg hover:bg-white transition-colors active:scale-95"
                title="展开预览图"
              >
                <MapIcon className="h-5 w-5 text-gray-700" />
              </button>
            ) : (
              // 展开状态 - 显示MiniMap
              <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg overflow-hidden relative" style={{ width: '160px' }}>
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 relative z-10">
                  <h3 className="font-semibold text-gray-800 text-xs">预览图</h3>
                  <button
                    onClick={() => setMinimapExpanded(false)}
                    className="bg-gray-800 text-white hover:bg-red-600 flex-shrink-0 active:scale-90 rounded-full p-1.5 transition-all shadow-sm"
                    title="关闭预览图"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="p-2 relative" style={{ zIndex: 1 }}>
                  <div style={{ height: '120px', width: '100%' }}>
                    <MiniMap 
                      nodeColor={(node) => {
                        const philosopher = (node.data as any).philosopher
                        return philosopher?.schoolColor || '#94a3b8'
                      }}
                      maskColor="rgba(99, 102, 241, 0.12)"
                      pannable={true}
                      zoomable={false}
                      nodeStrokeWidth={1.5}
                      nodeStrokeColor="#ffffff"
                      nodeBorderRadius={3}
                    />
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </ReactFlow>
      </div>

      {/* 详细信息侧边栏（点击哲学家时显示） */}
      {selectedPhilosopher && (
        <div className="fixed right-0 top-0 h-full w-full sm:w-96 md:w-[28rem] lg:w-96 bg-white shadow-2xl z-50 overflow-y-auto">
          <div className="p-4 sm:p-5 md:p-6">
            <button
              onClick={() => setSelectedPhilosopher(null)}
              className="absolute top-3 sm:top-4 right-3 sm:right-4 text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded active:scale-90"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 pr-8">
                  {selectedPhilosopher.name.zh}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 italic">{selectedPhilosopher.name.en}</p>
              </div>

              <div className="text-xs sm:text-sm text-gray-600">
                {selectedPhilosopher.birthYear} ~ {selectedPhilosopher.deathYear}
              </div>

              <div>
                <span 
                  className="inline-block px-2.5 sm:px-3 py-1 rounded text-white text-xs sm:text-sm font-medium"
                  style={{ backgroundColor: selectedPhilosopher.schoolColor }}
                >
                  {selectedPhilosopher.school}
                </span>
              </div>

              {selectedPhilosopher.detailedBio && selectedPhilosopher.detailedBio.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-800 mb-2">生平简介</h3>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {(Array.isArray(selectedPhilosopher.detailedBio) 
                      ? selectedPhilosopher.detailedBio 
                      : [selectedPhilosopher.detailedBio]
                    ).map((bio, index) => (
                      <li key={index} className="text-gray-600 text-xs sm:text-sm flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{bio}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedPhilosopher.inheritedThoughts && selectedPhilosopher.inheritedThoughts.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-800 mb-2">思想继承</h3>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {selectedPhilosopher.inheritedThoughts.map((thought, index) => (
                      <li key={index} className="text-gray-600 text-xs sm:text-sm flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{thought}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-800 mb-2">主要思想</h3>
                <ul className="space-y-1.5 sm:space-y-2">
                  {selectedPhilosopher.mainIdeas.map((idea, index) => (
                    <li key={index} className="text-gray-600 text-xs sm:text-sm flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{idea}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedPhilosopher.laterInfluence && selectedPhilosopher.laterInfluence.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-800 mb-2">后世影响</h3>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {(Array.isArray(selectedPhilosopher.laterInfluence) 
                      ? selectedPhilosopher.laterInfluence 
                      : [selectedPhilosopher.laterInfluence]
                    ).map((impact, index) => (
                      <li key={index} className="text-gray-600 text-xs sm:text-sm flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>{impact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedPhilosopher.majorWorks && selectedPhilosopher.majorWorks.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-800 mb-2">主要著作</h3>
                  <ul className="space-y-1">
                    {selectedPhilosopher.majorWorks.map((work, index) => (
                      <li key={index} className="text-gray-600 text-xs sm:text-sm">
                        {work}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedPhilosopher.quotes && selectedPhilosopher.quotes.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-800 mb-2">人物标签</h3>
                  <div className="bg-gray-50 p-2.5 sm:p-3 rounded border-l-4 border-blue-500">
                    <p className="text-gray-700 italic text-xs sm:text-sm">
                      "{selectedPhilosopher.quotes[0]}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
