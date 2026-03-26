#!/usr/bin/env node
/**
 * Build script to generate Firefox and Edge extension packages
 * from the Chrome extension (single source of truth).
 *
 * Usage:
 *   node build-extensions.js              # build both
 *   node build-extensions.js firefox      # build Firefox only
 *   node build-extensions.js edge         # build Edge only
 *
 * Output:
 *   dist/firefox/   — Manifest V2 build for Firefox
 *   dist/edge/      — Manifest V3 build for Edge
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = __dirname; // extension-chrome/
const DIST_DIR = path.resolve(SRC_DIR, '..', 'dist');

// Files/dirs to exclude from all platform builds
const EXCLUDE = new Set([
    'build-extensions.js',
    'dist',
    'node_modules',
    'tests',
    'examples',
    'QUEUE_README.md',
    'TESTING_GUIDE.md',
    '.git',
]);

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function copyDirSync(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        if (EXCLUDE.has(entry.name)) continue;
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function replaceInFile(filePath, search, replacement) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf-8');
    if (typeof search === 'string') {
        content = content.split(search).join(replacement);
    } else {
        content = content.replace(search, replacement);
    }
    fs.writeFileSync(filePath, content, 'utf-8');
}

function walkFiles(dir, callback) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkFiles(fullPath, callback);
        } else {
            callback(fullPath);
        }
    }
}

// ────────────────────────────────────────────
// Firefox Build (Manifest V2)
// ────────────────────────────────────────────

function buildFirefox() {
    const dest = path.join(DIST_DIR, 'firefox');
    if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true });

    console.log('🦊 Building Firefox extension...');
    copyDirSync(SRC_DIR, dest);

    // Read Chrome manifest and transform to MV2
    const chromeManifest = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'manifest.json'), 'utf-8'));

    const firefoxManifest = {
        manifest_version: 2,
        name: chromeManifest.name,
        version: chromeManifest.version,
        description: chromeManifest.description,

        // MV2: permissions include host patterns
        permissions: [
            ...(chromeManifest.permissions || []).filter(p => p !== 'nativeMessaging'),
            ...(chromeManifest.host_permissions || []),
        ],

        // MV2: background scripts instead of service worker
        background: {
            scripts: ['background/service-worker.js'],
            persistent: true,
        },

        // MV2: content_scripts stay the same
        content_scripts: chromeManifest.content_scripts,

        // MV2: browser_action instead of action
        browser_action: {
            default_popup: chromeManifest.action?.default_popup || 'popup/popup.html',
            default_title: chromeManifest.name,
            default_icon: chromeManifest.action?.default_icon || chromeManifest.icons,
        },

        // Options
        options_page: chromeManifest.options_ui?.page || 'options/settings.html',

        icons: chromeManifest.icons,

        browser_specific_settings: {
            gecko: {
                id: 'minime@tryminime.com',
                strict_min_version: '109.0',
            },
        },
    };

    fs.writeFileSync(
        path.join(dest, 'manifest.json'),
        JSON.stringify(firefoxManifest, null, 4) + '\n',
        'utf-8'
    );

    // Replace chrome.* API calls with browser.* for Firefox compatibility
    // (Firefox supports both, but browser.* is the standard WebExtensions API)
    walkFiles(dest, (filePath) => {
        if (!filePath.endsWith('.js')) return;
        replaceInFile(filePath, /\bchrome\.(runtime|storage|tabs|windows|alarms|contextMenus|action|browserAction|webNavigation)\b/g, 'browser.$1');
    });

    console.log(`   ✅ Firefox build → ${dest}`);
}

// ────────────────────────────────────────────
// Edge Build (Manifest V3, mostly same as Chrome)
// ────────────────────────────────────────────

function buildEdge() {
    const dest = path.join(DIST_DIR, 'edge');
    if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true });

    console.log('🌐 Building Edge extension...');
    copyDirSync(SRC_DIR, dest);

    // Read Chrome manifest and adjust for Edge
    const chromeManifest = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'manifest.json'), 'utf-8'));

    const edgeManifest = { ...chromeManifest };

    // Edge doesn't need nativeMessaging (desktop app integration is Chrome-only for now)
    edgeManifest.permissions = (edgeManifest.permissions || []).filter(p => p !== 'nativeMessaging');

    // Remove gecko-specific settings
    delete edgeManifest.browser_specific_settings;

    // Edge doesn't need <all_urls> host permission (no content injection on all pages)
    if (edgeManifest.host_permissions) {
        edgeManifest.host_permissions = edgeManifest.host_permissions.filter(p => p !== '<all_urls>');
    }

    fs.writeFileSync(
        path.join(dest, 'manifest.json'),
        JSON.stringify(edgeManifest, null, 4) + '\n',
        'utf-8'
    );

    console.log(`   ✅ Edge build → ${dest}`);
}

// ────────────────────────────────────────────
// Main
// ────────────────────────────────────────────

const target = process.argv[2]; // optional: 'firefox' or 'edge'

if (!target || target === 'firefox') buildFirefox();
if (!target || target === 'edge') buildEdge();

console.log('\n🎉 Extension builds complete!');
