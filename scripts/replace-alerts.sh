#!/bin/bash

# Script to replace all alert() calls with toast notifications

FILES=(
  "app/dashboard/whatsapp/page.tsx"
  "app/dashboard/documents/page.tsx"
  "app/dashboard/settings/import-export/page.tsx"
  "app/dashboard/chat/page.tsx"
  "app/dashboard/settings/billing/page.tsx"
)

for file in "${FILES[@]}"; do
  # Add toast import if not present
  if ! grep -q "import { toast } from \"sonner\"" "$file"; then
    # Find the last import line and add toast import after it
    sed -i '' '/^import /a\
import { toast } from "sonner";
' "$file"
  fi

  # Replace success-related alerts with toast.success
  sed -i '' 's/alert("Verification code sent! Check your WhatsApp.");/toast.success("Verification code sent! Check your WhatsApp.");/g' "$file"
  sed -i '' 's/alert("WhatsApp connected successfully!");/toast.success("WhatsApp connected successfully!");/g' "$file"
  sed -i '' 's/alert(`Import successful!/toast.success(`Import successful!/g' "$file"

  # Replace error-related alerts with toast.error
  sed -i '' 's/alert("Failed to send verification code");/toast.error("Failed to send verification code");/g' "$file"
  sed -i '' 's/alert("Invalid verification code");/toast.error("Invalid verification code");/g' "$file"
  sed -i '' 's/alert("Failed to verify code");/toast.error("Failed to verify code");/g' "$file"
  sed -i '' 's/alert("Failed to send message");/toast.error("Failed to send message");/g' "$file"
  sed -i '' 's/alert("Failed to delete document");/toast.error("Failed to delete document");/g' "$file"
  sed -i '' 's/alert("Export failed. Please try again.");/toast.error("Export failed. Please try again.");/g' "$file"
  sed -i '' 's/alert("Please select a file to import");/toast.error("Please select a file to import");/g' "$file"
  sed -i '' 's/alert(`Import completed with errors:/toast.error(`Import completed with errors:/g' "$file"
  sed -i '' 's/alert("Import failed. Please try again.");/toast.error("Import failed. Please try again.");/g' "$file"
  sed -i '' 's/alert(`Unsupported file type:/toast.error(`Unsupported file type:/g' "$file"
  sed -i '' 's/alert("Failed to create checkout session");/toast.error("Failed to create checkout session");/g' "$file"
  sed -i '' 's/alert("Failed to start upgrade process");/toast.error("Failed to start upgrade process");/g' "$file"
  sed -i '' 's/alert("Failed to open billing portal");/toast.error("Failed to open billing portal");/g' "$file"

  # Replace info-related alerts with toast.info
  sed -i '' 's/alert("View feature coming soon!");/toast.info("View feature coming soon!");/g' "$file"

  # Replace multiline alerts
  sed -i '' 's/alert(/toast.error(/g' "$file"

  echo "Processed $file"
done

echo "All files processed!"
