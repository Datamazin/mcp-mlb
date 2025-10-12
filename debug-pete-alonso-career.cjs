#!/usr/bin/env node

/**
 * Debug Pete Alonso Career Stats API Structure
 */

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

async function debugPeteAlonsoStats() {
    console.log('🔍 Debugging Pete Alonso Career Stats API Structure\n');
    
    const playerId = 624413;
    
    try {
        const url = `${MLB_API_BASE}/people/${playerId}/stats?stats=yearByYear&gameType=R`;
        console.log(`🔗 URL: ${url}\n`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('📋 Full API Response Structure:');
        console.log(JSON.stringify(data, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugPeteAlonsoStats();