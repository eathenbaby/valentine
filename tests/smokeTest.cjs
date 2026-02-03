// Using Node.js built-in fetch (Node 18+)

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const ADMIN_TOKEN = process.env.V4ULT_ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('❌ V4ULT_ADMIN_TOKEN environment variable is required');
  process.exit(1);
}

console.log('🚀 Starting V4ULT Smoke Test...');
console.log(`📍 Testing against: ${BASE_URL}`);

// Test data
const testProfile = {
  supabaseUserId: 'test-user-' + Date.now(),
  fullName: 'John Test Smith',
  avatarUrl: 'https://example.com/avatar.jpg',
  vibe: 'Coffee',
  shadowName: 'SecretAdmirer123',
  targetCrushName: 'Sarah Johnson',
  body: 'I have been admiring you from afar and would love to get to know you better over coffee.',
  department: 'Computer Science'
};

let createdConfessionId = null;
let createdShortId = null;

async function runSmokeTest() {
  try {
    // Step 1: Test health endpoint
    console.log('\n📋 Step 1: Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    const healthData = await healthResponse.json();
    console.log('✅ Health check passed:', healthData.status);

    // Step 2: Create a confession (which creates profile automatically)
    console.log('\n📋 Step 2: Creating confession and profile...');
    const confessionResponse = await fetch(`${BASE_URL}/api/v4ult/confessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProfile)
    });

    if (!confessionResponse.ok) {
      const errorText = await confessionResponse.text();
      throw new Error(`Failed to create confession: ${confessionResponse.status} - ${errorText}`);
    }

    const confessionData = await confessionResponse.json();
    createdConfessionId = confessionData.id;
    createdShortId = confessionData.shortId;
    
    console.log('✅ Confession created successfully:');
    console.log(`   ID: ${createdConfessionId}`);
    console.log(`   Short ID: ${createdShortId}`);
    console.log(`   Shadow Name: ${confessionData.shadowName}`);

    // Step 3: Verify confession appears in admin feed
    console.log('\n📋 Step 3: Checking admin feed...');
    const adminFeedResponse = await fetch(`${BASE_URL}/api/v4ult/admin/confessions`, {
      headers: {
        'x-v4ult-admin-token': ADMIN_TOKEN
      }
    });

    if (!adminFeedResponse.ok) {
      throw new Error(`Failed to fetch admin feed: ${adminFeedResponse.status}`);
    }

    const adminFeed = await adminFeedResponse.json();
    const ourConfession = adminFeed.find(c => c.id === createdConfessionId);
    
    if (!ourConfession) {
      throw new Error('Created confession not found in admin feed');
    }

    console.log('✅ Confession found in admin feed:');
    console.log(`   Status: ${ourConfession.status}`);
    console.log(`   Payment Status: ${ourConfession.paymentStatus}`);
    console.log(`   Sender: ${ourConfession.senderRealName}`);
    console.log(`   Target: ${ourConfession.targetCrushName}`);

    // Step 4: Test reveal endpoint (should return 402 - payment required)
    console.log('\n📋 Step 4: Testing reveal endpoint (should require payment)...');
    const revealResponse = await fetch(`${BASE_URL}/api/v4ult/reveal/${createdShortId}`);
    
    if (revealResponse.status !== 402) {
      throw new Error(`Expected 402 Payment Required, got ${revealResponse.status}`);
    }

    const revealData = await revealResponse.json();
    console.log('✅ Reveal endpoint correctly requires payment:');
    console.log(`   Identity: ${revealData.identity}`);
    console.log(`   Price: ₹${revealData.price}`);
    console.log(`   View Count: ${revealData.viewCount}`);

    // Step 5: Test 'Mark Paid' logic
    console.log('\n📋 Step 5: Testing Mark Paid functionality...');
    const markPaidResponse = await fetch(`${BASE_URL}/api/v4ult/admin/confessions/${createdConfessionId}/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-v4ult-admin-token': ADMIN_TOKEN
      },
      body: JSON.stringify({
        paymentRef: 'TEST-PAYMENT-' + Date.now()
      })
    });

    if (!markPaidResponse.ok) {
      const errorText = await markPaidResponse.text();
      throw new Error(`Failed to mark as paid: ${markPaidResponse.status} - ${errorText}`);
    }

    const markPaidData = await markPaidResponse.json();
    console.log('✅ Successfully marked as paid:');
    console.log(`   Payment Status: ${markPaidData.confession.paymentStatus}`);
    console.log(`   Payment Ref: ${markPaidData.confession.paymentRef}`);
    console.log(`   Reveal Count: ${markPaidData.confession.revealCount}`);

    // Step 6: Test reveal endpoint again (should now show identity)
    console.log('\n📋 Step 6: Testing reveal endpoint after payment...');
    const paidRevealResponse = await fetch(`${BASE_URL}/api/v4ult/reveal/${createdShortId}`);
    
    if (!paidRevealResponse.ok) {
      throw new Error(`Paid reveal failed: ${paidRevealResponse.status}`);
    }

    const paidRevealData = await paidRevealResponse.json();
    console.log('✅ Identity successfully revealed after payment:');
    console.log(`   Identity: ${paidRevealData.identity}`);
    console.log(`   Social Link: ${paidRevealData.socialLink || 'None'}`);
    console.log(`   View Count: ${paidRevealData.viewCount}`);

    // Step 7: Test stats endpoint
    console.log('\n📋 Step 7: Testing stats endpoint...');
    const statsResponse = await fetch(`${BASE_URL}/api/v4ult/stats`);
    
    if (!statsResponse.ok) {
      throw new Error(`Stats endpoint failed: ${statsResponse.status}`);
    }

    const statsData = await statsResponse.json();
    console.log('✅ Stats endpoint working:');
    console.log(`   Total Secrets: ${statsData.totalSecrets}`);
    console.log(`   Active Trackers: ${statsData.activeTrackers}`);

    console.log('\n🎉 ALL TESTS PASSED! 🎉');
    console.log('\n✅ Profile creation: SUCCESS');
    console.log('✅ Confession saving: SUCCESS');
    console.log('✅ Admin authentication: SUCCESS');
    console.log('✅ Payment protection: SUCCESS');
    console.log('✅ Mark Paid logic: SUCCESS');
    console.log('✅ Identity reveal: SUCCESS');
    console.log('\n🚀 Ready for Railway deployment!');

  } catch (error) {
    console.error('\n❌ SMOKE TEST FAILED:', error.message);
    process.exit(1);
  }
}

// Run the test
runSmokeTest();