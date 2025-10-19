/**
 * Debug ESPN Search API
 */

async function debugSearch() {
  const searchUrl = 'https://site.web.api.espn.com/apis/common/v3/search?query=Patrick%20Mahomes&limit=20';
  
  console.log('\n🔍 Testing ESPN Search API\n');
  console.log(`URL: ${searchUrl}\n`);
  
  try {
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    console.log('Response structure:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugSearch();
