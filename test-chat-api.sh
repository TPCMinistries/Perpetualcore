#!/bin/bash
# Quick test script to check if chat API is working

echo "🧪 Testing Chat API..."
echo ""

# Test 1: Check if endpoint is accessible
echo "1. Testing endpoint accessibility..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3004/api/chat

# Test 2: Check environment variables (without exposing values)
echo ""
echo "2. Checking API keys (names only)..."
if [ -f .env.local ]; then
  echo "✅ .env.local exists"
  grep -q "ANTHROPIC_API_KEY" .env.local && echo "✅ ANTHROPIC_API_KEY found" || echo "❌ ANTHROPIC_API_KEY missing"
  grep -q "OPENAI_API_KEY" .env.local && echo "✅ OPENAI_API_KEY found" || echo "❌ OPENAI_API_KEY missing"
  grep -q "GOOGLE_API_KEY" .env.local && echo "✅ GOOGLE_API_KEY found" || echo "❌ GOOGLE_API_KEY missing"
else
  echo "❌ .env.local not found"
fi

echo ""
echo "3. Check server logs for errors..."
echo "   Look for 'Error' or 'error' in the terminal running 'npm run dev'"



