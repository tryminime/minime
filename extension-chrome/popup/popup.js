// MiniMe Popup — Auth-aware UI
import { SyncManager } from '../lib/sync.js';
import { Toast } from '../lib/toast.js';

// ---------------------------------------------------------------------------
// ENVIRONMENT CONFIG
// The dashboard URL can be overridden in chrome.storage.local under the key
// "dashboardUrl". Default is localhost for dev; production sets it to the
// real domain via the settings/options page.
// ---------------------------------------------------------------------------
const DEFAULT_DASHBOARD_URL = 'http://localhost:3000/dashboard';

async function getDashboardUrl() {
    const { dashboardUrl } = await chrome.storage.local.get('dashboardUrl');
    return dashboardUrl || DEFAULT_DASHBOARD_URL;
}

document.addEventListener('DOMContentLoaded', init);

let updateInterval = null;
let statsInterval = null;
let tracking = true;

async function init() {
    console.log('MiniMe popup initialized');
    await checkAuth();
}

// ---------------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------------

async function checkAuth() {
    const isAuth = await SyncManager.isAuthenticated();
    if (isAuth) {
        showTrackingUI();
    } else {
        showLoginUI();
    }
}

function showLoginUI() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('trackingSection').style.display = 'none';

    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('loginPassword').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
}

function showTrackingUI() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('trackingSection').style.display = 'block';

    setupEventListeners();
    loadData();

    // Update current activity every second
    updateInterval = setInterval(updateCurrentActivity, 1000);
    // Refresh stats every 10 seconds
    statsInterval = setInterval(loadStats, 10000);
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    if (!email || !password) {
        errEl.textContent = 'Please enter email and password.';
        errEl.style.display = 'block';
        return;
    }

    btn.textContent = 'Signing in…';
    btn.disabled = true;
    errEl.style.display = 'none';

    const result = await SyncManager.login(email, password);
    if (result.success) {
        // Trigger first sync immediately
        chrome.runtime.sendMessage({ action: 'syncNow' });
        showTrackingUI();
    } else {
        errEl.textContent = result.error || 'Login failed. Check credentials.';
        errEl.style.display = 'block';
        btn.textContent = 'Sign In';
        btn.disabled = false;
    }
}

// ---------------------------------------------------------------------------
// TRACKING UI
// ---------------------------------------------------------------------------

function setupEventListeners() {
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    document.getElementById('pauseBtn')?.addEventListener('click', handlePause);

    document.getElementById('dashboardBtn')?.addEventListener('click', async () => {
        const url = await getDashboardUrl();
        chrome.tabs.create({ url });
    });

    document.getElementById('syncBtn')?.addEventListener('click', handleSync);
}

async function loadData() {
    await Promise.all([
        updateCurrentActivity(),
        loadStats(),
        loadRecentActivities()
    ]);
}

async function updateCurrentActivity() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (!tab || !tab.url) return;

        const url = new URL(tab.url);
        const domain = url.hostname;
        const favicon = tab.favIconUrl || '../assets/MiniMe-icon.png';

        const response = await chrome.runtime.sendMessage({
            action: 'getCurrentTabTime',
            tabId: tab.id
        });

        const timeSpent = response?.time || 0;

        document.getElementById('currentFavicon').src = favicon;
        document.getElementById('currentDomain').textContent = domain;
        document.getElementById('currentTime').textContent = `Browsing for ${formatTime(timeSpent)}`;
    } catch (error) {
        document.getElementById('currentDomain').textContent = 'No active tab';
        document.getElementById('currentTime').textContent = '--';
    }
}

async function loadStats() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getTodayStats' });
        if (response?.success) {
            const stats = response.stats;
            document.getElementById('totalTime').textContent = formatTime(stats.totalTime, true);
            document.getElementById('pagesVisited').textContent = stats.pagesVisited || 0;
            document.getElementById('entitiesFound').textContent = stats.entitiesFound || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRecentActivities() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getRecentActivities', limit: 5 });
        if (response?.success && response.activities) {
            renderRecentActivities(response.activities);
        }
    } catch (error) {
        console.error('Error loading recent activities:', error);
    }
}

function renderRecentActivities(activities) {
    const listElement = document.getElementById('recentList');
    if (!activities || activities.length === 0) {
        listElement.innerHTML = `<div class="activity-item"><img class="favicon" src="" alt=""><div class="domain">No recent activity</div><div class="time">--</div></div>`;
        return;
    }

    listElement.innerHTML = activities.map(activity => `
        <div class="activity-item" data-url="${activity.url}">
            <img class="favicon" src="${activity.favicon || '../assets/MiniMe-icon.png'}" alt="">
            <div class="domain">${activity.domain}</div>
            <div class="time">${formatTime(activity.duration, true)}</div>
        </div>
    `).join('');

    listElement.querySelectorAll('.activity-item').forEach(item => {
        item.addEventListener('click', () => {
            const url = item.dataset.url;
            if (url) chrome.tabs.create({ url });
        });
    });
}

async function handlePause() {
    tracking = !tracking;
    document.getElementById('pauseBtnText').textContent = tracking ? 'Pause' : 'Resume';
    document.getElementById('statusText').textContent = tracking ? 'Tracking activity...' : 'Paused';
    document.getElementById('statusDot').classList.toggle('inactive', !tracking);
    await chrome.runtime.sendMessage({ action: 'setTracking', tracking });
    Toast.show(tracking ? 'Tracking resumed' : 'Tracking paused', 'info');
}

async function handleSync() {
    const btn = document.getElementById('syncBtn');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Syncing...';
    try {
        const response = await chrome.runtime.sendMessage({ action: 'syncNow' });

        if (response?.error === 'not_authenticated') {
            Toast.show('Please sign in first', 'error');
            showLoginUI();
        } else if (response?.success) {
            const synced = (response.legacy?.synced || 0) + (response.queue?.synced || 0);
            Toast.show(synced > 0 ? `Synced ${synced} activities!` : 'Up to date ✓', 'success');
            await loadStats();
            await loadRecentActivities();
        } else {
            Toast.show(`Sync failed: ${response?.legacy?.error || 'check console'}`, 'error');
        }
    } catch (error) {
        Toast.show('Sync error — is the app running?', 'error');
    } finally {
        btn.disabled = false;
        btn.querySelector('span').textContent = 'Sync';
    }
}

function formatTime(seconds, compact = false) {
    if (!seconds || seconds === 0) return compact ? '0m' : '0 seconds';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (compact) return hours > 0 ? `${hours}h ${minutes}m` : minutes > 0 ? `${minutes}m` : `${secs}s`;
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    return parts.join(' ');
}

window.addEventListener('unload', () => {
    if (updateInterval) clearInterval(updateInterval);
    if (statsInterval) clearInterval(statsInterval);
});
