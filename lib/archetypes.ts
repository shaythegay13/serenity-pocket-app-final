import { SURVEY_QUESTIONS, SurveyAnswer } from '@/types/survey'

export interface ArchetypeDef {
  id: string
  name: string
  description: string
  positive: string
  negative: string
}

// Derive archetype using ONLY snapshot questions (c1–c4)
export function computeArchetypeFromSnapshot(responses: SurveyAnswer[]): ArchetypeDef {
  const getIdx = (id: string) => {
    const opts = SURVEY_QUESTIONS.find(q => q.id === id)?.options || []
    const ans = responses.find(r => r.questionId === id)
    if (!ans) return -1
    const val = Array.isArray(ans.selectedOption) ? ans.selectedOption[0] : ans.selectedOption
    return opts.indexOf(val)
  }

  const c1 = Math.max(0, getIdx('c1')) // longer than planned 0..3
  const c2 = Math.max(0, getIdx('c2')) // bet when stressed/bored 0..3
  const c3 = Math.max(0, getIdx('c3')) // exceed budget 0..3
  const c4 = Math.max(0, getIdx('c4')) // urge to chase 0..3

  // Simple signals
  const lowAll = c1 <= 0 && c2 <= 0 && c3 <= 0 && c4 <= 0
  const highEmotion = c2 >= 2 || c4 >= 2
  const highOverrun = c1 >= 2
  const budgetStress = c3 >= 2

  // Score each archetype lightly
  const score: Record<string, number> = {
    analyst: 0,
    emotional_bettor: 0,
    thrill_seeker: 0,
    social_bettor: 0,
    escape_artist: 0,
    risk_controller: 0,
    big_spender: 0,
    superfan: 0,
    aspiring_pro: 0,
    casual_dabbler: 0,
  }

  // Emotional signals
  score.emotional_bettor += c2 + c4
  score.escape_artist += c2 + (c4 >= 2 ? 1 : 0)
  score.thrill_seeker += c1 + (c4 >= 2 ? 1 : 0)

  // Control/discipline
  score.risk_controller += (3 - c1) + (3 - c3) + (3 - c4)
  score.analyst += (3 - c2) + (3 - c4)

  // Budget/overrun
  score.big_spender += Math.max(0, c3 - 1) + Math.max(0, c1 - 1)

  // Low activation → casual
  if (lowAll) score.casual_dabbler += 3

  // Tie-breakers
  if (highEmotion && !budgetStress) score.thrill_seeker += 1
  if (budgetStress) score.emotional_bettor += 1

  let best: keyof typeof score = 'analyst'
  let bestVal = -Infinity
  for (const [k, v] of Object.entries(score)) {
    if (v > bestVal) { best = k as any; bestVal = v }
  }
  return ARCHETYPES.find(a => a.id === best) || ARCHETYPES[0]
}

export const ARCHETYPES: readonly ArchetypeDef[] = [
  {
    id: 'analyst',
    name: 'The Analyst',
    description: 'Relies on data, research, and logic for every decision, tracking results and finding edges through information.',
    positive: 'Avoids reckless bets and manages risk systematically.',
    negative: 'May overthink decisions or become inflexible, sometimes missing timely opportunities.'
  },
  {
    id: 'emotional_bettor',
    name: 'The Emotional Bettor',
    description: 'Bets are driven by mood, stress, or the pursuit of relief and excitement, often influenced by emotional states rather than numbers.',
    positive: 'Experiences betting as a vivid and engaging outlet.',
    negative: 'Prone to chasing losses and impulsive bets, which can disrupt discipline.'
  },
  {
    id: 'thrill_seeker',
    name: 'The Thrill Seeker',
    description: 'Seeks excitement and adrenaline, frequently making high-variance or live bets, and thrives on the rush betting brings.',
    positive: 'Keeps the experience lively and fun, bringing energy to every wager.',
    negative: 'Faces risk of significant losses if thrill-seeking outweighs smart decision-making.'
  },
  {
    id: 'social_bettor',
    name: 'The Social Bettor',
    description: 'Views betting as a social event, participating to bond with friends or groups and focuses on enjoyment over seriousness.',
    positive: 'Builds connections and keeps the experience lighthearted.',
    negative: 'May make bets due to social pressure and not monitor risk or outcomes carefully.'
  },
  {
    id: 'escape_artist',
    name: 'The Escape Artist',
    description: 'Uses gambling as an escape or mood-changer, betting more during stressful or boring periods for distraction.',
    positive: 'Gains short-term mood boost or distraction when needed.',
    negative: 'Vulnerable to building unhealthy patterns if betting becomes a primary coping strategy.'
  },
  {
    id: 'risk_controller',
    name: 'The Risk Controller',
    description: 'Strictly manages bankroll and bets cautiously, prioritizing security and minimizing exposure to loss.',
    positive: 'Avoids ruinous losses and models financial responsibility.',
    negative: 'Could miss rewarding opportunities or enjoyment by being overly risk-averse.'
  },
  {
    id: 'big_spender',
    name: 'The Big Spender',
    description: 'Enjoys the prestige, excitement, and suspense of higher stakes, often making larger bets than the average peer.',
    positive: 'Brings confidence and conviction to bets, embracing high-stakes action.',
    negative: 'At risk of large, sudden losses and can let ego override sound judgment.'
  },
  {
    id: 'superfan',
    name: 'The Superfan',
    description: 'Wagers as a devoted fan, focusing on favorite teams, leagues, or players, often driven by loyalty over numbers.',
    positive: 'Highly knowledgeable in their sport of choice and passionate about following trends.',
    negative: 'Susceptible to bias and poor judgment if loyalty clouds objective analysis.'
  },
  {
    id: 'aspiring_pro',
    name: 'The Aspiring Pro',
    description: 'Strives for consistent profit, using sophisticated tracking, research, and discipline to mimic professional bettors.',
    positive: 'Highly strategic and always improving methods, aiming for sustainable gains.',
    negative: 'Can become too wrapped up in betting as “work,” risking fatigue or loss of enjoyment.'
  },
  {
    id: 'casual_dabbler',
    name: 'The Casual Dabbler',
    description: 'Bets rarely and with small stakes for novelty, sampling different markets with minimal investment or pressure.',
    positive: 'Experiences none of the stress or risk of heavier bettors and can easily walk away.',
    negative: 'May lack insight for savvy play and is more easily influenced by trends or hype when they do participate.'
  }
] as const

function getQuestionOptions(id: string): string[] | null {
  const q = SURVEY_QUESTIONS.find(q => q.id === id)
  return q ? q.options : null
}

function getSingleIndex(responses: SurveyAnswer[], id: string): number {
  const qOpts = getQuestionOptions(id)
  if (!qOpts) return -1
  const ans = responses.find(r => r.questionId === id)
  if (!ans) return -1
  const val = Array.isArray(ans.selectedOption) ? ans.selectedOption[0] : ans.selectedOption
  return qOpts.indexOf(val)
}

function getMultiSelected(responses: SurveyAnswer[], id: string): string[] {
  const ans = responses.find(r => r.questionId === id)
  if (!ans) return []
  return Array.isArray(ans.selectedOption) ? ans.selectedOption : [ans.selectedOption]
}

function countIf(arr: any[], predicate: (x: any) => boolean): number {
  return arr.reduce((acc, x) => acc + (predicate(x) ? 1 : 0), 0)
}

// Behavioral score calculation for qualification system
function calculateBehavioralScores(responses: SurveyAnswer[]) {
  const c1 = getSingleIndex(responses, 'c1') // longer than planned
  const c2 = getSingleIndex(responses, 'c2') // bet when stressed/bored
  const c3 = getSingleIndex(responses, 'c3') // exceed budget
  const c4 = getSingleIndex(responses, 'c4') // chase urge
  const c5 = getMultiSelected(responses, 'c5') // bet types
  const c6 = getSingleIndex(responses, 'c6') // bet size (0..4)
  const c7 = getSingleIndex(responses, 'c7') // adjust based on excitement
  const c8 = getSingleIndex(responses, 'c8') // research reliance (3 best)
  const c9 = getMultiSelected(responses, 'c9') // sports bet on
  const c10 = getMultiSelected(responses, 'c10') // sports understood most
  const c11 = getSingleIndex(responses, 'c11') // time of day (0..4)
  const c12 = getSingleIndex(responses, 'c12') // tracking (0..3; 3 best)

  const researchScore = Math.max(0, c8) // 0..3
  const trackingScore = Math.max(0, c12) // 0..3
  const emotionScore = Math.max(0, c2) + Math.max(0, c4) // 0..6
  const betSizeScore = Math.max(0, c6) // 0..4
  const adjustScore = Math.max(0, c7) // 0..3
  const budgetExceedScore = Math.max(0, c3) // 0..3
  const timeLateNight = c11 === 3 ? 1 : 0

  const hasLive = c5.includes('In-game/live bets')
  const hasParlay = c5.includes('Parlays') || c5.includes('Same-game parlays')
  const hasProps = c5.includes('Props')
  const hasStraight = c5.includes('Straight bets')

  const sportsCount = c9.length
  const understoodCount = c10.length
  const overlapSports = c9.filter(s => c10.includes(s))
  const overlapCount = overlapSports.length

  return {
    researchScore,
    trackingScore,
    emotionScore,
    betSizeScore,
    adjustScore,
    budgetExceedScore,
    timeLateNight,
    hasLive,
    hasParlay,
    hasProps,
    hasStraight,
    sportsCount,
    understoodCount,
    overlapCount,
    c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12
  }
}

// Qualification rules for each archetype
function isQualifiedForArchetype(archetypeId: string, scores: any): boolean {
  switch (archetypeId) {
    case 'analyst':
      return scores.researchScore >= 1 || scores.trackingScore >= 1

    case 'thrill_seeker':
      return scores.hasLive || scores.hasParlay || scores.betSizeScore >= 1

    case 'emotional_bettor':
      return scores.emotionScore >= 1

    case 'risk_controller':
      return scores.budgetExceedScore <= 2

    case 'social_bettor':
      return scores.sportsCount >= 1

    case 'escape_artist':
      return Math.max(0, scores.c2) >= 1 || scores.timeLateNight === 1

    case 'big_spender':
      return scores.betSizeScore >= 2

    case 'superfan':
      return scores.sportsCount >= 1

    case 'aspiring_pro':
      return scores.researchScore >= 1

    case 'casual_dabbler':
      return scores.betSizeScore <= 2

    default:
      return true // Fallback
  }
}

// Equal probability selection with minimal behavioral tie-breaking
function selectWithEqualProbability(qualifiedArchetypes: ArchetypeDef[], scores: any): ArchetypeDef {
  if (qualifiedArchetypes.length === 1) {
    return qualifiedArchetypes[0]
  }

  // True equal probability: randomly select from qualified archetypes
  const randomIndex = Math.floor(Math.random() * qualifiedArchetypes.length)
  return qualifiedArchetypes[randomIndex]
}

// Main function with equal distribution logic
export function computeArchetype(responses: SurveyAnswer[]): ArchetypeDef {
  const scores = calculateBehavioralScores(responses)

  // Find qualified archetypes
  let qualified = ARCHETYPES.filter(archetype =>
    isQualifiedForArchetype(archetype.id, scores)
  )

  // Ensure minimum qualification (at least 2-3 archetypes)
  if (qualified.length < 2) {
    // Relax criteria: include archetypes with partial qualification
    qualified = ARCHETYPES.filter(archetype => {
      if (isQualifiedForArchetype(archetype.id, scores)) return true

      // Relaxed rules for backup qualification
      switch (archetype.id) {
        case 'analyst':
          return scores.researchScore >= 1 || scores.trackingScore >= 1
        case 'thrill_seeker':
          return scores.hasLive || scores.hasParlay || scores.betSizeScore >= 1
        case 'emotional_bettor':
          return scores.emotionScore >= 2
        case 'risk_controller':
          return scores.budgetExceedScore <= 1
        case 'social_bettor':
          return scores.sportsCount >= 1
        case 'escape_artist':
          return Math.max(0, scores.c2) >= 1
        case 'big_spender':
          return scores.betSizeScore >= 2
        case 'superfan':
          return scores.sportsCount <= 2
        case 'aspiring_pro':
          return scores.researchScore >= 2
        case 'casual_dabbler':
          return scores.betSizeScore <= 2
        default:
          return true
      }
    })
  }

  // Final fallback: ensure at least 3 archetypes
  if (qualified.length < 3) {
    qualified = ARCHETYPES.slice(0, 3) // Default to first 3 archetypes
  }

  return selectWithEqualProbability(qualified, scores)
}
