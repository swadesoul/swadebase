const RULES = [
  ['payment', /\b(pay|payment|charge|refund|transfer money|send money|invoice)\b/i],
  ['delete', /\b(delete|drop table|destroy|erase)\b/i],
  ['send_message', /\b(send (an )?(email|dm|message)|publish this|post this)\b/i],
  ['signup', /\b(sign up|create an account|register an account)\b/i],
]

export function classifyRisk(text) {
  const source = String(text || '')
  for (const [action, pattern] of RULES) {
    if (pattern.test(source)) return action
  }
  return null
}

export function extractUrls(text) {
  const found = String(text || '').match(/https?:\/\/[^\s<>"']+/gi) || []
  return [...new Set(found.map((url) => url.replace(/[),.;]+$/, '')))]
}
