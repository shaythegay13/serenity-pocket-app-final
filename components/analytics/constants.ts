export const EMOTION_SCORE_LOOKUP: Record<string, number> = {
  // JOY (higher is better; happiest person = 100)
  happy: 100,
  excited: 96,
  optimistic: 92,
  grateful: 90,
  confident: 88,
  proud: 86,
  hopeful: 84,
  content: 82,
  cheerful: 80,
  inspired: 78,

  // CALM (positive/stable)
  peaceful: 85,
  relaxed: 82,
  centered: 80,
  focused: 78,
  balanced: 76,
  serene: 74,
  patient: 72,
  composed: 70,
  tranquil: 68,
  stable: 66,

  // FEAR (negative)
  anxious: 35,
  worried: 37,
  nervous: 38,
  scared: 33,
  uncertain: 40,
  panicked: 28,
  hesitant: 42,
  overwhelmed: 25,
  tense: 36,
  uneasy: 39,

  // GREED (risk / impulse; negative leaning)
  fomo: 30,
  euphoric: 44,
  impulsive: 26,
  overconfident: 40,
  eager: 52,
  craving: 24,
  obsessed: 20,
  compulsive: 18,
  restless: 34,
  driven: 46,

  // FRUSTRATION (lowest; maddest person = 0)
  angry: 0,
  irritated: 10,
  disappointed: 22,
  impatient: 14,
  stressed: 12,
  resentful: 6,
  annoyed: 16,
  agitated: 8,
  bitter: 4,
  exhausted: 18,

  // SADNESS (sad person = 45)
  down: 45,
  discouraged: 42,
  regretful: 40,
  defeated: 34,
  helpless: 28,
  lonely: 32,
  empty: 26,
  hopeless: 20,
  dejected: 30,
  grief: 16,
}

export const EMOTION_CATEGORIES: Record<string, string> = {
  // Joy
  happy: 'joy', excited: 'joy', optimistic: 'joy', grateful: 'joy', confident: 'joy',
  proud: 'joy', hopeful: 'joy', content: 'joy', cheerful: 'joy', inspired: 'joy',
  // Calm
  peaceful: 'calm', relaxed: 'calm', centered: 'calm', focused: 'calm', balanced: 'calm',
  serene: 'calm', patient: 'calm', composed: 'calm', tranquil: 'calm', stable: 'calm',
  // Fear
  anxious: 'fear', worried: 'fear', nervous: 'fear', scared: 'fear', uncertain: 'fear',
  panicked: 'fear', hesitant: 'fear', overwhelmed: 'fear', tense: 'fear', uneasy: 'fear',
  // Greed
  fomo: 'greed', euphoric: 'greed', impulsive: 'greed', overconfident: 'greed', eager: 'greed',
  craving: 'greed', obsessed: 'greed', compulsive: 'greed', restless: 'greed', driven: 'greed',
  // Frustration
  angry: 'frustration', irritated: 'frustration', disappointed: 'frustration', impatient: 'frustration',
  stressed: 'frustration', resentful: 'frustration', annoyed: 'frustration', agitated: 'frustration',
  bitter: 'frustration', exhausted: 'frustration',
  // Sadness
  down: 'sadness', discouraged: 'sadness', regretful: 'sadness', defeated: 'sadness',
  helpless: 'sadness', lonely: 'sadness', empty: 'sadness', hopeless: 'sadness',
  dejected: 'sadness', grief: 'sadness',
}

export const AVAILABLE_SPORTS = [
  { key: "basketball_nba", label: "NBA" },
  { key: "americanfootball_nfl", label: "NFL" },
  { key: "baseball_mlb", label: "MLB" },
  { key: "icehockey_nhl", label: "NHL" },
]
