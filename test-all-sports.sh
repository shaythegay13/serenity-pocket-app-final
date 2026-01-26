#!/bin/bash

echo "🧪 Testing All Sports for Dynamic Values"
echo "=========================================="

# Test each major sport
sports=("basketball_nba" "americanfootball_nfl" "baseball_mlb" "icehockey_nhl" "soccer_epl" "mma_ufc" "tennis_atp" "golf_pga")

for sport in "${sports[@]}"; do
    echo ""
    echo "📊 Testing $sport..."
    
    # Make API call
    response=$(curl -s -X POST http://localhost:3000/api/picker/recommend \
        -H "Content-Type: application/json" \
        -d "{\"sport\":\"$sport\",\"riskTolerance\":\"moderate\",\"weeklyBudget\":500,\"currentEmotion\":\"Confident\",\"currentEmotionIntensity\":7}" \
        --max-time 10)
    
    if [ $? -eq 0 ] && [ "$response" != "" ]; then
        # Check for dynamic values (not hardcoded 80 or 30)
        if echo "$response" | grep -q '"emotionalAlignment":[^8,80]'; then
            echo "✅ $sport: Dynamic emotional alignment detected"
        else
            echo "⚠️  $sport: Emotional alignment might be hardcoded"
        fi
        
        if echo "$response" | grep -q '"suggestedStakeAbsolute":[^3,30]'; then
            echo "✅ $sport: Dynamic stake amount detected"
        else
            echo "⚠️  $sport: Stake amount might be hardcoded"
        fi
        
        # Count recommendations
        rec_count=$(echo "$response" | grep -o '"gameId"' | wc -l)
        echo "📈 $sport: $rec_count recommendations generated"
        
    else
        echo "❌ $sport: API call failed or no data"
    fi
done

echo ""
echo "🏁 Test completed!"
echo "📝 Visit http://localhost:3000/test-all-sports.html for detailed results"
