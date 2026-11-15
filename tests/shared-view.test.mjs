// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test'
import assert from 'node:assert/strict'
import { createShareUrl, readSharedView } from '../src/shared-view.mjs'

test('shared view round trips Unicode filters and preserves the host path without unrelated parameters', () => {
  const state = { layout: 'lineage', philosopher: 'socrates_1760717560724', query: '苏格拉底 & Plato', schools: ['实用主义', '古典希腊哲学'], periods: ['ancient'], levels: [2, 1] }
  const href = createShareUrl('https://readmap.inklinks.io/knowledge-graphs/western-philosophy?private=discard#fragment', state)
  assert.equal(new URL(href).pathname, '/knowledge-graphs/western-philosophy')
  assert(!href.includes('private')); assert(!href.includes('#'))
  assert.deepEqual(readSharedView(href), {...state, schools: [...state.schools].sort(), levels: [1,2]})
})

test('invalid and oversized shared inputs fall back safely', () => {
  const state = readSharedView('https://example.com/?layout=unknown&level=NaN&level=-1&level=2&school=a&school=a&q=' + 'a'.repeat(300))
  assert.equal(state.layout, 'database'); assert.deepEqual(state.levels, [2]); assert.deepEqual(state.schools, ['a']); assert.equal(state.query.length, 200)
})
