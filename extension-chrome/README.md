# MiniMe Browser Extension

Privacy-first web activity tracking for Chrome and Firefox.

## Features

✅ **Tab & URL Tracking** - Automatically tracks active tabs and time spent  
✅ **Privacy Controls** - Blacklist/whitelist domains, skip incognito  
✅ **Encrypted Storage** - All data stored locally in IndexedDB  
✅ **Background Sync** - Auto-sync every 5 minutes to backend  
✅ **Modern UI** - Beautiful popup with real-time stats  
✅ **Keyboard Shortcuts** - Quick access to controls  

## Installation

### Chrome (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension-chrome` directory
5. Extension icon will appear in toolbar

### Firefox (Developer Mode)

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file in the `extension-firefox` directory
4. Extension will load temporarily

## Usage

1. **Login**: Click extension icon → Enter credentials
2. **Track**: Extension automatically tracks your browsing
3. **Pause**: Click "Pause" button to stop tracking temporarily
4. **Sync**: Activities automatically sync every 5 minutes
5. **Stats**: View today's stats in popup

## Privacy

- ❌ **No incognito tracking** - Private browsing is never tracked
- 🔒 **Encrypted storage** - All data encrypted locally  
- 🚫 **Blacklist support** - Block specific domains from tracking
- 🎯 **Sensitive detection** - Auto-skip password/banking pages

## Architecture

```
extension-chrome/
├── manifest.json          # Extension configuration
├── background/
│   ├── service-worker.js  # Main background script
│   └── tab-tracker.js     # Tab monitoring logic
├── lib/
│   ├── privacy.js         # Privacy filter
│   ├── storage.js         # IndexedDB manager
│   └── sync.js            # Backend sync
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.css          # Styles
│   └── popup.js           # Popup logic
└── assets/
    └── icon-*.png         # Extension icons
```

## API Integration

Extension syncs to backend at: `http://localhost:8000/api/v1/activities/batch`

Authentication via JWT stored in `chrome.storage.local`.

## Development

### Testing

1. Load extension in developer mode
2. Open popup and login
3. Browse some websites
4. Check console logs in service worker
5. Inspect IndexedDB: DevTools → Application → IndexedDB → MiniMeActivities

### Debugging

- **Service Worker logs**: `chrome://extensions` → Details → "service worker" link
- **Popup logs**: Right-click popup → "Inspect"
- **Storage**: DevTools → Application → Storage

## File Sizes

- Total: ~18 KB (uncompressed)
- JavaScript: ~14 KB
- HTML/CSS: ~4 KB

## Performance

- Memory: ~5-10 MB
- CPU: <0.1% when idle
- Storage: ~1-2 MB per week

## Permissions Explained

- `tabs` - Monitor active tabs and URL changes
- `storage` - Save settings and auth token
- `alarms` - Schedule periodic sync
- `webNavigation` - Detect page transitions
- `host_permissions` - Communicate with backend API

## Future Enhancements

- [ ] Settings page for blacklist management
- [ ] Weekly/monthly stats
- [ ] Export data to CSV
- [ ] Dark mode
- [ ] Productivity insights

## License

MIT
