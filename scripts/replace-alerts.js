const fs = require('fs');
const path = require('path');

const files = [
  'app/dashboard/whatsapp/page.tsx',
  'app/dashboard/documents/page.tsx',
  'app/dashboard/settings/import-export/page.tsx',
  'app/dashboard/chat/page.tsx',
  'app/dashboard/settings/billing/page.tsx',
];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add toast import if not present
  if (!content.includes('import { toast } from "sonner"')) {
    content = content.replace(
      /(import [^;]+;\n)/,
      '$1import { toast } from "sonner";\n'
    );
  }

  // Replace alerts with appropriate toast calls
  content = content
    // Success messages
    .replace(/alert\("Verification code sent! Check your WhatsApp."\);/g, 'toast.success("Verification code sent! Check your WhatsApp.");')
    .replace(/alert\("WhatsApp connected successfully!"\);/g, 'toast.success("WhatsApp connected successfully!");')
    .replace(/alert\(`Import successful!/g, 'toast.success(`Import successful!')

    // Error messages
    .replace(/alert\("Failed to send verification code"\);/g, 'toast.error("Failed to send verification code");')
    .replace(/alert\("Invalid verification code"\);/g, 'toast.error("Invalid verification code");')
    .replace(/alert\("Failed to verify code"\);/g, 'toast.error("Failed to verify code");')
    .replace(/alert\("Failed to send message"\);/g, 'toast.error("Failed to send message");')
    .replace(/alert\("Failed to delete document"\);/g, 'toast.error("Failed to delete document");')
    .replace(/alert\("Export failed. Please try again."\);/g, 'toast.error("Export failed. Please try again.");')
    .replace(/alert\("Please select a file to import"\);/g, 'toast.error("Please select a file to import");')
    .replace(/alert\(`Import completed with errors:/g, 'toast.error(`Import completed with errors:')
    .replace(/alert\("Import failed. Please try again."\);/g, 'toast.error("Import failed. Please try again.");')
    .replace(/alert\(`Unsupported file type:/g, 'toast.error(`Unsupported file type:')
    .replace(/alert\("Failed to create checkout session"\);/g, 'toast.error("Failed to create checkout session");')
    .replace(/alert\("Failed to start upgrade process"\);/g, 'toast.error("Failed to start upgrade process");')
    .replace(/alert\("Failed to open billing portal"\);/g, 'toast.error("Failed to open billing portal");')

    // Info messages
    .replace(/alert\("View feature coming soon!"\);/g, 'toast.info("View feature coming soon!");')

    // Multi-line alert replacement
    .replace(/alert\(\s*"([^"]+)"\s*\+\s*\n\s*"([^"]+)"\s*\)/g, 'toast.error("$1$2")');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed ${file}`);
});

console.log('All files processed!');
