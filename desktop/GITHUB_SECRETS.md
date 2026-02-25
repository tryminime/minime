# GitHub Secrets Setup for MiniMe Desktop Builds

## Required Secrets

Set these in **GitHub → Settings → Secrets and variables → Actions → New repository secret**.

### Auto-Update Signing (Required for updates)

| Secret | Description | How to Get |
|---|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | Contents of `desktop/src-tauri/.keys/minime.key` | `cat desktop/src-tauri/.keys/minime.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password for the key (empty if generated with `--ci`) | Leave empty if you used `--ci` flag |

### macOS Code Signing (Optional — needed for Gatekeeper)

| Secret | Description | How to Get |
|---|---|---|
| `APPLE_CERTIFICATE` | Base64 `.p12` certificate | Export from Keychain Access → Certificates |
| `APPLE_CERTIFICATE_PASSWORD` | Password for the `.p12` file | Set when exporting |
| `APPLE_SIGNING_IDENTITY` | e.g. `Developer ID Application: Your Name (TEAMID)` | `security find-identity -v -p codesigning` |
| `APPLE_ID` | Your Apple ID email | Your Apple Developer account email |
| `APPLE_PASSWORD` | App-specific password | [appleid.apple.com](https://appleid.apple.com) → Security → App-Specific Passwords |
| `APPLE_TEAM_ID` | 10-char Apple Team ID | [developer.apple.com/account](https://developer.apple.com/account) → Membership |

### Windows Code Signing (Optional — needed for SmartScreen)

| Secret | Description | How to Get |
|---|---|---|
| `WINDOWS_CERTIFICATE` | Base64 `.pfx` certificate | Purchase from DigiCert, Sectigo, or SSL.com (~$200-400/yr) |
| `WINDOWS_CERTIFICATE_PASSWORD` | Password for the `.pfx` file | Set when generating the certificate |

## Quick Start (Unsigned Builds)

To ship unsigned builds immediately (for testing), you only need the **auto-update signing** secrets:

```bash
# Copy the private key content
cat desktop/src-tauri/.keys/minime.key

# Paste it as TAURI_SIGNING_PRIVATE_KEY in GitHub Secrets
# Leave TAURI_SIGNING_PRIVATE_KEY_PASSWORD empty
```

Then tag and push:
```bash
git tag v0.2.0
git push origin v0.2.0
```

The release workflow will build `.dmg`, `.msi`, `.exe`, `.deb`, and `.AppImage` installers.
