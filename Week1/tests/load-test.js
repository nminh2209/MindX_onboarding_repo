/**
 * Production Load Testing Script
 * Tests the MindX AI Application under realistic load conditions
 */

const https = require('https');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  baseUrl: 'https://mindx-minhnh.135.171.192.18.nip.io',
  // You'll need to get a real auth token by logging in through the frontend
  // For now, we'll test public endpoints and document the auth flow
  concurrentUsers: 10,
  totalRequests: 50,
  rampUpTime: 5000, // 5 seconds to ramp up all users
};

// Test scenarios
const SCENARIOS = {
  // Health check - no auth needed
  healthCheck: {
    method: 'GET',
    path: '/api/health',
    requiresAuth: false,
  },
  
  // Chat endpoint - requires auth
  chat: {
    method: 'POST',
    path: '/api/chat',
    requiresAuth: true,
    body: {
      messages: [
        { role: 'user', content: 'What is the weather in Hanoi?' }
      ]
    }
  },
  
  // Chat with RAG - requires auth
  chatWithRAG: {
    method: 'POST',
    path: '/api/chat',
    requiresAuth: true,
    body: {
      messages: [
        { role: 'user', content: 'Search the knowledge base for information about deployment' }
      ]
    }
  },
  
  // Knowledge ingestion - requires auth
  ingest: {
    method: 'POST',
    path: '/api/ingest',
    requiresAuth: true,
    body: {
      documents: [
        {
          text: 'Load test document: This is a test document for performance validation.',
          metadata: { source: 'load-test', timestamp: new Date().toISOString() }
        }
      ]
    }
  }
};

// Metrics tracking
const metrics = {
  requests: {
    total: 0,
    successful: 0,
    failed: 0,
    byStatus: {},
  },
  responseTimes: [],
  errors: [],
  byScenario: {},
};

// Helper: Make HTTP request
function makeRequest(scenario, authToken = null) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    const url = new URL(CONFIG.baseUrl + scenario.path);
    const options = {
      method: scenario.method,
      headers: {
        'Content-Type': 'application/json',
      },
      // Allow self-signed certificates for testing
      rejectUnauthorized: false,
    };
    
    if (authToken && scenario.requiresAuth) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = performance.now() - startTime;
        
        resolve({
          statusCode: res.statusCode,
          duration,
          data,
          error: null,
        });
      });
    });
    
    req.on('error', (error) => {
      const duration = performance.now() - startTime;
      
      resolve({
        statusCode: 0,
        duration,
        data: null,
        error: error.message,
      });
    });
    
    if (scenario.body) {
      req.write(JSON.stringify(scenario.body));
    }
    
    req.end();
  });
}

// Helper: Track metrics
function recordMetric(scenarioName, result) {
  metrics.requests.total++;
  
  if (result.statusCode >= 200 && result.statusCode < 300) {
    metrics.requests.successful++;
  } else {
    metrics.requests.failed++;
  }
  
  if (!metrics.requests.byStatus[result.statusCode]) {
    metrics.requests.byStatus[result.statusCode] = 0;
  }
  metrics.requests.byStatus[result.statusCode]++;
  
  metrics.responseTimes.push(result.duration);
  
  if (!metrics.byScenario[scenarioName]) {
    metrics.byScenario[scenarioName] = {
      total: 0,
      successful: 0,
      failed: 0,
      responseTimes: [],
    };
  }
  
  const scenarioMetrics = metrics.byScenario[scenarioName];
  scenarioMetrics.total++;
  scenarioMetrics.responseTimes.push(result.duration);
  
  if (result.statusCode >= 200 && result.statusCode < 300) {
    scenarioMetrics.successful++;
  } else {
    scenarioMetrics.failed++;
  }
  
  if (result.error) {
    metrics.errors.push({
      scenario: scenarioName,
      error: result.error,
      statusCode: result.statusCode,
    });
  }
}

// Helper: Calculate statistics
function calculateStats(values) {
  if (values.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
  
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  
  return {
    min: sorted[0].toFixed(2),
    max: sorted[sorted.length - 1].toFixed(2),
    avg: (sum / sorted.length).toFixed(2),
    p50: sorted[Math.floor(sorted.length * 0.5)].toFixed(2),
    p95: sorted[Math.floor(sorted.length * 0.95)].toFixed(2),
    p99: sorted[Math.floor(sorted.length * 0.99)].toFixed(2),
  };
}

// Helper: Print results
function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('LOAD TEST RESULTS');
  console.log('='.repeat(80));
  
  console.log('\n📊 Overall Metrics:');
  console.log(`  Total Requests: ${metrics.requests.total}`);
  console.log(`  Successful: ${metrics.requests.successful} (${(metrics.requests.successful / metrics.requests.total * 100).toFixed(1)}%)`);
  console.log(`  Failed: ${metrics.requests.failed} (${(metrics.requests.failed / metrics.requests.total * 100).toFixed(1)}%)`);
  
  console.log('\n📈 Response Times (ms):');
  const overallStats = calculateStats(metrics.responseTimes);
  console.log(`  Min: ${overallStats.min}ms`);
  console.log(`  Max: ${overallStats.max}ms`);
  console.log(`  Avg: ${overallStats.avg}ms`);
  console.log(`  P50: ${overallStats.p50}ms`);
  console.log(`  P95: ${overallStats.p95}ms`);
  console.log(`  P99: ${overallStats.p99}ms`);
  
  console.log('\n🔢 Status Code Distribution:');
  Object.keys(metrics.requests.byStatus).sort().forEach(code => {
    console.log(`  ${code}: ${metrics.requests.byStatus[code]} requests`);
  });
  
  console.log('\n🎯 By Scenario:');
  Object.keys(metrics.byScenario).forEach(scenarioName => {
    const s = metrics.byScenario[scenarioName];
    const stats = calculateStats(s.responseTimes);
    console.log(`\n  ${scenarioName}:`);
    console.log(`    Total: ${s.total}, Success: ${s.successful}, Failed: ${s.failed}`);
    console.log(`    Avg Response: ${stats.avg}ms (P95: ${stats.p95}ms)`);
  });
  
  if (metrics.errors.length > 0) {
    console.log('\n❌ Errors:');
    metrics.errors.slice(0, 10).forEach(err => {
      console.log(`  [${err.scenario}] ${err.error} (Status: ${err.statusCode})`);
    });
    if (metrics.errors.length > 10) {
      console.log(`  ... and ${metrics.errors.length - 10} more errors`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
}

// Main test runner
async function runLoadTest() {
  console.log('🚀 Starting Load Test');
  console.log(`📍 Target: ${CONFIG.baseUrl}`);
  console.log(`👥 Concurrent Users: ${CONFIG.concurrentUsers}`);
  console.log(`📨 Total Requests: ${CONFIG.totalRequests}`);
  console.log('');
  
  // Test 1: Health Check (no auth required)
  console.log('Test 1: Health Check Endpoint (no auth)');
  const healthPromises = [];
  for (let i = 0; i < 10; i++) {
    healthPromises.push(
      makeRequest(SCENARIOS.healthCheck).then(result => {
        recordMetric('healthCheck', result);
        process.stdout.write('.');
      })
    );
  }
  await Promise.all(healthPromises);
  console.log(' ✓\n');
  
  // Test 2: Authentication info
  console.log('Test 2: Authenticated Endpoints');
  console.log('⚠️  Note: To test authenticated endpoints, you need a valid token:');
  console.log('   1. Open https://mindx-minhnh.135.171.192.18.nip.io in browser');
  console.log('   2. Log in through MindX SSO');
  console.log('   3. Open browser DevTools → Application → Cookies');
  console.log('   4. Copy the auth token');
  console.log('   5. Set AUTH_TOKEN environment variable and re-run this script');
  console.log('');
  
  const authToken = process.env.AUTH_TOKEN;
  
  if (authToken) {
    console.log('✓ Auth token found, testing authenticated endpoints...\n');
    
    // Test chat endpoint
    console.log('Testing Chat Endpoint (with tool calling)...');
    const chatPromises = [];
    for (let i = 0; i < 5; i++) {
      chatPromises.push(
        makeRequest(SCENARIOS.chat, authToken).then(result => {
          recordMetric('chat', result);
          process.stdout.write('.');
        })
      );
    }
    await Promise.all(chatPromises);
    console.log(' ✓\n');
    
    // Test chat with RAG
    console.log('Testing Chat with RAG...');
    const ragPromises = [];
    for (let i = 0; i < 5; i++) {
      ragPromises.push(
        makeRequest(SCENARIOS.chatWithRAG, authToken).then(result => {
          recordMetric('chatWithRAG', result);
          process.stdout.write('.');
        })
      );
    }
    await Promise.all(ragPromises);
    console.log(' ✓\n');
    
    // Test knowledge ingestion
    console.log('Testing Knowledge Ingestion...');
    const ingestPromises = [];
    for (let i = 0; i < 3; i++) {
      ingestPromises.push(
        makeRequest(SCENARIOS.ingest, authToken).then(result => {
          recordMetric('ingest', result);
          process.stdout.write('.');
        })
      );
    }
    await Promise.all(ingestPromises);
    console.log(' ✓\n');
    
  } else {
    console.log('⏭️  Skipping authenticated tests (no AUTH_TOKEN set)\n');
  }
  
  // Print results
  printResults();
  
  // Performance assertions
  console.log('\n✅ Performance Validation:');
  const stats = calculateStats(metrics.responseTimes);
  
  const checks = [
    { name: 'Average response time < 3s', pass: parseFloat(stats.avg) < 3000 },
    { name: 'P95 response time < 5s', pass: parseFloat(stats.p95) < 5000 },
    { name: 'Success rate > 90%', pass: (metrics.requests.successful / metrics.requests.total) > 0.9 },
    { name: 'No critical errors', pass: metrics.errors.filter(e => e.statusCode === 500).length === 0 },
  ];
  
  checks.forEach(check => {
    console.log(`  ${check.pass ? '✓' : '✗'} ${check.name}`);
  });
  
  const allPassed = checks.every(c => c.pass);
  console.log(allPassed ? '\n🎉 All performance checks passed!' : '\n⚠️  Some performance checks failed');
  
  process.exit(allPassed ? 0 : 1);
}

// Run the test
runLoadTest().catch(err => {
  console.error('Load test failed:', err);
  process.exit(1);
});
