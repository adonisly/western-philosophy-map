// SPDX-License-Identifier: AGPL-3.0-only
import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import { createSiteContent } from './scripts/site-content.mjs'

const noticeFiles = ['LICENSE', 'NOTICE.md', 'third-party/shadcn-ui-LICENSE']
const readNotice = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')
const sourceUrl = process.env.VITE_SOURCE_URL || 'https://github.com/adonisly/western-philosophy-map/tree/main'
const banner = '/*!\nSPDX-License-Identifier: AGPL-3.0-only\nCorresponding source: ' + sourceUrl +
  '\nThird-party MIT notice follows:\n' + readNotice('third-party/shadcn-ui-LICENSE') + '\n*/'

export default defineConfig({
  base: './',
  build: { rollupOptions: { input: { main: resolve(import.meta.dirname, 'index.html'), english: resolve(import.meta.dirname, 'en/index.html') } } },
  plugins: [{
    name: 'public-site-content',
    transformIndexHtml(html, context) {
      const site = createSiteContent(JSON.parse(readNotice('public/data/philosophy.json')), process.env.VITE_SITE_URL, process.env.VITE_GOOGLE_SITE_VERIFICATION, JSON.parse(readNotice('public/data/locales/en.json')))
      return html.replace('<!--SITE:HEAD-->', context.path.startsWith('/en/') ? site.enHead : site.head).replace('<!--SITE:INTRO-->', context.path.startsWith('/en/') ? site.enIntro : site.intro)
    },
    generateBundle() {
      const site = createSiteContent(JSON.parse(readNotice('public/data/philosophy.json')), process.env.VITE_SITE_URL, process.env.VITE_GOOGLE_SITE_VERIFICATION, JSON.parse(readNotice('public/data/locales/en.json')))
      for (const [fileName, source] of Object.entries(site.assets)) this.emitFile({ type: 'asset', fileName, source })
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = new URL(req.url || '/', 'http://localhost').pathname
        const assets = createSiteContent(JSON.parse(readNotice('public/data/philosophy.json')), process.env.VITE_SITE_URL, process.env.VITE_GOOGLE_SITE_VERIFICATION, JSON.parse(readNotice('public/data/locales/en.json'))).assets
        const file = path.endsWith('/explore/') ? path.slice(1) + 'index.html' : path.slice(1)
        if (!Object.hasOwn(assets, file)) return next()
        res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html; charset=utf-8' : file.endsWith('.xml') ? 'application/xml' : 'text/plain')
        res.end(assets[file as keyof typeof assets])
      })
    }
  }, {
    name: 'distribute-license-notices',
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type === 'chunk') output.code = banner + '\n' + output.code
      }
      for (const fileName of noticeFiles) {
        this.emitFile({ type: 'asset', fileName, source: readNotice(fileName) })
      }
    }
  }]
})
