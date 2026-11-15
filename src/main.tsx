// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { createRoot } from 'react-dom/client'
import WesternPhilosophyMap from './WesternPhilosophyMap'
import type { PhilosophyDataSource } from './data-source'
import { validateSnapshot } from './validate-snapshot.mjs'
import './styles.css'

const dataSource: PhilosophyDataSource = {
  async load() {
    const response = await fetch(import.meta.env.BASE_URL + 'data/philosophy.json')
    if (!response.ok) throw new Error('Unable to load the bundled philosophy snapshot')
    const snapshot = await response.json()
    validateSnapshot(snapshot)
    return snapshot
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WesternPhilosophyMap dataSource={dataSource}
      catalogHref={import.meta.env.BASE_URL + 'explore/'}
      homeHref="https://readmap.inklinks.io/"
      sourceHref={import.meta.env.VITE_SOURCE_URL || 'https://github.com/adonisly/western-philosophy-map/tree/main'}
      onFeedback={() => window.open('https://github.com/adonisly/western-philosophy-map/issues', '_blank', 'noopener,noreferrer')} />
  </React.StrictMode>
)
