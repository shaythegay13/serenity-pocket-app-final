export const FEATURE_FLAGS = {
  HYBRID_SURVEY: process.env.NEXT_PUBLIC_FEATURE_HYBRID_SURVEY === 'true',
  PGSI_INTEGRATION: process.env.NEXT_PUBLIC_FEATURE_PGSI_INTEGRATION === 'true',
  EMOTIONAL_STABILITY_V2: process.env.NEXT_PUBLIC_FEATURE_ES_V2 === 'true'
};

export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}
