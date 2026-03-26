// MiniMe Extension Settings v1.2
document.addEventListener('DOMContentLoaded', init);

async function init() {
    // Sidebar panel switching
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
    });

    // Privacy
    document.getElementById('addBlacklist').addEventListener('click', addToBlacklist);
    document.getElementById('addWhitelist').addEventListener('click', addToWhitelist);
    document.getElementById('whitelistEnabled').addEventListener('change', saveSettings);
    document.getElementById('skipSensitive').addEventListener('change', saveSettings);
    document.getElementById('skipLocalhost').addEventListener('change', saveSettings);

    // Tracking
    document.getElementById('trackWebVisits').addEventListener('change', saveSettings);
    document.getElementById('trackYouTube').addEventListener('change', saveSettings);
    document.getElementById('trackMedia').addEventListener('change', saveSettings);
    document.getElementById('trackPageContent').addEventListener('change', saveSettings);
    document.getElementById('trackCodeBlocks').addEventListener('change', saveSettings);
    document.getElementById('minDurationSeconds').addEventListener('change', saveSettings);
    document.getElementById('retentionDays').addEventListener('change', saveSettings);
    document.getElementById('clearOldData').addEventListener('click', clearOldData);

    // Sync
    document.getElementById('syncInterval').addEventListener('change', saveSettings);
    document.getElementById('saveApiUrl').addEventListener('click', saveApiUrl);
    document.getElementById('exportData').addEventListener('click', exportData);
    document.getElementById('clearAllData').addEventListener('click', clearAllData);
    document.getElementById('syncNowBtn').addEventListener('click', syncNow);

    // AI & RAG
    document.getElementById('aiExtractEntities').addEventListener('change', saveSettings);
    document.getElementById('aiEmbedContent').addEventListener('change', saveSettings);
    document.getElementById('aiSummarise').addEventListener('change', saveSettings);
    document.getElementById('aiKnowledgeGraph').addEventListener('change', saveSettings);
    document.getElementById('contextDepth').addEventListener('change', saveSettings);
    document.getElementById('aiSkipPersonal').addEventListener('change', saveSettings);
    document.getElementById('aiLocalOnly').addEventListener('change', saveSettings);

    // Reset
    document.getElementById('resetDefaults').addEventListener('click', resetDefaults);

    // Load
    await loadSettings();
    updateAboutTab();
}

function switchPanel(panelName) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.panel === panelName);
    });
    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${panelName}`);
    });
}

async function loadSettings() {
    try {
        const settings = await chrome.storage.local.get([
            'blacklist', 'whitelist', 'whitelistEnabled',
            'skipSensitive', 'skipLocalhost',
            'trackWebVisits', 'trackYouTube', 'trackMedia',
            'trackPageContent', 'trackCodeBlocks',
            'minDurationSeconds', 'retentionDays', 'syncInterval',
            'apiUrl', 'dashboardUrl',
            'aiExtractEntities', 'aiEmbedContent', 'aiSummarise',
            'aiKnowledgeGraph', 'contextDepth', 'aiSkipPersonal', 'aiLocalOnly',
            'lastSyncTime', 'pendingCount',
        ]);

        // Lists
        renderDomainList('blacklistList', settings.blacklist || [], removeFromBlacklist);
        renderDomainList('whitelistList', settings.whitelist || [], removeFromWhitelist);

        // Privacy toggles
        document.getElementById('whitelistEnabled').checked = settings.whitelistEnabled || false;
        document.getElementById('skipSensitive').checked = settings.skipSensitive !== false;
        document.getElementById('skipLocalhost').checked = settings.skipLocalhost || false;

        // Tracking toggles
        document.getElementById('trackWebVisits').checked = settings.trackWebVisits !== false;
        document.getElementById('trackYouTube').checked = settings.trackYouTube !== false;
        document.getElementById('trackMedia').checked = settings.trackMedia !== false;
        document.getElementById('trackPageContent').checked = settings.trackPageContent !== false;
        document.getElementById('trackCodeBlocks').checked = settings.trackCodeBlocks !== false;

        // Selects
        document.getElementById('minDurationSeconds').value = settings.minDurationSeconds ?? 5;
        document.getElementById('retentionDays').value = settings.retentionDays || 30;
        document.getElementById('syncInterval').value = settings.syncInterval || 5;

        // URLs
        document.getElementById('apiUrl').value = settings.apiUrl || 'http://localhost:8000';
        document.getElementById('dashboardUrl').value = settings.dashboardUrl || 'http://localhost:3000/dashboard';

        // Sync status
        if (settings.lastSyncTime) {
            const d = new Date(settings.lastSyncTime);
            document.getElementById('lastSyncTime').textContent = d.toLocaleTimeString();
        }
        if (settings.pendingCount !== undefined) {
            document.getElementById('pendingCount').textContent = settings.pendingCount;
        }

        // AI & RAG toggles
        document.getElementById('aiExtractEntities').checked = settings.aiExtractEntities !== false;
        document.getElementById('aiEmbedContent').checked = settings.aiEmbedContent !== false;
        document.getElementById('aiSummarise').checked = settings.aiSummarise !== false;
        document.getElementById('aiKnowledgeGraph').checked = settings.aiKnowledgeGraph !== false;
        document.getElementById('aiSkipPersonal').checked = settings.aiSkipPersonal !== false;
        document.getElementById('aiLocalOnly').checked = settings.aiLocalOnly || false;
        document.getElementById('contextDepth').value = settings.contextDepth || 'standard';

        // Test API connectivity
        testApiConnection(settings.apiUrl || 'http://localhost:8000');

    } catch (error) {
        console.error('Failed to load settings:', error);
        showStatus('Failed to load settings', 'error');
    }
}

async function testApiConnection(apiUrl) {
    const el = document.getElementById('apiStatus');
    if (!el) return;
    try {
        const resp = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(3000) });
        el.textContent = resp.ok ? '✅ Connected' : '⚠️ Error ' + resp.status;
        el.style.color = resp.ok ? '#059669' : '#d97706';
    } catch {
        el.textContent = '❌ Unreachable';
        el.style.color = '#dc2626';
    }
}

function updateAboutTab() {
    // Try to read version from manifest
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
        const m = chrome.runtime.getManifest();
        const vEl = document.getElementById('extVersion');
        if (vEl) vEl.textContent = `v${m.version} · Chrome MV${m.manifest_version}`;
    }

    // Mirror URLs in About tab
    chrome.storage.local.get(['apiUrl', 'dashboardUrl'], s => {
        const api = s.apiUrl || 'http://localhost:8000';
        const dash = s.dashboardUrl || 'http://localhost:3000/dashboard';
        const apiEl = document.getElementById('aboutApiUrl');
        const dashEl = document.getElementById('aboutDashUrl');
        const linkEl = document.getElementById('dashboardLink');
        if (apiEl) apiEl.textContent = api;
        if (dashEl) dashEl.textContent = dash;
        if (linkEl) linkEl.href = dash;
    });
}

function renderDomainList(elementId, domains, removeFunc) {
    const list = document.getElementById(elementId);
    list.innerHTML = '';
    if (domains.length === 0) return; // CSS :empty handles the empty state message

    domains.forEach(domain => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${domain}</span><button onclick="(${removeFunc.toString()})('${domain}')">Remove</button>`;
        list.appendChild(li);
    });
}

async function addToBlacklist() {
    const input = document.getElementById('blacklistInput');
    const domain = input.value.trim().toLowerCase().replace(/^https?:\/\//, '');
    if (!domain) return;
    try {
        const { blacklist = [] } = await chrome.storage.local.get('blacklist');
        if (blacklist.includes(domain)) { showStatus('Already in blacklist', 'error'); return; }
        blacklist.push(domain);
        await chrome.storage.local.set({ blacklist });
        input.value = '';
        await loadSettings();
        showStatus(`${domain} added to blacklist`, 'success');
    } catch { showStatus('Failed to add domain', 'error'); }
}

async function removeFromBlacklist(domain) {
    try {
        const { blacklist = [] } = await chrome.storage.local.get('blacklist');
        await chrome.storage.local.set({ blacklist: blacklist.filter(d => d !== domain) });
        await loadSettings();
        showStatus('Domain removed', 'success');
    } catch { showStatus('Failed to remove domain', 'error'); }
}

async function addToWhitelist() {
    const input = document.getElementById('whitelistInput');
    const domain = input.value.trim().toLowerCase().replace(/^https?:\/\//, '');
    if (!domain) return;
    try {
        const { whitelist = [] } = await chrome.storage.local.get('whitelist');
        if (whitelist.includes(domain)) { showStatus('Already in whitelist', 'error'); return; }
        whitelist.push(domain);
        await chrome.storage.local.set({ whitelist });
        input.value = '';
        await loadSettings();
        showStatus(`${domain} added to whitelist`, 'success');
    } catch { showStatus('Failed to add domain', 'error'); }
}

async function removeFromWhitelist(domain) {
    try {
        const { whitelist = [] } = await chrome.storage.local.get('whitelist');
        await chrome.storage.local.set({ whitelist: whitelist.filter(d => d !== domain) });
        await loadSettings();
        showStatus('Domain removed', 'success');
    } catch { showStatus('Failed to remove domain', 'error'); }
}

async function saveSettings() {
    try {
        await chrome.storage.local.set({
            whitelistEnabled: document.getElementById('whitelistEnabled').checked,
            skipSensitive: document.getElementById('skipSensitive').checked,
            skipLocalhost: document.getElementById('skipLocalhost').checked,
            trackWebVisits: document.getElementById('trackWebVisits').checked,
            trackYouTube: document.getElementById('trackYouTube').checked,
            trackMedia: document.getElementById('trackMedia').checked,
            trackPageContent: document.getElementById('trackPageContent').checked,
            trackCodeBlocks: document.getElementById('trackCodeBlocks').checked,
            minDurationSeconds: parseInt(document.getElementById('minDurationSeconds').value),
            retentionDays: parseInt(document.getElementById('retentionDays').value),
            syncInterval: parseInt(document.getElementById('syncInterval').value),
            aiExtractEntities: document.getElementById('aiExtractEntities').checked,
            aiEmbedContent: document.getElementById('aiEmbedContent').checked,
            aiSummarise: document.getElementById('aiSummarise').checked,
            aiKnowledgeGraph: document.getElementById('aiKnowledgeGraph').checked,
            contextDepth: document.getElementById('contextDepth').value,
            aiSkipPersonal: document.getElementById('aiSkipPersonal').checked,
            aiLocalOnly: document.getElementById('aiLocalOnly').checked,
        });
        showStatus('Saved ✓', 'success');
    } catch { showStatus('Failed to save', 'error'); }
}

async function saveApiUrl() {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    const dashboardUrl = document.getElementById('dashboardUrl').value.trim();
    if (!apiUrl) { showStatus('API URL cannot be empty', 'error'); return; }
    try {
        await chrome.storage.local.set({ apiUrl, ...(dashboardUrl && { dashboardUrl }) });
        showStatus('URLs saved ✓', 'success');
        testApiConnection(apiUrl);
        updateAboutTab();
    } catch { showStatus('Failed to save URLs', 'error'); }
}

async function syncNow() {
    const btn = document.getElementById('syncNowBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Syncing…';
    try {
        const resp = await chrome.runtime.sendMessage({ action: 'syncNow' });
        if (resp && resp.success) {
            showStatus(`Synced ${resp.count || 0} events ✓`, 'success');
            document.getElementById('lastSyncTime').textContent = new Date().toLocaleTimeString();
            document.getElementById('pendingCount').textContent = '0';
        } else {
            showStatus('Sync failed — check API URL', 'error');
        }
    } catch { showStatus('Sync failed', 'error'); }
    btn.disabled = false;
    btn.textContent = '⚡ Sync Now';
}

async function clearOldData() {
    if (!confirm('Delete all activities older than the retention period?')) return;
    try {
        const { retentionDays = 30 } = await chrome.storage.local.get('retentionDays');
        const resp = await chrome.runtime.sendMessage({ action: 'clearOldData', days: retentionDays });
        if (resp?.success) showStatus(`Deleted ${resp.count} old activities`, 'success');
        else showStatus('Failed to clear old data', 'error');
    } catch { showStatus('Failed to clear old data', 'error'); }
}

async function exportData() {
    try {
        const resp = await chrome.runtime.sendMessage({ action: 'exportData' });
        if (resp?.success) {
            const blob = new Blob([JSON.stringify(resp.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `minime-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showStatus('Data exported ✓', 'success');
        } else showStatus('Failed to export data', 'error');
    } catch { showStatus('Failed to export data', 'error'); }
}

async function clearAllData() {
    if (!confirm('⚠️ This will delete ALL local data including unsynced activities. Cannot be undone!')) return;
    try {
        const resp = await chrome.runtime.sendMessage({ action: 'clearAllData' });
        if (resp?.success) { await loadSettings(); showStatus('All data cleared', 'success'); }
        else showStatus('Failed to clear data', 'error');
    } catch { showStatus('Failed to clear data', 'error'); }
}

async function resetDefaults() {
    if (!confirm('Reset all settings to default values?')) return;
    try {
        await chrome.storage.local.set({
            blacklist: [], whitelist: [], whitelistEnabled: false,
            skipSensitive: true, skipLocalhost: false,
            trackWebVisits: true, trackYouTube: true, trackMedia: true,
            trackPageContent: true, trackCodeBlocks: true,
            minDurationSeconds: 5, retentionDays: 30, syncInterval: 5,
            apiUrl: 'http://localhost:8000', dashboardUrl: 'http://localhost:3000/dashboard',
            aiExtractEntities: true, aiEmbedContent: true, aiSummarise: true,
            aiKnowledgeGraph: true, contextDepth: 'standard',
            aiSkipPersonal: true, aiLocalOnly: false,
        });
        await loadSettings();
        showStatus('Settings reset to defaults', 'success');
    } catch { showStatus('Failed to reset settings', 'error'); }
}

function showStatus(message, type = 'success') {
    const el = document.getElementById('statusMessage');
    el.textContent = message;
    el.className = `status-message ${type}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
}

// Make remove functions global for inline onclick handlers
window.removeFromBlacklist = removeFromBlacklist;
window.removeFromWhitelist = removeFromWhitelist;
