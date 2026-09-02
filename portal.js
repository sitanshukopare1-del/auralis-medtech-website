/**
 * Auralis Healthcare Clinician Portal JavaScript
 * Secure Fleet Telemetry & Multi-Bed Operations
 */

// Selected Clinician Profile
let currentProfile = {
  id: 'dr_ananya',
  name: 'Dr. Ananya Sharma',
  role: 'Lead Wound Surgeon • Ward 3',
  avatar: '🩺'
};

// Fleet Devices Database (Demo Telemetry)
const fleetData = {
  104: {
    id: 'DEVICE #SV-104',
    bed: 'Surgical Ward 3 — Bed 12-A',
    ward: 'ward3',
    indication: 'Diabetic Foot Ulcer (Stage III) • Continuous Suction',
    targetPressure: -125,
    currentPressure: -124.8,
    status: 'RUNNING',
    battery: '96% (AC)',
    canisterMl: 85,
    canisterMax: 300,
    sessionTime: '02h 45m',
    notes: 'Patient reported comfort with -125 mmHg continuous therapy. Periwound skin intact without erythema. Dressing seal airtight with minimal canister exudate increment in last 2 hours.'
  },
  108: {
    id: 'DEVICE #SV-108',
    bed: 'ICU — Bed 04',
    ward: 'icu',
    indication: 'Dehisced Abdominal Surgical Incision • Continuous Suction',
    targetPressure: -100,
    currentPressure: -99.4,
    status: 'RUNNING',
    battery: '88%',
    canisterMl: 140,
    canisterMax: 300,
    sessionTime: '06h 12m',
    notes: 'Heavy serosanguineous drainage managed effectively. Hydrophobic filter intact. Pressure stable across 6-hour surgical postoperative review.'
  },
  112: {
    id: 'DEVICE #SV-112',
    bed: 'OPD Wound Care — Room #2',
    ward: 'opd',
    indication: 'Scheduled Dressing Application • Pre-Op Standby',
    targetPressure: -70,
    currentPressure: 0,
    status: 'STANDBY',
    battery: '100%',
    canisterMl: 0,
    canisterMax: 300,
    sessionTime: 'Ready',
    notes: 'Unit cleaned and sanitized with replacement 300 mL graduated canister locked in bay. Ready for scheduled outpatient graft bolster procedure.'
  },
  115: {
    id: 'DEVICE #SV-115',
    bed: 'Ward 3 — Bed 08-B',
    ward: 'ward3',
    indication: 'Post-Trauma Skin Graft Bolster • Continuous Suction',
    targetPressure: -125,
    currentPressure: -125.0,
    status: 'RUNNING',
    battery: '92% (AC)',
    canisterMl: 110,
    canisterMax: 300,
    sessionTime: '04h 30m',
    notes: 'Skin graft bolster firmly adhered. Intermittent check shows excellent micro-strain contact across graft margins.'
  },
  119: {
    id: 'DEVICE #SV-119',
    bed: 'Supervised Home Care #HC-09',
    ward: 'home',
    indication: 'Venous Stasis Ulcer Refractory • Ambulatory Care',
    targetPressure: -100,
    currentPressure: -99.8,
    status: 'RUNNING',
    battery: '74% (Batt)',
    canisterMl: 150,
    canisterMax: 300,
    sessionTime: '11h 45m',
    notes: 'Ambulatory patient monitored remotely via encrypted sync. Patient reports full mobility with shoulder strap carrying pouch.'
  }
};

let activeDeviceId = 104;
let isLeakAlarmActive = false;

// Profile Selector
function selectProfile(id, name, role) {
  const cards = document.querySelectorAll('.profile-card');
  cards.forEach(card => card.classList.remove('active'));

  const clicked = event.currentTarget;
  clicked.classList.add('active');

  const avatar = clicked.querySelector('.profile-avatar').textContent;
  currentProfile = { id, name, role, avatar };
}

// Clinician Login Gate
function loginClinician() {
  const pinInput = document.getElementById('clinicianPin');
  if (pinInput.value.length < 4) {
    alert('Please enter a valid 4-digit PIN');
    return;
  }

  // Update header info
  document.getElementById('headerUserName').textContent = currentProfile.name;
  document.getElementById('headerUserRole').textContent = currentProfile.role;
  document.getElementById('headerUserAvatar').textContent = currentProfile.avatar;

  // Hide auth gate and display portal app
  document.getElementById('authOverlay').style.display = 'none';
  document.getElementById('portalApp').style.display = 'flex';

  // Initialize Canvas
  initPortalCanvas();
}

function logoutClinician() {
  document.getElementById('portalApp').style.display = 'none';
  document.getElementById('authOverlay').style.display = 'flex';
}

// Select Fleet Device
function selectFleetDevice(devId) {
  activeDeviceId = devId;
  const dev = fleetData[devId];
  if (!dev) return;

  // Highlight card in list
  const cards = document.querySelectorAll('.f-card');
  cards.forEach(c => c.classList.remove('active-selection'));
  const activeCard = document.getElementById(`fcard-${devId}`);
  if (activeCard) activeCard.classList.add('active-selection');

  // Update Monitor header
  document.getElementById('selectedDeviceTag').textContent = dev.id;
  document.getElementById('selectedBedTitle').textContent = dev.bed;
  document.getElementById('selectedIndication').textContent = `Clinical Indication: ${dev.indication}`;

  // Update Pressure and Canister
  setPortalPressure(dev.targetPressure, false);
  updateCanisterDisplay(dev.canisterMl, dev.canisterMax);

  // Update Notes
  document.getElementById('clinicianNotes').value = dev.notes;
}

// Pressure Setpoint Handler
function setPortalPressure(pressure, userAction = true) {
  const dev = fleetData[activeDeviceId];
  if (dev && userAction) {
    dev.targetPressure = pressure;
  }

  // Update values
  document.getElementById('pTargetVal').textContent = `${pressure} mmHg`;

  // Update 3 Buttons & Glowing Dots
  const levels = [-70, -100, -125];
  levels.forEach(lvl => {
    const abs = Math.abs(lvl);
    const btn = document.getElementById(`btnP${abs}`);
    const dot = document.getElementById(`pDot${abs}`);
    if (btn && dot) {
      if (lvl === pressure) {
        btn.classList.add('active-level');
        dot.classList.add('active-glow');
      } else {
        btn.classList.remove('active-level');
        dot.classList.remove('active-glow');
      }
    }
  });
}

function updateCanisterDisplay(ml, maxMl) {
  const pct = Math.round((ml / maxMl) * 100);
  const fillBar = document.getElementById('portalFluidFill');
  const mlDisplay = document.getElementById('portalCanisterMl');

  if (fillBar) fillBar.style.height = `${pct}%`;
  if (mlDisplay) mlDisplay.innerHTML = `${ml} mL <span class="c-pct">(${pct}%)</span>`;
}

// Ward Filtering
function filterWard(wardVal) {
  const cards = document.querySelectorAll('.f-card');
  let visibleCount = 0;

  Object.keys(fleetData).forEach(id => {
    const dev = fleetData[id];
    const cardElem = document.getElementById(`fcard-${id}`);
    if (!cardElem) return;

    if (wardVal === 'all' || dev.ward === wardVal) {
      cardElem.style.display = 'block';
      visibleCount++;
    } else {
      cardElem.style.display = 'none';
    }
  });

  document.getElementById('fleetCount').textContent = `${visibleCount} Device${visibleCount !== 1 ? 's' : ''}`;
}

// Alarm Simulation
function triggerRemoteAlertTest() {
  const sealBadge = document.getElementById('pSealBadge');
  isLeakAlarmActive = !isLeakAlarmActive;

  if (isLeakAlarmActive) {
    if (sealBadge) {
      sealBadge.className = 'seal-badge seal-alert';
      sealBadge.textContent = '⚠️ DRESSING LEAK DETECTED';
    }
    alert('ALERT TEST TRIGGERED: Bedside seal integrity loss simulated on ' + fleetData[activeDeviceId].id);
  } else {
    if (sealBadge) {
      sealBadge.className = 'seal-badge seal-good';
      sealBadge.textContent = 'OPTIMAL SEAL';
    }
    alert('ALERT RESOLVED: Optimal seal restored on ' + fleetData[activeDeviceId].id);
  }
}

// Clinical Report Exporter
function exportClinicalReport() {
  const dev = fleetData[activeDeviceId];
  const reportText = `
======================================================
AURALIS MED TECH — SAFE VAC CLINICAL THERAPY SUMMARY
======================================================
Generated At: ${new Date().toLocaleString()}
Clinician: ${currentProfile.name} (${currentProfile.role})
Device ID: ${dev.id}
Location: ${dev.bed}
Indication: ${dev.indication}

THERAPY PARAMETERS:
- Setpoint: ${dev.targetPressure} mmHg
- Measured Bed Vacuum: ${dev.currentPressure} mmHg
- Adherence Rate: 99.4%
- Canister Volume: ${dev.canisterMl} mL / ${dev.canisterMax} mL
- Total Session Run: ${dev.sessionTime}

CLINICIAN OBSERVATIONS:
${dev.notes}

DISCLAIMER:
Product demonstration telemetry export. Complies with ISO 13485 design guidelines.
======================================================
`;
  alert('Clinical Summary Generated for ' + dev.bed + ':\n\n' + reportText);
}

function saveClinicianNote() {
  const notesText = document.getElementById('clinicianNotes').value;
  fleetData[activeDeviceId].notes = notesText;
  const tag = document.getElementById('noteSavedTag');
  if (tag) {
    tag.textContent = 'Saved at ' + new Date().toLocaleTimeString();
    setTimeout(() => {
      tag.textContent = 'Auto-Saved';
    }, 3000);
  }
}

function triggerDressingChangeTimer() {
  alert('Dressing change timestamp logged in EHR compliance trail for ' + fleetData[activeDeviceId].bed);
}

// ==================================================
// REAL-TIME CANVAS PRESSURE STREAMING
// ==================================================
const canvas = document.getElementById('portalCanvas');
let ctx = null;
const portalGraphHistory = [];
const maxPts = 80;

for (let i = 0; i < maxPts; i++) {
  portalGraphHistory.push(-125 + (Math.random() * 1.5 - 0.75));
}

function initPortalCanvas() {
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  setInterval(updatePortalTelemetry, 60);
}

function updatePortalTelemetry() {
  if (!ctx || !canvas) return;

  const dev = fleetData[activeDeviceId];
  const target = dev ? dev.targetPressure : -125;
  let cur = dev ? dev.currentPressure : -124.8;

  // Physics convergence
  if (dev && dev.status === 'RUNNING') {
    if (isLeakAlarmActive) {
      cur = target * 0.65 + (Math.random() * 10 - 5);
    } else {
      cur += (target - cur) * 0.15 + (Math.random() * 1.2 - 0.6);
    }
  } else {
    cur *= 0.95;
  }

  if (dev) dev.currentPressure = cur;

  // Update display
  const curDisp = document.getElementById('pCurrentVal');
  if (curDisp) curDisp.textContent = cur.toFixed(1);

  portalGraphHistory.push(cur);
  if (portalGraphHistory.length > maxPts) {
    portalGraphHistory.shift();
  }

  renderPortalGraph(target);
}

function renderPortalGraph(target) {
  const w = canvas.width;
  const h = canvas.height;

  // Clear
  ctx.fillStyle = '#060B14';
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
  const gridVals = [-30, -70, -100, -125, -150];
  gridVals.forEach(v => {
    const y = mapPtoY(v, h);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`${v} mmHg`, 8, y - 3);
  });

  // Target Dotted Line
  const targetY = mapPtoY(target, h);
  ctx.save();
  ctx.strokeStyle = 'rgba(20, 184, 166, 0.5)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, targetY);
  ctx.lineTo(w, targetY);
  ctx.stroke();
  ctx.restore();

  // Wave Gradient Fill
  const stepX = w / (maxPts - 1);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(14, 165, 233, 0.25)');
  grad.addColorStop(1, 'rgba(14, 165, 233, 0.0)');

  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let i = 0; i < portalGraphHistory.length; i++) {
    const x = i * stepX;
    const y = mapPtoY(portalGraphHistory[i], h);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Wave Stroke
  ctx.beginPath();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = isLeakAlarmActive ? '#EF4444' : '#38BDF8';
  for (let i = 0; i < portalGraphHistory.length; i++) {
    const x = i * stepX;
    const y = mapPtoY(portalGraphHistory[i], h);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Head Pulse Dot
  const headX = (portalGraphHistory.length - 1) * stepX;
  const headY = mapPtoY(portalGraphHistory[portalGraphHistory.length - 1], h);
  ctx.beginPath();
  ctx.arc(headX, headY, 5, 0, Math.PI * 2);
  ctx.fillStyle = isLeakAlarmActive ? '#EF4444' : '#14B8A6';
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function mapPtoY(p, height) {
  const minP = 0;
  const maxP = -160;
  const norm = (p - minP) / (maxP - minP);
  return 15 + norm * (height - 30);
}
