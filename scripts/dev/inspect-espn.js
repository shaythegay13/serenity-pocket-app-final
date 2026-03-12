(async () => {
  try {
    const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams');
    const data = await response.json();
    
    console.log('Response structure:');
    console.log(JSON.stringify(data, null, 2).substring(0, 1000));
    
    // Check different possible property names
    console.log('\nChecking for teams data...');
    console.log('data.teams:', !!data.teams);
    console.log('data.sports:', !!data.sports);
    console.log('Top-level keys:', Object.keys(data).slice(0, 10));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
