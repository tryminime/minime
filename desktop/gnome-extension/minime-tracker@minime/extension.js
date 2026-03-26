/**
 * MiniMe Activity Tracker — GNOME Shell Extension
 *
 * Exposes the currently focused window via a custom D-Bus interface
 * so the MiniMe Python tracker daemon can read it.
 *
 * D-Bus interface:  org.minime.Tracker
 * Object path:      /org/minime/Tracker
 * Method:           GetFocusedWindow() → JSON string
 */

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

// ── D-Bus interface XML ─────────────────────────────────────────────────────
const DBUS_IFACE = `
<node>
  <interface name="org.minime.Tracker">
    <method name="GetFocusedWindow">
      <arg type="s" direction="out" name="window_json"/>
    </method>
    <method name="GetAllWindows">
      <arg type="s" direction="out" name="windows_json"/>
    </method>
    <method name="Ping">
      <arg type="s" direction="out" name="status"/>
    </method>
  </interface>
</node>`;

export default class MiniMeTrackerExtension extends Extension {
    _dbusId = null;
    _focusSignalId = null;

    enable() {
        this._cachedWindow = null;
        this._impl = null;

        // Register D-Bus service
        this._impl = Gio.DBusExportedObject.wrapJSObject(DBUS_IFACE, this);
        this._impl.export(Gio.DBus.session, '/org/minime/Tracker');

        // Own bus name so clients can discover us
        this._dbusId = Gio.bus_own_name(
            Gio.BusType.SESSION,
            'org.minime.Tracker',
            Gio.BusNameOwnerFlags.NONE,
            null, null, null,
        );

        // Listen for focus changes
        this._focusSignalId = global.display.connect(
            'notify::focus-window',
            this._onFocusChanged.bind(this),
        );

        // Cache current window immediately
        this._onFocusChanged();

        console.log('[MiniMe] Tracker extension enabled — D-Bus org.minime.Tracker ready');
    }

    disable() {
        if (this._focusSignalId) {
            global.display.disconnect(this._focusSignalId);
            this._focusSignalId = null;
        }

        if (this._impl) {
            this._impl.unexport();
            this._impl = null;
        }

        if (this._dbusId) {
            Gio.bus_unown_name(this._dbusId);
            this._dbusId = null;
        }

        this._cachedWindow = null;
        console.log('[MiniMe] Tracker extension disabled');
    }

    // ── Focus change handler ─────────────────────────────────────────────────
    _onFocusChanged() {
        const win = global.display.focus_window;
        if (!win) {
            this._cachedWindow = null;
            return;
        }

        this._cachedWindow = {
            app: win.get_wm_class() || '',
            title: win.get_title() || '',
            pid: win.get_pid() || 0,
        };
    }

    // ── D-Bus method implementations ─────────────────────────────────────────

    /** Return the currently focused window as JSON */
    GetFocusedWindow() {
        // Refresh in case signal was missed
        const win = global.display.focus_window;
        if (win) {
            return JSON.stringify({
                app: win.get_wm_class() || '',
                title: win.get_title() || '',
                pid: win.get_pid() || 0,
            });
        }
        if (this._cachedWindow) {
            return JSON.stringify(this._cachedWindow);
        }
        return JSON.stringify({ app: '', title: '', pid: 0 });
    }

    /** Return all open windows as JSON array */
    GetAllWindows() {
        const actors = global.get_window_actors();
        const windows = [];
        for (const actor of actors) {
            const win = actor.get_meta_window();
            if (!win) continue;
            if (win.get_window_type() !== Meta.WindowType.NORMAL) continue;
            windows.push({
                app: win.get_wm_class() || '',
                title: win.get_title() || '',
                pid: win.get_pid() || 0,
                focus: win.has_focus(),
            });
        }
        return JSON.stringify(windows);
    }

    /** Simple health check */
    Ping() {
        return 'ok';
    }
}
