// ==========================================
// 1. CONFIGURATION
// ==========================================
const USERS = ['Belidet', 'Ephi', 'Seli', 'Ermi'];

// Note: For production, authenticate credentials via backend POST requests
const PASSWORDS = {
  Belidet: 'belidet123',
  Ephi: 'ephi123',
  Seli: 'seli123',
  Ermi: 'ermi123'
};

const START_DATE_STR = '2026-09-11';
const TOTAL_DAYS = 40;
const POLL_INTERVAL_MS = 10000;   // 10s polling interval

let loggedInUser = localStorage.getItem('orthodox_journey_user') || null;
let selectedDateStr = START_DATE_STR;
let cloudData = {};

// Guard flag: prevents background polling from overwriting an in-flight save or active editing
let isSaving = false;

// Helper: Safely parse YYYY-MM-DD into a local Date without UTC offset shifts
function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Helper: Format Date object to YYYY-MM-DD
function formatDateStr(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Helper: Escape HTML to prevent XSS in template literals
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================
// 2. CLOUD SYNC
// ==========================================
async function loadCloudData() {
  if (isSaving) return;

  try {
    const response = await fetch('/api/prayer', { cache: 'no-store' });
    if (!response.ok) {
      console.warn('GET /api/prayer returned status:', response.status);
      return;
    }
    cloudData = await response.json();
    renderDashboard();
    renderMatrix();
  } catch (err) {
    console.error('Failed to connect to Vercel Storage:', err);
  }
}

// Auto-polling setup
setInterval(loadCloudData, POLL_INTERVAL_MS);

// ==========================================
// 3. SOUND & VISUAL FX
// ==========================================
async function playGentleChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(261.63, ctx.currentTime + 2.0);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.0);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 2.0);
  } catch (e) {
    console.warn('AudioContext prevented or not supported:', e);
  }
}

function triggerGoldenIncense() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 35 }).map(() => ({
    x: Math.random() * canvas.width,
    y: canvas.height + Math.random() * 20,
    size: Math.random() * 3.5 + 1,
    speedY: Math.random() * 1.5 + 0.6,
    speedX: (Math.random() - 0.5) * 0.8,
    opacity: 1,
  }));

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.y -= p.speedY;
      p.x += p.speedX;
      p.opacity -= 0.009;
      ctx.fillStyle = `rgba(255, 215, 0, ${Math.max(0, p.opacity)})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#ffd700';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    if (particles.some(p => p.opacity > 0)) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }
  animate();
}

// ==========================================
// 4. AUTHENTICATION & UTILITIES
// ==========================================
function togglePasswordVisibility() {
  const passInput = document.getElementById('passInput');
  const toggleBtn = document.getElementById('togglePassBtn');
  if (!passInput || !toggleBtn) return;

  const isPassword = passInput.type === 'password';
  passInput.type = isPassword ? 'text' : 'password';
  toggleBtn.textContent = isPassword ? '🙈' : '👁️';
  toggleBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
}

function loginUser() {
  const userSelect = document.getElementById('userSelect');
  const passInput = document.getElementById('passInput');
  
  if (!userSelect || !passInput) return;

  const user = userSelect.value;
  const pass = passInput.value;

  if (!user) {
    alert('Please select a pilgrim.');
    return;
  }

  if (PASSWORDS[user] === pass) {
    loggedInUser = user;
    localStorage.setItem('orthodox_journey_user', user);
    passInput.value = '';
    updateAuthUI();
    renderDashboard();
  } else {
    alert('Incorrect password for ' + user);
  }
}

function logoutUser() {
  loggedInUser = null;
  localStorage.removeItem('orthodox_journey_user');
  updateAuthUI();
  renderDashboard();
}

function updateAuthUI() {
  const nameDisplay = document.getElementById('currentUserName');
  const logoutBtn = document.getElementById('logoutBtn');
  const passInput = document.getElementById('passInput');
  const toggleBtn = document.getElementById('togglePassBtn');

  // Reset password visibility field to standard state on state change
  if (passInput && passInput.type === 'text') {
    passInput.type = 'password';
    if (toggleBtn) {
      toggleBtn.textContent = '👁️';
      toggleBtn.setAttribute('aria-label', 'Toggle password visibility');
    }
  }

  if (nameDisplay) {
    nameDisplay.textContent = loggedInUser ? loggedInUser : 'Guest (View Only)';
  }
  if (logoutBtn) {
    logoutBtn.style.display = loggedInUser ? 'inline-block' : 'none';
  }
}

// ==========================================
// 5. DATE NAVIGATION
// ==========================================
function changeDate(deltaDays) {
  const cur = parseLocalDate(selectedDateStr);
  cur.setDate(cur.getDate() + deltaDays);

  const start = parseLocalDate(START_DATE_STR);
  const end = parseLocalDate(START_DATE_STR);
  end.setDate(end.getDate() + TOTAL_DAYS - 1);

  if (cur < start || cur > end) return;

  selectedDateStr = formatDateStr(cur);
  
  const picker = document.getElementById('journeyDatePicker');
  if (picker) picker.value = selectedDateStr;

  updateDateLabel();
  renderDashboard();
  renderMatrix();
}

function onDatePicked(val) {
  if (!val) return;
  selectedDateStr = val;

  const picker = document.getElementById('journeyDatePicker');
  if (picker) picker.value = selectedDateStr;

  updateDateLabel();
  renderDashboard();
  renderMatrix();
}

function updateDateLabel() {
  const start = parseLocalDate(START_DATE_STR);
  const cur = parseLocalDate(selectedDateStr);
  const diffDays = Math.round((cur - start) / (1000 * 60 * 60 * 24)) + 1;
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  const dateFormatted = cur.toLocaleDateString('en-US', options);

  const labelElement = document.getElementById('dateDisplayLabel');
  if (labelElement) {
    labelElement.textContent = `Day ${diffDays} of 40 — ${dateFormatted}`;
  }
}

// ==========================================
// 6. SAVE PRAYER PROGRESS & NOTES
// ==========================================
async function togglePrayer(user, prayerType) {
  if (loggedInUser !== user) {
    alert(`Please log in as ${user} to update prayer records.`);
    return;
  }

  const dayData = cloudData[selectedDateStr] || {};
  const userData = dayData[user] || { jesus: false, theotokos: false, note: '' };

  const newStatus = !userData[prayerType];
  userData[prayerType] = newStatus;

  // Optimistic UI update
  if (!cloudData[selectedDateStr]) cloudData[selectedDateStr] = {};
  cloudData[selectedDateStr][user] = userData;
  renderDashboard();
  renderMatrix();

  if (newStatus) {
    playGentleChime();
    if (userData.jesus && userData.theotokos) {
      triggerGoldenIncense();
    }
  }

  isSaving = true;
  try {
    const res = await fetch('/api/prayer', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateKey: selectedDateStr,
        userData: { [user]: userData }
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Save failed:', res.status, errBody);
      alert('Could not save to server. Please check your connection.');
      await loadCloudData();
    } else {
      const payload = await res.json();
      if (payload && payload.data) {
        cloudData = payload.data;
        renderDashboard();
        renderMatrix();
      }
    }
  } catch (err) {
    console.error('Network error:', err);
    alert('Network error — change not saved.');
  } finally {
    isSaving = false;
  }
}

async function saveNote(user, noteText) {
  if (loggedInUser !== user) return;

  const dayData = cloudData[selectedDateStr] || {};
  const userData = dayData[user] || { jesus: false, theotokos: false, note: '' };
  userData.note = noteText;

  // Optimistically commit note to local state
  if (!cloudData[selectedDateStr]) cloudData[selectedDateStr] = {};
  cloudData[selectedDateStr][user] = userData;

  isSaving = true;
  try {
    const res = await fetch('/api/prayer', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateKey: selectedDateStr,
        userData: { [user]: userData }
      })
    });

    if (!res.ok) {
      console.error('Note save failed:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Note network error:', err);
  } finally {
    isSaving = false;
  }
}

// ==========================================
// 7. COMPLETION COUNTER
// ==========================================
function get40DayCompletionCount(user) {
  let count = 0;
  const startDate = parseLocalDate(START_DATE_STR);

  // Accurately count only within the 40-day window
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateKey = formatDateStr(d);

    if (
      cloudData[dateKey] &&
      cloudData[dateKey][user] &&
      cloudData[dateKey][user].jesus &&
      cloudData[dateKey][user].theotokos
    ) {
      count++;
    }
  }
  return count;
}

// ==========================================
// 8. RENDER — DASHBOARD
// ==========================================
function renderDashboard() {
  const container = document.getElementById('pilgrimsDashboard');
  if (!container) return;
  container.innerHTML = '';

  const dayData = cloudData[selectedDateStr] || {};

  USERS.forEach(user => {
    const data = dayData[user] || { jesus: false, theotokos: false, note: '' };
    const totalCompleted = get40DayCompletionCount(user);
    const progressPct = Math.round((totalCompleted / TOTAL_DAYS) * 100);

    const isUserLoggedIn = (loggedInUser === user);
    const card = document.createElement('article');
    card.className = `user-card gold-border-frame ${isUserLoggedIn ? 'active-user-card' : ''}`;

    card.innerHTML = `
      <div class="user-card-header">
        <h2>${escapeHTML(user)}</h2>
        <span style="font-size:0.85rem; color:var(--gold-bright, #ffd700); font-weight:bold;">${totalCompleted}/40 Days</span>
      </div>

      <div class="progress-container">
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${progressPct}%;"></div>
        </div>
        <div class="progress-text">
          <span>Rule Completion</span>
          <span>${progressPct}%</span>
        </div>
      </div>

      <!-- Jesus Prayer -->
      <div class="prayer-item ${data.jesus ? 'is-done' : ''}">
        <div class="prayer-name">"Lord Jesus Christ Son of God have mercy on me a sinner."</div>
        <button type="button" class="status-toggle-btn ${data.jesus ? 'done' : ''}" 
                onclick="togglePrayer('${user}', 'jesus')"
                ${!isUserLoggedIn ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : ''}>
          ${data.jesus ? '✓ Prayer Completed' : 'Mark as Done'}
        </button>
        <div class="beads-container">
          ${Array(5).fill(0).map(() => `<div class="bead ${data.jesus ? 'filled' : ''}"></div>`).join('')}
        </div>
      </div>

      <!-- Theotokos Prayer -->
      <div class="prayer-item ${data.theotokos ? 'is-done' : ''}">
        <div class="prayer-name">"Most Holy Theotokos save me!"</div>
        <button type="button" class="status-toggle-btn ${data.theotokos ? 'done' : ''}" 
                onclick="togglePrayer('${user}', 'theotokos')"
                ${!isUserLoggedIn ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : ''}>
          ${data.theotokos ? '✓ Prayer Completed' : 'Mark as Done'}
        </button>
        <div class="beads-container">
          ${Array(5).fill(0).map(() => `<div class="bead ${data.theotokos ? 'filled' : ''}"></div>`).join('')}
        </div>
      </div>

      <!-- Reflection Box -->
      <div class="note-box">
        <textarea placeholder="${isUserLoggedIn ? 'Daily prayer reflection...' : 'No reflection recorded.'}" 
                  ${!isUserLoggedIn ? 'disabled' : ''} 
                  onchange="saveNote('${user}', this.value)">${escapeHTML(data.note || '')}</textarea>
      </div>
    `;

    container.appendChild(card);
  });
}

// ==========================================
// 9. RENDER — 40-DAY MATRIX
// ==========================================
function renderMatrix() {
  const table = document.getElementById('journeyMatrixTable');
  if (!table) return;

  let tableContent = `<thead><tr><th>Day</th><th>Date</th>`;
  USERS.forEach(u => tableContent += `<th>${escapeHTML(u)}</th>`);
  tableContent += `</tr></thead><tbody>`;

  const startDate = parseLocalDate(START_DATE_STR);

  for (let i = 0; i < TOTAL_DAYS; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = formatDateStr(d);
    const isSelected = (dateStr === selectedDateStr);

    tableContent += `<tr class="${isSelected ? 'active-row' : ''}" onclick="onDatePicked('${dateStr}')" style="cursor:pointer;">
      <td>Day ${i + 1}</td>
      <td style="font-size:0.8rem;">${d.getMonth() + 1}/${d.getDate()}</td>`;

    USERS.forEach(u => {
      const rec = cloudData[dateStr] ? cloudData[dateStr][u] : { jesus: false, theotokos: false };
      let statusClass = '';
      if (rec && rec.jesus && rec.theotokos) statusClass = 'completed';
      else if (rec && (rec.jesus || rec.theotokos)) statusClass = 'partial';

      tableContent += `<td><span class="matrix-status-dot ${statusClass}"></span></td>`;
    });

    tableContent += `</tr>`;
  }

  tableContent += `</tbody>`;
  table.innerHTML = tableContent;
}

// ==========================================
// 10. BOOTSTRAP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  loadCloudData();
  updateAuthUI();
  updateDateLabel();
  
  const picker = document.getElementById('journeyDatePicker');
  if (picker) picker.value = selectedDateStr;
});
