import { supabase } from './lib/supabase';

async function main() {
  const parlay = {
    id: 'test-parlay-1',
    legs: Array.from({ length: 20 }).map((_, i) => ({
      pickId: `test-pick-${i}`,
      outcome: 'won',
      settledAt: new Date().toISOString()
    }))
  };

  const start = performance.now();

  // Try to test just the loop part
  for (const leg of parlay.legs) {
    if (leg.outcome && leg.outcome !== 'pending') {
      await supabase
        .from("parlay_legs")
        .update({
          outcome: leg.outcome,
          settled_at: leg.settledAt || null,
        })
        .eq("parlay_id", parlay.id)
        .eq("pick_id", leg.pickId)
    }
  }

  const end = performance.now();
  console.log(`Original update took ${end - start} ms`);


  const start2 = performance.now();

  const updates = parlay.legs.map(async (leg) => {
    if (leg.outcome && leg.outcome !== 'pending') {
      return supabase
        .from("parlay_legs")
        .update({
          outcome: leg.outcome,
          settled_at: leg.settledAt || null,
        })
        .eq("parlay_id", parlay.id)
        .eq("pick_id", leg.pickId)
    }
    return Promise.resolve();
  });
  await Promise.all(updates);

  const end2 = performance.now();
  console.log(`Optimized update took ${end2 - start2} ms`);
}

main().catch(console.error);
