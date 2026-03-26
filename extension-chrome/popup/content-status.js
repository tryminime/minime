/**
 * Content Extraction Status — Popup Script
 *
 * Displays the current tab's content extraction status in the popup.
 * Shows: ✅ extracted / ⏳ extracting / ⚠️ unavailable
 * And: word count, page type, top 3 keyphrases (if API returned them).
 */

(function () {
    'use strict';

    const STATUS_ICONS = {
        extracted: '✅',
        extracting: '⏳',
        error: '⚠️',
        unavailable: '—',
    };

    async function renderContentStatus() {
        const container = document.getElementById('content-status-section');
        if (!container) return;

        // Get current active tab
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
            container.innerHTML = buildStatusHTML({ status: 'unavailable' });
            return;
        }

        // Show loading
        container.innerHTML = `<p class="cs-loading">Checking page extraction…</p>`;

        // Query background for extraction status
        chrome.runtime.sendMessage(
            { action: 'getContentStatus', tabId: tab.id },
            (response) => {
                if (chrome.runtime.lastError || !response || !response.success) {
                    container.innerHTML = buildStatusHTML({ status: 'unavailable' });
                    return;
                }

                const status = response.status;
                if (!status) {
                    container.innerHTML = buildStatusHTML({ status: 'unavailable' });
                    return;
                }

                container.innerHTML = buildStatusHTML(status);
            }
        );
    }

    function buildStatusHTML(status) {
        const icon = STATUS_ICONS[status.status] || '—';
        const wordCount = status.word_count
            ? `${status.word_count.toLocaleString()} words`
            : '';
        const pageType = status.page_type
            ? `<span class="cs-badge">${formatPageType(status.page_type)}</span>`
            : '';
        const keyphrases = (status.keyphrases || [])
            .slice(0, 3)
            .map(kp => `<span class="cs-keyphrase">${kp}</span>`)
            .join('');

        const timeAgo = status.extracted_at
            ? getTimeAgo(new Date(status.extracted_at))
            : '';

        return `
            <div class="content-status-card">
                <div class="cs-header">
                    <span class="cs-icon">${icon}</span>
                    <span class="cs-label">Content ${status.status === 'extracted' ? 'Captured' : status.status}</span>
                    ${pageType}
                </div>
                ${wordCount || timeAgo ? `
                <div class="cs-meta">
                    ${wordCount ? `<span class="cs-meta-item">📝 ${wordCount}</span>` : ''}
                    ${timeAgo ? `<span class="cs-meta-item">🕐 ${timeAgo}</span>` : ''}
                </div>` : ''}
                ${keyphrases ? `
                <div class="cs-keyphrases">
                    <span class="cs-kp-label">Key phrases: </span>
                    ${keyphrases}
                </div>` : ''}
            </div>
        `;
    }

    function formatPageType(type) {
        const labels = {
            code_repo: '💻 Code',
            q_and_a: '❓ Q&A',
            documentation: '📚 Docs',
            article: '📰 Article',
            research: '🔬 Research',
            media: '🎥 Media',
            webpage: '🌐 Web',
        };
        return labels[type] || type;
    }

    function getTimeAgo(date) {
        const diff = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }

    // Run after popup DOM loads
    document.addEventListener('DOMContentLoaded', renderContentStatus);

})();
