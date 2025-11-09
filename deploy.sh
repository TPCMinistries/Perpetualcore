#!/bin/bash

echo "🚀 Deploying many-to-many document relationships..."
echo ""
echo "Opening GitHub to create a Personal Access Token..."
echo "1. Click 'Generate new token (classic)'"
echo "2. Name it: 'Deploy from Terminal'"
echo "3. Select scopes: 'repo' (all repo permissions)"
echo "4. Click 'Generate token'"
echo "5. Copy the token and paste it when prompted below"
echo ""

# Open GitHub token creation page
open "https://github.com/settings/tokens/new?description=Deploy%20from%20Terminal&scopes=repo"

echo ""
echo "Press ENTER after you've copied your token..."
read

echo ""
echo "Paste your GitHub token:"
read -s GITHUB_TOKEN

echo ""
echo "Pushing to GitHub..."
git push https://$GITHUB_TOKEN@github.com/TPCMinistries/Perpetualcore.git main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🎉 Vercel will automatically deploy in a few moments..."
    echo ""
    echo "Check deployment status at:"
    echo "https://vercel.com/the-gdi/ai-os-platform"
else
    echo ""
    echo "❌ Push failed. Check the error above."
fi
