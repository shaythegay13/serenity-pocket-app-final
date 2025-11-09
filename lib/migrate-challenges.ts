/**
 * Migrate existing challenges to update "trading" terminology to "betting"
 */
export function migrateChallengeTerminology(challenges: any[]): any[] {
  return challenges.map(challenge => {
    if (challenge.id === 'pause-challenge') {
      return {
        ...challenge,
        title: 'Pause Before Betting',
        description: 'Take a 3-second pause before 5 bets this week'
      }
    }
    return challenge
  })
}
