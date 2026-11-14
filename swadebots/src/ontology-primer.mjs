import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const primerPath = join(dirname(fileURLToPath(import.meta.url)), '../../docs/SWADE_ONTOLOGY_PRIMER.md')

export const ONTOLOGY_PRIMER = readFileSync(primerPath, 'utf8').replace(/\n$/, '')

export const INFORMATION_USE_RULE = ONTOLOGY_PRIMER.slice(ONTOLOGY_PRIMER.indexOf('## Information-use logging'))

export function baseInstructions(specific = '') {
  return `${ONTOLOGY_PRIMER}${specific ? `\n\n${specific}` : ''}`
}
