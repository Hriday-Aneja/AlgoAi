import { generateRecommendations } from './src/services/advanced-recommendation.service';

/**
 * Simple test script for the advanced recommendation system
 */
async function testAdvancedRecommendations() {
  console.log('🧪 Testing Advanced Recommendation System\n');

  const testUserId = 'test-user-123';

  try {
    console.log(`📊 Generating recommendations for user: ${testUserId}`);
    const result = await generateRecommendations(testUserId);

    if (!result) {
      console.log('❌ No recommendations generated (user has no progress data)');
      return;
    }

    console.log('✅ Recommendations generated successfully!\n');

    console.log('📈 Recommendation Details:');
    console.log(`   Topic: ${result.recommended_topic}`);
    console.log(`   Weakness Score: ${result.weakness_score}`);
    console.log(`   Reason: ${result.reason}`);
    console.log(`   Problems Count: ${result.problems.length}\n`);

    console.log('📝 Recommended Problems:');
    result.problems.forEach((problem, index) => {
      console.log(`   ${index + 1}. ${problem.title} (${problem.difficulty})`);
      console.log(`      ID: ${problem.id}, Topic: ${problem.topic}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAdvancedRecommendations();