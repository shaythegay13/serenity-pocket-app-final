(async () => {
  try {
    const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams');
    const data = await response.json();
    
    // Navigate the nested structure
    const teams = data.sports[0].leagues[0].teams;
    
    const utahTeam = teams.find(t => 
      t.team.displayName.toLowerCase().includes('utah')
    );
    
    if (utahTeam) {
      console.log('✓ Utah team found!');
      console.log('Display name:', utahTeam.team.displayName);
      console.log('Slug:', utahTeam.team.slug);
      console.log('Abbreviation:', utahTeam.team.abbreviation);
    } else {
      console.log('✗ Utah not found in ESPN data');
      console.log('\nAll NHL teams on ESPN:');
      teams.forEach(t => console.log(`  - ${t.team.displayName} (${t.team.slug})`));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
