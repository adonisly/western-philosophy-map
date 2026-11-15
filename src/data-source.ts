// SPDX-License-Identifier: AGPL-3.0-only
import type { School } from './types/western-philosophy'

/** Public graph data only. Hosts own authentication, writes and analytics. */
export interface PhilosophySnapshot {
  philosophers: Array<Record<string, any>>
  influences: Array<Record<string, any>>
  schools: School[]
  influenceTypes: Array<Record<string, any>>
  hotSearches: string[]
}

export interface PhilosophyDataSource {
  load(): Promise<PhilosophySnapshot>
  subscribeToPhilosophers?(onInsert: (row: Record<string, any>) => void): () => void
}

export interface HotSearchTerm { term: string; count?: number }
