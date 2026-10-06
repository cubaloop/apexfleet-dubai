const crypto = require('crypto');

/**
 * ApexFleet Escrow Deposit State Machine
 * Guarantees zero balance leakage: InitialDeposit === RefundAmount + DeductionAmount
 */

class EscrowDeposit {
  constructor(leaseId, depositAmountAed, customerPhone) {
    if (depositAmountAed <= 0) {
      throw new Error('Deposit amount must be strictly greater than 0');
    }
    this.leaseId = String(leaseId);
    this.depositAmountAed = Number(depositAmountAed);
    this.customerPhone = String(customerPhone);
    this.status = 'LOCKED'; // 'LOCKED' | 'SETTLED_CLEAR' | 'DEDUCTED_PARTIAL' | 'DEDUCTED_TOTAL'
    this.refundAmountAed = 0;
    this.deductionAmountAed = 0;
    this.settledAt = null;
    this.settlementProof = null;
  }

  settle(damageDeductionAed = 0, damageProofHash = 'NO_DAMAGE') {
    if (this.status !== 'LOCKED') {
      throw new Error(`Cannot settle escrow in state: ${this.status}`);
    }

    const requestedDeduction = Math.max(0, Number(damageDeductionAed));
    this.deductionAmountAed = Math.min(this.depositAmountAed, requestedDeduction);
    this.refundAmountAed = this.depositAmountAed - this.deductionAmountAed;

    if (this.deductionAmountAed === 0) {
      this.status = 'SETTLED_CLEAR';
    } else if (this.deductionAmountAed === this.depositAmountAed) {
      this.status = 'DEDUCTED_TOTAL';
    } else {
      this.status = 'DEDUCTED_PARTIAL';
    }

    this.settledAt = new Date().toISOString();
    this.settlementProof = crypto.createHash('sha256')
      .update(`${this.leaseId}:${this.depositAmountAed}:${this.refundAmountAed}:${this.deductionAmountAed}:${damageProofHash}:${this.settledAt}`)
      .digest('hex');

    return {
      leaseId: this.leaseId,
      status: this.status,
      depositAmountAed: this.depositAmountAed,
      refundAmountAed: this.refundAmountAed,
      deductionAmountAed: this.deductionAmountAed,
      settlementProof: this.settlementProof
    };
  }

  // Invariant verification method
  verifyConservation() {
    return this.depositAmountAed === (this.refundAmountAed + this.deductionAmountAed);
  }
}

module.exports = {
  EscrowDeposit
};
