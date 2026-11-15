// SPDX-License-Identifier: AGPL-3.0-only
import { readFile } from 'node:fs/promises'
import { validateSnapshot } from '../src/validate-snapshot.mjs'

const data = validateSnapshot(JSON.parse(await readFile(new URL('../public/data/philosophy.json', import.meta.url), 'utf8')))
console.log(`Valid snapshot: ${data.philosophers.length} philosophers, ${data.schools.length} schools, ${data.influences.length} relationships.`)
