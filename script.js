// ==========================================
// 1. CONFIGURATION & WISDOM DATA
// ==========================================
const USERS = ['Belidet', 'Ephi', 'Seli', 'Ermi'];

const PASSWORDS = {
  Belidet: 'belidet123',
  Ephi: 'ephi123',
  Seli: 'seli123',
  Ermi: 'ermi123'
};

const START_DATE_STR = '2026-09-11';
const TOTAL_DAYS = 40;
const POLL_INTERVAL_MS = 10000;

const dailyWisdomArray = [
  /* Day 1 */  '"Acquire a peaceful spirit, and thousands around you will be saved." — Abba Seraphim of Sarov',
  /* Day 2 */  '"Go, sit in your cell, and your cell will teach you everything." — Abba Moses the Black',
  /* Day 3 */  '"Pray without ceasing." — 1 Thessalonians 5:17',
  /* Day 4 */  '"This is the great work of a man: always to take the blame for his own sins before God and to expect temptation to his last breath." — Saint Anthony the Great',
  /* Day 5 */  '"Be angry and do not sin; do not let the sun go down on your wrath." — Ephesians 4:26',
  /* Day 6 */  '"A tree cannot bear fruit if it is frequently transplanted; so it is with the monk." — Abba Anthony the Great',
  /* Day 7 */  '"Blessed are the pure in heart, for they shall see God." — Matthew 5:8',
  /* Day 8 */  '"Do not judge anyone, for in judging another you condemn yourself." — Abba Poemen',
  /* Day 9 */  '"Trust in the LORD with all your heart, and lean not on your own understanding." — Proverbs 3:5',
  /* Day 10 */ '"Silence is the mystery of the world to come, while speech is an instrument of this world." — Abba Isaac the Syrian',
  /* Day 11 */ '"Set a guard, O LORD, over my mouth; keep watch over the door of my lips." — Psalm 141:3',
  /* Day 12 */ '"If you pray truly, you will feel a great assurance, and the angels will walk with you." — Abba Nilus of Sinai',
  /* Day 13 */ '"The light of the body is the eye: if therefore thine eye be single, thy whole body shall be full of light." — Matthew 6:22',
  /* Day 14 */ '"Watch and pray, lest you enter into temptation; the spirit indeed is willing, but the flesh is weak." — Abba Arsenius',
  /* Day 15 */ '"Rejoice in hope, be patient in tribulation, be constant in prayer." — Romans 12:12',
  /* Day 16 */ '"Just as water extinguishes a fire, so does humility wash away sin." — Abba Hyperechius',
  /* Day 17 */ '"The Lord is my light and my salvation; whom shall I fear?" — Psalm 27:1',
  /* Day 18 */ '"Never seek human praise; seek only the quiet approval of God." — Abba Pambo',
  /* Day 19 */ '"Draw near to God and He will draw near to you." — James 4:8',
  /* Day 20 */ '"A man who bears a grudge in his heart is like a man who harbors a snake in his breast." — Abba Zosimas',
  /* Day 21 */ '"Peace I leave with you, My peace I give to you; not as the world gives do I give to you." — John 14:27',
  /* Day 22 */ '"Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God." — Philippians 4:6',
  /* Day 23 */ '"As long as we are in the body, we must never trust our own heart." — Abba Agathon',
  /* Day 24 */ '"Create in me a clean heart, O God, and renew a steadfast spirit within me." — Psalm 51:10',
  /* Day 25 */ '"Prayer is the place of light, the refuge of the soul." — Abba Evagrius Ponticus',
  /* Day 26 */ '"The humble man never falls; for where can he fall when he is below all?" — Abba Macarius the Great',
  /* Day 27 */ '"Come to Me, all you who labor and are heavy laden, and I will give you rest." — Matthew 11:28',
  /* Day 28 */ '"It is impossible to build a house without foundations; so it is impossible to be saved without humility." — Abba John the Dwarf',
  /* Day 29 */ '"Your word is a lamp to my feet and a light to my path." — Psalm 119:105',
  /* Day 30 */ '"Lust is checked by fasting and labor; pride is checked by solitude and prayer." — Abba Mark the Ascetic',
  /* Day 31 */ '"Be still, and know that I am God." — Psalm 46:10',
  /* Day 32 */ '"If you wish to find rest here and hereafter, say on every occasion: Who am I?" — Abba Sisoes',
  /* Day 33 */ '"Fear not, for I am with you; be not dismayed, for I am your God." — Isaiah 41:10',
  /* Day 34 */ '"To weep over one’s own sins is greater than to raise the dead by one’s prayers." — Abba Pachomius',
  /* Day 35 */ '"Walk in the Spirit, and you shall not fulfill the lust of the flesh." — Galatians 5:16',
  /* Day 36 */ '"He who returns good for evil changes an enemy into a brother." — Abba Dorotheus of Gaza',
  /* Day 37 */ '"The kingdom of God does not come with observation; for indeed, the kingdom of God is within you." — Luke 17:20-21',
  /* Day 38 */ '"Do not measure yourself against others, but measure yourself against the commandments of Christ." — Abba Cassian',
  /* Day 39 */ '"I can do all things through Christ who strengthens me." — Philippians 4:13',
  /* Day 40 */ '"He who perseveres to the end will be saved." — Matthew 24:13'
];

let loggedInUser = localStorage.getItem('orthodox_journey_user') || null;
let cloudData = {};

// Polling guards
let isSaving = false;       // blocks the poll while a save is in flight
let noteEditing = false;    // blocks the poll while user is typing in a note
let lastDataHash = '';      // used to skip re-render if the poll returns identical data

// ==========================================
// 1b. NON-BLOCKING TOAST (replaces alert)
// ==========================================
function toast(msg, ms = 2500) {
  let el = document.getElementById('_toast');
  if (!el) {
    el = document.createElement('div');
    el.id = '_toast';
    el.style.cssText = `
      position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%) translateY(20px);
      background: rgba(20,15,5,0.95); color: #ffd700; padding: 10px 18px;
      border: 1px solid #ffd700; border-radius: 8px; z-index: 10000;
      font-family: inherit; font-size: 0.9rem; opacity: 0;
      transition: opacity .2s, transform .2s; pointer-events: none;
      max-width: 90vw; text-align: center;
    `;
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
  });
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(20px)';
  }, ms);
}

// ==========================================
// 1c. DATE HELPERS & PRE-COMPUTED DATE KEYS
// ==========================================
function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}
function formatDateStr(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DATE_KEYS = (() => {
  const start = parseLocalDate(START_DATE_STR);
  const out = [];
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    out.push(formatDateStr(d));
  }
  return out;
})();

// ← NEW: live "today" helpers
function todayStr() {
  return formatDateStr(new Date());
}

// 0 = Day 1, 39 = Day 40, negative = before journey, ≥40 = after journey
function currentJourneyDayIndex() {
  const start = parseLocalDate(START_DATE_STR);
  const today = parseLocalDate(todayStr());
  return Math.round((today - start) / (1000 * 60 * 60 * 24));
}

// What date should the app open on? Today, clamped into the 40-day window.
function defaultSelectedDate() {
  const idx = currentJourneyDayIndex();
  if (idx < 0) return DATE_KEYS[0];                                // before journey
  if (idx >= TOTAL_DAYS) return DATE_KEYS[DATE_KEYS.length - 1];   // after journey
  return todayStr();                                               // today
}

// ← CHANGED: initialize selection to "today" instead of Day 1
let selectedDateStr = defaultSelectedDate();

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================
// 2. CLOUD SYNC (diff-aware)
// ==========================================
async function loadCloudData() {
  if (isSaving || noteEditing) return;

  try {
    const response = await fetch('/api/prayer', { cache: 'no-store' });
    if (!response.ok) {
      console.warn('GET /api/prayer returned status:', response.status);
      return;
    }
    const freshData = await response.json();

    // Guard again after async gap
    if (isSaving || noteEditing) return;

    // Skip re-render if nothing changed
    const hash = JSON.stringify(freshData);
    if (hash === lastDataHash) return;
    lastDataHash = hash;

    cloudData = freshData;
    renderDashboard();
    renderMatrix();
  } catch (err) {
    console.error('Failed to connect to Vercel Storage:', err);
  }
}

setInterval(loadCloudData, POLL_INTERVAL_MS);

// ==========================================
// 3. SOUND & VISUAL FX (single AudioContext)
// ==========================================
let _audioCtx = null;
async function playGentleChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!_audioCtx) _audioCtx = new AudioCtx();
    if (_audioCtx.state === 'suspended') await _audioCtx.resume();

    const ctx = _audioCtx;
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

let _incenseActive = false;
function triggerGoldenIncense() {
  if (_incenseActive) return;
  _incenseActive = true;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;';
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
      _incenseActive = false;
    }
  }
  animate();
}

// ==========================================
// 4. AUTHENTICATION
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

  if (!user) { toast('Please select a pilgrim.'); return; }
  if (PASSWORDS[user] === pass) {
    loggedInUser = user;
    localStorage.setItem('orthodox_journey_user', user);
    passInput.value = '';
    updateAuthUI();
    renderDashboard();
  } else {
    toast('Incorrect password for ' + user);
  }
}

function logoutUser() {
  loggedInUser = null;
  localStorage.removeItem('orthodox_journey_user');
  updateAuthUI();
  renderDashboard();
}

function updateAuthUI() {
  const loginControls = document.getElementById('loginControls');
  const nameDisplay = document.getElementById('currentUserName');
  const logoutBtn = document.getElementById('logoutBtn');
  const passInput = document.getElementById('passInput');
  const toggleBtn = document.getElementById('togglePassBtn');

  if (passInput && passInput.type === 'text') {
    passInput.type = 'password';
    if (toggleBtn) {
      toggleBtn.textContent = '👁️';
      toggleBtn.setAttribute('aria-label', 'Toggle password visibility');
    }
  }
  if (loggedInUser) {
    if (loginControls) loginControls.style.display = 'none';
    if (nameDisplay) nameDisplay.textContent = loggedInUser;
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
  } else {
    if (loginControls) loginControls.style.display = 'flex';
    if (nameDisplay) nameDisplay.textContent = 'Guest (View Only)';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

// ==========================================
// 5. DATE NAVIGATION & WISDOM
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

// ← CHANGED: clamp incoming dates into the 40-day window
function onDatePicked(val) {
  if (!val) return;
  if (!DATE_KEYS.includes(val)) {
    toast('Please pick a date within the 40-day journey.');
    val = val < DATE_KEYS[0] ? DATE_KEYS[0]
        : val > DATE_KEYS[DATE_KEYS.length - 1] ? DATE_KEYS[DATE_KEYS.length - 1]
        : val;
  }
  selectedDateStr = val;
  const picker = document.getElementById('journeyDatePicker');
  if (picker) picker.value = selectedDateStr;
  updateDateLabel();
  renderDashboard();
  renderMatrix();
}

function updateDateLabel() {
  const cur = parseLocalDate(selectedDateStr);
  const diffDays = DATE_KEYS.indexOf(selectedDateStr);
  const dayNum = diffDays + 1;
  const dateFormatted = cur.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const labelElement = document.getElementById('dateDisplayLabel');
  if (labelElement) labelElement.textContent = `Day ${dayNum} of 40 — ${dateFormatted}`;
  updateDailyWisdom(diffDays);
}

function updateDailyWisdom(dayIndex) {
  const wisdomBlock = document.getElementById('dailyWisdomText');
  if (wisdomBlock && dayIndex >= 0 && dayIndex < TOTAL_DAYS) {
    wisdomBlock.textContent = dailyWisdomArray[dayIndex];
  }
}

// ==========================================
// 6. SAVE PRAYER PROGRESS & NOTES (non-blocking)
// ==========================================
function togglePrayer(user, prayerType) {
  if (loggedInUser !== user) {
    toast(`Please log in as ${user} to update prayer records.`);
    return;
  }

  // ---- 1. Optimistic local update (synchronous) ----
  if (!cloudData[selectedDateStr]) cloudData[selectedDateStr] = {};
  if (!cloudData[selectedDateStr][user]) {
    cloudData[selectedDateStr][user] = { jesus: false, theotokos: false, note: '' };
  }
  const userData = cloudData[selectedDateStr][user];
  const prevStatus = userData[prayerType];
  const newStatus = !prevStatus;
  userData[prayerType] = newStatus;

  // ---- 2. Instant UI ----
  renderDashboard();
  renderMatrix();

  // ---- 3. FX ----
  if (newStatus) {
    playGentleChime();
    if (userData.jesus && userData.theotokos) triggerGoldenIncense();
  }

  // ---- 4. Fire-and-forget network ----
  isSaving = true;
  fetch('/api/prayer', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateKey: selectedDateStr,
      userData: { [user]: userData }
    })
  })
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
    })
    .catch(err => {
      console.error('Save failed:', err);
      userData[prayerType] = prevStatus;
      renderDashboard();
      renderMatrix();
      toast('Save failed — reverted');
    })
    .finally(() => {
      isSaving = false;
    });
}

function saveNote(user, noteText) {
  if (loggedInUser !== user) return;

  if (!cloudData[selectedDateStr]) cloudData[selectedDateStr] = {};
  const userData = cloudData[selectedDateStr][user] || { jesus: false, theotokos: false, note: '' };
  userData.note = noteText;
  cloudData[selectedDateStr][user] = userData;

  isSaving = true;
  fetch('/api/prayer', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateKey: selectedDateStr,
      userData: { [user]: userData }
    })
  })
    .catch(err => console.error('Note network error:', err))
    .finally(() => { isSaving = false; });
}

// ==========================================
// 7. COMPLETION COUNTER (O(40), no date rebuilds)
// ==========================================
function get40DayCompletionCount(user) {
  let count = 0;
  for (let i = 0; i < DATE_KEYS.length; i++) {
    const k = DATE_KEYS[i];
    const rec = cloudData[k] && cloudData[k][user];
    if (rec && rec.jesus && rec.theotokos) count++;
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
    card.dataset.user = user;

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

      <div class="prayer-item ${data.jesus ? 'is-done' : ''}">
        <div class="prayer-name">"Lord Jesus Christ Son of God have mercy on me a sinner."</div>
        <button type="button" class="status-toggle-btn ${data.jesus ? 'done' : ''}"
                data-action="toggle" data-prayer="jesus"
                ${!isUserLoggedIn ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : ''}>
          ${data.jesus ? '✓ Prayer Completed' : 'Mark as Done'}
        </button>
        <div class="beads-container">
          ${Array(5).fill(0).map(() => `<div class="bead ${data.jesus ? 'filled' : ''}"></div>`).join('')}
        </div>
      </div>

      <div class="prayer-item ${data.theotokos ? 'is-done' : ''}">
        <div class="prayer-name">"Most Holy Theotokos save me!"</div>
        <button type="button" class="status-toggle-btn ${data.theotokos ? 'done' : ''}"
                data-action="toggle" data-prayer="theotokos"
                ${!isUserLoggedIn ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : ''}>
          ${data.theotokos ? '✓ Prayer Completed' : 'Mark as Done'}
        </button>
        <div class="beads-container">
          ${Array(5).fill(0).map(() => `<div class="bead ${data.theotokos ? 'filled' : ''}"></div>`).join('')}
        </div>
      </div>

      <div class="note-box">
        <textarea placeholder="${isUserLoggedIn ? 'Daily prayer reflection...' : 'No reflection recorded.'}"
                  data-action="note"
                  ${!isUserLoggedIn ? 'disabled' : ''}>${escapeHTML(data.note || '')}</textarea>
      </div>
    `;

    container.appendChild(card);
  });

  // Delegated listeners, attached once per render, no inline JS
  container.querySelectorAll('button[data-action="toggle"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.user-card');
      const user = card.dataset.user;
      togglePrayer(user, btn.dataset.prayer);
    });
  });

  container.querySelectorAll('textarea[data-action="note"]').forEach(ta => {
    ta.addEventListener('focus', () => { noteEditing = true; });
    ta.addEventListener('blur',  () => { noteEditing = false; saveNote(ta.closest('.user-card').dataset.user, ta.value); });
  });
}

// ==========================================
// 9. RENDER — 40-DAY MATRIX (delegated clicks)
// ==========================================
function renderMatrix() {
  const table = document.getElementById('journeyMatrixTable');
  if (!table) return;

  const rows = [];
  rows.push('<thead><tr><th>Day</th><th>Date</th>');
  USERS.forEach(u => rows.push(`<th>${escapeHTML(u)}</th>`));
  rows.push('</tr></thead><tbody>');

  for (let i = 0; i < TOTAL_DAYS; i++) {
    const dateStr = DATE_KEYS[i];
    const d = parseLocalDate(dateStr);
    const isSelected = (dateStr === selectedDateStr);

    rows.push(`<tr class="${isSelected ? 'active-row' : ''}" data-date="${dateStr}" style="cursor:pointer;">`);
    rows.push(`<td>Day ${i + 1}</td>`);
    rows.push(`<td style="font-size:0.8rem;">${d.getMonth() + 1}/${d.getDate()}</td>`);

    USERS.forEach(u => {
      const rec = cloudData[dateStr] ? cloudData[dateStr][u] : null;
      let statusClass = '';
      if (rec && rec.jesus && rec.theotokos) statusClass = 'completed';
      else if (rec && (rec.jesus || rec.theotokos)) statusClass = 'partial';
      rows.push(`<td><span class="matrix-status-dot ${statusClass}"></span></td>`);
    });
    rows.push('</tr>');
  }
  rows.push('</tbody>');
  table.innerHTML = rows.join('');

  table.onclick = (e) => {
    const tr = e.target.closest('tr[data-date]');
    if (tr) onDatePicked(tr.dataset.date);
  };
}

// ==========================================
// 10. MIDNIGHT AUTO-ADVANCE                 // ← NEW
// ==========================================
let _midnightTimer = null;

function scheduleMidnightRefresh() {
  clearTimeout(_midnightTimer);
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  const ms = nextMidnight - now + 1000;      // +1s buffer

  _midnightTimer = setTimeout(() => {
    // Only auto-jump if the user was already on "today" —
    // don't yank them off a day they deliberately browsed to.
    if (selectedDateStr === todayStr()) {
      selectedDateStr = defaultSelectedDate();
      const picker = document.getElementById('journeyDatePicker');
      if (picker) picker.value = selectedDateStr;
      updateDateLabel();
      renderDashboard();
      renderMatrix();
    }
    scheduleMidnightRefresh();               // re-arm for the next midnight
  }, ms);
}

// ==========================================
// 11. BOOTSTRAP                             // ← CHANGED
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  selectedDateStr = defaultSelectedDate();   // re-derive "today" on every load
  loadCloudData();
  updateAuthUI();
  updateDateLabel();

  const picker = document.getElementById('journeyDatePicker');
  if (picker) {
    picker.value = selectedDateStr;
    picker.min = DATE_KEYS[0];
    picker.max = DATE_KEYS[DATE_KEYS.length - 1];
  }

  scheduleMidnightRefresh();                 // auto-advance at midnight

  // "Today" button handler
  document.getElementById('goTodayBtn')?.addEventListener('click', () => {
    selectedDateStr = defaultSelectedDate();
    const p = document.getElementById('journeyDatePicker');
    if (p) p.value = selectedDateStr;
    updateDateLabel();
    renderDashboard();
    renderMatrix();
  });
});
