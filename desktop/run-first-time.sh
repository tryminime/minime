#!/bin/bash

# MiniMe Desktop App - First Run Script
# This script runs the desktop app for the first time

echo "🚀 Starting MiniMe Desktop App..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in desktop directory"
    echo "Please run: cd /home/ansari/Documents/MiniMe/desktop"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if Rust/Tauri is set up
if [ ! -d "src-tauri/target" ]; then
    echo "🦀 First time setup - this may take a few minutes..."
    echo "Building Rust backend..."
    echo ""
fi

echo "✨ Launching MiniMe..."
echo ""
echo "📝 On First Run:"
echo "   → App will open setup wizard automatically"
echo "   → Choose AI provider (Ollama or OpenAI)"
echo "   → Click 'Start Automatic Setup'"
echo "   → Wait for installation to complete"
echo ""
echo "🌐 App will open at: http://localhost:1420"
echo ""

# Run the app
npm run tauri dev
