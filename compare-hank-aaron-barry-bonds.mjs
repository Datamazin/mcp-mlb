// Test Hank Aaron vs Barry Bonds comparison using the MCP dynamic tool simulation
import { SportAPIFactory } from './build/api/sport-api-factory.js';
import { ComparisonFactory } from './build/comparison/comparison-factory.js';

async function compareHankAaronBarryBonds() {
    try {
        console.log('⚾ Hank Aaron vs Barry Bonds - Career Batting Comparison');
        console.log('='.repeat(80));
        
        // Simulate the MCP tool: compare-players-by-name
        const league = 'mlb';
        const player1Name = 'Hank Aaron';
        const player2Name = 'Barry Bonds';
        const statGroup = 'hitting';
        const season = 'career';
        const activeStatus = 'Both'; // Both active and inactive for historical players
        
        console.log('🔍 Simulating MCP Tool Call:');
        console.log(`Tool: compare-players-by-name`);
        console.log(`League: ${league}`);
        console.log(`Player 1: ${player1Name}`);
        console.log(`Player 2: ${player2Name}`);
        console.log(`Stat Group: ${statGroup}`);
        console.log(`Season: ${season}`);
        console.log(`Active Status: ${activeStatus}`);
        console.log();
        
        // Step 1: Search for players
        const apiClient = SportAPIFactory.getClient(league);
        
        console.log('1. 🔍 Searching for players...');
        
        // Search for Hank Aaron
        console.log(`   Searching for "${player1Name}"...`);
        const aaronResults = await apiClient.searchPlayers(player1Name, 'N'); // Inactive players
        const aaronCandidates = aaronResults.people || [];
        
        if (aaronCandidates.length === 0) {
            console.log('   ❌ Hank Aaron not found');
            return;
        }
        
        console.log(`   ✅ Found ${aaronCandidates.length} candidates for Hank Aaron:`);
        aaronCandidates.slice(0, 3).forEach((player, i) => {
            console.log(`      ${i + 1}. ${player.fullName} (ID: ${player.id}) - ${player.primaryPosition?.name || 'Unknown position'}`);
        });
        
        // Search for Barry Bonds
        console.log(`   Searching for "${player2Name}"...`);
        const bondsResults = await apiClient.searchPlayers(player2Name, 'N'); // Inactive players
        const bondsCandidates = bondsResults.people || [];
        
        if (bondsCandidates.length === 0) {
            console.log('   ❌ Barry Bonds not found');
            return;
        }
        
        console.log(`   ✅ Found ${bondsCandidates.length} candidates for Barry Bonds:`);
        bondsCandidates.slice(0, 3).forEach((player, i) => {
            console.log(`      ${i + 1}. ${player.fullName} (ID: ${player.id}) - ${player.primaryPosition?.name || 'Unknown position'}`);
        });
        
        // Step 2: Select best matches (first result)
        const selectedAaron = aaronCandidates[0];
        const selectedBonds = bondsCandidates[0];
        
        console.log('\n2. 👥 Selected players:');
        console.log(`   Hank Aaron: ${selectedAaron.fullName} (ID: ${selectedAaron.id})`);
        console.log(`   Barry Bonds: ${selectedBonds.fullName} (ID: ${selectedBonds.id})`);
        
        // Step 3: Get career statistics
        console.log('\n3. 📊 Retrieving career statistics...');
        
        const mlbClient = apiClient;
        
        // Using the legacy comparison function for MLB
        const { comparePlayers } = await import('./build/comparison-utils.js');
        
        console.log('   Getting Hank Aaron career stats...');
        const comparisonResult = await comparePlayers(
            mlbClient,
            selectedAaron.id,
            selectedBonds.id,
            'career',
            'hitting'
        );
        
        // Step 4: Display results
        console.log('\n' + '='.repeat(80));
        console.log('🏆 CAREER BATTING COMPARISON RESULTS');
        console.log('='.repeat(80));
        
        console.log(`\n👤 ${comparisonResult.player1.name} vs ${comparisonResult.player2.name}`);
        console.log(`🏆 Overall Winner: ${comparisonResult.winner}`);
        console.log(`📋 Summary: ${comparisonResult.summary}`);
        
        // Display top metrics
        console.log('\n📈 Key Batting Statistics:');
        
        if (comparisonResult.metrics && comparisonResult.metrics.length > 0) {
            const keyStats = comparisonResult.metrics.slice(0, 10);
            
            keyStats.forEach((metric, i) => {
                const winnerName = metric.winner === 'player1' ? comparisonResult.player1.name : 
                                 metric.winner === 'player2' ? comparisonResult.player2.name : 'TIE';
                
                console.log(`   ${i + 1}. ${metric.name}:`);
                console.log(`      ${comparisonResult.player1.name}: ${metric.player1Value}`);
                console.log(`      ${comparisonResult.player2.name}: ${metric.player2Value}`);
                console.log(`      Winner: ${winnerName} ${metric.difference > 0 ? `(+${metric.difference})` : ''}`);
                console.log();
            });
        }
        
        // Player details
        console.log('📋 Player Details:');
        console.log(`   ${comparisonResult.player1.name}:`);
        if (comparisonResult.player1.stats) {
            Object.entries(comparisonResult.player1.stats).slice(0, 5).forEach(([stat, value]) => {
                console.log(`      ${stat}: ${value}`);
            });
        }
        
        console.log(`   ${comparisonResult.player2.name}:`);
        if (comparisonResult.player2.stats) {
            Object.entries(comparisonResult.player2.stats).slice(0, 5).forEach(([stat, value]) => {
                console.log(`      ${stat}: ${value}`);
            });
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('✅ Career Batting Comparison Complete!');
        console.log('\n🎯 This demonstrates the MCP dynamic tool capability:');
        console.log('   - ✅ Player name search (no IDs needed)');
        console.log('   - ✅ Historical player support');
        console.log('   - ✅ Career statistics comparison');
        console.log('   - ✅ Comprehensive batting metrics');
        console.log('   - ✅ Dynamic tool parameterization');
        
    } catch (error) {
        console.error('❌ Comparison failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

compareHankAaronBarryBonds();