// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { validateSnapshot, projectPublicSnapshot } from '../src/validate-snapshot.mjs'

const snapshot = JSON.parse(await readFile(new URL('../public/data/philosophy.json', import.meta.url), 'utf8'))

test('the bundled snapshot has resolvable schools, endpoints and relationship types', () => {
  assert.equal(validateSnapshot(snapshot), snapshot)
})

test('a new relationship cannot silently point at an absent philosopher', () => {
  const changed = structuredClone(snapshot)
  changed.influences[0].to_philosopher_id = 'not-in-the-snapshot'
  assert.throws(() => validateSnapshot(changed), /dangling relationship/)
})

test('export only includes public graph fields, preserving all layout overrides', () => {
  const privateRows = structuredClone(snapshot)
  privateRows.philosophers[0].editor_email = 'private@example.invalid'
  privateRows.users = [{ email: 'private@example.invalid' }]
  const projected = projectPublicSnapshot(privateRows)
  assert.deepEqual(projected, snapshot)
})

test('unexpected nested fields and duplicate ids are rejected', () => {
  const changed = structuredClone(snapshot)
  changed.philosophers[0].position_override = { secret: 'not-a-position' }
  assert.throws(() => validateSnapshot(changed), /invalid position/)
  const duplicated = structuredClone(snapshot)
  duplicated.philosophers.push(duplicated.philosophers[0])
  assert.throws(() => validateSnapshot(duplicated), /duplicate id/)
})
