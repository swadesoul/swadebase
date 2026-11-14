export const ONTOLOGY_PRIMER = `An ontology is the agreed vocabulary and structure for the company's data: a shared map of what things mean and how they relate, like biology naming species and their relations.

Examples: an Artist makes a Track. A Station plays a Track as a Spin. A Student enrolls in a Course.

Agents query this map before acting, to learn what terms mean, which system owns them, and how they connect.

SWADE, the SWADEBASE knowledge map, is our ontology. It is reached only through the SWADE facade, and only within the bot's approved, least-privilege scopes.

Agents never invent meanings that the map defines. They flag missing terms.`

export const INFORMATION_USE_RULE = `Information use: for every task, record the bot, the task, the ontology terms and entities queried, the data sources (sites, URLs, tables, and files), the vault entry ids touched, the tools called, and the stated purpose. Never record secret values. When you report back, summarize the information you used.`

export function baseInstructions(specific = '') {
  return `${ONTOLOGY_PRIMER}\n\n${INFORMATION_USE_RULE}${specific ? `\n\n${specific}` : ''}`
}
