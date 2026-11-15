// SPDX-License-Identifier: AGPL-3.0-only
/** @typedef {'database'|'compact'|'school'|'century'|'lineage'} LayoutMode */
/** @typedef {{layout:LayoutMode, philosopher?:string, query:string, schools:string[], periods:string[], levels:number[]}} SharedView */
const layouts = new Set(['database', 'compact', 'school', 'century', 'lineage'])
const strings = (/** @type {URLSearchParams} */ params, /** @type {string} */ key) =>
  [...new Set(params.getAll(key).filter(value => value.length > 0 && value.length <= 100))].slice(0, 200)

/** @returns {SharedView} */
export function readSharedView(/** @type {string} */ href) {
  const params = new URL(href).searchParams
  const layout = params.get('layout') || 'database'
  return {
    layout: /** @type {LayoutMode} */ (layouts.has(layout) ? layout : 'database'),
    philosopher: (params.get('philosopher') || '').slice(0, 100) || undefined,
    query: (params.get('q') || '').slice(0, 200),
    schools: strings(params, 'school'), periods: strings(params, 'period'),
    levels: strings(params, 'level').filter(value => /^\d{1,3}$/.test(value)).map(Number)
  }
}

export function createShareUrl(/** @type {string} */ href, /** @type {SharedView} */ state) {
  const url = new URL(href)
  // Share only graph state, never unrelated host query parameters or fragments.
  url.search = ''; url.hash = ''
  url.searchParams.set('layout', layouts.has(state.layout) ? state.layout : 'database')
  if (state.philosopher) url.searchParams.set('philosopher', state.philosopher)
  if (state.query.trim()) url.searchParams.set('q', state.query.trim())
  for (const value of [...state.schools].sort()) url.searchParams.append('school', value)
  for (const value of [...state.periods].sort()) url.searchParams.append('period', value)
  for (const value of [...state.levels].sort((a, b) => a - b)) url.searchParams.append('level', String(value))
  return url.href
}
