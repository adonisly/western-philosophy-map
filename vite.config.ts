// SPDX-License-Identifier: AGPL-3.0-only
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'

const noticeFiles = ['LICENSE', 'NOTICE.md', 'third-party/shadcn-ui-LICENSE']
const readNotice = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')
const sourceUrl = process.env.VITE_SOURCE_URL || 'https://github.com/adonisly/western-philosophy-map/tree/main'
const banner = '/*!\nSPDX-License-Identifier: AGPL-3.0-only\nCorresponding source: ' + sourceUrl +
  '\nThird-party MIT notice follows:\n' + readNotice('third-party/shadcn-ui-LICENSE') + '\n*/'

export default defineConfig({
  base: './',
  plugins: [{
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
