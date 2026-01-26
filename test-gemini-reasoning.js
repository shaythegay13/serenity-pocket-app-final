// Test script to verify Gemini reasoning fixes
const { analyzeUserBet } = require('./lib/services/gemini-reasoner.ts');

const testGeminiReasoning = async () => {
  console.log('🧪 Testing Gemini Reasoning Fixes...\n');
  
  const testCases = [
    {
      name: 'Broncos vs Patriots (AI probability > implied)',
      input: {
        user: {
          currentEmotion: 'Centered',
          riskTolerance: 'moderate',
          weeklyBudget: 500,
          lastOutcome: 'None',
          emotionalTriggers: '',
          recentHistorySummary: ''
        },
        game: {
          context: {
            homeTeam: 'New England Patriots',
            awayTeam: 'Denver Broncos',
            currentOdds: {
              moneylineHome: -150,
              moneylineAway: +130
            },
            impliedProbabilities: {
              home: 0.60, // 60% implied for Patriots
              away: 0.40  // 40% implied for Broncos
            }
          },
          prediction: {
            winProbabilityHome: 0.55, // AI thinks Patriots have 55% (lower than implied)
            winProbabilityAway: 0.45, // AI thinks Broncos have 45% (higher than implied!)
            modelConfidence: 0.75
          }
        },
        bet: {
          type: 'Moneyline',
          stake: 30,
          odds: +130, // Betting on Broncos
          slipText: 'Denver Broncos moneyline +130'
        }
      }
    },
    {
      name: 'Seahawks case (AI probability > implied)',
      input: {
        user: {
          currentEmotion: 'Confident',
          riskTolerance: 'moderate', 
          weeklyBudget: 500,
          lastOutcome: 'Won',
          emotionalTriggers: '',
          recentHistorySummary: 'Recent win streak, feeling confident'
        },
        game: {
          context: {
            homeTeam: 'Favorite Team',
            awayTeam: 'Seattle Seahawks',
            currentOdds: {
              moneylineHome: -140,
              moneylineAway: +120
            },
            impliedProbabilities: {
              home: 0.58, // 58% implied for favorite
              away: 0.42  // 42% implied for Seahawks
            }
          },
          prediction: {
            winProbabilityHome: 0.55, // AI thinks favorite has 55% (lower than implied)
            winProbabilityAway: 0.48, // AI thinks Seahawks have 48% (higher than implied!)
            modelConfidence: 0.80
          }
        },
        bet: {
          type: 'Moneyline',
          stake: 30,
          odds: +120, // Betting on Seahawks
          slipText: 'Seattle Seahawks moneyline +120'
        }
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📊 Testing: ${testCase.name}`);
    console.log(`AI Probability: ${testCase.input.game.prediction.winProbabilityAway * 100}% vs Implied: ${testCase.input.game.context.impliedProbabilities.away * 100}%`);
    
    try {
      const result = await analyzeUserBet(testCase.input);
      
      console.log('✅ Gemini Results:');
      console.log(`  Safety Category: ${result.betSafetyCategory}`);
      console.log(`  Stake Amount: $${result.stakeRecommendation.amount}`);
      console.log(`  Stake Fraction: ${(result.stakeRecommendation.fractionOfBudget * 100).toFixed(1)}%`);
      console.log(`  Emotional Alignment: ${result.emotionalAlignment}%`);
      console.log(`  Summary: ${result.summary.substring(0, 100)}...`);
      
      // Check if the logic is correct
      const aiProb = testCase.input.game.prediction.winProbabilityAway;
      const impliedProb = testCase.input.game.context.impliedProbabilities.away;
      
      if (aiProb > impliedProb) {
        if (result.betSafetyCategory === 'PREFERRED' || result.betSafetyCategory === 'REASONABLE') {
          console.log('✅ CORRECT: AI recommends betting when probability > implied');
        } else {
          console.log('❌ ISSUE: AI should recommend betting when probability > implied');
        }
      } else {
        if (result.betSafetyCategory === 'DISCOURAGED' || result.betSafetyCategory === 'CAUTION') {
          console.log('✅ CORRECT: AI discourages betting when probability < implied');
        } else {
          console.log('❌ ISSUE: AI should discourage betting when probability < implied');
        }
      }
      
      // Check for dynamic values
      if (result.emotionalAlignment && result.emotionalAlignment !== 80) {
        console.log('✅ Dynamic emotional alignment detected');
      } else {
        console.log('⚠️  Emotional alignment might be static');
      }
      
      if (result.stakeRecommendation.amount && result.stakeRecommendation.amount !== 30) {
        console.log('✅ Dynamic stake calculation detected');
      } else {
        console.log('⚠️  Stake might be using default value');
      }
      
    } catch (error) {
      console.error(`❌ Test failed:`, error.message);
    }
  }
  
  console.log('\n🏁 Gemini reasoning test completed!');
};

// Run the test
testGeminiReasoning().catch(console.error);
