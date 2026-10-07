const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const {
  hashInspectionRecord,
  computeDamageDelta,
  EscrowDeposit,
  LeaseLedger,
  hashLeaf,
  validateFramingAndQuality,
  comparePanelForensics
} = require('../core');
const { startWakeLockDaemon } = require('./wakeLock');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const webDistPath = path.join(__dirname, '../web');
app.use(express.static(webDistPath));

let activeEscrows = new Map();

// 1. Mandatory /healthz
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'ApexFleet Protocol Gateway',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    memoryRssMb: parseFloat((process.memoryUsage().rss / 1024 / 1024).toFixed(2))
  });
});

// 2. Mandatory /api/config
app.get('/api/config', (req, res) => {
  res.status(200).json({
    appName: 'ApexFleet Dubai',
    version: '1.0.0',
    jurisdiction: 'Dubai, UAE',
    currency: 'AED',
    adminContact: '+971508379080',
    mode: process.env.NODE_ENV || 'production'
  });
});

// 3. POST /api/inspection/hash: Anchor vehicle pre/post condition
app.post('/api/inspection/hash', (req, res) => {
  try {
    const result = hashInspectionRecord(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST /api/inspection/verify-return: Compare pre & post return deltas
app.post('/api/inspection/verify-return', (req, res) => {
  try {
    const { preInspection, postInspection, penaltyPerMm } = req.body;
    const delta = computeDamageDelta(preInspection, postInspection, penaltyPerMm);
    res.status(200).json({ success: true, delta });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4b. POST /api/inspection/validate-frame: Validate framing and lighting with Groq Vision
app.post('/api/inspection/validate-frame', async (req, res) => {
  try {
    const { image, panel } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'Image payload is required' });
    }
    const result = await validateFramingAndQuality(image, panel || 'hood');
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4c. POST /api/inspection/compare-forensics: Side-by-side Groq Vision damage comparison & escrow calculation
app.post('/api/inspection/compare-forensics', async (req, res) => {
  try {
    const { preImage, postImage, panel, depositAmountAed } = req.body;
    if (!preImage || !postImage) {
      return res.status(400).json({ success: false, error: 'Both preImage and postImage are required' });
    }
    const result = await comparePanelForensics(preImage, postImage, panel || 'hood', depositAmountAed || 8000);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. POST /api/escrow/create: Initialize locked deposit
app.post('/api/escrow/create', (req, res) => {
  try {
    const { leaseId, depositAmountAed, customerPhone } = req.body;
    const escrow = new EscrowDeposit(leaseId, depositAmountAed, customerPhone);
    activeEscrows.set(String(leaseId), escrow);
    res.status(200).json({
      success: true,
      leaseId: String(leaseId),
      status: escrow.status,
      depositAmountAed: escrow.depositAmountAed
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. POST /api/escrow/settle: Execute settlement with mathematical conservation
app.post('/api/escrow/settle', (req, res) => {
  try {
    const { leaseId, damageDeductionAed, damageProofHash } = req.body;
    const escrow = activeEscrows.get(String(leaseId));
    if (!escrow) {
      return res.status(404).json({ success: false, error: 'Escrow not found for lease' });
    }
    const settlement = escrow.settle(damageDeductionAed, damageProofHash);
    res.status(200).json({ success: true, settlement });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Catch-all for SPA
app.use((req, res) => {
  res.sendFile(path.join(webDistPath, 'index.html'));
});

let server = null;
if (require.main === module) {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ApexFleet Server] Running on http://0.0.0.0:${PORT}`);
    startWakeLockDaemon();
  });
}

module.exports = { app, server };
