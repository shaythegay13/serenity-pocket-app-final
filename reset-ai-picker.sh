#!/bin/bash

echo "🔄 Resetting AI Picker Usage Data"
echo "================================="

# Clear localStorage items that affect AI picker behavior
echo "🗑️  Clearing localStorage data..."

# Create a temporary HTML file to clear storage
cat > /tmp/clear-storage.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Clear AI Picker Data</title>
</head>
<body>
    <h1>Clearing AI Picker Data...</h1>
    <script>
        // Clear all serenity-related localStorage items
        const keysToClear = [
            'serenity_user_data',
            'serenity_emotion_logs', 
            'serenity_trades',
            'serenity_bias_profile',
            'serenity_bias_history',
            'serenity_achievements',
            'serenity_challenges',
            'serenity_last_check_in',
            'serenity_bet_analyses',
            'serenity_comprehensive_bets',
            'serenity_game_lines',
            'serenity_ai_service_usage',
            'pendingBetAnalysis',
            'tiltLabPrefillData',
            'pendingBetGame'
        ];

        let clearedCount = 0;
        keysToClear.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`✅ Cleared: ${key}`);
                clearedCount++;
            }
        });

        // Clear sessionStorage too
        sessionStorage.clear();

        document.body.innerHTML = `
            <h1>✅ Reset Complete!</h1>
            <p>Cleared ${clearedCount} localStorage items</p>
            <p>All sessionStorage cleared</p>
            <p>You can now test the AI Picker with fresh data!</p>
            <p><a href="/ai-picker">Go to AI Picker</a></p>
            <p><a href="/ai-bet-advisor">Go to AI Bet Advisor</a></p>
        `;
    </script>
</body>
</html>
EOF

echo "📁 Created reset page at: /tmp/clear-storage.html"
echo ""
echo "🌐 To reset your data:"
echo "1. Open your browser"
echo "2. Go to: file:///tmp/clear-storage.html"
echo "3. The page will automatically clear all AI picker data"
echo ""
echo "🔄 Alternative: Manual Reset"
echo "You can also manually reset by:"
echo "1. Opening browser DevTools (F12)"
echo "2. Go to Console tab"
echo "3. Run: localStorage.clear(); sessionStorage.clear();"
echo ""
echo "✅ After resetting, your AI picker will use fresh data!"
