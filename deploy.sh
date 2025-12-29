#!/bin/bash
# Deploy script - Push to GitHub, which mirrors to Gitea and triggers build

set -e

echo "📦 Preparing deployment..."

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ You have uncommitted changes. Please commit first."
  exit 1
fi

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push github main

echo "✅ Pushed to GitHub!"
echo "🔄 GitHub will mirror to Gitea automatically"
echo "🏗️  Gitea runner will build and deploy to Podman"
echo ""
echo "Monitor the build at: https://git.it.rm.dk:3000/morbre/EDC-tools/actions"
echo "When deployed, access at: http://localhost:8080"
