// Test script to verify AI bet analysis fixes
const testBetAnalysis = async () => {
  console.log('🧪 Testing AI Bet Analysis Fixes...\n');
  
  const testCases = [
    {
      name: 'Broncos vs Patriots (AI thinks Broncos will win)',
      payload: {
        sport: 'americanfootball_nfl',
        betType: 'Moneyline',
        betAmount: 30,
        budget: 500,
        favoriteTeam: 'New England Patriots',
        underdogTeam: 'Denver Broncos',
        favoriteRecord: '10-6',
        underdogRecord: '8-8',
        odds: -150, // Patriots favored
        selection: 'away', // Betting on Broncos (underdog)
        currentEmotion: 'Centered',
        lastOutcome: 'None',
        emotionalTriggers: '',
        bettingSlip: '',
        history: '',
        notes: '',
        hasKeyInjuries: false,
        hasAdverseWeather: false,
        isLiveBet: false,
        isFavoriteTeam: false,
        isChasingLoss: false,
        confidenceLevel: 5,
        reasoning: '',
        sportsbook: 'DraftKings'
      }
    },
    {
      name: 'Seahawks vs Opponent (AI thinks Seahawks will win)',
      payload: {
        sport: 'americanfootball_nfl',
        betType: 'Moneyline',
        betAmount: 30,
        budget: 500,
        favoriteTeam: 'Favorite Team',
        underdogTeam: 'Seattle Seahawks',
        favoriteRecord: '9-7',
        underdogRecord: '7-9',
        odds: +130, // Seahawks underdog
        selection: 'away', // Betting on Seahawks
        currentEmotion: 'Confident',
        lastOutcome: 'Won',
        emotionalTriggers: '',
        bettingSlip: '',
        history: 'Recent win streak',
        notes: '',
        hasKeyInjuries: false,
        hasAdverseWeather: false,
        isLiveBet: false,
        isFavoriteTeam: false,
        isChasingLoss: false,
        confidenceLevel: 7,
        reasoning: '',
        sportsbook: 'DraftKings'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📊 Testing: ${testCase.name}`);
    console.log(`Odds: ${testCase.payload.odds}, Selection: ${testCase.payload.selection}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/ai/analyze-bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.payload)
      });

      if (!response.ok) {
        console.error(`❌ API Error: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      
      console.log('✅ Analysis Results:');
      console.log(`  Recommendation: ${data.analysis?.recommendation?.recommendation}`);
      console.log(`  Reason: ${data.analysis?.recommendation?.reason}`);
      
      if (data.enhanced) {
        console.log('🧠 Enhanced Analysis:');
        console.log(`  Emotional Alignment: ${data.enhanced.emotionalAlignment}%`);
        console.log(`  Enhanced Reasoning: ${data.enhanced.enhancedReasoning?.substring(0, 100)}...`);
        console.log(`  Numeric Risk EV: $${data.enhanced.numericRisk?.ev}`);
      }
      
      // Check if values are dynamic (not hardcoded)
      const emotionalAlignment = data.enhanced?.emotionalAlignment;
      const stakeRecommendation = data.enhanced?.numericRisk?.ev;
      
      if (emotionalAlignment && emotionalAlignment !== 80) {
        console.log('✅ Dynamic emotional alignment detected');
      } else {
        console.log('⚠️  Emotional alignment might still be hardcoded');
      }
      
      if (stakeRecommendation !== undefined && stakeRecommendation !== 0) {
        console.log('✅ Dynamic stake calculation detected');
      } else {
        console.log('⚠️  Stake calculation needs verification');
      }
      
    } catch (error) {
      console.error(`❌ Test failed:`, error.message);
    }
  }
  
  console.log('\n🏁 Test completed!');
};

// Run the test
testBetAnalysis().catch(console.error);
