// SPDX-License-Identifier: AGPL-3.0-only
/** Stable IDs and Chinese school keys belong to graph structure, never to a translation. */
export const contentFields = ['name','description','contributions','works','quotes','inherited_thoughts','later_influence','nationality']
export function textArray(value) {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value !== 'string' || !value) return []
  if (value.startsWith('[')) { try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed.map(String) } catch {} }
  return [value]
}
/** @param {any} source @param {any} entry */
export function translatedField(source, entry) {
  const original = textArray(source)
  if (!original.length) return {text: original, status: 'empty'}
  if (!entry || JSON.stringify(entry.source) !== JSON.stringify(original) || !Array.isArray(entry.text) || entry.text.length !== original.length || entry.text.some((x,i) => typeof x !== 'string' || (original[i].trim() && !x.trim()))) return {text: original, status: entry ? 'stale' : 'missing'}
  return {text: entry.text, status: entry.review === 'reviewed' ? 'reviewed' : 'draft'}
}
/** @param {any} snapshot @param {any} translations */
export function translationReport(snapshot, translations) {
  const report = {fields:0, draft:0, reviewed:0, missing:0, stale:0}
  for (const group of ['philosophers','schools','influences']) {
    for (const row of snapshot[group]) {
      const fields = group === 'philosophers' ? contentFields : group === 'schools' ? ['name','description'] : ['description']
      for (const field of fields) {
        if (typeof row[field] !== 'string' && !Array.isArray(row[field])) continue
        const result = translatedField(row[field], translations?.[group]?.[row.id]?.[field])
        if (result.status === 'empty') continue
        report.fields++; report[result.status]++
      }
    }
  }
  return report
}
export function formatPeriod(value, locale = 'zh') {
  if (locale !== 'en') return String(value || '')
  return String(value || '').replace(/约/g,'c. ').replace(/前(\d+)/g,'$1 BCE').replace(/世纪/g,' century').replace(/至今/g,'present').replace(/公元/g,'CE ')
}
export function formatYear(value, locale = 'zh') {
  return !value ? (locale === 'en' ? 'Unknown' : '不详') : value < 0 ? (locale === 'en' ? `${Math.abs(value)} BCE` : `前${Math.abs(value)}`) : String(value)
}
export function centuryLabel(id, locale = 'zh') {
  const n = Number(String(id).replace('century_',''))
  if (locale !== 'en') return n < 0 ? `公元前${-n}世纪` : `${n || 1}世纪`
  const a = Math.abs(n) || 1
  const suffix = a % 100 >= 11 && a % 100 <= 13 ? 'th' : ({1:'st',2:'nd',3:'rd'}[a % 10] || 'th')
  return `${a}${suffix} century${n < 0 ? ' BCE' : ''}`
}
/** Preserve a deployed base path; no SPA fallback is required for /en/. */
export function localePaths(pathname) {
  const clean = pathname.replace(/index\.html$/, '')
  const english = /\/en\/$/.test(clean) || /\/en$/.test(clean)
  let base = english ? clean.replace(/en\/?$/, '') : clean
  if (!base.endsWith('/')) base += '/'
  return {locale: english ? 'en' : 'zh', base, zh: base, en: base + 'en/'}
}
