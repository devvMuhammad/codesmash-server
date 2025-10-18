/**
 * Test script for rate limiting endpoints
 * 
 * Usage: bun run test-rate-limit.ts
 */

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

// You need to replace this with an actual problem ID from your database
const PROBLEM_ID = '6761c21f01f8b69a8e8b8c0e'; // Update this!

interface TestResult {
  requestNumber: number;
  status: number;
  success: boolean;
  error?: string;
  retryAfter?: number;
  rateLimitRemaining?: string;
}

async function testEndpoint(
  endpoint: string,
  numRequests: number,
  delayMs: number = 100
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${endpoint}`);
  console.log(`Making ${numRequests} requests with ${delayMs}ms delay between them`);
  console.log('='.repeat(60));

  for (let i = 1; i <= numRequests; i++) {
    try {
      const response = await fetch(`${SERVER_URL}/api/problems/${PROBLEM_ID}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: 'console.log("test")',
          language: 'javascript',
        }),
      });

      const data = await response.json();
      const rateLimitRemaining = response.headers.get('RateLimit-Remaining');

      const result: TestResult = {
        requestNumber: i,
        status: response.status,
        success: response.ok,
        rateLimitRemaining: rateLimitRemaining || 'N/A',
      };

      if (!response.ok) {
        result.error = (data as any).error;
        result.retryAfter = (data as any).retryAfter;
      }

      results.push(result);

      // Color code the output
      const statusColor = response.ok ? '\x1b[32m' : '\x1b[31m'; // green : red
      const resetColor = '\x1b[0m';

      console.log(
        `${statusColor}Request ${i}:${resetColor} ` +
        `Status ${response.status} | ` +
        `Remaining: ${rateLimitRemaining || 'N/A'}` +
        (result.error ? ` | Error: ${result.error}` : '')
      );

      // Add delay between requests
      if (i < numRequests) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Request ${i} failed:`, error);
      results.push({
        requestNumber: i,
        status: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

function printSummary(results: TestResult[], expectedLimit: number) {
  const successCount = results.filter(r => r.success).length;
  const rateLimitedCount = results.filter(r => r.status === 429).length;

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total requests: ${results.length}`);
  console.log(`Successful (200): ${successCount}`);
  console.log(`Rate limited (429): ${rateLimitedCount}`);
  console.log(`Expected limit: ${expectedLimit} requests/minute`);

  if (successCount <= expectedLimit && rateLimitedCount > 0) {
    console.log('\n✅ Rate limiting is working correctly!');
  } else if (rateLimitedCount === 0 && results.length > expectedLimit) {
    console.log('\n⚠️  Warning: No rate limiting detected! Check implementation.');
  } else {
    console.log('\n✅ Test completed.');
  }
}

async function main() {
  console.log('\n🚀 Starting Rate Limit Tests\n');
  console.log(`Server URL: ${SERVER_URL}`);
  console.log(`Problem ID: ${PROBLEM_ID}`);
  console.log('\nMake sure your server is running!\n');

  // Test /run endpoint (limit: 20/minute)
  console.log('\n📝 TEST 1: /run endpoint (limit: 20 requests/minute)');
  const runResults = await testEndpoint('/run', 25, 100);
  printSummary(runResults, 20);

  // Wait a bit before next test
  console.log('\n⏳ Waiting 3 seconds before next test...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test /submit endpoint (limit: 10/minute)
  console.log('\n📝 TEST 2: /submit endpoint (limit: 10 requests/minute)');
  const submitResults = await testEndpoint('/submit', 15, 100);
  printSummary(submitResults, 10);

  console.log('\n✨ All tests completed!\n');
}

main().catch(console.error);

