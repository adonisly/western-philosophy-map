// SPDX-License-Identifier: AGPL-3.0-only
/** Validate the portable data contract before displaying or publishing it. */
export const publicFields = {
  philosophers: ['id', 'name', 'chinese_name', 'period', 'school', 'description', 'contributions', 'works', 'created_at', 'quotes', 'legacy_impact', 'inherited_thoughts', 'later_influence', 'nationality', 'position_override'],
  influences: ['id', 'from_philosopher_id', 'to_philosopher_id', 'influence_type', 'description'],
  schools: ['id', 'name', 'description', 'color', 'vertical', 'horizontal'],
  influenceTypes: ['value', 'label_zh', 'label_en', 'color', 'sort_order']
}

export function projectPublicSnapshot(raw) {
  const result = Object.fromEntries(Object.entries(publicFields).map(([name, fields]) => [
    name, raw[name].map(row => Object.fromEntries(fields.filter(field => Object.hasOwn(row, field)).map(field => [field, row[field]])))
  ]))
  result.hotSearches = [...raw.hotSearches]
  validateSnapshot(result)
  return result
}

export function validateSnapshot(data) {
  const fail = message => { throw new Error('Invalid philosophy snapshot: ' + message) }
  const groups = [...Object.keys(publicFields), 'hotSearches']
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('expected an object')
  if (Object.keys(data).some(key => !groups.includes(key))) fail('unexpected top-level fields')
  for (const name of groups) {
    if (!Array.isArray(data[name])) fail(name + ' must be an array')
    if (name !== 'hotSearches' && data[name].length === 0) fail(name + ' is empty')
    if (name === 'hotSearches') {
      if (data[name].some(term => typeof term !== 'string')) fail('hotSearches must contain strings')
      continue
    }
    const seen = new Set()
    for (const row of data[name]) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) fail(name + ' contains a non-object')
      if (Object.keys(row).some(key => !publicFields[name].includes(key))) fail(name + ' contains a non-public field')
      const id = name === 'influenceTypes' ? row.value : row.id
      if (!['string', 'number'].includes(typeof id) || !String(id).trim()) fail(name + ' contains a missing id')
      if (seen.has(String(id))) fail(name + ' contains duplicate id ' + id)
      seen.add(String(id))
    }
  }
  const people = new Set(data.philosophers.map(p => p.id))
  const schools = new Set(data.schools.map(s => s.name))
  const types = new Set(data.influenceTypes.map(t => t.value))
  for (const person of data.philosophers) {
    for (const key of ['id', 'name', 'chinese_name', 'period', 'school']) {
      if (typeof person[key] !== 'string' || !person[key].trim()) fail('person ' + person.id + ' missing ' + key)
    }
    if (!schools.has(person.school)) fail('unknown school for ' + person.id)
    for (const key of ['contributions', 'works', 'quotes']) {
      if (person[key] != null && (!Array.isArray(person[key]) || person[key].some(item => typeof item !== 'string'))) fail(person.id + ': ' + key + ' must contain strings')
    }
    const position = person.position_override
    if (position != null && (typeof position !== 'object' || Array.isArray(position) ||
      Object.keys(position).some(key => !['vertical', 'horizontal'].includes(key)) ||
      Object.values(position).some(value => typeof value !== 'number' || !Number.isFinite(value)))) fail('invalid position for ' + person.id)
  }
  for (const school of data.schools) {
    if (typeof school.name !== 'string' || !/^#[\da-f]{6}$/i.test(school.color)) fail('invalid school ' + school.id)
    for (const key of ['vertical', 'horizontal']) {
      if (school[key] != null && (typeof school[key] !== 'number' || !Number.isFinite(school[key]))) fail('invalid school position ' + school.id)
    }
  }
  for (const edge of data.influences) {
    if (!people.has(edge.from_philosopher_id) || !people.has(edge.to_philosopher_id)) fail('dangling relationship ' + edge.id)
    if (!types.has(edge.influence_type)) fail('unknown relationship type ' + edge.id)
  }
  return data
}
