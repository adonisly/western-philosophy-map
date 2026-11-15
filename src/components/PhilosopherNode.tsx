// SPDX-License-Identifier: AGPL-3.0-only
import React, { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { Philosopher } from '../types/western-philosophy'

interface PhilosopherNodeProps {
  data: {
    philosopher: Philosopher
    onClick?: (philosopher: Philosopher) => void
    isHighlighted?: boolean
    isConnected?: boolean
    isAncestor?: boolean
    isDescendant?: boolean
    isDimmed?: boolean
    isSameLevel?: boolean  // 是否与相邻节点同级（水平排列）
  }
  selected?: boolean
}

const PhilosopherNode = memo(({ data, selected }: PhilosopherNodeProps) => {
  const { philosopher, onClick, isHighlighted, isConnected, isAncestor, isDescendant, isDimmed, isSameLevel } = data

  return (
    <div 
      className={`
        relative bg-white rounded-lg shadow-md border-2 
        transition-all duration-300 cursor-pointer
        ${selected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
        ${isHighlighted ? 'ring-4 ring-yellow-400 ring-opacity-70 shadow-2xl' : ''}
        ${isAncestor && !isHighlighted ? 'ring-2 ring-emerald-400 ring-opacity-60' : ''}
        ${isDescendant && !isHighlighted ? 'ring-2 ring-indigo-400 ring-opacity-60' : ''}
        ${!isHighlighted && !isAncestor && !isDescendant ? 'hover:shadow-xl hover:scale-105' : ''}
        ${isDimmed ? 'opacity-25 grayscale' : ''}
      `}
      style={{ 
        borderColor: philosopher.schoolColor,
        width: '280px',        // 固定宽度，适配移动端
        minWidth: '280px',
        height: '280px',       // 固定高度
        minHeight: '280px',
        animation: isHighlighted ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
      }}
      onClick={() => onClick?.(philosopher)}
    >
      {/* 顶部颜色条 */}
      <div 
        className={`h-2 rounded-t-lg transition-all duration-300 ${isHighlighted ? 'h-3' : ''}`}
        style={{ backgroundColor: philosopher.schoolColor }}
      />
      
      {/* 高亮标记 */}
      {isHighlighted && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
          <span className="text-white text-xs font-bold">✓</span>
        </div>
      )}

      {/* 连接标记 / 后继链路 ping 保留 */}
      {isConnected && !isHighlighted && !isAncestor && !isDescendant && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping" />
      )}

      {/* 祖先 / 后继 标记 */}
      {!isHighlighted && (isAncestor || isDescendant) && (
        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow ${isAncestor ? 'bg-emerald-500' : 'bg-indigo-500'}`}>{isAncestor ? 'A' : 'D'}</div>
      )}
      
      {/* 卡片内容 */}
      <div className="p-3 space-y-1.5 h-full flex flex-col overflow-hidden">
        {/* 年代和国籍 */}
        <div className="text-xs text-gray-500 font-mono flex-shrink-0">
          {philosopher.birthYear} ~ {philosopher.deathYear}
          {philosopher.nationality && <span> • {philosopher.nationality}</span>}
        </div>
        
        {/* 名字 */}
        <div className="flex-shrink-0">
          <h3 className={`text-base font-bold transition-colors ${
            isHighlighted ? 'text-yellow-600' : 'text-gray-900'
          }`}>
            {philosopher.name.zh}
          </h3>
          <p className="text-xs text-gray-600 italic line-clamp-1">
            {philosopher.name.en}
          </p>
        </div>
        
        {/* 流派 */}
        <div className="flex-shrink-0">
          <div 
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium text-white transition-all ${
              isHighlighted ? 'scale-110' : ''
            }`}
            style={{ backgroundColor: philosopher.schoolColor }}
          >
            {philosopher.school}
          </div>
        </div>
        
        {/* 主要思想：可滚动区域 */}
        <div className="flex-1 overflow-y-auto text-xs text-gray-700 space-y-1 pr-1">
          {philosopher.mainIdeas.slice(0, 3).map((idea, index) => (
            <div key={index} className="flex items-start gap-1">
              <span className="text-gray-400 mt-0.5 flex-shrink-0">•</span>
              <span className="flex-1 leading-relaxed line-clamp-2">{idea}</span>
            </div>
          ))}
        </div>
        
        {/* 人物标签（如果有） */}
        {philosopher.quotes && philosopher.quotes.length > 0 && (
          <div className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-2 flex-shrink-0 line-clamp-1">
            "{philosopher.quotes[0]}"
          </div>
        )}
      </div>
      
      {/* React Flow 连接点 - 支持全方向连接 */}
      
      {/* Top - 既可以接收来自上层的连接，也可以发出向上的连接 */}
      {/* Target handles - 接收从上层来的连接 */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 !bg-blue-500"
        id="target-main"
        style={{ left: '50%' }}
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-2 h-2 !bg-blue-400 opacity-0"
        id="target-top-left"
        style={{ left: '33%' }}
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-2 h-2 !bg-blue-400 opacity-0"
        id="target-top-right"
        style={{ left: '67%' }}
      />
      {/* Source handles - 发出向上的连接 */}
      <Handle 
        type="source" 
        position={Position.Top} 
        className="w-3 h-3 !bg-green-500 opacity-0"
        id="source-top-main"
        style={{ left: '50%' }}
      />
      <Handle 
        type="source" 
        position={Position.Top} 
        className="w-2 h-2 !bg-green-400 opacity-0"
        id="source-top-left"
        style={{ left: '33%' }}
      />
      <Handle 
        type="source" 
        position={Position.Top} 
        className="w-2 h-2 !bg-green-400 opacity-0"
        id="source-top-right"
        style={{ left: '67%' }}
      />
      
      {/* Bottom - 既可以发出到下层的连接，也可以接收来自下层的连接 */}
      {/* Source handles - 发出到下层的连接 */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-green-500"
        id="source-main"
        style={{ left: '50%' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-2 h-2 !bg-green-400 opacity-0"
        id="source-bottom-left"
        style={{ left: '33%' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-2 h-2 !bg-green-400 opacity-0"
        id="source-bottom-right"
        style={{ left: '67%' }}
      />
      {/* Target handles - 接收来自下层的连接 */}
      <Handle 
        type="target" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-blue-500 opacity-0"
        id="target-bottom-main"
        style={{ left: '50%' }}
      />
      <Handle 
        type="target" 
        position={Position.Bottom} 
        className="w-2 h-2 !bg-blue-400 opacity-0"
        id="target-bottom-left"
        style={{ left: '33%' }}
      />
      <Handle 
        type="target" 
        position={Position.Bottom} 
        className="w-2 h-2 !bg-blue-400 opacity-0"
        id="target-bottom-right"
        style={{ left: '67%' }}
      />
      
      {/* Left - 用于同级左侧连接（双向）*/}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-2 h-2 !bg-blue-400 opacity-50"
        id="target-left"
        style={{ top: '50%' }}
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        className="w-2 h-2 !bg-green-400 opacity-0"
        id="source-left"
        style={{ top: '50%' }}
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        className="w-2 h-2 !bg-green-400 opacity-0"
        id="source-left-top"
        style={{ top: '33%' }}
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        className="w-2 h-2 !bg-green-400 opacity-0"
        id="source-left-bottom"
        style={{ top: '67%' }}
      />
      
      {/* Right - 用于同级右侧连接（双向），多个连接点 */}
      <Handle 
        type="target" 
        position={Position.Right} 
        className="w-2 h-2 !bg-blue-400 opacity-0"
        id="target-right"
        style={{ top: '50%' }}
      />
      <Handle 
        type="target" 
        position={Position.Right} 
        className="w-2 h-2 !bg-blue-400 opacity-0"
        id="target-right-top"
        style={{ top: '33%' }}
      />
      <Handle 
        type="target" 
        position={Position.Right} 
        className="w-2 h-2 !bg-blue-400 opacity-0"
        id="target-right-bottom"
        style={{ top: '67%' }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-2 h-2 !bg-green-400 opacity-50"
        id="source-right"
        style={{ top: '50%' }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-2 h-2 !bg-green-400 opacity-0"
        id="source-right-top"
        style={{ top: '33%' }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-2 h-2 !bg-green-400 opacity-0"
        id="source-right-bottom"
        style={{ top: '67%' }}
      />
    </div>
  )
})

PhilosopherNode.displayName = 'PhilosopherNode'

export default PhilosopherNode
