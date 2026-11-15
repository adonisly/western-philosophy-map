// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test'
import assert from 'node:assert/strict'
import { createSiteContent } from '../scripts/site-content.mjs'
const snapshot = { philosophers: [{id:'p&1',chinese_name:'测试<人物>',name:'Test "name"',school:'学派',period:'1900–1980'}],schools:[{id:'school',name:'学派'}],influences:[] }
test('static catalog escapes public content and links to a working graph state under a custom base path',()=>{
  const result=createSiteContent(snapshot,'https://example.com/map/')
  assert(result.head.includes('https://example.com/map/social-preview.png'))
  assert(result.assets['sitemap.xml'].includes('https://example.com/map/explore/'))
  assert(result.assets['explore/index.html'].includes('测试&lt;人物&gt;'))
  assert(result.assets['explore/index.html'].includes('../?layout=lineage&amp;philosopher=p%261'))
  assert(!result.assets['explore/index.html'].includes('测试<人物>'))
})
