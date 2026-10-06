const assert = require('assert');
const {
  STANDARD_PANELS,
  hashInspectionRecord,
  computeDamageDelta,
  EscrowDeposit,
  LeaseLedger,
  hashLeaf
} = require('../app/core');

console.log('--- RUNNING APEXFLEET UNIT TESTS ---');

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${desc}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${desc}:`, err.message);
  }
}

// 1. INSPECTION HASHING TESTS
it('InspectionHasher: Hashes 16 canonical body panels deterministically', () => {
  const rec1 = { vin: 'WBA1234567890', leaseId: 'L-01', mileageKm: 12500 };
  const res1 = hashInspectionRecord(rec1);
  const res2 = hashInspectionRecord(rec1);
  assert.strictEqual(res1.recordHash, res2.recordHash);
  assert.strictEqual(typeof res1.recordHash, 'string');
  assert.strictEqual(res1.recordHash.length, 64);
});

it('InspectionHasher: Computes clean return with 0 AED deduction', () => {
  const pre = hashInspectionRecord({ vin: 'LAMBO-01', leaseId: 'L-100' });
  const post = hashInspectionRecord({ vin: 'LAMBO-01', leaseId: 'L-100' });
  const delta = computeDamageDelta(pre, post);
  assert.strictEqual(delta.isCleanReturn, true);
  assert.strictEqual(delta.totalDamageDeductionAed, 0);
  assert.strictEqual(delta.anomaliesCount, 0);
});

it('InspectionHasher: Detects scratch delta on rim and computes exact deduction', () => {
  const pre = hashInspectionRecord({
    vin: 'FERRARI-488',
    leaseId: 'L-200',
    panelConditions: { rim_front_left: { status: 'PRISTINE', scratchMm: 0 } }
  });
  const post = hashInspectionRecord({
    vin: 'FERRARI-488',
    leaseId: 'L-200',
    panelConditions: { rim_front_left: { status: 'SCRATCHED', scratchMm: 12 } }
  });
  const delta = computeDamageDelta(pre, post, 150);
  assert.strictEqual(delta.isCleanReturn, false);
  assert.strictEqual(delta.anomaliesCount, 1);
  assert.strictEqual(delta.anomalies[0].panel, 'rim_front_left');
  assert.strictEqual(delta.anomalies[0].deltaMm, 12);
  assert.strictEqual(delta.totalDamageDeductionAed, 1800); // 12mm * 150 AED
});

// 2. ESCROW ENGINE TESTS
it('EscrowDeposit: Preserves strict conservation of funds on full refund', () => {
  const escrow = new EscrowDeposit('L-300', 5000, '+971501234567');
  const settlement = escrow.settle(0, 'NO_DAMAGE');
  assert.strictEqual(settlement.status, 'SETTLED_CLEAR');
  assert.strictEqual(settlement.refundAmountAed, 5000);
  assert.strictEqual(settlement.deductionAmountAed, 0);
  assert.strictEqual(escrow.verifyConservation(), true);
});

it('EscrowDeposit: Correctly apportions partial damage deduction with proof', () => {
  const escrow = new EscrowDeposit('L-301', 5000, '+971501234567');
  const settlement = escrow.settle(1800, 'HASH_PROOF_123');
  assert.strictEqual(settlement.status, 'DEDUCTED_PARTIAL');
  assert.strictEqual(settlement.refundAmountAed, 3200);
  assert.strictEqual(settlement.deductionAmountAed, 1800);
  assert.strictEqual(escrow.verifyConservation(), true);
  assert.strictEqual(typeof settlement.settlementProof, 'string');
});

it('EscrowDeposit: Caps maximum deduction at deposit amount (no negative refund)', () => {
  const escrow = new EscrowDeposit('L-302', 5000, '+971501234567');
  const settlement = escrow.settle(8500, 'MAJOR_CRASH_PROOF');
  assert.strictEqual(settlement.status, 'DEDUCTED_TOTAL');
  assert.strictEqual(settlement.refundAmountAed, 0);
  assert.strictEqual(settlement.deductionAmountAed, 5000);
  assert.strictEqual(escrow.verifyConservation(), true);
});

// 3. LEASE LEDGER MERKLE TESTS
it('LeaseLedger: Builds Merkle tree and verifies inclusion proofs for lease fleet', () => {
  const leases = [
    { leaseId: 'L-1', car: 'Lamborghini Revuelto', client: 'Rashid A.' },
    { leaseId: 'L-2', car: 'Rolls-Royce Spectre', client: 'Elena R.' },
    { leaseId: 'L-3', car: 'Ferrari Purosangue', client: 'Alexander K.' }
  ];
  const tree = new LeaseLedger(leases);
  for (let i = 0; i < leases.length; i++) {
    const leafHash = hashLeaf(leases[i]);
    const proof = tree.getProof(i);
    const valid = LeaseLedger.verifyProof(leafHash, proof, tree.getRoot());
    assert.strictEqual(valid, true, `Proof verification failed for lease ${i}`);
  }
});

console.log(`\nAPEXFLEET UNIT TESTS SUMMARY: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
