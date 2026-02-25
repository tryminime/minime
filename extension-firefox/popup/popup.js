// MiniMe Popup - Spec-Compliant UI Logic
import { Toast } from '../lib/toast.js';

document.addEventListener('DOMContentLoaded', init);

let updateInterval = null;
let currentTabId = null;
let tracking = true;

async function init() {
    console.log('MiniMe popup initialized');

    // Set up event listeners
    setupEventListeners();

    // Load initial data
    await loadData();

    // Update current activity every second
    updateInterval = setInterval(updateCurrentActivity, 1000);

    // Refresh stats every 10 seconds
    setInterval(loadStats, 10000);
}

function setupEventListeners() {
    // Settings button
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // Pause button
    document.getElementById('pauseBtn')?.addEventListener('click', handlePause);

    // Dashboard button
    document.getElementById('dashboardBtn')?.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://app.tryminime.com' });
    });

    // Sync button
    document.getElementById('syncBtn')?.addEventListener('click', handleSync);
}

async function loadData() {
    await Promise.all([
        updateCurrentActivity(),
        loadStats(),
        loadRecentActivities()
    ]);
}

// Update current activity card
async function updateCurrentActivity() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab) return;

        currentTabId = tab.id;
        const domain = new URL(tab.url).hostname;
        const favicon = tab.favIconUrl || '../assets/MiniMe-icon.png';

        // Get time spent from background worker
        const response = await chrome.runtime.sendMessage({
            action: 'getCurrentTabTime',
            tabId: tab.id
        });

        const timeSpent = response?.time || 0;
        const timeText = formatTime(timeSpent);

        // Update UI
        document.getElementById('currentFavicon').src = favicon;
        document.getElementById('currentDomain').textContent = domain;
        document.getElementById('currentTime').textContent = `Browsing for ${timeText}`;

    } catch (error) {
        console.error('Error updating current activity:', error);
        document.getElementById('currentDomain').textContent = 'No active tab';
        document.getElementById('currentTime').textContent = '--';
    }
}

// Load today's stats
async function loadStats() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getTodayStats' });

        if (response && response.success) {
            const stats = response.stats;

            document.getElementById('totalTime').textContent = formatTime(stats.totalTime, true);
            document.getElementById('pagesVisited').textContent = stats.pagesVisited || 0;
            document.getElementById('entitiesFound').textContent = stats.entitiesFound || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load recent activities
async function loadRecentActivities() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getRecentActivities', limit: 5 });

        if (response && response.success && response.activities) {
            renderRecentActivities(response.activities);
        }
    } catch (error) {
        console.error('Error loading recent activities:', error);
    }
}

function renderRecentActivities(activities) {
    const listElement = document.getElementById('recentList');

    if (!activities || activities.length === 0) {
        listElement.innerHTML = `
            <div class="activity-item">
                <img class="favicon" src="" alt="">
                <div class="domain">No recent activity</div>
                <div class="time">--</div>
            </div>
        `;
        return;
    }

    listElement.innerHTML = activities.map(activity => `
        <div class="activity-item" data-url="${activity.url}">
            <img class="favicon" src="${activity.favicon || '../assets/MiniMe-icon.png'}" alt="">
            <div class="domain">${activity.domain}</div>
            <div class="time">${formatTime(activity.duration, true)}</div>
        </div>
    `).join('');

    // Add click handlers
    listElement.querySelectorAll('.activity-item').forEach(item => {
        item.addEventListener('click', () => {
            const url = item.dataset.url;
            if (url) {
                chrome.tabs.create({ url });
            }
        });
    });
}

// Handle pause/resume
async function handlePause() {
    tracking = !tracking;

    const btn = document.getElementById('pauseBtn');
    const btnText = document.getElementById('pauseBtnText');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    if (tracking) {
        btnText.textContent = 'Pause';
        statusText.textContent = 'Tracking activity...';
        statusDot.classList.remove('inactive');
    } else {
        btnText.textContent = 'Resume';
        statusText.textContent = 'Paused';
        statusDot.classList.add('inactive');
    }

    // Send to background worker
    await chrome.runtime.sendMessage({
        action: 'setTracking',
        tracking: tracking
    });

    Toast.show(tracking ? 'Tracking resumed' : 'Tracking paused', 'info');
}

// Handle sync
async function handleSync() {
    const btn = document.getElementById('syncBtn');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Syncing...';

    try {
        const response = await chrome.runtime.sendMessage({ action: 'syncNow' });

        if (response && response.success) {
            Toast.show('Synced successfully!', 'success');
        } else {
            Toast.show('Sync failed. Try again.', 'error');
        }
    } catch (error) {
        console.error('Sync error:', error);
        Toast.show('Sync error', 'error');
    } finally {
        btn.disabled = false;
        btn.querySelector('span').textContent = 'Sync';
    }
}

// Format time (seconds to human readable)
function formatTime(seconds, compact = false) {
    if (!seconds || seconds === 0) {
        return compact ? '0m' : '0 seconds';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (compact) {
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        } else {
            return `${secs}s`;
        }
    } else {
        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
        return parts.join(' ');
    }
}

// Cleanup on unload
window.addEventListener('unload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
