const crypto = require('crypto');

/**
 * ApexFleet Vehicle Inspection & Damage Verification Engine
 * Hashes condition metrics and photos of vehicle body panels before and after rental.
 */

const STANDARD_PANELS = [
  'front_bumper',
  'rear_bumper',
  'hood',
  'roof',
  'driver_front_fender',
  'passenger_front_fender',
  'driver_door',
  'passenger_door',
  'driver_rear_quarter',
  'passenger_rear_quarter',
  'front_windshield',
  'rear_windshield',
  'rim_front_left',
  'rim_front_right',
  'rim_rear_left',
  'rim_rear_right'
];

function hashInspectionRecord(record) {
  const normalized = {
    vin: String(record.vin || '').toUpperCase(),
    leaseId: String(record.leaseId || ''),
    timestamp: String(record.timestamp || '2026-10-07T00:00:00.000Z'),
    mileageKm: Number(record.mileageKm || 0),
    inspectorId: String(record.inspectorId || 'INSPECTOR_AUTO'),
    panelConditions: {}
  };

  // Canonicalize panels
  STANDARD_PANELS.forEach(panel => {
    const val = record.panelConditions?.[panel] || { status: 'PRISTINE', scratchMm: 0, photoHash: 'EMPTY' };
    normalized.panelConditions[panel] = {
      status: val.status,
      scratchMm: Number(val.scratchMm || 0),
      photoHash: String(val.photoHash || 'NONE')
    };
  });

  const canonicalString = JSON.stringify(normalized, Object.keys(normalized).sort());
  const hash = crypto.createHash('sha256').update(canonicalString).digest('hex');

  return {
    canonicalRecord: normalized,
    recordHash: hash
  };
}

/**
 * Compare pre-rental and post-rental inspection records to detect damage deltas
 */
function computeDamageDelta(preInspection, postInspection, penaltyPerMm = 150) {
  const anomalies = [];
  let totalDamageDeductionAed = 0;

  STANDARD_PANELS.forEach(panel => {
    const pre = preInspection.canonicalRecord?.panelConditions?.[panel] || { scratchMm: 0, status: 'PRISTINE' };
    const post = postInspection.canonicalRecord?.panelConditions?.[panel] || { scratchMm: 0, status: 'PRISTINE' };

    const deltaMm = Math.max(0, (post.scratchMm || 0) - (pre.scratchMm || 0));
    const statusChanged = pre.status === 'PRISTINE' && post.status !== 'PRISTINE';

    if (deltaMm > 0 || statusChanged) {
      const estimatedCost = Math.max(500, deltaMm * penaltyPerMm);
      totalDamageDeductionAed += estimatedCost;

      anomalies.push({
        panel,
        preStatus: pre.status,
        postStatus: post.status,
        preScratchMm: pre.scratchMm,
        postScratchMm: post.scratchMm,
        deltaMm,
        estimatedCostAed: estimatedCost
      });
    }
  });

  return {
    isCleanReturn: anomalies.length === 0,
    anomaliesCount: anomalies.length,
    totalDamageDeductionAed,
    anomalies,
    verificationProof: crypto.createHash('sha256')
      .update(`${preInspection.recordHash}:${postInspection.recordHash}:${totalDamageDeductionAed}`)
      .digest('hex')
  };
}

module.exports = {
  STANDARD_PANELS,
  hashInspectionRecord,
  computeDamageDelta
};
