// Simple test script for commit-story API
// This tests the API endpoint locally

import handler, { config } from './api/commit-story.js';

console.log('Testing commit-story API endpoint...\n');

// Test 1: Verify edge runtime config
console.log('Test 1: Edge runtime configuration');
console.log('Expected: edge');
console.log('Actual:', config.runtime);
console.log(config.runtime === 'edge' ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 2: Test without GitHub token (should return error)
console.log('Test 2: Handler without GitHub token');
const mockRequest = new Request('http://localhost:3000/api/commit-story');
const response = await handler(mockRequest);
const data = await response.json();
console.log('Status:', response.status);
console.log('Response:', data);
console.log(data.error && data.error.includes('token') ? '✓ PASS - Error handling works' : '✗ FAIL');
console.log('');

// Test 3: Test with mock GitHub token (will fail at GitHub API but shows flow works)
console.log('Test 3: Handler with mock token (will fail at GitHub but shows structure)');
process.env.GITHUB_TOKEN = 'mock_token_for_testing';
process.env.GITHUB_ORG = 'standardhuman';
process.env.GITHUB_REPO = 'sailorskills-repos';

const response2 = await handler(mockRequest);
const data2 = await response2.json();
console.log('Status:', response2.status);
console.log('Response:', data2);
console.log(response2.status === 500 && data2.error ? '✓ PASS - API call attempted' : '✗ FAIL');
console.log('');

console.log('API structure tests complete!');
console.log('\nNote: Full integration test requires valid GITHUB_TOKEN in .env.local');
console.log('To test with real data, set GITHUB_TOKEN in .env.local and run: vercel dev');
