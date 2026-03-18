export interface BlueprintStep {
  step_number: number
  name: string
  instruction: string
  tip?: string
}

export interface BlueprintPhase {
  phase_number: number
  phase_title: string
  steps: BlueprintStep[]
}

export interface Blueprint {
  title: string
  phases: BlueprintPhase[]
}

function strip(s: string): string {
  return s.replace(/\*\*/g, '').trim()
}

function splitNameInstruction(text: string): { name: string; instruction: string } {
  // Remove leading "Step N:" or "N." prefix
  const withoutPrefix = text.replace(/^(?:step\s*\d+[:.]\s*)?(?:\d+\.\s*)?/i, '')
  // Try splitting on first colon or period that looks like name:instruction
  const m = withoutPrefix.match(/^([^:.]{3,40})[:.]\s*(.+)/s)
  if (m && m[1] && m[2]) {
    return { name: m[1].trim(), instruction: m[2].trim() }
  }
  return { name: '', instruction: withoutPrefix.trim() || text.trim() }
}

function parseOldStep(s: any, index: number): BlueprintStep {
  if (typeof s === 'string') {
    const cleaned = strip(s)
    const { name, instruction } = splitNameInstruction(cleaned)
    return { step_number: index + 1, name, instruction }
  }

  // Object format
  const name = strip(s.name || '')
  const instruction = strip(
    s.instruction || s.description || s.text || (typeof s.step === 'string' ? s.step : '') || ''
  )
  return {
    step_number: s.step_number || index + 1,
    name,
    instruction,
    tip: s.tip,
  }
}

// --- Defining Traits ---

export type TraitWeight = 'core' | 'important' | 'supporting'

export interface DefiningTrait {
  text: string
  weight: TraitWeight
}

const VALID_WEIGHTS: TraitWeight[] = ['core', 'important', 'supporting']

function isValidWeight(w: any): w is TraitWeight {
  return typeof w === 'string' && VALID_WEIGHTS.includes(w as TraitWeight)
}

export function parseDefiningTraits(raw: any): DefiningTrait[] | null {
  if (!raw) return null

  // New structured format — array of { text, weight }
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object' && raw[0].text) {
    return raw
      .filter((t: any) => t.text && typeof t.text === 'string')
      .map((t: any) => ({
        text: strip(t.text),
        weight: isValidWeight(t.weight) ? t.weight : 'important',
      }))
  }

  // Old format — plain string: split into sentences, all as "important"
  if (typeof raw === 'string' && raw.trim()) {
    const sentences = raw
      .split(/\.(?:\s|$)/)
      .map(s => s.trim())
      .filter(s => s.length > 10)
    if (sentences.length === 0) return [{ text: strip(raw), weight: 'core' }]
    return sentences.map((s, i) => ({
      text: strip(s.endsWith('.') ? s : s + '.'),
      weight: (i === 0 ? 'core' : 'important') as TraitWeight,
    }))
  }

  return null
}

// --- Blueprint ---

export function parseBlueprint(raw: any): Blueprint | null {
  if (!raw) return null

  // New structured format — has phases array
  if (raw.phases && Array.isArray(raw.phases) && raw.phases.length > 0) {
    return {
      title: raw.title || '',
      phases: raw.phases.map((p: any) => ({
        phase_number: p.phase_number || 0,
        phase_title: p.phase_title || '',
        steps: Array.isArray(p.steps) ? p.steps.map((s: any, i: number) => parseOldStep(s, i)) : [],
      })),
    }
  }

  // Old formats — convert to single-phase blueprint
  let steps: BlueprintStep[] = []

  if (Array.isArray(raw)) {
    steps = raw.map((s, i) => parseOldStep(s, i))
  } else if (typeof raw === 'string') {
    steps = raw.split('\n').filter(Boolean).map((s, i) => parseOldStep(s, i))
  } else if (typeof raw === 'object') {
    if (raw.steps && Array.isArray(raw.steps)) {
      steps = raw.steps.map((s: any, i: number) => parseOldStep(s, i))
    } else {
      steps = Object.values(raw)
        .filter((v): v is string => typeof v === 'string')
        .map((v, i) => parseOldStep(v, i))
    }
  }

  if (steps.length === 0) return null

  return {
    title: '',
    phases: [{ phase_number: 1, phase_title: '', steps }],
  }
}
