// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { translatedField, translationReport, localePaths, formatYear, centuryLabel } from '../src/i18n/content.mjs'
import { createShareUrl, readSharedView } from '../src/shared-view.mjs'
import { createSiteContent } from '../scripts/site-content.mjs'
const snapshot=JSON.parse(readFileSync(new URL('../public/data/philosophy.json',import.meta.url),'utf8'))
const translations=JSON.parse(readFileSync(new URL('../public/data/locales/en.json',import.meta.url),'utf8'))
test('every nonempty public content field has a matching, complete English translation',()=>{
  const report=translationReport(snapshot,translations)
  assert.equal(report.missing,0); assert.equal(report.stale,0)
  assert.equal(Object.keys(translations.philosophers).length,snapshot.philosophers.length)
  assert.equal(Object.keys(translations.schools).length,snapshot.schools.length)
  assert(report.draft>0); assert(report.reviewed>=snapshot.schools.length)
})
test('changed Chinese sources never silently display outdated English text',()=>{
  const entry={source:['旧内容'],text:['Old text'],review:'reviewed'}
  assert.deepEqual(translatedField('新内容',entry),{text:['新内容'],status:'stale'})
  assert.deepEqual(translatedField('新内容',null),{text:['新内容'],status:'missing'})
  assert.equal(translatedField(['甲',''],{source:['甲',''],text:['A','']}).status,'draft')
  assert.equal(translatedField(['甲','乙'],{source:['甲','乙'],text:['A','']}).status,'stale')
})
test('language routes work under a project path and preserve stable shared state',()=>{
  const paths=localePaths('/my-map/en/index.html')
  assert.deepEqual(paths,{locale:'en',base:'/my-map/',zh:'/my-map/',en:'/my-map/en/'})
  assert.equal(localePaths('/en/').base,'/')
  const state={layout:'lineage',philosopher:snapshot.philosophers[0].id,query:'Kant',schools:['德国古典哲学'],periods:['century_18'],levels:[3]}
  const en=createShareUrl('https://example.com'+paths.en,state)
  const zh=createShareUrl('https://example.com'+paths.zh,readSharedView(en))
  assert.deepEqual(readSharedView(en),readSharedView(zh));assert(en.includes('/my-map/en/'))
})
test('English index is real escaped HTML, with self canonical and reciprocal language links',()=>{
  const site=createSiteContent(snapshot,'https://example.com/map/',undefined,translations)
  const index=site.assets['en/explore/index.html']
  assert(index.includes('<html lang="en">'));assert(index.includes('Socrates'));assert(index.includes('Pragmatism'))
  assert(index.includes('href="https://example.com/map/en/explore/"'))
  for(const head of [site.head,site.enHead]){
    assert(head.includes('hreflang="zh-CN"'));assert(head.includes('hreflang="en"'))
  }
  assert(site.enHead.includes('rel="canonical" href="https://example.com/map/en/"'))
  assert(site.enHead.includes('social-preview-en.png'))
  assert.equal((site.assets['sitemap.xml'].match(/<loc>/g)||[]).length,4)
})
test('BCE and century labels keep numeric dates and handle ordinal exceptions',()=>{
  assert.equal(formatYear(-469,'en'),'469 BCE')
  assert.equal(centuryLabel('century_-5','en'),'5th century BCE')
  assert.equal(centuryLabel('century_21','en'),'21st century')
  assert.equal(centuryLabel('century_11','en'),'11th century')
})
