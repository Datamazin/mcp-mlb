// Direct test of MLB postseason API endpoint
import https from 'https';

async function testPostseasonAPI() {
    console.log('Testing MLB Postseason API...');
    
    // Test the exact endpoint
    const url = 'https://statsapi.mlb.com/api/v1/schedule/postseason?season=2024&hydrate=team,linescore,venue';
    
    console.log(`Making request to: ${url}`);
    
    try {
        const response = await fetch(url);
        console.log(`Response status: ${response.status}`);
        console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const data = await response.json();
            console.log('API Response:');
            console.log(JSON.stringify(data, null, 2));
        } else {
            const errorText = await response.text();
            console.log('Error response:', errorText);
        }
    } catch (error) {
        console.error('Request failed:', error.message);
    }
}

// Also test with different parameters
async function testMultipleYears() {
    const years = [2024, 2023, 2025];
    
    for (const year of years) {
        console.log(`\n--- Testing ${year} ---`);
        const url = `https://statsapi.mlb.com/api/v1/schedule/postseason?season=${year}`;
        
        try {
            const response = await fetch(url);
            console.log(`${year}: Status ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`${year}: Found ${data.dates?.length || 0} dates with games`);
                if (data.dates && data.dates.length > 0) {
                    const totalGames = data.dates.reduce((sum, date) => sum + (date.games?.length || 0), 0);
                    console.log(`${year}: Total games: ${totalGames}`);
                }
            } else {
                console.log(`${year}: Error - ${response.statusText}`);
            }
        } catch (error) {
            console.log(`${year}: Failed - ${error.message}`);
        }
    }
}

// Run tests
testPostseasonAPI().then(() => {
    console.log('\n' + '='.repeat(50));
    return testMultipleYears();
});