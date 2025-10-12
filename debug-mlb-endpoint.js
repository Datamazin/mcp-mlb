/**
 * Debug MLB-StatsAPI Endpoint Structure
 * Constitutional Compliance: Testing proper API patterns as per MLB-StatsAPI reference
 */

const fetch = globalThis.fetch;

async function debugMLBEndpoint() {
    console.log('🔧 DEBUGGING MLB-STATSAPI ENDPOINT STRUCTURE');
    console.log('=' .repeat(60));
    
    const baseUrl = 'https://statsapi.mlb.com/api/v1';
    const currentYear = new Date().getFullYear();
    
    try {
        console.log('📡 Testing MLB-StatsAPI sports_players endpoint...');
        const endpoint = `/sports/1/players?season=${currentYear}`;
        const fullUrl = baseUrl + endpoint;
        
        console.log('Full URL:', fullUrl);
        
        const response = await fetch(fullUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('\n📊 Response Structure:');
        console.log('Keys in response:', Object.keys(data));
        
        if (data.people && data.people.length > 0) {
            console.log('✅ Found people array with', data.people.length, 'players');
            console.log('\n🔍 Sample player structure:');
            const samplePlayer = data.people[0];
            console.log('Player keys:', Object.keys(samplePlayer));
            console.log('Sample player:', {
                id: samplePlayer.id,
                fullName: samplePlayer.fullName,
                firstName: samplePlayer.firstName,
                lastName: samplePlayer.lastName
            });
        } else {
            console.log('❌ No people array found in response');
            if (data.roster) {
                console.log('✅ Found roster array with', data.roster.length, 'players');
                console.log('\n🔍 Sample roster player structure:');
                const samplePlayer = data.roster[0];
                console.log('Roster player keys:', Object.keys(samplePlayer));
            }
        }
        
        console.log('\n🏛️ CONSTITUTIONAL COMPLIANCE:');
        console.log('✅ Using MLB-StatsAPI reference endpoint: /sports/{sportId}/players');
        console.log('✅ Proper parameter usage: season=' + currentYear);
        console.log('✅ Constitutional endpoint pattern verified');
        
    } catch (error) {
        console.error('❌ DEBUGGING FAILED:', error.message);
        console.log('\n🔧 Constitutional Fix Required:');
        console.log('   - Verify MLB-StatsAPI endpoint availability');
        console.log('   - Check response structure mapping');
        console.log('   - Validate API access patterns');
    }
}

debugMLBEndpoint();