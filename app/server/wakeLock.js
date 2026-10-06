const http = require('http');
const https = require('https');

function startWakeLockDaemon(targetUrl = null, intervalMs = 360000) {
  const urlToPing = targetUrl || process.env.RENDER_EXTERNAL_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;
  const healthEndpoint = `${urlToPing.replace(/\/$/, '')}/healthz`;

  console.log(`[ApexFleet WakeLock] Initialized targeting ${healthEndpoint}`);
  const client = healthEndpoint.startsWith('https') ? https : http;

  const ping = () => {
    try {
      const req = client.get(healthEndpoint, { timeout: 10000 }, res => {
        console.log(`[ApexFleet WakeLock Pulse] Ping sent -> HTTP ${res.statusCode} at ${new Date().toISOString()}`);
        res.resume();
      });
      req.on('error', () => {});
    } catch (e) {}
  };

  setTimeout(ping, 30000);
  const timer = setInterval(ping, intervalMs);
  timer.unref();
  return timer;
}

module.exports = { startWakeLockDaemon };
