cask "minime" do
  # ─── Release metadata ───────────────────────────────────────────────────────
  # Update version and sha256 for every new release.
  # Generate SHA-256 with: shasum -a 256 MiniMe_<version>_aarch64.dmg
  version "0.2.0"
  sha256 "REPLACE_WITH_SHA256_OF_RELEASE_DMG"

  # ─── Download URL ────────────────────────────────────────────────────────────
  # Supports Apple Silicon (aarch64) by default.
  # Add arch-specific blocks for Intel support.
  url "https://github.com/tryminime/minime/releases/download/v#{version}/MiniMe_#{version}_aarch64.dmg",
      verified: "github.com/tryminime/minime/"

  name "MiniMe"
  desc "Privacy-first activity intelligence and knowledge graph platform"
  homepage "https://tryminime.com"

  # ─── System requirements ─────────────────────────────────────────────────────
  depends_on macos: ">= :monterey"  # macOS 12+

  # ─── Installation ────────────────────────────────────────────────────────────
  app "MiniMe.app"

  # ─── Binaries (CLI, if any) ──────────────────────────────────────────────────
  # binary "#{appdir}/MiniMe.app/Contents/MacOS/minime-cli"

  # ─── Permissions note ────────────────────────────────────────────────────────
  caveats <<~EOS
    MiniMe requires the following System Permissions on first launch:
      • Accessibility — for app and window title tracking
      • Screen Recording — optional, for screenshot-based activity capture

    To grant these, open:
      System Settings → Privacy & Security

    MiniMe processes all data locally. No raw activity data is sent to external servers.
    Full privacy policy: https://tryminime.com/legal/privacy

    To start MiniMe:
      open /Applications/MiniMe.app
  EOS

  # ─── GitHub Actions auto-update ──────────────────────────────────────────────
  # Used by homebrew-cask-autobump to create update PRs automatically.
  livecheck do
    url :url
    strategy :github_latest
  end
end
