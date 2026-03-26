'use client';

import { useQuery } from '@tanstack/react-query';
import { getAPIClient } from '../api';
import { ActivityItem } from './useActivities';

export interface ReadingDocument {
    name: string;
    app_or_domain: string;
    source: 'browser' | 'desktop';
    format: string;
    time_seconds: number;
    visit_count: number;
    latest_at: string;
    scroll_depth_pct?: number;
    estimated_read_pct?: number;
    word_count?: number;
    key_insights: string[];
    /** Raw extracted data from the activity context for inspection */
    extracted_data: Record<string, any>;
}

export interface FormatGroup {
    format: string;
    documents: ReadingDocument[];
    total_time_seconds: number;
    doc_count: number;
}

export interface ReadingStats {
    total_reading_minutes: number;
    total_documents: number;
    avg_session_minutes: number;
    browser_minutes: number;
    desktop_minutes: number;
    documents: ReadingDocument[];
    format_groups: FormatGroup[];
    daily_minutes: { date: string; minutes: number }[];
    top_format: string;
}

/** File extension patterns found in window titles */
const FORMAT_LABELS: Record<string, string> = {
    '.pdf': 'PDF', '.doc': 'Word', '.docx': 'Word', '.odt': 'ODT',
    '.txt': 'Text', '.md': 'Markdown', '.epub': 'eBook', '.mobi': 'eBook',
    '.rtf': 'RTF', '.tex': 'LaTeX', '.csv': 'CSV',
    '.xlsx': 'Excel', '.xls': 'Excel', '.pptx': 'PowerPoint', '.ppt': 'PowerPoint',
};

/** Domains that are NOT reading/learning — exclude from Reading tab */
const EXCLUDED_DOMAINS = [
    // Social media
    'facebook.com', 'www.facebook.com', 'web.facebook.com',
    'instagram.com', 'www.instagram.com',
    'twitter.com', 'x.com',
    'tiktok.com', 'www.tiktok.com',
    'snapchat.com',
    'reddit.com', 'www.reddit.com', // front page scrolling isn't reading
    'linkedin.com', 'www.linkedin.com', // feed, not articles
    'pinterest.com',
    // Messaging / chat
    'web.whatsapp.com', 'whatsapp.com',
    'web.telegram.org', 'telegram.org',
    'discord.com', 'discordapp.com',
    'slack.com', 'app.slack.com',
    'teams.microsoft.com',
    'messenger.com', 'www.messenger.com',
    // Entertainment / media
    'youtube.com', 'www.youtube.com',
    'netflix.com', 'www.netflix.com',
    'twitch.tv', 'www.twitch.tv',
    'spotify.com', 'open.spotify.com',
    'music.youtube.com',
    'disneyplus.com', 'hulu.com', 'primevideo.com',
    // Shopping
    'amazon.com', 'www.amazon.com', 'amazon.in',
    'ebay.com', 'www.ebay.com',
    'etsy.com', 'flipkart.com',
    // Email
    'mail.google.com', 'outlook.live.com', 'outlook.office.com',
    // Search (landing page, not reading)
    'google.com', 'www.google.com',
    'bing.com', 'www.bing.com',
    // Other non-learning
    'calendar.google.com', 'drive.google.com',
    'accounts.google.com', 'myaccount.google.com',
];

function isExcludedDomain(domain: string | null | undefined): boolean {
    if (!domain) return false;
    const d = domain.toLowerCase();
    return EXCLUDED_DOMAINS.some(ex => d === ex || d.endsWith('.' + ex));
}

function detectFormat(title: string, app?: string | null): string {
    const lower = (title || '').toLowerCase();
    const appLower = (app || '').toLowerCase();

    for (const [ext, label] of Object.entries(FORMAT_LABELS)) {
        if (lower.includes(ext)) return label;
    }

    // Detect from app name (desktop)
    if (appLower.includes('evince') || appLower.includes('okular') || appLower.includes('zathura') ||
        appLower.includes('mupdf') || appLower.includes('qpdfview') || appLower.includes('foxit')) {
        return 'PDF';
    }
    if (appLower.includes('libreoffice') || appLower.includes('soffice') || appLower.includes('abiword')) {
        return 'Document';
    }
    if (appLower.includes('calibre') || appLower.includes('foliate') || appLower.includes('fbreader')) {
        return 'eBook';
    }
    if (appLower.includes('gedit') || appLower.includes('kate') || appLower.includes('vim') ||
        appLower.includes('nvim') || appLower.includes('nano') || appLower.includes('code')) {
        return 'Text';
    }

    if (lower.includes('google docs') || lower.includes('google sheets')) return 'Google';
    return 'Web Article';
}

function extractDocName(activity: ActivityItem): string {
    const title = activity.title || activity.context?.title || activity.domain || activity.context?.domain || 'Untitled';
    return title
        .replace(/\s*[-–—]\s*(Evince|Okular|Zathura|LibreOffice|Document Viewer|Foxit|Adobe|Calibre).*$/i, '')
        .replace(/^(Evince|Okular|Zathura|LibreOffice|Document Viewer|Foxit|Adobe|Calibre)\s*[-–—]\s*/i, '')
        .trim() || title;
}

/**
 * Extract key insights / bullet points from a document's context.
 */
function extractKeyInsights(activities: ActivityItem[]): string[] {
    const insights = new Set<string>();

    for (const a of activities) {
        const ctx = a.context || (a.data as any) || {};

        // Headings from content extraction
        if (ctx.headings && Array.isArray(ctx.headings)) {
            for (const h of ctx.headings.slice(0, 5)) {
                const text = typeof h === 'string' ? h : h?.text;
                if (text && text.length > 5 && text.length < 200) {
                    insights.add(text.trim());
                }
            }
        }

        // Meta description
        if (ctx.meta?.description && ctx.meta.description.length > 10) {
            insights.add(ctx.meta.description.trim().substring(0, 200));
        }

        // Selected / highlighted text
        if (ctx.selected_text && ctx.selected_text.length > 10) {
            insights.add(`"${ctx.selected_text.trim().substring(0, 200)}"`);
        }

        // Content summary
        if (ctx.content_summary && ctx.content_summary.length > 10) {
            insights.add(ctx.content_summary.trim().substring(0, 200));
        }

        // Reading context insights
        const reading = ctx.reading || {};
        if (reading.summary) {
            insights.add(reading.summary.trim().substring(0, 200));
        }
        if (reading.key_points && Array.isArray(reading.key_points)) {
            for (const p of reading.key_points) {
                if (typeof p === 'string' && p.length > 5) {
                    insights.add(p.trim().substring(0, 200));
                }
            }
        }
    }

    return Array.from(insights).slice(0, 5);
}

/**
 * Merge extracted data from all activities for a document into a summary.
 */
function mergeExtractedData(activities: ActivityItem[]): Record<string, any> {
    const merged: Record<string, any> = {};

    for (const a of activities) {
        const ctx = a.context || {};
        const data = (a.data as any) || {};

        // Reading metrics
        if (ctx.reading) {
            merged.reading = { ...merged.reading, ...ctx.reading };
        }

        // URL
        if (ctx.url && !merged.url) merged.url = ctx.url;

        // Domain
        if (ctx.domain && !merged.domain) merged.domain = ctx.domain;

        // Headings
        if (ctx.headings && Array.isArray(ctx.headings) && ctx.headings.length > 0) {
            merged.headings = ctx.headings.slice(0, 10);
        }

        // Meta
        if (ctx.meta) merged.meta = ctx.meta;

        // Word count
        if (ctx.reading?.word_count) merged.word_count = ctx.reading.word_count;

        // Selected text
        if (ctx.selected_text) merged.selected_text = ctx.selected_text;

        // App info
        if (a.app) merged.app = a.app;

        // Source
        merged.source = a.source;

        // Desktop-specific
        if (data.file_path) merged.file_path = data.file_path;
        if (data.file_name) merged.file_name = data.file_name;

        // Input metrics
        if (data.input_metrics) merged.input_metrics = data.input_metrics;

        // Importance
        if (ctx.importance_score != null) merged.importance_score = ctx.importance_score;
        if (ctx.page_type) merged.page_type = ctx.page_type;
    }

    return merged;
}

export function useReadingAnalytics() {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['activities', 'reading-analytics'],
        queryFn: async () => {
            try {
                const [readingRes, webVisitRes, appFocusRes, pageViewRes] = await Promise.all([
                    api.get<{ activities: ActivityItem[] }>('/api/v1/activities/?type=reading_analytics&limit=500').catch(() => ({ activities: [] })),
                    api.get<{ activities: ActivityItem[] }>('/api/v1/activities/?type=web_visit&limit=500').catch(() => ({ activities: [] })),
                    api.get<{ activities: ActivityItem[] }>('/api/v1/activities/?type=app_focus&limit=500').catch(() => ({ activities: [] })),
                    api.get<{ activities: ActivityItem[] }>('/api/v1/activities/?type=page_view&limit=500').catch(() => ({ activities: [] })),
                ]);

                const readingActivities = readingRes.activities || [];

                // Filter web_visit: substantial duration AND not an excluded domain
                const webReadingActivities = (webVisitRes.activities || []).filter(a =>
                    (a.duration_seconds || 0) > 60 &&
                    !isExcludedDomain(a.domain) &&
                    !isExcludedDomain(a.context?.domain)
                );

                // Filter page_view (browser extension): same rules as web_visit
                const pageViewReadingActivities = (pageViewRes.activities || []).filter(a =>
                    (a.duration_seconds || 0) > 60 &&
                    !isExcludedDomain(a.domain) &&
                    !isExcludedDomain(a.context?.domain)
                );

                // Filter app_focus to only include document/reading file types
                const READING_FILE_TYPES = new Set([
                    'document', 'note', 'text', 'spreadsheet', 'presentation',
                ]);
                const READING_EXTENSIONS = [
                    '.pdf', '.doc', '.docx', '.odt', '.rtf', '.txt', '.md',
                    '.epub', '.mobi', '.tex', '.csv', '.xlsx', '.xls',
                    '.pptx', '.ppt',
                ];
                const appFocusReadingActivities = (appFocusRes.activities || []).filter(a => {
                    // Check file type from data.files or data.file_type
                    if (a.data?.file_type && READING_FILE_TYPES.has(a.data.file_type)) return true;
                    if (a.data?.files?.some((f: { type?: string }) => f.type && READING_FILE_TYPES.has(f.type))) return true;
                    // Check file extension in title or file_name
                    const title = (a.title || '').toLowerCase();
                    const fileName = (a.data?.file_name || '').toLowerCase();
                    if (READING_EXTENSIONS.some(ext => title.includes(ext) || fileName.includes(ext))) return true;
                    // Check app name for known reader apps
                    const app = (a.app || '').toLowerCase();
                    if (['evince', 'okular', 'zathura', 'mupdf', 'foxit', 'calibre', 'foliate',
                         'libreoffice', 'soffice', 'abiword'].some(r => app.includes(r))) return true;
                    return false;
                });

                // Also exclude non-learning domains from reading_analytics (browser source)
                const filteredReading = readingActivities.filter(a => {
                    if (a.source === 'desktop' || a.source === 'desktop_tracker') return true; // always include desktop
                    return !isExcludedDomain(a.domain) && !isExcludedDomain(a.context?.domain);
                });

                const allActivities = [
                    ...filteredReading,
                    ...webReadingActivities,
                    ...pageViewReadingActivities,
                    ...appFocusReadingActivities,
                ];

                // Group by document/page — track per-doc activity list for insights
                const docMap: Record<string, ReadingDocument> = {};
                const docActivities: Record<string, ActivityItem[]> = {};

                allActivities.forEach(a => {
                    const isDesktop = a.source === 'desktop' || a.source === 'desktop_tracker' || (!a.domain && !a.context?.domain && a.app);
                    const source: 'browser' | 'desktop' = isDesktop ? 'desktop' : 'browser';
                    const docName = extractDocName(a);
                    const key = `${source}:${docName}`;
                    const titleForFormat = a.title || a.context?.title || '';
                    const format = detectFormat(titleForFormat, a.app);

                    if (!docMap[key]) {
                        docMap[key] = {
                            name: docName,
                            app_or_domain: isDesktop ? (a.app || 'Unknown App') : (a.domain || a.context?.domain || 'Unknown'),
                            source,
                            format,
                            time_seconds: 0,
                            visit_count: 0,
                            latest_at: a.created_at,
                            key_insights: [],
                            extracted_data: {},
                        };
                        docActivities[key] = [];
                    }
                    docMap[key].time_seconds += (a.duration_seconds || 0);
                    docMap[key].visit_count += 1;
                    docActivities[key].push(a);

                    // Track latest activity
                    if (a.created_at > docMap[key].latest_at) {
                        docMap[key].latest_at = a.created_at;
                    }

                    // Merge reading context
                    const reading = a.context?.reading
                        || (a.data as any)?.reading
                        || (a.data as any)?.context?.reading;
                    if (reading) {
                        docMap[key].scroll_depth_pct = Math.max(
                            docMap[key].scroll_depth_pct || 0,
                            reading.scroll_depth_pct || 0
                        );
                        docMap[key].estimated_read_pct = Math.max(
                            docMap[key].estimated_read_pct || 0,
                            reading.estimated_read_pct || 0
                        );
                        docMap[key].word_count = reading.word_count || docMap[key].word_count;
                    }
                });

                // Extract key insights and merged data for each document
                for (const [key, doc] of Object.entries(docMap)) {
                    doc.key_insights = extractKeyInsights(docActivities[key]);
                    doc.extracted_data = mergeExtractedData(docActivities[key]);
                }

                // Sort by latest activity time (most recent first)
                const documents = Object.values(docMap)
                    .sort((a, b) => b.latest_at.localeCompare(a.latest_at));

                // Group by format
                const fmtMap: Record<string, FormatGroup> = {};
                documents.forEach(doc => {
                    if (!fmtMap[doc.format]) {
                        fmtMap[doc.format] = {
                            format: doc.format,
                            documents: [],
                            total_time_seconds: 0,
                            doc_count: 0,
                        };
                    }
                    fmtMap[doc.format].documents.push(doc);
                    fmtMap[doc.format].total_time_seconds += doc.time_seconds;
                    fmtMap[doc.format].doc_count += 1;
                });
                // Sort format groups: documents before web articles, then by time
                const FORMAT_PRIORITY: Record<string, number> = {
                    'PDF': 1, 'Word': 2, 'Document': 3, 'Markdown': 4, 'Text': 5,
                    'eBook': 6, 'Excel': 7, 'PowerPoint': 8, 'LaTeX': 9,
                    'Google': 10, 'ODT': 11, 'RTF': 12, 'CSV': 13,
                    'Web Article': 20,  // web articles last
                };
                const format_groups = Object.values(fmtMap)
                    .sort((a, b) => {
                        const pa = FORMAT_PRIORITY[a.format] || 15;
                        const pb = FORMAT_PRIORITY[b.format] || 15;
                        if (pa !== pb) return pa - pb;
                        return b.total_time_seconds - a.total_time_seconds;
                    });

                // Daily breakdown
                const dailyMap: Record<string, number> = {};
                allActivities.forEach(a => {
                    const date = a.created_at.split('T')[0];
                    dailyMap[date] = (dailyMap[date] || 0) + (a.duration_seconds || 0) / 60;
                });
                const daily_minutes = Object.entries(dailyMap)
                    .map(([date, minutes]) => ({ date, minutes: Math.round(minutes) }))
                    .sort((a, b) => a.date.localeCompare(b.date));

                const totalSeconds = allActivities.reduce((sum, a) => sum + (a.duration_seconds || 0), 0);
                const isDesktopActivity = (a: ActivityItem) =>
                    a.source === 'desktop' || a.source === 'desktop_tracker' ||
                    a.type === 'app_focus' || a.type === 'window_focus' ||
                    (!a.domain && !a.context?.domain && !!a.app);
                const desktopSeconds = allActivities
                    .filter(isDesktopActivity)
                    .reduce((sum, a) => sum + (a.duration_seconds || 0), 0);
                const browserSeconds = totalSeconds - desktopSeconds;

                // Top format
                const formatCounts: Record<string, number> = {};
                allActivities.forEach(a => {
                    const fmt = detectFormat(a.title || a.context?.title || '', a.app);
                    formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;
                });
                const topFormat = Object.entries(formatCounts)
                    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

                const result: ReadingStats = {
                    total_reading_minutes: Math.round(totalSeconds / 60),
                    total_documents: documents.length,
                    avg_session_minutes: allActivities.length > 0
                        ? Math.round(totalSeconds / allActivities.length / 60)
                        : 0,
                    browser_minutes: Math.round(browserSeconds / 60),
                    desktop_minutes: Math.round(desktopSeconds / 60),
                    documents,
                    format_groups,
                    daily_minutes,
                    top_format: topFormat,
                };

                return result;
            } catch (err) {
                console.error('[MiniMe] Reading analytics processing error:', err);
                return {
                    total_reading_minutes: 0,
                    total_documents: 0,
                    avg_session_minutes: 0,
                    browser_minutes: 0,
                    desktop_minutes: 0,
                    documents: [],
                    format_groups: [],
                    daily_minutes: [],
                    top_format: 'N/A',
                } as ReadingStats;
            }
        },
        staleTime: 60 * 1000,
        refetchInterval: 60 * 1000,
        retry: 2,
    });
}
