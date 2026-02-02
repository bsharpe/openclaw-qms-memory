#!/usr/bin/env node
/**
 * Simple test for QMS Memory Search skill
 */

import { searchMemory, getMemorySearchStatus, rebuildMemoryIndex } from './index.js';

async function runTests() {
  console.log('🧪 Testing QMS Memory Search Skill\n');

  try {
    // Test 1: Check status
    console.log('1. Testing system status...');
    const status = await getMemorySearchStatus();
    console.log('   Status:', status);
    
    if (!status.ready) {
      console.log('   Index not ready, attempting to build...');
      await rebuildMemoryIndex();
      const newStatus = await getMemorySearchStatus();
      console.log('   New status:', newStatus);
    }

    // Test 2: Simple search
    console.log('\n2. Testing search functionality...');
    const results = await searchMemory('memory system');
    console.log(`   Found ${results.length} results`);
    
    if (results.length > 0) {
      console.log('   Sample result:');
      const sample = results[0];
      console.log(`     File: ${sample.path}`);
      console.log(`     Score: ${sample.score.toFixed(4)}`);
      console.log(`     Lines: ${sample.lineNumbers.slice(0, 3).join(', ')}${sample.lineNumbers.length > 3 ? '...' : ''}`);
      console.log(`     Preview: ${sample.snippets[0]?.substring(0, 100)}...`);
    }

    // Test 3: Different search
    console.log('\n3. Testing different query...');
    const results2 = await searchMemory('prompt injection');
    console.log(`   Found ${results2.length} results for "prompt injection"`);

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();