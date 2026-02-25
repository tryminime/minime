// Settings page logic
document.addEventListener('DOMContentLoaded', init);

async function init() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Privacy controls
    document.getElementById('addBlacklist').addEventListener('click', addToBlacklist);
    document.getElementById('addWhitelist').addEventListener('click', addToWhitelist);
    document.getElementById('whitelistEnabled').addEventListener('change', saveSettings);
    document.getElementById('skipSensitive').addEventListener('change', saveSettings);

    // Tracking preferences
    document.getElementById('trackYouTube').addEventListener('change', saveSettings);
    document.getElementById('trackMedia').addEventListener('change', saveSettings);
    document.getElementById('minDuration').addEventListener('change', saveSettings);
    document.getElementById('retentionDays').addEventListener('change', saveSettings);
    document.getElementById('clearOldData').addEventListener('click', clearOldData);

    // Sync settings
    document.getElementById('syncInterval').addEventListener('change', saveSettings);
    document.getElementById('saveApiUrl').addEventListener('click', saveApiUrl);
    document.getElementById('exportData').addEventListener('click', exportData);
    document.getElementById('clearAllData').addEventListener('click', clearAllData);

    // Reset
    document.getElementById('resetDefaults').addEventListener('click', resetDefaults);

    // Load current settings
    await loadSettings();
}

function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('hidden', content.id !== `${tabName}-tab`);
    });
}

async function loadSettings() {
    try {
        const settings = await chrome.storage.local.get([
            'blacklist', 'whitelist', 'whitelistEnabled',
            'skipSensitive', 'trackYouTube', 'trackMedia',
            'minDuration', 'retentionDays', 'syncInterval', 'api Url'
        ]);

        // Load blacklist
        const blacklist = settings.blacklist || [];
        renderDomainList('blacklistList', blacklist, removeFromBlacklist);

        // Load whitelist
        const whitelist = settings.whitelist || [];
        renderDomainList('whitelistList', whitelist, removeFromWhitelist);

        // Load toggles
        document.getElementById('whitelistEnabled').checked = settings.whitelistEnabled || false;
        document.getElementById('skipSensitive').checked = settings.skipSensitive !== false;
        document.getElementById('trackYouTube').checked = settings.trackYouTube !== false;
        document.getElementById('trackMedia').checked = settings.trackMedia !== false;
        document.getElementById('minDuration').checked = settings.minDuration || false;

        // Load selects
        document.getElementById('retentionDays').value = settings.retentionDays || 30;
        document.getElementById('syncInterval').value = settings.syncInterval || 5;
        document.getElementById('apiUrl').value = settings.apiUrl || 'http://localhost:8000';

    } catch (error) {
        console.error('Failed to load settings:', error);
        showStatus('Failed to load settings', 'error');
    }
}

function renderDomainList(elementId, domains, removeFunc) {
    const list = document.getElementById(elementId);
    list.innerHTML = '';

    if (domains.length === 0) {
        list.innerHTML = '<li style="text-align: center; color: #9ca3af;">No domains added</li>';
        return;
    }

    domains.forEach(domain => {
        const li = document.createElement('li');
        li.innerHTML = `
      <span>${domain}</span>
      <button onclick="(${removeFunc.toString()})('${domain}')">Remove</button>
    `;
        list.appendChild(li);
    });
}

async function addToBlacklist() {
    const input = document.getElementById('blacklistInput');
    const domain = input.value.trim().toLowerCase();

    if (!domain) return;

    try {
        const { blacklist = [] } = await chrome.storage.local.get('blacklist');

        if (blacklist.includes(domain)) {
            showStatus('Domain already in blacklist', 'error');
            return;
        }

        blacklist.push(domain);
        await chrome.storage.local.set({ blacklist });

        input.value = '';
        await loadSettings();
        showStatus('Domain added to blacklist', 'success');
    } catch (error) {
        showStatus('Failed to add domain', 'error');
    }
}

async function removeFromBlacklist(domain) {
    try {
        const { blacklist = [] } = await chrome.storage.local.get('blacklist');
        const updated = blacklist.filter(d => d !== domain);
        await chrome.storage.local.set({ blacklist: updated });
        await loadSettings();
        showStatus('Domain removed from blacklist', 'success');
    } catch (error) {
        showStatus('Failed to remove domain', 'error');
    }
}

async function addToWhitelist() {
    const input = document.getElementById('whitelistInput');
    const domain = input.value.trim().toLowerCase();

    if (!domain) return;

    try {
        const { whitelist = [] } = await chrome.storage.local.get('whitelist');

        if (whitelist.includes(domain)) {
            showStatus('Domain already in whitelist', 'error');
            return;
        }

        whitelist.push(domain);
        await chrome.storage.local.set({ whitelist });

        input.value = '';
        await loadSettings();
        showStatus('Domain added to whitelist', 'success');
    } catch (error) {
        showStatus('Failed to add domain', 'error');
    }
}

async function removeFromWhitelist(domain) {
    try {
        const { whitelist = [] } = await chrome.storage.local.get('whitelist');
        const updated = whitelist.filter(d => d !== domain);
        await chrome.storage.local.set({ whitelist: updated });
        await loadSettings();
        showStatus('Domain removed from whitelist', 'success');
    } catch (error) {
        showStatus('Failed to remove domain', 'error');
    }
}

async function saveSettings() {
    try {
        await chrome.storage.local.set({
            whitelistEnabled: document.getElementById('whitelistEnabled').checked,
            skipSensitive: document.getElementById('skipSensitive').checked,
            trackYouTube: document.getElementById('trackYouTube').checked,
            trackMedia: document.getElementById('trackMedia').checked,
            minDuration: document.getElementById('minDuration').checked,
            retentionDays: parseInt(document.getElementById('retentionDays').value),
            syncInterval: parseInt(document.getElementById('syncInterval').value),
        });

        showStatus('Settings saved', 'success');
    } catch (error) {
        showStatus('Failed to save settings', 'error');
    }
}

async function saveApiUrl() {
    const apiUrl = document.getElementById('apiUrl').value.trim();

    if (!apiUrl) {
        showStatus('API URL cannot be empty', 'error');
        return;
    }

    try {
        await chrome.storage.local.set({ apiUrl });
        showStatus('API URL saved', 'success');
    } catch (error) {
        showStatus('Failed to save API URL', 'error');
    }
}

async function clearOldData() {
    if (!confirm('This will delete all synced activities older than the retention period. Continue?')) {
        return;
    }

    try {
        const { retentionDays = 30 } = await chrome.storage.local.get('retentionDays');
        const response = await chrome.runtime.sendMessage({
            action: 'clearOldData',
            days: retentionDays
        });

        if (response && response.success) {
            showStatus(`Deleted ${response.count} old activities`, 'success');
        } else {
            showStatus('Failed to clear old data', 'error');
        }
    } catch (error) {
        showStatus('Failed to clear old data', 'error');
    }
}

async function exportData() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'exportData' });

        if (response && response.success) {
            const blob = new Blob([JSON.stringify(response.data, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `minime-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            showStatus('Data exported successfully', 'success');
        } else {
            showStatus('Failed to export data', 'error');
        }
    } catch (error) {
        showStatus('Failed to export data', 'error');
    }
}

async function clearAllData() {
    if (!confirm('This will delete ALL local data including unsynced activities. This cannot be undone! Continue?')) {
        return;
    }

    try {
        const response = await chrome.runtime.sendMessage({ action: 'clearAllData' });

        if (response && response.success) {
            await loadSettings();
            showStatus('All data cleared', 'success');
        } else {
            showStatus('Failed to clear data', 'error');
        }
    } catch (error) {
        showStatus('Failed to clear data', 'error');
    }
}

async function resetDefaults() {
    if (!confirm('Reset all settings to default values?')) {
        return;
    }

    try {
        await chrome.storage.local.set({
            blacklist: [],
            whitelist: [],
            whitelistEnabled: false,
            skipSensitive: true,
            trackYouTube: true,
            trackMedia: true,
            minDuration: false,
            retentionDays: 30,
            syncInterval: 5,
            apiUrl: 'http://localhost:8000',
        });

        await loadSettings();
        showStatus('Settings reset to defaults', 'success');
    } catch (error) {
        showStatus('Failed to reset settings', 'error');
    }
}

function showStatus(message, type = 'success') {
    const status = document.getElementById('statusMessage');
    status.textContent = message;
    status.className = `status-message ${type}`;
    status.classList.remove('hidden');

    setTimeout(() => {
        status.classList.add('hidden');
    }, 3000);
}

// Make remove functions global for onclick handlers
window.removeFromBlacklist = removeFromBlacklist;
window.removeFromWhitelist = removeFromWhitelist;
