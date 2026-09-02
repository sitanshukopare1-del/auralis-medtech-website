/**
 * Auralis Med Tech - SAFE VAC
 * Interactive Control Panel Simulator & Secure Portal Handler
 * Clinical-Grade Medical Device Logic
 */

// ==================================================
// SIMULATOR STATE
// ==================================================
const simState = {
  targetPressure: -125, // mmHg (-70, -100, -125)
  currentPressure: -124.6,
  therapyMode: 'Continuous',
  deviceState: 'RUNNING', // 'RUNNING', 'PAUSED', 'STOPPED', 'ALARM'
  elapsedSeconds: 9912, // 02h 45m 12s
  targetMinutes: 240, // 04h 00m
  batteryPct: 96,
  isACOnline: true,
  canisterMl: 85,
  canisterMaxMl: 300,
  isAlarmActive: false,
  alarmType: null,
  graphHistory: []
};

// Audio Context for subtle tactile medical feedback
let audioCtx = null;
function playTactileBeep(freq = 600, duration = 0.05, type = 'sine') {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Audio optional / browser restricted
  }
}

// ==================================================
// 1. PRESSURE CONTROL WITH 3 DEDICATED GLOWING LIGHTS
// ==================================================
/**
 * Selects one of the three pressure levels: -70 mmHg, -100 mmHg, -125 mmHg.
 * Strictly enforces that ONLY the selected indicator illuminates/glows.
 */
function selectPressure(pressure) {
  playTactileBeep(520, 0.08);
  simState.targetPressure = pressure;

  // 1. Update Hardware Chassis Visual LEDs & LCD
  const hwLeds = {
    '-70': document.getElementById('hwLed70'),
    '-100': document.getElementById('hwLed100'),
    '-125': document.getElementById('hwLed125')
  };

  Object.keys(hwLeds).forEach(p => {
    if (hwLeds[p]) {
      if (parseInt(p) === pressure) {
        hwLeds[p].classList.add('active-glow');
      } else {
        hwLeds[p].classList.remove('active-glow');
      }
    }
  });

  const devTarget = document.getElementById('deviceDisplayTarget');
  if (devTarget) devTarget.textContent = pressure;

  // 2. Update Interactive Control Panel Option Cards & Glowing Lights
  const pressures = [-70, -100, -125];
  pressures.forEach(p => {
    const pAbs = Math.abs(p);
    const card = document.getElementById(`card${pAbs}`);
    const glowLight = document.getElementById(`glowLight${pAbs}`);
    const statusLabel = document.getElementById(`lightLabel${pAbs}`);

    if (card && glowLight && statusLabel) {
      if (p === pressure) {
        // Only the selected pressure illuminates
        card.classList.add('active-card');
        glowLight.classList.add('active-glowing');
        statusLabel.classList.add('active-label');
        statusLabel.textContent = 'ILLUMINATED';
      } else {
        card.classList.remove('active-card');
        glowLight.classList.remove('active-glowing');
        statusLabel.classList.remove('active-label');
        statusLabel.textContent = 'STANDBY';
      }
    }
  });

  // 3. Update Numeric Telemetry Displays
  const dispTarget = document.getElementById('displayTargetPressure');
  if (dispTarget) dispTarget.textContent = pressure;

  // Log demo transition event
  addHistoryLog(pressure, 'Pressure setpoint updated by clinician touch');
}

// ==================================================
// 2. THERAPY TIME ADJUSTMENT
// ==================================================
function adjustTherapyTime(deltaMinutes) {
  playTactileBeep(480, 0.04);
  simState.targetMinutes = Math.max(15, Math.min(1440, simState.targetMinutes + deltaMinutes));
  updateTimeDisplays();
}

function setTherapyTime(totalMinutes) {
  playTactileBeep(480, 0.04);
  simState.targetMinutes = totalMinutes;
  updateTimeDisplays();

  // Update preset button active states
  const presetBtns = document.querySelectorAll('.preset-btn');
  presetBtns.forEach(btn => {
    const text = btn.textContent;
    const hrs = totalMinutes / 60;
    btn.classList.toggle('active', text.includes(`${hrs} Hour`));
  });
}

function updateTimeDisplays() {
  const hrs = Math.floor(simState.targetMinutes / 60);
  const mins = simState.targetMinutes % 60;
  const formatted = `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;

  const durationDisplay = document.getElementById('timeDurationDisplay');
  const targetSessionTime = document.getElementById('displayTargetSessionTime');
  if (durationDisplay) durationDisplay.textContent = formatted;
  if (targetSessionTime) targetSessionTime.textContent = formatted;
}

// ==================================================
// 3. CONTROL BUTTONS: START, PAUSE, STOP, ALERT
// ==================================================
function handleControlAction(action) {
  const btnStart = document.getElementById('btnStart');
  const btnPause = document.getElementById('btnPause');
  const btnStop = document.getElementById('btnStop');
  const btnAlert = document.getElementById('btnAlert');
  const simDevStatus = document.getElementById('simDeviceStatus');
  const simTherapyStatus = document.getElementById('simTherapyStatus');
  const devStatus = document.getElementById('deviceDisplayStatus');
  const telemetryBadge = document.getElementById('telemetryBadgeMode');

  // Reset button action highlights
  [btnStart, btnPause, btnStop].forEach(btn => {
    if (btn) btn.className = btn.className.replace(/active-action/g, '').trim();
  });

  if (action === 'START') {
    playTactileBeep(660, 0.1);
    simState.deviceState = 'RUNNING';
    simState.isAlarmActive = false;
    if (btnStart) btnStart.classList.add('active-action');

    if (simDevStatus) simDevStatus.innerHTML = '<span class="status-indicator-dot dot-green"></span> SYSTEM RUNNING';
    if (simTherapyStatus) simTherapyStatus.textContent = 'CONTINUOUS NPWT';
    if (devStatus) {
      devStatus.textContent = 'ACTIVE';
      devStatus.className = 'lcd-status-badge status-green';
    }
    if (telemetryBadge) telemetryBadge.textContent = 'CONTINUOUS SUCTION';

    clearAlertStatus();
    addHistoryLog(simState.targetPressure, 'Therapy started / resumed in continuous vacuum mode');

  } else if (action === 'PAUSE') {
    playTactileBeep(420, 0.12);
    simState.deviceState = 'PAUSED';
    if (btnPause) btnPause.classList.add('active-action');

    if (simDevStatus) simDevStatus.innerHTML = '<span class="status-indicator-dot" style="background:#F59E0B; box-shadow: 0 0 8px #F59E0B;"></span> THERAPY PAUSED';
    if (simTherapyStatus) simTherapyStatus.textContent = 'PAUSED (STANDBY)';
    if (devStatus) {
      devStatus.textContent = 'PAUSED';
      devStatus.className = 'lcd-status-badge';
      devStatus.style.background = 'rgba(245, 158, 11, 0.2)';
      devStatus.style.color = '#FBBF24';
    }
    if (telemetryBadge) telemetryBadge.textContent = 'VALVE HOLD / PAUSED';

    addHistoryLog(simState.targetPressure, 'Therapy paused by healthcare professional');

  } else if (action === 'STOP') {
    playTactileBeep(330, 0.18);
    simState.deviceState = 'STOPPED';
    simState.isAlarmActive = false;
    if (btnStop) btnStop.classList.add('active-action');

    if (simDevStatus) simDevStatus.innerHTML = '<span class="status-indicator-dot" style="background:#EF4444; box-shadow: 0 0 8px #EF4444;"></span> STANDBY / STOPPED';
    if (simTherapyStatus) simTherapyStatus.textContent = 'THERAPY STOPPED';
    if (devStatus) {
      devStatus.textContent = 'STANDBY';
      devStatus.className = 'lcd-status-badge';
      devStatus.style.background = 'rgba(148, 163, 184, 0.2)';
      devStatus.style.color = '#94A3B8';
    }
    if (telemetryBadge) telemetryBadge.textContent = 'ATMOSPHERIC VENTED';

    clearAlertStatus();
    addHistoryLog(0, 'Therapy cycle completed & system vented');

  } else if (action === 'ALERT') {
    // Toggle Alert Test Simulation / Acknowledgment
    if (!simState.isAlarmActive) {
      // Trigger Alarm Demo
      playTactileBeep(880, 0.25, 'sawtooth');
      simState.isAlarmActive = true;
      simState.deviceState = 'ALARM';
      
      const alertPill = document.getElementById('simAlertStatus');
      if (alertPill) {
        alertPill.innerHTML = '<span class="alert-pill-red">⚠️ DRESSING LEAK DETECTED</span>';
      }
      if (btnAlert) {
        btnAlert.style.background = 'rgba(239, 68, 68, 0.3)';
        btnAlert.style.borderColor = '#EF4444';
        btnAlert.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> <span>ACKNOWLEDGE & CLEAR ALARM</span>';
      }
      addHistoryLog(simState.targetPressure, 'TEST ALERT: Dressing seal leak simulated (Auto-throttle active)');
    } else {
      // Acknowledge Alarm
      playTactileBeep(600, 0.1);
      clearAlertStatus();
      handleControlAction('START');
    }
  }
}

function clearAlertStatus() {
  simState.isAlarmActive = false;
  const alertPill = document.getElementById('simAlertStatus');
  const btnAlert = document.getElementById('btnAlert');
  if (alertPill) {
    alertPill.innerHTML = '<span class="alert-pill-green">NORMAL SEAL</span>';
  }
  if (btnAlert) {
    btnAlert.style.background = '#111827';
    btnAlert.style.borderColor = '#374151';
    btnAlert.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> <span>ACKNOWLEDGE / TEST ALERT</span>';
  }
}

// ==================================================
// 4. REAL-TIME CANVAS PRESSURE GRAPH & TELEMETRY LOOP
// ==================================================
const canvas = document.getElementById('pressureCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// Initialize graph buffer
const maxDataPoints = 65;
for (let i = 0; i < maxDataPoints; i++) {
  simState.graphHistory.push(-125 + (Math.random() * 1.6 - 0.8));
}

function updateTelemetryPhysics() {
  // Pressure convergence physics
  if (simState.deviceState === 'RUNNING') {
    const diff = simState.targetPressure - simState.currentPressure;
    simState.currentPressure += diff * 0.15;
    // Add subtle motor ripple
    const ripple = (Math.random() * 1.4 - 0.7);
    simState.currentPressure += ripple;
  } else if (simState.deviceState === 'PAUSED') {
    // Hold pressure with minor decay
    simState.currentPressure *= 0.998;
  } else if (simState.deviceState === 'STOPPED') {
    // Bleed to zero
    simState.currentPressure *= 0.92;
    if (Math.abs(simState.currentPressure) < 0.5) simState.currentPressure = 0;
  } else if (simState.deviceState === 'ALARM') {
    // Fluctuating pressure during leak
    simState.currentPressure = simState.targetPressure * 0.65 + (Math.random() * 8 - 4);
  }

  // Push to history
  simState.graphHistory.push(simState.currentPressure);
  if (simState.graphHistory.length > maxDataPoints) {
    simState.graphHistory.shift();
  }

  // Update current readout on screen
  const curPresElem = document.getElementById('displayCurrentPressure');
  if (curPresElem) {
    curPresElem.textContent = simState.currentPressure.toFixed(1);
  }
}

function renderPressureGraph() {
  if (!canvas || !ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // Clear background
  ctx.fillStyle = '#040711';
  ctx.fillRect(0, 0, w, h);

  // Draw Medical Grid Lines
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';

  // Horizontal Grid Lines (-50, -100, -150 mmHg)
  const yLevels = [-30, -70, -100, -125, -150];
  yLevels.forEach(val => {
    const y = mapPressureToY(val, h);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`${val} mmHg`, 8, y - 3);
  });

  // Target Setpoint Dotted Guide Line
  const targetY = mapPressureToY(simState.targetPressure, h);
  ctx.save();
  ctx.strokeStyle = 'rgba(20, 184, 166, 0.5)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, targetY);
  ctx.lineTo(w, targetY);
  ctx.stroke();
  ctx.restore();

  // Draw Pressure Wave with Gradient Fill
  const stepX = w / (maxDataPoints - 1);

  // Area Fill
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
  grad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let i = 0; i < simState.graphHistory.length; i++) {
    const x = i * stepX;
    const y = mapPressureToY(simState.graphHistory[i], h);
    if (i === 0) ctx.lineTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Wave Stroke Line
  ctx.beginPath();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = simState.isAlarmActive ? '#EF4444' : '#38BDF8';
  for (let i = 0; i < simState.graphHistory.length; i++) {
    const x = i * stepX;
    const y = mapPressureToY(simState.graphHistory[i], h);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Draw Current Head Pulse Circle
  const latestX = (simState.graphHistory.length - 1) * stepX;
  const latestY = mapPressureToY(simState.graphHistory[simState.graphHistory.length - 1], h);

  ctx.beginPath();
  ctx.arc(latestX, latestY, 5, 0, Math.PI * 2);
  ctx.fillStyle = simState.isAlarmActive ? '#EF4444' : '#14B8A6';
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function mapPressureToY(p, height) {
  // Map 0 to -160 mmHg into canvas height [20, height - 20]
  const minP = 0;
  const maxP = -160;
  const norm = (p - minP) / (maxP - minP);
  return 20 + norm * (height - 40);
}

// Telemetry & Render Interval Loop
setInterval(() => {
  updateTelemetryPhysics();
  renderPressureGraph();
}, 60);

// ==================================================
// 5. SESSION TIMER & CLOCK TICK
// ==================================================
setInterval(() => {
  if (simState.deviceState === 'RUNNING') {
    simState.elapsedSeconds++;

    const hrs = Math.floor(simState.elapsedSeconds / 3600);
    const mins = Math.floor((simState.elapsedSeconds % 3600) / 60);
    const secs = simState.elapsedSeconds % 60;
    const timeStr = `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;

    const timerDisp = document.getElementById('displayElapsedTimer');
    const devTimeDisp = document.getElementById('deviceDisplayTime');

    if (timerDisp) timerDisp.textContent = timeStr;
    if (devTimeDisp) devTimeDisp.textContent = `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m RUN`;
  }
}, 1000);

// ==================================================
// 6. HISTORY LOG HELPER
// ==================================================
function addHistoryLog(target, note) {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];

  const row = document.createElement('tr');
  row.innerHTML = `
    <td><code>${timeStr}</code></td>
    <td>${target} mmHg</td>
    <td>${simState.currentPressure.toFixed(1)} mmHg</td>
    <td>${simState.therapyMode}</td>
    <td><span class="${simState.isAlarmActive ? 'badge-stage-upcoming' : 'badge-status-ok'}">${simState.isAlarmActive ? 'Seal Alert' : 'Optimal Seal'}</span></td>
    <td>${note}</td>
  `;

  tbody.insertBefore(row, tbody.firstChild);

  // Keep max 6 rows
  if (tbody.children.length > 6) {
    tbody.removeChild(tbody.lastChild);
  }
}

// ==================================================
// 7. SECURE HEALTHCARE DASHBOARD MODAL
// ==================================================
function openSecureModal() {
  playTactileBeep(640, 0.08);
  const modal = document.getElementById('securePortalModal');
  if (modal) {
    modal.classList.add('modal-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function closeSecureModal() {
  playTactileBeep(440, 0.06);
  const modal = document.getElementById('securePortalModal');
  if (modal) {
    modal.classList.remove('modal-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

// Close modal on outside click or ESC key
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeSecureModal();
  }
});

const modalBackdrop = document.getElementById('securePortalModal');
if (modalBackdrop) {
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      closeSecureModal();
    }
  });
}

// ==================================================
// 8. CONTACT FORM & PREFILL ROUTING
// ==================================================
function prefillForm(interestCategory) {
  const selectElem = document.getElementById('interestedIn');
  const targetSection = document.getElementById('contactFormCard');

  if (selectElem && interestCategory) {
    selectElem.value = interestCategory;
  }

  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function handlePartnershipSubmit(event) {
  event.preventDefault();
  playTactileBeep(700, 0.12);

  const submitBtn = document.getElementById('formSubmitBtn');
  const successBox = document.getElementById('formSuccessMessage');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-icon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      <span>Transmitting Inquiry...</span>
    `;
  }

  // Simulate secure dispatch
  setTimeout(() => {
    if (submitBtn) {
      submitBtn.style.display = 'none';
    }
    if (successBox) {
      successBox.style.display = 'flex';
    }
  }, 900);
}

// ==================================================
// 9. MOBILE NAVIGATION TOGGLE
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (toggle && navMenu) {
    toggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });

    // Close menu when clicking nav links
    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
      });
    });
  }

  // Ensure initial pressure state displays properly
  selectPressure(-125);
  updateTimeDisplays();
});
