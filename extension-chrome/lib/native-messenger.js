/**
 * Native Messaging Host Wrapper
 *
 * Connects the browser extension to the MiniMe Tauri desktop app via
 * Chrome Native Messaging API. The desktop app runs a native host binary
 * (native-host) that reads/writes JSON from stdin/stdout.
 *
 * Usage:
 *   import { NativeMessenger } from '../lib/native-messenger.js';
 *   const messenger = new NativeMessenger();
 *   await messenger.connect();
 *   const result = await messenger.sendAndWait({ type: 'search_local', query: '...' });
 */

export class NativeMessenger {
    static HOST_NAME = 'com.tryminime.minime';

    constructor() {
        this._port = null;
        this._pendingRequests = new Map();   // requestId → { resolve, reject, timer }
        this._sequence = 0;
        this._onDisconnect = null;
        this._reconnectDelay = 2000;
        this._maxReconnectAttempts = 5;
        this._reconnectAttempts = 0;
        this._connected = false;
    }

    /**
     * Connect to the native host. Idempotent.
     */
    async connect() {
        if (this._connected && this._port) return;

        try {
            this._port = chrome.runtime.connectNative(NativeMessenger.HOST_NAME);
            this._connected = true;
            this._reconnectAttempts = 0;

            this._port.onMessage.addListener((msg) => this._onMessage(msg));
            this._port.onDisconnect.addListener(() => this._onPortDisconnect());

            console.log('[MiniMe] Native host connected');
        } catch (err) {
            console.warn('[MiniMe] Native host not available:', err.message);
            this._connected = false;
        }
    }

    /**
     * Send a message and wait for a response.
     *
     * @param {object} message - Must include a `type` field
     * @param {number} timeoutMs - Max wait time (default 10s)
     * @returns {Promise<object>} - Response from native host
     */
    async sendAndWait(message, timeoutMs = 10000) {
        if (!this._connected || !this._port) {
            await this.connect();
        }
        if (!this._connected) {
            throw new Error('Native host not available');
        }

        const requestId = ++this._sequence;
        const payload = { ...message, _requestId: requestId };

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this._pendingRequests.delete(requestId);
                reject(new Error(`Native host timeout after ${timeoutMs}ms`));
            }, timeoutMs);

            this._pendingRequests.set(requestId, { resolve, reject, timer });

            try {
                this._port.postMessage(payload);
            } catch (err) {
                this._pendingRequests.delete(requestId);
                clearTimeout(timer);
                reject(err);
            }
        });
    }

    /**
     * Fire-and-forget — send without waiting for response.
     */
    async send(message) {
        if (!this._connected || !this._port) await this.connect();
        if (!this._connected) return;
        try {
            this._port.postMessage(message);
        } catch (err) {
            console.warn('[MiniMe] Native send failed:', err.message);
        }
    }

    disconnect() {
        if (this._port) {
            try { this._port.disconnect(); } catch (_) { }
            this._port = null;
        }
        this._connected = false;
        this._pendingRequests.forEach(({ reject, timer }) => {
            clearTimeout(timer);
            reject(new Error('Messenger disconnected'));
        });
        this._pendingRequests.clear();
    }

    isConnected() {
        return this._connected;
    }

    // -------------------------------------------------------------------------
    // Internal
    // -------------------------------------------------------------------------

    _onMessage(msg) {
        if (!msg || typeof msg._requestId === 'undefined') return;
        const pending = this._pendingRequests.get(msg._requestId);
        if (!pending) return;
        this._pendingRequests.delete(msg._requestId);
        clearTimeout(pending.timer);
        if (msg.error) {
            pending.reject(new Error(msg.error));
        } else {
            pending.resolve(msg);
        }
    }

    _onPortDisconnect() {
        const err = chrome.runtime.lastError;
        console.warn('[MiniMe] Native host disconnected:', err?.message || 'unknown reason');
        this._connected = false;
        this._port = null;

        // Reject all pending requests
        this._pendingRequests.forEach(({ reject, timer }) => {
            clearTimeout(timer);
            reject(new Error('Native host disconnected'));
        });
        this._pendingRequests.clear();

        // Auto-reconnect with backoff
        if (
            this._reconnectAttempts < this._maxReconnectAttempts &&
            typeof this._onDisconnect !== 'function'
        ) {
            const delay = this._reconnectDelay * Math.pow(2, this._reconnectAttempts);
            this._reconnectAttempts++;
            setTimeout(() => this.connect(), delay);
        }
    }
}

// Singleton for background service worker
export const nativeMessenger = new NativeMessenger();
