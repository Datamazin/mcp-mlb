// Test the MLB Jobs endpoint functionality
import { MLBAPIClient } from './build/mlb-api.js';

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';
const mlbClient = new MLBAPIClient(MLB_API_BASE);

async function testMLBJobsEndpoint() {
    console.log('Testing MLB Jobs Endpoint...');
    
    // Common job types to test
    const jobTypes = ['umpire', 'manager', 'coach', 'trainer'];
    
    for (const jobType of jobTypes) {
        console.log(`\n--- Testing Job Type: "${jobType}" ---`);
        
        try {
            const jobsData = await mlbClient.getJobs(jobType);
            
            console.log(`✅ Found ${jobsData.totalJobs} ${jobType} jobs`);
            
            if (jobsData.jobs && jobsData.jobs.length > 0) {
                console.log(`\nSample ${jobType} positions:`);
                
                // Show first 5 jobs
                jobsData.jobs.slice(0, 5).forEach((job, index) => {
                    console.log(`${index + 1}. Job ID: ${job.id}`);
                    console.log(`   Title: ${job.title || 'N/A'}`);
                    console.log(`   Person: ${job.person?.fullName || 'N/A'}`);
                    console.log(`   Team: ${job.team?.name || 'N/A'}`);
                    console.log(`   Active: ${job.isActive !== undefined ? job.isActive : 'Unknown'}`);
                    if (job.startDate) console.log(`   Start Date: ${job.startDate}`);
                    console.log('');
                });
                
                if (jobsData.jobs.length > 5) {
                    console.log(`   ... and ${jobsData.jobs.length - 5} more ${jobType} positions`);
                }
            } else {
                console.log(`No ${jobType} jobs found or data structure different than expected`);
            }
            
        } catch (error) {
            console.log(`❌ Error fetching ${jobType} jobs:`, error.message);
        }
    }
    
    // Test with a specific date
    console.log('\n--- Testing with Specific Date (2024-10-01) ---');
    try {
        const dateJobsData = await mlbClient.getJobs('manager', 1, '2024-10-01');
        console.log(`✅ Found ${dateJobsData.totalJobs} manager jobs for 2024-10-01`);
        
        if (dateJobsData.jobs && dateJobsData.jobs.length > 0) {
            console.log('\nManagers on 2024-10-01:');
            dateJobsData.jobs.slice(0, 10).forEach(job => {
                if (job.person && job.team) {
                    console.log(`  ${job.person.fullName} - ${job.team.name}`);
                }
            });
        }
    } catch (error) {
        console.log('❌ Error fetching jobs for specific date:', error.message);
    }
    
    console.log('\n=== Job Type Usage Guide ===');
    console.log('Common job types you can query:');
    console.log('- "umpire" - Game umpires and officials');
    console.log('- "manager" - Team managers');
    console.log('- "coach" - Coaching staff (pitching, hitting, base, etc.)');
    console.log('- "trainer" - Athletic trainers and medical staff');
    console.log('- "scout" - Player scouts and talent evaluators');
    console.log('- "front-office" - Front office executives');
    console.log('- "broadcaster" - Broadcasting personnel');
    console.log('\nParameters:');
    console.log('- jobType (required): The type of job to search for');
    console.log('- sportId (optional): Sport ID, defaults to 1 (MLB)');
    console.log('- date (optional): Specific date in YYYY-MM-DD format');
}

testMLBJobsEndpoint();