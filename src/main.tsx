// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { createRoot } from 'react-dom/client'
import WesternPhilosophyMap from './WesternPhilosophyMap'
import type { PhilosophyDataSource } from './data-source'
import { validateSnapshot } from './validate-snapshot.mjs'
import './styles.css'
import { localePaths } from './i18n/content.mjs'
import { createShareUrl } from './shared-view.mjs'
import type { Translations } from './i18n'

const paths = localePaths(window.location.pathname)
const locale = paths.locale === 'en' ? 'en' : 'zh'
let translations: Translations = {}


const dataSource: PhilosophyDataSource = {
  async load() {
    const response = await fetch(paths.base + 'data/philosophy.json')
    if (!response.ok) throw new Error('Unable to load the bundled philosophy snapshot')
    const snapshot = await response.json()
    validateSnapshot(snapshot)
    return snapshot
  }
}

async function start() {
  // Translation data is static and same-origin. A failed request has a visible, labelled Chinese fallback.
  try {
    const response = await fetch(paths.base + 'data/locales/en.json')
    if (response.ok) translations = await response.json()
  } catch { /* Keep source content available even if translations cannot be loaded. */ }
  createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WesternPhilosophyMap dataSource={dataSource} locale={locale} translations={translations}
      onLocaleChange={(next,state) => {
        window.location.assign(createShareUrl(new URL(paths[next],window.location.origin).href,state))
      }}
      catalogHref={(locale === 'en' ? paths.en : paths.zh) + 'explore/'}
      homeHref="https://readmap.inklinks.io/"
      sourceHref={import.meta.env.VITE_SOURCE_URL || 'https://github.com/adonisly/western-philosophy-map/tree/main'}
      onFeedback={() => window.open('https://github.com/adonisly/western-philosophy-map/issues', '_blank', 'noopener,noreferrer')} />
  </React.StrictMode>
)

}
void start()
