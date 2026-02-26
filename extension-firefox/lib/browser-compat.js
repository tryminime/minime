// Cross-browser compatibility layer
// Normalizes API differences between Chrome and Firefox

const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

// Export unified API
export const tabs = browserAPI.tabs;
export const storage = browserAPI.storage;
export const runtime = browserAPI.runtime;
export const alarms = browserAPI.alarms;
export const webNavigation = browserAPI.webNavigation;
export const contextMenus = browserAPI.contextMenus;
export const windows = browserAPI.windows;
export const action = browserAPI.action || browserAPI.browserAction; // V3 vs V2

// Helper to promisify callback-based APIs (mainly for Firefox Manifest V2)
export function promisify(fn, context) {
    return (...args) => {
        return new Promise((resolve, reject) => {
            fn.call(context, ...args, (result) => {
                if (browserAPI.runtime.lastError) {
                    reject(browserAPI.runtime.lastError);
                } else {
                    resolve(result);
                }
            });
        });
    };
}

// Detect browser
export const isFirefox = typeof browser !== 'undefined';
export const isChrome = !isFirefox;

console.log(`Browser detected: ${isFirefox ? 'Firefox' : 'Chrome'}`);
