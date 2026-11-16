// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { translationReport } from '../src/i18n/content.mjs'
const snapshot = JSON.parse(readFileSync(new URL('../public/data/philosophy.json',import.meta.url),'utf8'))
const translations = JSON.parse(readFileSync(new URL('../public/data/locales/en.json',import.meta.url),'utf8'))
const report = translationReport(snapshot,translations)
console.log('English translation coverage:', report)
if (report.missing || report.stale) {
  console.error('Update matching translations before publishing. Never copy changed Chinese source into an old English entry without updating its translation.')
  process.exitCode=1
}
