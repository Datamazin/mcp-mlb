import { MLBAPIClient } from './build/mlb-api.js';

async function getTonightBrewersStarter() {
  const client = new MLBAPIClient('https://statsapi.mlb.com/api');
  const today = new Date().toISOString().split('T')[0];
  
  try {
    console.log(`🗓️ Tonight's MLB Games (${today}):`);
    const data = await client.getSchedule(today, today);
    
    if (data.dates && data.dates[0] && data.dates[0].games) {
      const games = data.dates[0].games;
      const brewersGame = games.find(game => 
        game.teams.away.team.name.includes('Brewers') || 
        game.teams.home.team.name.includes('Brewers')
      );
      
      if (brewersGame) {
        console.log('\n⚾ Brewers Game Found:');
        console.log(`Away: ${brewersGame.teams.away.team.name}`);
        console.log(`Home: ${brewersGame.teams.home.team.name}`);
        console.log(`Time: ${new Date(brewersGame.gameDate).toLocaleTimeString()}`);
        
        // Check for probable pitchers
        if (brewersGame.teams.away.probablePitcher || brewersGame.teams.home.probablePitcher) {
          const brewersTeam = brewersGame.teams.away.team.name.includes('Brewers') ? 'away' : 'home';
          const starter = brewersGame.teams[brewersTeam].probablePitcher;
          if (starter) {
            console.log(`🎯 Brewers Probable Starter: ${starter.fullName} (ID: ${starter.id})`);
            return { name: starter.fullName, id: starter.id };
          }
        }
        
        console.log('⚠️ No probable pitcher listed yet');
        return null;
      } else {
        console.log('❌ No Brewers game found for tonight');
        console.log('\nAvailable games:');
        games.forEach(game => {
          console.log(`- ${game.teams.away.team.name} @ ${game.teams.home.team.name}`);
        });
        return null;
      }
    } else {
      console.log('❌ No games found for tonight');
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching schedule:', error.message);
    return null;
  }
}

getTonightBrewersStarter();