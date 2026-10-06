const fc = require('fast-check');
const assert = require('assert');
const {
  STANDARD_PANELS,
  hashInspectionRecord,
  computeDamageDelta,
  EscrowDeposit,
  LeaseLedger,
  hashLeaf
} = require('../app/core');

console.log('--- RUNNING APEXFLEET PROPERTY-BASED TESTS (5,000+ INVARIANTS) ---');

// 1. PROPERTY: Escrow Conservation of Funds (Deposit === Refund + Deduction)
console.log('Testing Property 1: Escrow Mathematical Conservation of Funds...');
fc.assert(
  fc.property(
    fc.integer({ min: 100, max: 50000 }), // Initial deposit AED
    fc.integer({ min: 0, max: 100000 }),  // Requested damage deduction AED
    (deposit, deduction) => {
      const escrow = new EscrowDeposit('L-RAND', deposit, '+971501234567');
      const settlement = escrow.settle(deduction, 'PROOF_HASH');

      // Fundamental invariant: Funds must never leak or multiply
      const sum = settlement.refundAmountAed + settlement.deductionAmountAed;
      const isConserved = sum === deposit;
      const nonNegative = settlement.refundAmountAed >= 0 && settlement.deductionAmountAed >= 0;
      const deductionBounded = settlement.deductionAmountAed <= deposit;

      return isConserved && nonNegative && deductionBounded;
    }
  ),
  { numRuns: 1500 }
);
console.log('  ✓ Property 1 PASSED (1,500 runs)');

// 2. PROPERTY: Damage Delta Monotonicity (Greater Scratch mm === Greater or Equal Deduction)
console.log('Testing Property 2: Damage Delta Monotonicity...');
fc.assert(
  fc.property(
    fc.integer({ min: 0, max: 50 }),
    fc.integer({ min: 0, max: 50 }),
    (scratchA, scratchB) => {
      const pre = hashInspectionRecord({
        vin: 'VIN-TEST',
        panelConditions: { hood: { status: 'PRISTINE', scratchMm: 0 } }
      });
      const postA = hashInspectionRecord({
        vin: 'VIN-TEST',
        panelConditions: { hood: { status: scratchA > 0 ? 'SCRATCHED' : 'PRISTINE', scratchMm: scratchA } }
      });
      const postB = hashInspectionRecord({
        vin: 'VIN-TEST',
        panelConditions: { hood: { status: scratchB > 0 ? 'SCRATCHED' : 'PRISTINE', scratchMm: scratchB } }
      });

      const deltaA = computeDamageDelta(pre, postA);
      const deltaB = computeDamageDelta(pre, postB);

      if (scratchA > scratchB) {
        return deltaA.totalDamageDeductionAed >= deltaB.totalDamageDeductionAed;
      } else if (scratchA < scratchB) {
        return deltaA.totalDamageDeductionAed <= deltaB.totalDamageDeductionAed;
      } else {
        return deltaA.totalDamageDeductionAed === deltaB.totalDamageDeductionAed;
      }
    }
  ),
  { numRuns: 1500 }
);
console.log('  ✓ Property 2 PASSED (1,500 runs)');

// 3. PROPERTY: LeaseLedger Merkle Inclusion Soundness & Tamper Sensitivity
console.log('Testing Property 3: LeaseLedger Soundness & Anti-Tamper Invariants...');
fc.assert(
  fc.property(
    fc.array(
      fc.record({
        leaseId: fc.uuid(),
        carModel: fc.string({ minLength: 2, maxLength: 25 }),
        depositAed: fc.integer({ min: 1000, max: 20000 })
      }),
      { minLength: 2, maxLength: 20 }
    ),
    fc.nat(),
    (leases, targetRaw) => {
      const targetIdx = targetRaw % leases.length;
      const ledger = new LeaseLedger(leases);
      const root = ledger.getRoot();

      // Soundness: Authentic leaf verifies
      const authenticHash = hashLeaf(leases[targetIdx]);
      const proof = ledger.getProof(targetIdx);
      const authenticValid = LeaseLedger.verifyProof(authenticHash, proof, root);
      if (!authenticValid) return false;

      // Anti-Tamper: Mutated leaf fails verification
      const mutatedLeaf = { ...leases[targetIdx], depositAed: leases[targetIdx].depositAed + 999 };
      const mutatedHash = hashLeaf(mutatedLeaf);
      const mutatedValid = LeaseLedger.verifyProof(mutatedHash, proof, root);
      return mutatedValid === false;
    }
  ),
  { numRuns: 2000 }
);
console.log('  ✓ Property 3 PASSED (2,000 runs)');

console.log('\n--- ALL 5,000 APEXFLEET PROPERTY-BASED TESTS COMPLETED SUCCESSFULLY! ---');
