// Direct test of MLB Jobs API to understand structure
async function testJobsAPIStructure() {
    console.log('Testing MLB Jobs API structure...');
    
    const jobTypes = ['umpire', 'manager', 'coach', 'trainer', 'official'];
    
    for (const jobType of jobTypes) {
        const url = `https://statsapi.mlb.com/api/v1/jobs?jobType=${jobType}&sportId=1`;
        console.log(`\nTesting: ${url}`);
        
        try {
            const response = await fetch(url);
            console.log(`Status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Response structure:');
                console.log(JSON.stringify(data, null, 2));
                
                // If we find any data, break to avoid spam
                if (data.jobs && data.jobs.length > 0) {
                    console.log('✅ Found data! Breaking to avoid spam...');
                    break;
                }
            } else {
                console.log(`Error: ${response.statusText}`);
            }
        } catch (error) {
            console.log(`Failed: ${error.message}`);
        }
    }
    
    // Test without jobType to see what's required
    console.log('\n--- Testing without jobType ---');
    try {
        const response = await fetch('https://statsapi.mlb.com/api/v1/jobs?sportId=1');
        console.log(`Status: ${response.status}`);
        if (!response.ok) {
            const errorText = await response.text();
            console.log('Error response:', errorText);
        }
    } catch (error) {
        console.log('Failed:', error.message);
    }
}

testJobsAPIStructure();