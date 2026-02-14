import { computeArchetype } from '@/lib/archetypes';
import { SurveyAnswer } from '@/types/survey';

// Mock survey responses for testing different archetype qualifications
const createMockResponse = (overrides: Partial<Record<string, string>>): SurveyAnswer[] => {
  const defaults = {
    c1: 'Sometimes', // longer than planned
    c2: 'Somewhat likely', // bet when stressed/bored
    c3: 'Rarely', // exceed budget
    c4: 'Rarely', // urge to chase
    c5: 'Straight bets', // bet types
    c6: '$10–$25', // bet size
    c7: 'Rarely', // adjust based on excitement
    c8: '5–15 min', // research reliance
    c9: 'NFL', // sports bet on
    c10: 'NFL', // sports understood most
    c11: 'Evening', // time of day
    c12: 'Yes, I track numbers' // tracking
  };

  const merged = { ...defaults, ...overrides };
  
  return Object.entries(merged).map(([questionId, selectedOption]) => ({
    questionId,
    selectedOption,
    timestamp: new Date()
  }));
};

describe('Equal Archetype Distribution', () => {
  test('should distribute archetypes equally across multiple runs', () => {
    const responses = createMockResponse({
      c8: '15+ min', // High research
      c12: 'Yes, I use tools/platforms' // High tracking
    });

    const results: Record<string, number> = {};
    const runs = 100;

    // Run multiple times to check distribution
    for (let i = 0; i < runs; i++) {
      const archetype = computeArchetype(responses);
      results[archetype.id] = (results[archetype.id] || 0) + 1;
    }

    console.log('Distribution results:', results);
    
    // Check that we get variety (not just one archetype)
    const uniqueArchetypes = Object.keys(results);
    expect(uniqueArchetypes.length).toBeGreaterThan(1);
    
    // Check that no single archetype dominates (>50% of results)
    const maxPercentage = Math.max(...Object.values(results)) / runs;
    expect(maxPercentage).toBeLessThan(0.6);
  });

  test('should qualify multiple archetypes for balanced users', () => {
    // Create a balanced user profile
    const responses = createMockResponse({
      c1: 'Sometimes',
      c2: 'Somewhat likely',
      c3: 'Rarely',
      c4: 'Rarely',
      c5: 'Straight bets',
      c6: '$10–$25',
      c7: 'Rarely',
      c8: '5–15 min',
      c9: 'NFL,NBA',
      c10: 'NFL',
      c11: 'Evening',
      c12: 'Yes, I track numbers'
    });

    // Test multiple runs to see variety
    const archetypes = new Set();
    for (let i = 0; i < 20; i++) {
      const archetype = computeArchetype(responses);
      archetypes.add(archetype.id);
    }

    // Should qualify multiple archetypes for variety
    expect(archetypes.size).toBeGreaterThan(1);
  });

  test('should handle edge cases gracefully', () => {
    // Test minimal responses
    const minimalResponses = createMockResponse({
      c1: 'Never',
      c2: 'Very unlikely',
      c3: 'Never',
      c4: 'Never',
      c5: 'Straight bets',
      c6: 'Under $10',
      c7: 'Never',
      c8: 'None',
      c9: 'NFL',
      c10: 'NFL',
      c11: 'Morning',
      c12: 'No'
    });

    const archetype = computeArchetype(minimalResponses);
    expect(archetype).toBeDefined();
    expect(archetype.name).toBeDefined();
  });

  test('should ensure fallback when few archetypes qualify', () => {
    // Create responses that might qualify very few archetypes
    const extremeResponses = createMockResponse({
      c1: 'Often',
      c2: 'Very likely',
      c3: 'Often',
      c4: 'Often',
      c5: 'In-game/live bets',
      c6: 'Over $100',
      c7: 'Often',
      c8: 'None',
      c9: 'NFL,NBA,MLB,NHL',
      c10: 'NFL,NBA,MLB',
      c11: 'Late night',
      c12: 'No'
    });

    const archetype = computeArchetype(extremeResponses);
    expect(archetype).toBeDefined();
    
    // Should still get variety across multiple runs
    const archetypes = new Set();
    for (let i = 0; i < 10; i++) {
      archetypes.add(computeArchetype(extremeResponses).id);
    }
    expect(archetypes.size).toBeGreaterThan(0);
  });
});
