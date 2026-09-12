// Pilgrim Configuration & Authentication
const USERS = ['Belidet', 'Ephi', 'Seli', 'Ermi'];
const PASSWORDS = {
  Belidet: 'belidet123',
  Ephi: 'ephi123',
  Seli: 'seli123',
  Ermi: 'ermi123'
};

const START_DATE_STR = '2026-09-11';
const TOTAL_DAYS = 40;

let loggedInUser = localStorage.getItem('orthodox_journey_user') || null;
let selectedDateStr = START_DATE_STR;

// Database state stored in local browser storage
let db = JSON.parse(localStorage.getItem('orthodox_journey_db')) || {};

// Initialize data structure for 40 days
function initDataStore() {
  const startDate = new Date(START_DATE_STR);
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateKey = d.toISOString().split('T')[0];
    
    if (!db[dateKey]) {
      db[dateKey] = {};
    }
    
    USERS.forEach(u => {
      if (!db[dateKey][u]) {
        db[dateKey][u] = { jesus: false, theotokos: false, note: '' };
      }
    });
  }
  saveDb();
}

function saveDb() {
  localStorage.setItem('orthodox_journey_db', JSON.stringify(db));
}

// Web Audio API Synthesized Bell Chime
function playGentleChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 note
    osc.frequency.exponentialRampToValueAtTime(261.63, ctx.currentTime + 2.0);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.0);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 2.0);
  } catch (e) {
    // Audio context fallback
  }
}

// Incense Particle Visual FX
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

// User Authentication
function loginUser() {
  const user = document.getElementById('userSelect').value;
  const pass = document.getElementById('passInput').value;

  if (!user) {
    alert('Please select a pilgrim.');
    return;
  }

  if (PASSWORDS[user] === pass) {
    loggedInUser = user;
    localStorage.setItem('orthodox_journey_user', user);
    document.getElementById('passInput').value = '';
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

  if (loggedInUser) {
    nameDisplay.textContent = loggedInUser;
    logoutBtn.style.display = 'inline-block';
  } else {
    nameDisplay.textContent = 'Guest (View Only)';
    logoutBtn.style.display = 'none';
  }
}

// Date Navigation
function changeDate(deltaDays) {
  const cur = new Date(selectedDateStr);
  cur.setDate(cur.getDate() + deltaDays);
  
  const start = new Date(START_DATE_STR);
  const end = new Date(START_DATE_STR);
  end.setDate(end.getDate() + TOTAL_DAYS - 1);

  if (cur < start || cur > end) return;

  selectedDateStr = cur.toISOString().split('T')[0];
  document.getElementById('journeyDatePicker').value = selectedDateStr;
  updateDateLabel();
  renderDashboard();
  renderMatrix();
}

function onDatePicked(val) {
  selectedDateStr = val;
  updateDateLabel();
  renderDashboard();
  renderMatrix();
}

function updateDateLabel() {
  const start = new Date(START_DATE_STR);
  const cur = new Date(selectedDateStr);
  const diffDays = Math.round((cur - start) / (1000 * 60 * 60 * 24)) + 1;
  
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  const dateFormatted = cur.toLocaleDateString('en-US', options);

  document.getElementById('dateDisplayLabel').textContent = `Day ${diffDays} of 40 — ${dateFormatted}`;
}

// Prayer Status Toggles
function togglePrayer(user, prayerType) {
  if (loggedInUser !== user) {
    alert(`Please log in as ${user} to update prayer records.`);
    return;
  }

  const dayRecord = db[selectedDateStr][user];
  dayRecord[prayerType] = !dayRecord[prayerType];
  
  saveDb();
  
  if (dayRecord[prayerType]) {
    playGentleChime();
    if (dayRecord.jesus && dayRecord.theotokos) {
      triggerGoldenIncense();
    }
  }

  renderDashboard();
  renderMatrix();
}

function saveNote(user, noteText) {
  if (loggedInUser !== user) return;
  db[selectedDateStr][user].note = noteText;
  saveDb();
}

function get40DayCompletionCount(user) {
  let count = 0;
  Object.keys(db).forEach(date => {
    if (db[date][user] && db[date][user].jesus && db[date][user].theotokos) {
      count++;
    }
  });
  return count;
}

// Component Rendering
function renderDashboard() {
  const container = document.getElementById('pilgrimsDashboard');
  container.innerHTML = '';

  const dayData = db[selectedDateStr] || {};

  USERS.forEach(user => {
    const data = dayData[user] || { jesus: false, theotokos: false, note: '' };
    const totalCompleted = get40DayCompletionCount(user);
    const progressPct = Math.round((totalCompleted / TOTAL_DAYS) * 100);

    const isUserLoggedIn = (loggedInUser === user);
    const card = document.createElement('article');
    card.className = `user-card gold-border-frame ${isUserLoggedIn ? 'active-user-card' : ''}`;

    card.innerHTML = `
      <div class="user-card-header">
        <h2>${user}</h2>
        <span style="font-size:0.85rem; color:var(--gold-bright); font-weight:bold;">${totalCompleted}/40 Days</span>
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
                ${!isUserLoggedIn ? 'style="opacity:0.75;"' : ''}>
          ${data.jesus ? '✓ Prayer Completed' : 'Mark as Done'}
        </button>
        <div class="beads-container">
          ${Array(5).fill(0).map((_, i) => `<div class="bead ${data.jesus ? 'filled' : ''}"></div>`).join('')}
        </div>
      </div>

      <!-- Theotokos Prayer -->
      <div class="prayer-item ${data.theotokos ? 'is-done' : ''}">
        <div class="prayer-name">"Most Holy Theotokos save me!"</div>
        <button type="button" class="status-toggle-btn ${data.theotokos ? 'done' : ''}" 
                onclick="togglePrayer('${user}', 'theotokos')"
                ${!isUserLoggedIn ? 'style="opacity:0.75;"' : ''}>
          ${data.theotokos ? '✓ Prayer Completed' : 'Mark as Done'}
        </button>
        <div class="beads-container">
          ${Array(5).fill(0).map((_, i) => `<div class="bead ${data.theotokos ? 'filled' : ''}"></div>`).join('')}
        </div>
      </div>

      <!-- Reflection Box -->
      <div class="note-box">
        <textarea placeholder="${isUserLoggedIn ? 'Daily prayer reflection...' : 'No reflection recorded.'}" 
                  ${!isUserLoggedIn ? 'disabled' : ''} 
                  onchange="saveNote('${user}', this.value)">${data.note || ''}</textarea>
      </div>
    `;

    container.appendChild(card);
  });
}

function renderMatrix() {
  const table = document.getElementById('journeyMatrixTable');
  table.innerHTML = '';

  let headerRow = `<tr><th>Day</th><th>Date</th>`;
  USERS.forEach(u => headerRow += `<th>${u}</th>`);
  headerRow += `</tr>`;
  table.innerHTML += headerRow;

  const startDate = new Date(START_DATE_STR);

  for (let i = 0; i < TOTAL_DAYS; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const isSelected = (dateStr === selectedDateStr);

    let rowHtml = `<tr class="${isSelected ? 'active-row' : ''}">
      <td>Day ${i + 1}</td>
      <td style="font-size:0.8rem;">${d.getMonth() + 1}/${d.getDate()}</td>`;

    USERS.forEach(u => {
      const rec = db[dateStr] ? db[dateStr][u] : { jesus: false, theotokos: false };
      let statusClass = '';
      if (rec.jesus && rec.theotokos) statusClass = 'completed';
      else if (rec.jesus || rec.theotokos) statusClass = 'partial';

      rowHtml += `<td><span class="matrix-status-dot ${statusClass}"></span></td>`;
    });

    rowHtml += `</tr>`;
    table.innerHTML += rowHtml;
  }
}

// Initial Bootstrapping
initDataStore();
updateAuthUI();
updateDateLabel();
renderDashboard();
renderMatrix();
