const BASE_URL = 'http://localhost:3003';

async function testAdvancedRecommendations() {
  console.log('🧪 Testing Advanced Recommendation System\n');

  const testUserId = 'test-user-123';

  try {
    // Test health endpoint first
    console.log('🏥 Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);

    // Test the new advanced recommendations endpoint
    console.log(`\n📊 Testing advanced recommendations for user: ${testUserId}`);
    const response = await fetch(`${BASE_URL}/api/advanced-recommendations/${testUserId}`);

    if (!response.ok) {
      console.log('❌ Response not OK:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log('✅ API Response received!\n');

    if (data.status === 'success' && data.data) {
      console.log('📈 Recommendation Details:');
      console.log(`   Topic: ${data.data.recommended_topic}`);
      console.log(`   Weakness Score: ${data.data.weakness_score}`);
      console.log(`   Reason: ${data.data.reason}`);
      console.log(`   Problems Count: ${data.data.problems.length}\n`);

      console.log('📝 Recommended Problems:');
      data.data.problems.forEach((problem, index) => {
        console.log(`   ${index + 1}. ${problem.title} (${problem.difficulty})`);
        console.log(`      ID: ${problem.id}, Topic: ${problem.topic}`);
      });

      console.log('\n🎉 Advanced Recommendation System is WORKING! ✅');
    } else {
      console.log('⚠️  No recommendations available:', data.message || 'User may need to attempt more problems');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Possible issues:');
    console.log('   - Server not running on port 3003');
    console.log('   - Database connection issues');
    console.log('   - Missing dependencies (try: npm install node-fetch)');
  }
}

// Run the test
testAdvancedRecommendations();