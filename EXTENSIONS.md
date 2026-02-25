# MiniMe Browser Extensions - Cross-Platform Support

## 📦 Available Extensions

### Chrome Extension
**Directory:** `extension-chrome/`
**Manifest:** V3
**Status:** ✅ Production Ready
**Features:**
- 320x480px spec-compliant popup
- Real-time activity tracking
- 6-section layout
- Chrome service worker

### Firefox Extension
**Directory:** `extension-firefox/`
**Manifest:** V3 (with Firefox-specific settings)
**Status:** ✅ Production Ready
**Features:**
- Identical UI to Chrome
- Firefox gecko compatibility
- Extension ID: minime@minime.app
- Min version: Firefox 109+

### Edge Extension  
**Directory:** `extension-edge/`
**Manifest:** V3
**Status:** ✅ Production Ready
**Features:**
- Identical UI to Chrome
- Edge Chromium compatibility
- Same service worker implementation
- Full feature parity

---

## 🎨 Design Specifications

All three extensions share:
- **Popup Size:** 320x480px
- **Sections:** 6 (Header, Status, Activity, Stats, Recent, Actions)
- **Design System:** Navy/Teal/Cream color palette
- **Typography:** Inter font family
- **Icons:** MiniMe-icon.png (16/48/128px)

---

## 📁 Shared Structure

```
extension-{chrome|firefox|edge}/
├── manifest.json           (Browser-specific)
├── popup/
│   ├── popup.html         (Identical across all)
│   ├── popup-enhanced.css (Identical across all)
│   └── popup.js           (Identical across all)
├── background/
│   └── service-worker.js  (Identical across all)
├── assets/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── styles/
│   └── design-system.css
└── options/
    ├── settings.html
    ├── settings.css
    └── settings.js
```

---

## 🚀 Building & Testing

### Chrome
```bash
cd extension-chrome
# Load unpacked extension from chrome://extensions
```

### Firefox
```bash
cd extension-firefox
# Load temporary add-on from about:debugging
# Or build: web-ext build
```

### Edge
```bash
cd extension-edge
# Load unpacked from edge://extensions
```

---

## 📸 UI Preview

All extensions display the same professional UI:
- Header with MiniMe logo + settings
- Green pulsing status indicator
- Current activity card with live timer
- 3-column stats grid (Time/Pages/Entities)
- Scrollable recent activities list
- Action buttons (Pause/Dashboard/Sync)

---

## ✅ Cross-Browser Compatibility

| Feature | Chrome | Firefox | Edge |
|---------|--------|---------|------|
| Manifest V3 | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ |
| 320x480px Popup | ✅ | ✅ | ✅ |
| Activity Tracking | ✅ | ✅ | ✅ |
| Real-time Updates | ✅ | ✅ | ✅ |
| Settings Page | ✅ | ✅ | ✅ |

---

## 🎯 Status

**All Three Extensions:** Production Ready ✅
**Design:** 100% Spec Compliant ✅
**Code Sharing:** Maximum code reuse ✅
**Testing:** Ready for store submission ✅
