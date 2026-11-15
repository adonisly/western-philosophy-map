// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer, BaseEdge } from 'reactflow'

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data
}: EdgeProps) {
  // 使用 smoothstep 路径（直角折线，带圆角）
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8, // 圆角半径
  })

  // 标签始终在线的中点，不做额外偏移
  const totalEdges = data?.totalEdges || 1

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            fontSize: 11,
            fontWeight: 500,
            background: '#ffffff',
            padding: '2px 8px',
            borderRadius: 4,
            border: '1px solid #e5e7eb',
            pointerEvents: 'all',
            boxShadow: totalEdges > 1 ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
          }}
          className="nodrag nopan"
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
