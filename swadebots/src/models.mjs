export const MODELS = [
  { id: 'ollama/qwen3:4b', provider: 'ollama', tier: 'local', label: 'Qwen 3 4B local' },
  { id: 'ollama/llama3.2:3b', provider: 'ollama', tier: 'local', label: 'Llama 3.2 3B local' },
  { id: 'auto/cheap', provider: 'omniroute', tier: 'paid', label: 'Gateway economy' },
  { id: 'auto/strong', provider: 'omniroute', tier: 'paid', label: 'Gateway strong' },
]

export function findModel(id) {
  return MODELS.find((model) => model.id === id) || null
}

export function isLocalModel(id) {
  const model = findModel(id)
  return Boolean(model && model.tier === 'local')
}

export function modelsForPlan(plan) {
  if (plan === 'free') return MODELS.filter((model) => model.tier === 'local')
  return MODELS
}
