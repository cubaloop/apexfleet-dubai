const { execSync } = require('child_process');

console.log('====================================================');
console.log('   APEXFLEET SYSTEM: EXTENSIVE TEST SUITE RUNNER    ');
console.log('====================================================\n');

try {
  console.log('[1/2] Executing Core Unit Tests...');
  execSync('node tests/unit_tests.js', { stdio: 'inherit' });
  console.log('\n[2/2] Executing Fast-Check Property Tests (5,000 Invariants)...');
  execSync('node tests/property_based_tests.js', { stdio: 'inherit' });

  console.log('\n====================================================');
  console.log('   ✓ ALL APEXFLEET TESTS PASSED WITH 100% SUCCESS   ');
  console.log('====================================================');
} catch (err) {
  console.error('\n✗ Test Suite Encountered a Failure:', err.message);
  process.exit(1);
}
