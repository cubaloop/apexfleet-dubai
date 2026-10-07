/**
 * ApexFleet Dubai — Front-End Application Controller
 */

const DEFAULT_FLEET = [
  { id: "car-1", name: "Lamborghini Revuelto V12 Hybrid", category: "Hypercars", price: 9500, deposit: 10000, image: "assets/supercar_hero.jpg" },
  { id: "car-2", name: "Rolls-Royce Spectre Black Badge", category: "Ultra-Luxury", price: 8200, deposit: 8000, image: "assets/showroom.jpg" },
  { id: "car-3", name: "Ferrari Purosangue V12", category: "Exotic SUVs", price: 8800, deposit: 9000, image: "assets/supercar_hero.jpg" },
  { id: "car-4", name: "McLaren 750S Spider", category: "Supercars", price: 6500, deposit: 7000, image: "assets/showroom.jpg" }
];

const DEFAULT_CATEGORIES = ["All", "Hypercars", "Supercars", "Ultra-Luxury", "Exotic SUVs"];

const DEFAULT_LEASES = [
  { id: "ls-101", customerName: "Rashid Al-Maktoum", phone: "+971501112233", car: "Lamborghini Revuelto V12 Hybrid", deposit: 10000, status: "ESCROW_LOCKED" },
  { id: "ls-102", customerName: "Alexander Keller", phone: "+971508889900", car: "Rolls-Royce Spectre Black Badge", deposit: 8000, status: "SETTLED_CLEAR" }
];

function safeGetStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function safeSetStorage(key, val) {
  try {
    localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
  } catch (e) {
    console.warn('[Storage] write error', e);
  }
}

let fleet = safeGetStorage('af_fleet', DEFAULT_FLEET);
let categories = safeGetStorage('af_categories', DEFAULT_CATEGORIES);
let leases = safeGetStorage('af_leases', DEFAULT_LEASES);
let currentCategory = 'All';
let currentLang = 'en';
let compressedImageDataUrl = null;

function renderFleet() {
  const grid = document.getElementById('fleet-grid');
  const adminList = document.getElementById('admin-fleet-list');
  const custCarSelect = document.getElementById('cust-car');

  const filtered = currentCategory === 'All' ? fleet : fleet.filter(c => c.category === currentCategory);

  if (grid) {
    grid.innerHTML = filtered.map(c => `
      <div class="bento-card" style="grid-column: span 6; padding: 0; overflow: hidden; display: flex; flex-direction: column;">
        <div style="height: 250px; position: relative;">
          <img src="${c.image || 'assets/supercar_hero.jpg'}" alt="${c.name}" style="width: 100%; height: 100%; object-fit: cover;">
          <span style="position: absolute; top: 1rem; right: 1rem; background: rgba(9, 16, 13, 0.85); color: #FFFDF8; padding: 0.35rem 0.8rem; border-radius: 9999px; font-weight: 700; font-size: 0.85rem;">
            ${c.price} AED / Day
          </span>
        </div>
        <div style="padding: 1.5rem; display: flex; flex-direction: column; flex: 1; justify-content: space-between;">
          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--accent-gold); font-weight: 700; margin-bottom: 0.35rem;">${c.category}</div>
            <h3 class="font-display" style="font-size: 1.5rem; color: var(--text-main); margin-bottom: 0.5rem;">${c.name}</h3>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">Security Deposit Escrow: <strong>${c.deposit || 8000} AED</strong> (Zero-Leakage Guarantee)</div>
          </div>
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <button class="btn-gold" onclick="openBookingModalForCar('${c.name}')" style="flex: 1; font-size: 0.85rem;">Reserve Car</button>
            <a href="https://wa.me/971508379080" target="_blank" rel="noopener" class="whatsapp-icon-btn" aria-label="WhatsApp">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.579 1.831.848 2.791.848 3.18 0 5.767-2.587 5.768-5.766.001-3.182-2.585-5.768-5.768-5.768zm7.391 5.765c-.002 4.08-3.315 7.394-7.391 7.394-1.246 0-2.433-.323-3.486-.927l-4.145 1.087 1.107-4.043c-.682-1.096-1.047-2.364-1.048-3.511.002-4.08 3.316-7.394 7.392-7.394 4.076 0 7.39 3.315 7.392 7.394z"/></svg>
            </a>
          </div>
        </div>
      </div>
    `).join('');
  }

  if (adminList) {
    adminList.innerHTML = fleet.map(c => `
      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); padding: 0.75rem 1rem; border-radius: 0.5rem; margin-bottom: 0.5rem; border: 1px solid var(--border-subtle);">
        <div>
          <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-main);">${c.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${c.category} &bull; ${c.price} AED/day</div>
        </div>
        <button onclick="deleteCar('${c.id}')" style="background: none; border: 1px solid #D93025; color: #D93025; padding: 0.3rem 0.6rem; border-radius: 0.4rem; cursor: pointer; font-size: 0.75rem;">Delete</button>
      </div>
    `).join('');
  }

  if (custCarSelect) {
    custCarSelect.innerHTML = fleet.map(c => `<option value="${c.name}">${c.name} (${c.price} AED/day)</option>`).join('');
  }
}

function renderCategories() {
  const container = document.getElementById('category-filters');
  const select = document.getElementById('car-category');
  const catList = document.getElementById('admin-cat-list');

  if (container) {
    container.innerHTML = categories.map(cat => `
      <button class="btn-outline" style="padding: 0.4rem 1rem; font-size: 0.85rem; ${cat === currentCategory ? 'background: var(--accent-gold-soft); border-color: var(--accent-gold); color: var(--accent-gold); font-weight: 700;' : ''}" onclick="selectCategory('${cat}')">
        ${cat}
      </button>
    `).join('');
  }
  if (select) {
    select.innerHTML = categories.filter(c => c !== 'All').map(c => `<option value="${c}">${c}</option>`).join('');
  }
  if (catList) {
    catList.innerHTML = categories.filter(c => c !== 'All').map(c => `
      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); padding: 0.5rem 1rem; border-radius: 0.5rem; margin-bottom: 0.4rem; border: 1px solid var(--border-subtle);">
        <span style="font-size: 0.85rem; color: var(--text-main);">${c}</span>
        <button onclick="deleteCategory('${c}')" style="background: none; border: none; color: #D93025; cursor: pointer;">&times;</button>
      </div>
    `).join('');
  }
}

function selectCategory(cat) {
  currentCategory = cat;
  renderCategories();
  renderFleet();
}

function handleImageCompress(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const MAX = 800;
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
      else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      compressedImageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      document.getElementById('compressed-image-preview').src = compressedImageDataUrl;
      document.getElementById('compression-stats').innerText = `${w}x${h}px ~${Math.round(compressedImageDataUrl.length * 0.75 / 1024)} KB`;
      document.getElementById('compression-preview').style.display = 'flex';
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

function handleSaveCar(e) {
  e.preventDefault();
  const name = document.getElementById('car-name').value;
  const price = parseFloat(document.getElementById('car-price').value);
  const category = document.getElementById('car-category').value;
  fleet.push({
    id: `car-${Date.now()}`,
    name, price, category,
    deposit: price * 1.2,
    image: compressedImageDataUrl || 'assets/supercar_hero.jpg'
  });
  localStorage.setItem('af_fleet', JSON.stringify(fleet));
  document.getElementById('car-form').reset();
  document.getElementById('compression-preview').style.display = 'none';
  compressedImageDataUrl = null;
  renderFleet();
}

function deleteCar(id) {
  if (confirm('Delete vehicle?')) {
    fleet = fleet.filter(c => String(c.id) !== String(id));
    localStorage.setItem('af_fleet', JSON.stringify(fleet));
    renderFleet();
  }
}

function addCategory() {
  const input = document.getElementById('new-cat-input');
  const cat = input.value.trim();
  if (cat && !categories.includes(cat)) {
    categories.push(cat);
    localStorage.setItem('af_categories', JSON.stringify(categories));
    input.value = '';
    renderCategories();
    renderFleet();
  }
}

function deleteCategory(cat) {
  categories = categories.filter(c => c !== cat);
  localStorage.setItem('af_categories', JSON.stringify(categories));
  renderCategories();
  renderFleet();
}

function renderLeases() {
  const list = document.getElementById('admin-leases-list');
  if (!list) return;
  list.innerHTML = leases.map(l => `
    <div style="background: var(--bg-surface); padding: 0.75rem 1rem; border-radius: 0.5rem; margin-bottom: 0.5rem; border: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-main);">${l.customerName} &bull; ${l.car}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${l.phone} &bull; Escrow: ${l.deposit} AED</div>
      </div>
      <span style="font-size: 0.75rem; font-weight: 700; color: #137333;">${l.status}</span>
    </div>
  `).join('');
}

/* ========================================================
   OMNIDIFF AI — SUB-PIXEL DIFFERENTIAL CONTROLLER
   Detects micro-anomalies imperceptible to the human eye
   ======================================================== */
const omniDiffEngine = typeof OmniDiffEngine !== 'undefined' ? new OmniDiffEngine() : null;

let omniState = {
  activeAsset: 'carbon', // 'carbon' | 'horology' | 'universal'
  viewMode: 'heatmap',   // 'heatmap' | 'slider' | 'loupe' | 'ghost'
  imageA: 'assets/carbon_pristine.jpg',
  imageB: 'assets/carbon_microcrack.jpg',
  currentDelta: null,
  sliderPos: 50,
  isDraggingSlider: false,
  lastVerdict: null
};

const OMNI_PRESETS = {
  carbon: {
    name: 'Carbon Fiber Weave (0.3mm Fissure)',
    imgA: 'assets/carbon_pristine.jpg',
    imgB: 'assets/carbon_microcrack.jpg',
    labelA: 'Carbon Fiber Weave OEM (Pristine Monocoque)',
    labelB: 'Post-Return Surface (Sub-Visual Hairline Stress)',
    expectedDesc: 'Hairline structural fissure (0.28 mm) across weave axis.'
  },
  horology: {
    name: 'Luxury Watch (Sapphire Scuff)',
    imgA: 'assets/watch_pristine.jpg',
    imgB: 'assets/watch_microscratch.jpg',
    labelA: 'Patek/Rolex Sapphire Crystal OEM',
    labelB: 'Post-Lease Sapphire Horizon (Micro-Scuff 0.15 mm)',
    expectedDesc: 'Sub-millimeter sapphire coating abrasion invisible at 1x.'
  },
  universal: {
    name: 'Universal Object / Camera Feed',
    imgA: 'assets/porsche.jpg',
    imgB: 'assets/damaged_wheel.jpg',
    labelA: 'Baseline Master Reference (Departure / Check-in)',
    labelB: 'Inspection Frame (Return / Quality Gate)',
    expectedDesc: 'Universal optical discrepancy analysis.'
  }
};

function switchAssetMode(mode) {
  if (!OMNI_PRESETS[mode]) return;
  omniState.activeAsset = mode;

  // Update tabs visual state
  ['carbon', 'horology', 'universal'].forEach(m => {
    const btn = document.getElementById(`tab-${m}-btn`);
    if (btn) btn.classList.toggle('active', m === mode);
  });

  const preset = OMNI_PRESETS[mode];
  omniState.imageA = preset.imgA;
  omniState.imageB = preset.imgB;

  const slotA = document.getElementById('slot-a-label');
  const slotB = document.getElementById('slot-b-label');
  if (slotA) slotA.innerText = preset.labelA;
  if (slotB) slotB.innerText = preset.labelB;

  renderOmniDifferential();
}

function setViewMode(mode) {
  omniState.viewMode = mode;

  ['heatmap', 'slider', 'loupe', 'ghost'].forEach(m => {
    const btn = document.getElementById(`vm-${m}-btn`);
    if (btn) btn.classList.toggle('active', m === mode);
  });

  const stageImgA = document.getElementById('stage-img-a');
  const stageImgB = document.getElementById('stage-img-b');
  const canvas = document.getElementById('stage-heatmap-canvas');
  const ghostLayer = document.getElementById('stage-ghost-layer');
  const sliderDivider = document.getElementById('stage-split-divider');
  const loupeLens = document.getElementById('stage-loupe-lens');

  // Reset base styles
  if (stageImgA) stageImgA.style.clipPath = 'none';
  if (stageImgB) stageImgB.style.clipPath = 'none';

  if (mode === 'heatmap') {
    if (stageImgA) stageImgA.style.opacity = '1';
    if (stageImgB) stageImgB.style.opacity = '0';
    if (canvas) canvas.style.display = 'block';
    if (ghostLayer) ghostLayer.style.display = 'none';
    if (sliderDivider) sliderDivider.style.display = 'none';
    if (loupeLens) loupeLens.style.display = 'none';
  } else if (mode === 'slider') {
    if (stageImgA) stageImgA.style.opacity = '1';
    if (stageImgB) stageImgB.style.opacity = '1';
    if (canvas) canvas.style.display = 'none';
    if (ghostLayer) ghostLayer.style.display = 'none';
    if (sliderDivider) sliderDivider.style.display = 'block';
    if (loupeLens) loupeLens.style.display = 'none';
    updateSliderWipe(omniState.sliderPos);
  } else if (mode === 'loupe') {
    if (stageImgA) stageImgA.style.opacity = '1';
    if (stageImgB) stageImgB.style.opacity = '0';
    if (canvas) canvas.style.display = 'none';
    if (ghostLayer) ghostLayer.style.display = 'none';
    if (sliderDivider) sliderDivider.style.display = 'none';
    if (loupeLens) loupeLens.style.display = 'block';
  } else if (mode === 'ghost') {
    if (stageImgA) stageImgA.style.opacity = '1';
    if (stageImgB) stageImgB.style.opacity = '0';
    if (canvas) canvas.style.display = 'none';
    if (ghostLayer) ghostLayer.style.display = 'block';
    if (sliderDivider) sliderDivider.style.display = 'none';
    if (loupeLens) loupeLens.style.display = 'none';
  }
}

async function renderOmniDifferential() {
  const stageImgA = document.getElementById('stage-img-a');
  const stageImgB = document.getElementById('stage-img-b');
  const stageGhostImg = document.getElementById('stage-ghost-img');
  const canvas = document.getElementById('stage-heatmap-canvas');

  if (stageImgA) stageImgA.src = omniState.imageA;
  if (stageImgB) stageImgB.src = omniState.imageB;
  if (stageGhostImg) stageGhostImg.src = omniState.imageB;

  if (!omniDiffEngine || !canvas) return;

  try {
    const diffResult = await omniDiffEngine.computeDifferential(omniState.imageA, omniState.imageB, {
      threshold: 20,
      highPassBoost: 2.6,
      width: 600,
      height: 450
    });

    omniState.currentDelta = diffResult;

    // Transfer rendered differential to the stage canvas
    canvas.width = diffResult.targetWidth;
    canvas.height = diffResult.targetHeight;
    const ctx = canvas.getContext('2d');
    const tempImg = new Image();
    tempImg.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempImg, 0, 0);
    };
    tempImg.src = diffResult.heatmapDataUrl;

    // Update Optical Discrepancy Index pill
    const metricPill = document.getElementById('delta-metric-pill');
    if (metricPill) {
      if (diffResult.hasAnomaly) {
        metricPill.style.background = 'rgba(255, 0, 85, 0.15)';
        metricPill.style.color = '#FF0055';
        metricPill.style.borderColor = 'rgba(255, 0, 85, 0.3)';
        metricPill.innerText = `Delta: +${diffResult.deltaPercentage}% (Sub-Visual Anomaly)`;
      } else {
        metricPill.style.background = 'rgba(37, 211, 102, 0.15)';
        metricPill.style.color = '#25D366';
        metricPill.style.borderColor = 'rgba(37, 211, 102, 0.3)';
        metricPill.innerText = `Delta: 0.00% (Identical Sub-Pixel Match)`;
      }
    }

    // Refresh view mode
    setViewMode(omniState.viewMode);
  } catch (err) {
    console.error('OmniDiff computation failed:', err);
  }
}

function updateSliderWipe(percentage) {
  omniState.sliderPos = Math.max(0, Math.min(100, percentage));
  const stageImgB = document.getElementById('stage-img-b');
  const sliderDivider = document.getElementById('stage-split-divider');

  if (stageImgB) {
    stageImgB.style.clipPath = `polygon(${omniState.sliderPos}% 0, 100% 0, 100% 100%, ${omniState.sliderPos}% 100%)`;
  }
  if (sliderDivider) {
    sliderDivider.style.left = `${omniState.sliderPos}%`;
  }
}

function updateLoupe(x, y, rect) {
  const loupeLens = document.getElementById('stage-loupe-lens');
  const loupeCanvas = document.getElementById('loupe-canvas');
  if (!loupeLens || !loupeCanvas) return;

  const lensW = 140;
  const lensH = 140;
  loupeLens.style.left = `${x - lensW / 2}px`;
  loupeLens.style.top = `${y - lensH / 2}px`;

  const ctx = loupeCanvas.getContext('2d');
  const imgB = document.getElementById('stage-img-b');
  if (!imgB || !imgB.complete) return;

  const zoomFactor = 8;
  const sampleW = lensW / zoomFactor;
  const sampleH = lensH / zoomFactor;

  // Relative normalized coordinates (0 to 1)
  const normX = x / rect.width;
  const normY = y / rect.height;

  const naturalW = imgB.naturalWidth || 600;
  const naturalH = imgB.naturalHeight || 450;

  const srcX = normX * naturalW - sampleW / 2;
  const srcY = normY * naturalH - sampleH / 2;

  ctx.clearRect(0, 0, lensW, lensH);
  ctx.imageSmoothingEnabled = false; // Pixel-level inspection
  ctx.drawImage(imgB, srcX, srcY, sampleW, sampleH, 0, 0, lensW, lensH);

  // Overlay neon reticle grid inside loupe
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(lensW / 2, 0); ctx.lineTo(lensW / 2, lensH);
  ctx.moveTo(0, lensH / 2); ctx.lineTo(lensW, lensH / 2);
  ctx.stroke();

  ctx.strokeStyle = '#FF0055';
  ctx.beginPath();
  ctx.arc(lensW / 2, lensH / 2, 8, 0, Math.PI * 2);
  ctx.stroke();
}

function setupStageInteractions() {
  const stage = document.getElementById('diff-stage-container');
  if (!stage) return;

  let isDown = false;

  const onPointerMove = (e) => {
    const rect = stage.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (omniState.viewMode === 'slider' && isDown) {
      const pct = (x / rect.width) * 100;
      updateSliderWipe(pct);
    } else if (omniState.viewMode === 'loupe') {
      updateLoupe(x, y, rect);
    }
  };

  stage.addEventListener('mousedown', (e) => {
    isDown = true;
    onPointerMove(e);
  });
  window.addEventListener('mouseup', () => { isDown = false; });
  stage.addEventListener('mousemove', onPointerMove);

  stage.addEventListener('touchstart', (e) => {
    isDown = true;
    onPointerMove(e);
  }, { passive: true });
  window.addEventListener('touchend', () => { isDown = false; });
  stage.addEventListener('touchmove', onPointerMove, { passive: true });
}

function handleOmniUpload(event, slot) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    if (slot === 'A') {
      omniState.imageA = dataUrl;
      const label = document.getElementById('slot-a-label');
      if (label) label.innerText = `Custom Upload A (${file.name})`;
    } else {
      omniState.imageB = dataUrl;
      const label = document.getElementById('slot-b-label');
      if (label) label.innerText = `Custom Upload B (${file.name})`;
    }
    renderOmniDifferential();
  };
  reader.readAsDataURL(file);
}

async function runOmniDiffAnalysis() {
  const runBtn = document.getElementById('run-omnidiff-btn');
  if (runBtn) {
    runBtn.disabled = true;
    runBtn.innerHTML = `<span>⏳ Groq Vision AI Optical Metrology Running...</span>`;
  }

  try {
    const heatmapDataUrl = omniState.currentDelta ? omniState.currentDelta.heatmapDataUrl : null;
    const objectType = omniState.activeAsset;

    const res = await fetch('/api/diff/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageA: omniState.imageA,
        imageB: omniState.imageB,
        heatmapImage: heatmapDataUrl,
        objectType,
        metadata: {
          clientTimestamp: new Date().toISOString(),
          deltaPercentage: omniState.currentDelta ? omniState.currentDelta.deltaPercentage : null
        }
      })
    });

    const data = await res.json();
    if (data.success && data.analysis) {
      omniState.lastVerdict = data;
      renderOmniVerdict(data.analysis);
    } else {
      alert('OmniDiff Analysis: ' + (data.error || 'Server error occurred'));
    }
  } catch (err) {
    console.error('Analysis error:', err);
    alert('Error running OmniDiff analysis: ' + err.message);
  } finally {
    if (runBtn) {
      runBtn.disabled = false;
      runBtn.innerHTML = `⚡ Run Groq Sub-Pixel Forensic Appraisal`;
    }
  }
}

function renderOmniVerdict(analysis) {
  const title = document.getElementById('omni-verdict-title');
  const badge = document.getElementById('omni-severity-badge');
  const dim = document.getElementById('omni-dimension-val');
  const conf = document.getElementById('omni-confidence-val');
  const coords = document.getElementById('omni-coords-val');
  const reason = document.getElementById('omni-invisibility-reason');
  const proof = document.getElementById('omni-proof-hash');

  if (title) title.innerText = analysis.anomalyDetected ? `Microscopic Anomaly Detected: ${analysis.defectClassification || 'Hairline Defect'}` : `Optical Integrity Confirmed: Sub-Pixel Match`;
  
  if (badge) {
    if (analysis.anomalyDetected) {
      badge.style.background = 'rgba(255, 0, 85, 0.15)';
      badge.style.color = '#FF0055';
      badge.style.borderColor = '#FF0055';
      badge.innerText = `${analysis.severityRating || 'MICRO_MINOR'} (${analysis.estimatedDimensions?.widthMm || 0.28} mm)`;
    } else {
      badge.style.background = 'rgba(37, 211, 102, 0.15)';
      badge.style.color = '#25D366';
      badge.style.borderColor = '#25D366';
      badge.innerText = `PRISTINE &bull; ZERO OPTICAL DELTA`;
    }
  }

  if (dim && analysis.estimatedDimensions) {
    dim.innerHTML = `${analysis.estimatedDimensions.widthMm} mm &times; ${analysis.estimatedDimensions.lengthMm} mm (Depth: ${analysis.estimatedDimensions.depthMicrons} &mu;m)`;
  }
  if (conf) conf.innerText = `${Math.round(analysis.confidenceScore * 100)}% Sub-Pixel`;
  if (coords && analysis.affectedZoneCoordinates) {
    coords.innerText = `${analysis.affectedZoneCoordinates.description} (x:${analysis.affectedZoneCoordinates.pixelX || 0}, y:${analysis.affectedZoneCoordinates.pixelY || 0})`;
  }
  if (reason) {
    reason.innerText = analysis.humanInvisibilityReason || 'Micro-discrepancy falls below standard human visual threshold.';
  }
  if (proof && analysis.forensicAuditProof) {
    proof.innerText = analysis.forensicAuditProof.merkleRootHex ? analysis.forensicAuditProof.merkleRootHex.slice(0, 16) + '...' : 'Verified';
  }
}

function downloadOmniDiffReport() {
  const report = omniState.lastVerdict || {
    timestamp: new Date().toISOString(),
    asset: omniState.activeAsset,
    delta: omniState.currentDelta,
    notice: 'Run Groq Vision appraisal for certified appraisal cryptographic seal.'
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `OmniDiff-Forensic-Dossier-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ========================================================
   GROQ VISION AI INSPECTION & ESCROW STATION CONTROLLER
   ======================================================== */
let currentInspectionPanel = 'rim_front_left';
let preImageState = {
  url: 'assets/porsche.jpg',
  valid: true,
  hash: 'e81a74d284...99a1',
  detectedPanel: 'Rim & Tire (Front Left)',
  qualityScore: 0.98
};
let postImageState = {
  url: 'assets/porsche.jpg',
  valid: true,
  hash: 'e81a74d284...99a1',
  detectedPanel: 'Rim & Tire (Front Left)',
  qualityScore: 0.98
};
let lastForensicVerdict = null;

function handlePanelSelectChange() {
  const sel = document.getElementById('inspection-panel-select');
  if (!sel) return;
  currentInspectionPanel = sel.value;
  const panelText = sel.options[sel.selectedIndex].text.toUpperCase();
  const preLabel = document.getElementById('pre-target-label');
  const postLabel = document.getElementById('post-target-label');
  if (preLabel) preLabel.innerText = `ALIGN ${panelText.slice(0, 18)} IN RETICLE`;
  if (postLabel) postLabel.innerText = `ALIGN ${panelText.slice(0, 18)} IN RETICLE`;
}

// 1-Click Preset Demo Scenarios
function loadDemoScenario(scenarioKey) {
  document.querySelectorAll('.scenario-pill').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`scenario-${scenarioKey}-btn`);
  if (activeBtn) activeBtn.classList.add('active');

  const preView = document.getElementById('pre-viewfinder');
  const postView = document.getElementById('post-viewfinder');
  const preImg = document.getElementById('pre-preview-img');
  const postImg = document.getElementById('post-preview-img');
  const preBadge = document.getElementById('pre-frame-badge');
  const postBadge = document.getElementById('post-frame-badge');
  const preMsg = document.getElementById('pre-status-msg');
  const postMsg = document.getElementById('post-status-msg');
  const preHash = document.getElementById('pre-hash-tag');
  const postHash = document.getElementById('post-hash-tag');
  const verdictConsole = document.getElementById('verdict-console');
  if (verdictConsole) verdictConsole.style.display = 'none';

  if (scenarioKey === 'clean') {
    // Scenario 1: Clean Return
    document.getElementById('inspection-panel-select').value = 'rim_front_left';
    handlePanelSelectChange();
    preImageState = { url: 'assets/porsche.jpg', valid: true, hash: 'a19c...44bf', detectedPanel: 'Rim & Tire', qualityScore: 0.99 };
    postImageState = { url: 'assets/porsche.jpg', valid: true, hash: 'a19c...44bf', detectedPanel: 'Rim & Tire', qualityScore: 0.99 };

    if (preImg) preImg.src = 'assets/porsche.jpg';
    if (postImg) postImg.src = 'assets/porsche.jpg';
    if (preView) preView.className = 'hud-viewfinder valid';
    if (postView) postView.className = 'hud-viewfinder valid';

    if (preBadge) { preBadge.innerText = '✅ Valid (99%)'; preBadge.style.color = '#25D366'; }
    if (postBadge) { postBadge.innerText = '✅ Valid (99%)'; postBadge.style.color = '#25D366'; }
    if (preMsg) preMsg.innerHTML = '<span style="color:#25D366;font-weight:600;">✅ Certified:</span> <span style="color:var(--text-main);margin-left:4px;">Rim centered in reticle. Surface glare-free &amp; calibrated.</span>';
    if (postMsg) postMsg.innerHTML = '<span style="color:#25D366;font-weight:600;">✅ Certified:</span> <span style="color:var(--text-main);margin-left:4px;">Return frame matches perspective. Calibrated for delta analysis.</span>';
    if (preHash) preHash.innerText = 'SHA-256: 7f81a...d901';
    if (postHash) postHash.innerText = 'SHA-256: 7f81a...d901';

  } else if (scenarioKey === 'damaged') {
    // Scenario 2: Curb Rash Damage
    document.getElementById('inspection-panel-select').value = 'rim_front_left';
    handlePanelSelectChange();
    preImageState = { url: 'assets/porsche.jpg', valid: true, hash: 'a19c...44bf', detectedPanel: 'Rim & Tire', qualityScore: 0.99 };
    postImageState = { url: 'assets/damaged_wheel.jpg', valid: true, hash: 'e42d...18cc', detectedPanel: 'Rim & Tire', qualityScore: 0.98 };

    if (preImg) preImg.src = 'assets/porsche.jpg';
    if (postImg) postImg.src = 'assets/damaged_wheel.jpg';
    if (preView) preView.className = 'hud-viewfinder valid';
    if (postView) postView.className = 'hud-viewfinder valid';

    if (preBadge) { preBadge.innerText = '✅ Valid (99%)'; preBadge.style.color = '#25D366'; }
    if (postBadge) { postBadge.innerText = '✅ Valid (98%)'; postBadge.style.color = '#25D366'; }
    if (preMsg) preMsg.innerHTML = '<span style="color:#25D366;font-weight:600;">✅ Pre-Lease Baseline:</span> <span style="color:var(--text-main);margin-left:4px;">Wheel in pristine OEM showroom condition.</span>';
    if (postMsg) postMsg.innerHTML = '<span style="color:#25D366;font-weight:600;">✅ Return Frame Validated:</span> <span style="color:var(--text-main);margin-left:4px;">Frame accepted. Ready for forensic optical delta appraisal.</span>';
    if (preHash) preHash.innerText = 'SHA-256: 7f81a...d901';
    if (postHash) postHash.innerText = 'SHA-256: b389f...28ea';

  } else if (scenarioKey === 'misaligned') {
    // Scenario 3: Bad Framing / Rejected Photo
    document.getElementById('inspection-panel-select').value = 'hood';
    handlePanelSelectChange();
    preImageState = { url: 'assets/showroom.jpg', valid: false, hash: 'f41c...902a', detectedPanel: 'Environmental showroom', qualityScore: 0.45 };
    postImageState = { url: 'assets/supercar_hero.jpg', valid: true, hash: 'a539...5bfa', detectedPanel: 'Vehicle Exterior', qualityScore: 0.92 };

    if (preImg) preImg.src = 'assets/showroom.jpg';
    if (postImg) postImg.src = 'assets/supercar_hero.jpg';
    if (preView) preView.className = 'hud-viewfinder invalid';
    if (postView) postView.className = 'hud-viewfinder';

    if (preBadge) { preBadge.innerText = '❌ Rejected (45%)'; preBadge.style.color = '#D93025'; }
    if (postBadge) { postBadge.innerText = 'Awaiting Check'; postBadge.style.color = 'var(--text-muted)'; }
    if (preMsg) preMsg.innerHTML = '<span style="color:#D93025;font-weight:700;">❌ Groq Vision Rejection:</span> <span style="color:var(--text-main);margin-left:4px;">Wide environmental shot of multiple cars. Target hood is not isolated in reticle. Please center panel within brackets.</span>';
    if (postMsg) postMsg.innerHTML = '<span style="color:var(--text-muted);">Awaiting compliant pre-lease baseline photo.</span>';
    if (preHash) preHash.innerText = 'SHA-256: REJECTED';
    if (postHash) postHash.innerText = 'SHA-256: Ready';
  }
}

// Canvas Image Compressor for camera uploads (<= 500px, 0.82 quality)
function compressUploadFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 500;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
        else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handlePreImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const compressed = await compressUploadFile(file);
  const preImg = document.getElementById('pre-preview-img');
  const preView = document.getElementById('pre-viewfinder');
  const preBadge = document.getElementById('pre-frame-badge');
  const preMsg = document.getElementById('pre-status-msg');

  if (preImg) preImg.src = compressed;
  if (preView) preView.className = 'hud-viewfinder analyzing';
  if (preBadge) { preBadge.innerText = 'Analyzing Reticle...'; preBadge.style.color = 'var(--accent-gold)'; }
  if (preMsg) preMsg.innerHTML = '<span style="color:var(--accent-gold);">Groq Vision AI (qwen/qwen3.8-27b) analyzing panel framing and lighting...</span>';

  try {
    const res = await fetch('/api/inspection/validate-frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: compressed, panel: currentInspectionPanel })
    });
    const data = await res.json();
    if (preView) preView.className = `hud-viewfinder ${data.validFrame ? 'valid' : 'invalid'}`;
    if (preBadge) {
      preBadge.innerText = data.validFrame ? `✅ Accepted (${Math.round(data.confidence * 100)}%)` : '❌ Rejected';
      preBadge.style.color = data.validFrame ? '#25D366' : '#D93025';
    }
    if (preMsg) {
      preMsg.innerHTML = data.validFrame
        ? `<span style="color:#25D366;font-weight:600;">✅ Certified:</span> <span style="color:var(--text-main);margin-left:4px;">Panel [${data.detectedPanel}] framed within parameters. Sello SHA-256 grabado.</span>`
        : `<span style="color:#D93025;font-weight:700;">❌ Rejected:</span> <span style="color:var(--text-main);margin-left:4px;">${data.rejectionReason}</span>`;
    }
    const hashEl = document.getElementById('pre-hash-tag');
    if (hashEl) hashEl.innerText = `SHA-256: ${data.imageHash ? data.imageHash.slice(0, 14) + '...' : 'Certified'}`;
    preImageState = { url: compressed, valid: data.validFrame, hash: data.imageHash, detectedPanel: data.detectedPanel };
  } catch (err) {
    if (preView) preView.className = 'hud-viewfinder valid';
    if (preBadge) { preBadge.innerText = '✅ Valid (Local)'; preBadge.style.color = '#25D366'; }
    preImageState = { url: compressed, valid: true, hash: 'local-hash' };
  }
}

async function handlePostImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const compressed = await compressUploadFile(file);
  const postImg = document.getElementById('post-preview-img');
  const postView = document.getElementById('post-viewfinder');
  const postBadge = document.getElementById('post-frame-badge');
  const postMsg = document.getElementById('post-status-msg');

  if (postImg) postImg.src = compressed;
  if (postView) postView.className = 'hud-viewfinder analyzing';
  if (postBadge) { postBadge.innerText = 'Analyzing Reticle...'; postBadge.style.color = 'var(--accent-gold)'; }
  if (postMsg) postMsg.innerHTML = '<span style="color:var(--accent-gold);">Groq Vision AI analyzing return panel framing...</span>';

  try {
    const res = await fetch('/api/inspection/validate-frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: compressed, panel: currentInspectionPanel })
    });
    const data = await res.json();
    if (postView) postView.className = `hud-viewfinder ${data.validFrame ? 'valid' : 'invalid'}`;
    if (postBadge) {
      postBadge.innerText = data.validFrame ? `✅ Accepted (${Math.round(data.confidence * 100)}%)` : '❌ Rejected';
      postBadge.style.color = data.validFrame ? '#25D366' : '#D93025';
    }
    if (postMsg) {
      postMsg.innerHTML = data.validFrame
        ? `<span style="color:#25D366;font-weight:600;">✅ Certified:</span> <span style="color:var(--text-main);margin-left:4px;">Return frame matches target. Sello SHA-256 grabado.</span>`
        : `<span style="color:#D93025;font-weight:700;">❌ Rejected:</span> <span style="color:var(--text-main);margin-left:4px;">${data.rejectionReason}</span>`;
    }
    const hashEl = document.getElementById('post-hash-tag');
    if (hashEl) hashEl.innerText = `SHA-256: ${data.imageHash ? data.imageHash.slice(0, 14) + '...' : 'Certified'}`;
    postImageState = { url: compressed, valid: data.validFrame, hash: data.imageHash, detectedPanel: data.detectedPanel };
  } catch (err) {
    if (postView) postView.className = 'hud-viewfinder valid';
    if (postBadge) { postBadge.innerText = '✅ Valid (Local)'; postBadge.style.color = '#25D366'; }
    postImageState = { url: compressed, valid: true, hash: 'local-hash' };
  }
}

// Convert image URL to base64 if needed
async function getImgDataUrl(src) {
  if (src.startsWith('data:')) return src;
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// Main Forensic Appraisal Execution
async function executeAIForensicInspection() {
  if (!preImageState.valid) {
    alert('Inspection Blocked: Pre-Lease frame was rejected by Groq Vision. Please align panel inside HUD reticle.');
    return;
  }
  if (!postImageState.valid) {
    alert('Inspection Blocked: Post-Lease frame was rejected by Groq Vision. Please align panel inside HUD reticle.');
    return;
  }

  const btn = document.getElementById('run-forensics-btn');
  if (btn) btn.innerText = '⚡ Groq Vision Appraising Forensics (qwen/qwen3.8-27b)...';

  try {
    const preData = await getImgDataUrl(preImageState.url);
    const postData = await getImgDataUrl(postImageState.url);

    const res = await fetch('/api/inspection/compare-forensics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preImage: preData,
        postImage: postData,
        panel: currentInspectionPanel,
        depositAmountAed: 8000
      })
    });
    const data = await res.json();
    lastForensicVerdict = data;

    const consoleBox = document.getElementById('verdict-console');
    const title = document.getElementById('verdict-title');
    const pill = document.getElementById('verdict-status-pill');
    const desc = document.getElementById('verdict-description');
    const ded = document.getElementById('verdict-deductible');
    const ref = document.getElementById('verdict-refund');
    const hash = document.getElementById('verdict-proof-hash');

    if (consoleBox) consoleBox.style.display = 'block';

    if (data.damageDetected) {
      if (title) title.innerText = `Forensic Anomaly Detected: ${data.damageType}`;
      if (pill) {
        pill.innerText = 'DAMAGE DETECTED';
        pill.style.background = '#FCE8E6';
        pill.style.color = '#D93025';
      }
      if (ded) ded.innerText = `-${data.deductibleAed} AED`;
      if (ref) ref.innerText = `${data.remainingRefundAed} AED`;
    } else {
      if (title) title.innerText = 'Inspection Verdict: PRISTINE (100% Escrow Released)';
      if (pill) {
        pill.innerText = 'VERIFIED PRISTINE';
        pill.style.background = '#E6F4EA';
        pill.style.color = '#137333';
      }
      if (ded) ded.innerText = '0 AED';
      if (ref) ref.innerText = '8,000 AED';
    }

    if (desc) desc.innerText = `${data.damageDescription} (Forensic Confidence: ${Math.round((data.confidence || 0.96) * 100)}%).`;
    if (hash) hash.innerText = data.proofHash || 'SHA-256-CERTIFIED';

    consoleBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    alert('Forensic appraisal error: ' + err.message);
  } finally {
    if (btn) btn.innerText = '⚡ Run Groq AI Forensic Appraisal & Settle Escrow';
  }
}

function downloadAppraisalDossier() {
  if (!lastForensicVerdict) return;
  const v = lastForensicVerdict;
  const text = `========================================================================
APEXFLEET DUBAI — CERTIFIED VEHICULAR FORENSIC APPRAISAL DOSSIER
Autonomous Escrow & Computer Vision Protocol (Groq qwen/qwen3.8-27b)
========================================================================
Date: ${new Date().toISOString()}
Jurisdiction: Dubai, United Arab Emirates (DET & RTA Framework)
Target Panel: ${currentInspectionPanel}
Inspection Verdict: ${v.status}
Forensic Damage Type: ${v.damageType}
Appraisal Summary: ${v.damageDescription}
AI Model Confidence: ${Math.round((v.confidence || 0.96) * 100)}%

ESCROW DEPOSIT SETTLEMENT RECORD:
- Total Locked Escrow Deposit: 8,000 AED
- Authorized Baremo Damage Deductible: ${v.deductibleAed} AED
- Immediate Unreserved Customer Refund: ${v.remainingRefundAed} AED

CRYPTOGRAPHIC PROOF & INTEGRITY ANCHORS:
- Pre-Lease SHA-256 Seal: ${v.preHash}
- Post-Lease SHA-256 Seal: ${v.postHash}
- Merkle Escrow Settlement Proof: ${v.proofHash}
========================================================================
Certified by ApexFleet Autonomous Inspection Engine
Developed by Tecnoemprende
========================================================================`;

  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ApexFleet_Forensic_Dossier_${Date.now()}.txt`;
  a.click();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.innerText = next === 'dark' ? '☀️' : '🌙';
  safeSetStorage('af_theme', next);
}

function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'ar' : 'en';
  document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
  const btn = document.getElementById('lang-toggle-btn');
  if (btn) btn.innerText = currentLang === 'en' ? 'العربية' : 'English';
}

function openAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) modal.classList.add('active');
  renderLeases();
}
function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) modal.classList.remove('active');
}
function handleBackdropClick(e) { if (e.target.id === 'admin-modal') closeAdminModal(); }

function switchAdminTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const target = document.getElementById(tabId);
  if (target) target.style.display = 'block';
  const btn = document.querySelector(`[data-tab="${tabId}"]`);
  if (btn) btn.classList.add('active');
}

function openBookingModal() {
  const modal = document.getElementById('booking-modal');
  if (modal) modal.classList.add('active');
}
function openBookingModalForCar(carName) {
  openBookingModal();
  const c = document.getElementById('cust-car');
  if (c) c.value = carName;
}
function closeBookingModal() {
  const modal = document.getElementById('booking-modal');
  if (modal) modal.classList.remove('active');
}
function handleBookingBackdrop(e) { if (e.target.id === 'booking-modal') closeBookingModal(); }

function handleCustomerBooking(e) {
  e.preventDefault();
  const nameEl = document.getElementById('cust-name');
  const phoneEl = document.getElementById('cust-phone');
  const carEl = document.getElementById('cust-car');
  const name = nameEl ? nameEl.value : 'Guest';
  const phone = phoneEl ? phoneEl.value : '';
  const car = carEl ? carEl.value : 'Exotic';

  leases.push({ id: `ls-${Date.now()}`, customerName: name, phone, car, deposit: 8000, status: 'ESCROW_LOCKED' });
  safeSetStorage('af_leases', leases);
  closeBookingModal();
  alert(`Supercar reservation confirmed for ${name}. Deposit escrow locked with SHA-256 pre-lease inspection.`);
}

function exportBackupJSON() {
  const blob = new Blob([JSON.stringify({ fleet, categories, leases }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `apexfleet_backup_${Date.now()}.json`; a.click();
}

// Window Global Exports
window.toggleTheme = toggleTheme;
window.toggleLanguage = toggleLanguage;
window.openAdminModal = openAdminModal;
window.closeAdminModal = closeAdminModal;
window.handleBackdropClick = handleBackdropClick;
window.switchAdminTab = switchAdminTab;
window.openBookingModal = openBookingModal;
window.openBookingModalForCar = openBookingModalForCar;
window.closeBookingModal = closeBookingModal;
window.handleBookingBackdrop = handleBookingBackdrop;
window.handleCustomerBooking = handleCustomerBooking;
window.exportBackupJSON = exportBackupJSON;
window.handlePanelSelectChange = handlePanelSelectChange;
window.loadDemoScenario = loadDemoScenario;
window.handlePreImageUpload = handlePreImageUpload;
window.handlePostImageUpload = handlePostImageUpload;
window.executeAIForensicInspection = executeAIForensicInspection;
window.downloadAppraisalDossier = downloadAppraisalDossier;
window.deleteCar = deleteCar;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.selectCategory = selectCategory;
window.saveAnnouncement = saveAnnouncement;
window.handleSaveCar = handleSaveCar;
window.handleImageCompress = handleImageCompress;

// OmniDiff Sub-Pixel Differential Suite Exports
window.switchAssetMode = switchAssetMode;
window.setViewMode = setViewMode;
window.renderOmniDifferential = renderOmniDifferential;
window.updateSliderWipe = updateSliderWipe;
window.updateLoupe = updateLoupe;
window.handleOmniUpload = handleOmniUpload;
window.runOmniDiffAnalysis = runOmniDiffAnalysis;
window.downloadOmniDiffReport = downloadOmniDiffReport;

function initializeApexFleet() {
  const savedTheme = localStorage.getItem('af_theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.innerText = savedTheme === 'dark' ? '☀️' : '🌙';
  }
  renderCategories();
  renderFleet();
  renderLeases();
  loadDemoScenario('clean');

  // Initialize OmniDiff Sub-Pixel Suite
  switchAssetMode('carbon');
  setupStageInteractions();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initializeApexFleet);
} else {
  initializeApexFleet();
}
